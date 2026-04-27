## ADDED Requirements

### Requirement: Global notification surface

The frontend SHALL mount `NotificationContext` and `ToastProvider` once at the application root. Every authenticated page SHALL be able to publish toasts and to read the unread count for the sidebar badge.

#### Scenario: Provider availability

- **GIVEN** a user has logged in and `App.tsx` is mounted
- **WHEN** any page calls `useToast()` or `useNotification()`
- **THEN** the hook returns the active context (no "must be used within Provider" error)

### Requirement: Real-time notifications via Socket.IO

The server does NOT emit a generic `notification:new` event. Instead, `App.tsx` listens to specific feature-level Socket.IO events and calls `addNotification()` from `NotificationContext`:

| Trigger                                      | Socket event               | Notification type |
| -------------------------------------------- | -------------------------- | ----------------- |
| Incoming chat message (chat window not open) | `p2p-message-notification` | `"message"`       |
| Coach sends an invitation                    | `coach-invitation`         | `"invitation"`    |

**Known gap:** The spec previously assumed a generic `notification:new` event. That event does not exist in the codebase. Notifications are assembled in `App.tsx` by subscribing to individual events.

**Known gap:** There is no `notification:new` event for "invitation accepted" or "routine assigned". Those flows generate no real-time notification to the coach/client.

#### Scenario: New chat message while page is elsewhere

- **GIVEN** B is on the dashboard, not in the chat with A
- **WHEN** A sends a message and `p2p-message-notification` arrives on B's socket
- **THEN** `App.tsx` calls `addNotification` with type `"message"` and the notification appears in `NotificationCenter`

#### Scenario: Incoming coach invitation

- **GIVEN** Client K is connected
- **WHEN** a coach sends an invitation and the server emits `coach-invitation` to K's socket
- **THEN** `App.tsx` calls `addNotification` with type `"invitation"` and the notification center shows the invitation

#### Scenario: Incoming video call

- **GIVEN** B is on any authenticated page
- **WHEN** `video-call-invite` arrives on B's socket
- **THEN** the global popup mounted in `AppContent` opens with the caller info and ringtone (handled in `App.tsx` directly, not via `NotificationContext`)

### Requirement: Notification center listing

The sidebar `NotificationCenter` SHALL list recent notifications with type-specific actions (open chat, view invitation, etc.).

#### Scenario: Open the center

- **WHEN** the user clicks the bell icon
- **THEN** the panel opens and shows the most recent N notifications (N confirmed at apply time)
- **AND** clicking an entry navigates to the relevant page (chat thread, invitations list, etc.)

#### Scenario: Mark as read

- **WHEN** the user clicks the "mark as read" affordance (or opens the center, depending on UX)
- **THEN** the badge counter decreases and previously-bold entries become regular weight

### Requirement: Notifications UI is internationalised

The notification center, toasts, and badges SHALL render their chrome strings from `ca.json`, `es.json`, and `en.json`.

#### Scenario: Toasts and entries translated

- **WHEN** the language is switched to Spanish
- **THEN** every existing notification entry and any new toast renders the Spanish string from `es.json` rather than the originally-rendered language
- **NOTE** Past plain-text payloads (e.g. message previews) are NOT retranslated; only the surrounding chrome.

### Requirement: Notifications are testable

The notification flows SHALL be exercisable via manual multi-window QA today, and any future automated coverage SHALL live as Jest specs under `src/back/src/events/` that spy on `server.to('user:'+id).emit(...)`.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer runs the multi-window QA scripts (invitation accept, chat message while away, incoming call) in `doc/Proves_usuari.md`
- **THEN** the appropriate badge and toast appear within ~1 second of the trigger
- **AND** a future Jest spec under `src/back/src/events/` SHOULD spy on `server.to('user:'+id).emit('notification:new', ...)` to assert each notification path
