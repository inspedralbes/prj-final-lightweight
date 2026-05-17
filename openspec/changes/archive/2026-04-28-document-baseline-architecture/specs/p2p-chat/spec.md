## ADDED Requirements

### Requirement: Authenticated chat connection

Every authenticated user SHALL maintain a single Socket.IO connection (the frontend singleton at `features/workout/services/socket.ts`) and SHALL be auto-joined by the server to a private room keyed `user:{userId}`.

#### Scenario: Successful handshake

- **GIVEN** a user with a valid JWT
- **WHEN** the SPA opens the Socket.IO connection passing the JWT in the `auth.token` field of the handshake
- **THEN** `EventsGateway` validates the token, attaches `userId` to the socket, and joins the socket to room `user:{userId}`

#### Scenario: Missing or invalid token

- **WHEN** a socket connects without a token or with an expired/invalid token
- **THEN** the gateway disconnects the socket immediately

### Requirement: Sending a message via Socket.IO

A user SHALL be able to send a chat message to any other user by emitting `send-p2p-message`. The message SHALL be persisted as a `P2PChatMessage` and pushed to the recipient if online.

#### Scenario: Recipient is online and does NOT have the chat open

- **GIVEN** users A and B both connected, B does not have the chat with A open
- **WHEN** A emits `send-p2p-message` with `{ senderId: A.id, receiverId: B.id, text: "hi" }`
- **THEN** a `P2PChatMessage` row is created via `chatService.sendMessage`
- **AND** B's socket receives both `p2p-message` AND `p2p-message-notification` with `{ from, fromUsername, text, messageId, timestamp }`

#### Scenario: Recipient is online and has the chat open

- **WHEN** A sends a message to B and B has this chat window open (`userOpenChats` tracking via `open-chat` / `close-chat` events)
- **THEN** B receives `p2p-message` only (no `p2p-message-notification`)

#### Scenario: Recipient is offline

- **WHEN** A emits `send-p2p-message` to B and B has no connected socket
- **THEN** the message is persisted with `read = false`; no real-time event is emitted
- **AND** when B next opens the conversation, the REST `GET /api/chat/conversation/:userId` returns the message

#### Scenario: Empty payload

- **WHEN** A emits `send-p2p-message` with no payload
- **THEN** the gateway logs a warning and returns without persisting or broadcasting

**Known gap:** The spec previously described `chat:send` / `chat:message` event names. The actual event names are `send-p2p-message` (client → server) and `p2p-message` (server → client). A follow-up should consider aligning naming conventions.

### Requirement: REST endpoints for chat

All REST endpoints are under `/api/chat` and require `AuthGuard('jwt')` (`JwtAuthGuard`-equivalent).

| Method   | Path                             | Description                                               |
| -------- | -------------------------------- | --------------------------------------------------------- |
| `POST`   | `/api/chat/send`                 | Persist a message via REST (body: `{ receiverId, text }`) |
| `GET`    | `/api/chat/unread`               | Get all unread messages for the authenticated user        |
| `POST`   | `/api/chat/mark-read`            | Mark messages as read (body: `{ messageIds: number[] }`)  |
| `GET`    | `/api/chat/conversation/:userId` | Get conversation history between caller and `userId`      |
| `DELETE` | `/api/chat/:messageId`           | Delete a single message by ID (only sender can delete)    |

**Known gap:** The spec previously listed `GET /api/chat/partners` and `DELETE /api/chat/conversation/:userId`. Neither endpoint exists in the controller. The actual delete is per-message: `DELETE /api/chat/:messageId`.

#### Scenario: Load conversation history

- **WHEN** B GETs `/api/chat/conversation/:userId`
- **THEN** the response is a chronological list of `P2PChatMessage` records between the two users (`200 OK`)

#### Scenario: History with non-existent peer

- **WHEN** B GETs `/api/chat/conversation/999` for a user that does not exist
- **THEN** the response is `200 OK` with an empty array (service returns `[]` for no rows found)

**Known gap:** The spec previously assumed `GET /api/chat/:peerId/history`. The actual endpoint is `GET /api/chat/conversation/:userId`.

### Requirement: Read receipts

When a user reads messages from a peer, the system SHALL mark them as read via `POST /api/chat/mark-read`.

**Known gap:** There is no `chat:read` Socket.IO event and no `chat:read-receipt` event. Read marking is REST-only. The spec previously described a Socket.IO read-receipt flow; that does not exist in code.

### Requirement: Unread badge

The frontend SHALL display an unread indicator on the chat entry for any peer with unread messages.

#### Scenario: Badge appears on new message

- **GIVEN** B is on a page other than the chat with A
- **WHEN** B receives a `p2p-message-notification` event from the socket
- **THEN** the notification system (via `NotificationContext`) shows an unread badge for A's chat thread
- **AND** if `NotificationContext` is mounted, a toast appears

#### Scenario: Badge clears on read

- **WHEN** B opens the conversation
- **THEN** the unread dot disappears immediately

### Requirement: Chat UI is internationalised

The empty state, input placeholder, send-button label, and toast strings SHALL exist in `ca.json`, `es.json`, and `en.json`.

#### Scenario: Empty state translated

- **WHEN** B opens a conversation with A in `en` and there are no messages
- **THEN** the empty-state hint reads the English string from `en.json`

### Requirement: P2P chat is testable

The P2P chat flow SHALL be exercisable via manual two-browser QA today, and any future automated coverage SHALL live as Jest specs under `src/back/src/chat/` and `src/back/src/events/` using a Socket.IO test client.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer runs "Coach ↔ Client chat" with two browser windows per `doc/Proves_usuari.md`
- **THEN** messages, read receipts, and unread badges all behave per the scenarios above
- **AND** a future Jest spec under `src/back/src/chat/` and `src/back/src/events/` SHOULD use a Socket.IO test client to assert `chat:send` → `chat:message` broadcast and `chat:read` → `chat:read-receipt` propagation
