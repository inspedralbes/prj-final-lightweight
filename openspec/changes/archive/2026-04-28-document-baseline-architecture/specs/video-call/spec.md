## ADDED Requirements

### Requirement: Caller initiates a video call from chat

The caller SHALL initiate a video call from the chat header. The frontend `P2PChat` component SHALL emit `video-call-invite` and enter a `pending` state until the server confirms reachability.

#### Scenario: Invite reaches an online callee

- **GIVEN** caller A with chat open to callee B and B is connected
- **WHEN** A emits `video-call-invite` with `{ callerId: A.id, calleeId: B.id, callerName: A.username, roomId }`
- **THEN** the server emits `video-call-delivered` to A's room `user:{A.id}` and `video-call-invite` with `{ from: A.id }` to B's room `user:{B.id}`
- **AND** A transitions to state `calling` and a ringtone (Web Audio API) starts
- **AND** B sees the incoming-call popup with a ringtone, mounted globally in `AppContent`

#### Scenario: Callee is offline

- **WHEN** A emits `video-call-invite` and B has no active socket
- **THEN** the server emits `video-call-unavailable` to A's room
- **AND** A's UI shows a toast and reverts to `idle` (no popup is shown to A)

### Requirement: Callee accepts or rejects

The callee SHALL be able to accept or reject the call from the global popup.

#### Scenario: Callee accepts

- **WHEN** B clicks "Accept" and the SPA emits `video-call-accept` with `{ callerId: A.id, calleeId: B.id, roomId }`
- **THEN** the server forwards `video-call-accept` with the same payload to A's socket
- **AND** both clients then emit `join-room` with the same `roomId` (to `EventsGateway`, not `RoomGateway`)
- **AND** the caller emits `offer` (SDP offer) → callee responds with `answer` → both sides exchange `ice-candidate` events
- **AND** the `VideoCallModal` mounts on both clients with local video in PiP and the remote stream in fullscreen

**Known gap:** The spec previously described `webrtc-offer` / `webrtc-answer` / `webrtc-ice-candidate`. The actual event names are `offer`, `answer`, and `ice-candidate`.

#### Scenario: Callee rejects

- **WHEN** B clicks "Reject" and emits `video-call-reject` with `{ to: A.id }`
- **THEN** A's room receives `video-call-reject`
- **AND** A's UI dismisses the calling overlay and stops the ringtone

### Requirement: Caller cancellation and timeout

The caller SHALL be able to cancel a pending call. The system SHALL also auto-cancel after 30 seconds without an answer.

#### Scenario: Caller hangs up before answer

- **WHEN** A clicks "Cancel" while in `calling` state and the SPA emits `video-call-end` with `{ fromUserId: A.id, toUserId: B.id }`
- **THEN** B's popup is dismissed via the forwarded `video-call-end` event
- **AND** A's UI returns to `idle`

**Known gap:** The spec previously described `video-call-cancel`. The actual hang-up/cancel event is `video-call-end` (used for both in-call hang-up and pre-answer cancellation).

#### Scenario: 30-second timeout

- **GIVEN** A is in state `calling` and B has not accepted, rejected, or timed out
- **WHEN** 30 seconds elapse
- **THEN** the SPA emits `video-call-end` automatically and the same dismissal flow as a manual cancel runs

### Requirement: Active-call controls

While the call is active, each peer SHALL be able to mute the microphone and hang up. Hanging up SHALL stop the local media tracks and release `RTCPeerConnection`.

#### Scenario: Mute toggle

- **WHEN** A clicks the mute button
- **THEN** the local audio track's `enabled` flag is toggled
- **AND** the icon updates to reflect the muted state

#### Scenario: Hang up

- **WHEN** A clicks the red phone-off button
- **THEN** A's `RTCPeerConnection.close()` is invoked, local tracks are stopped, and `video-call-end` with `{ fromUserId: A.id, toUserId: B.id }` is emitted to the server
- **AND** B's `VideoCallModal` unmounts on receiving `video-call-end`

### Requirement: STUN configuration is hardcoded to Google STUN

WebRTC peer connections SHALL use Google's public STUN server (`stun:stun.l.google.com:19302`) as the only ICE server. The value is **hardcoded** in the frontend today — there is no env override and no TURN server.

**Known gap:** without a TURN server, calls between peers behind symmetric NATs MAY fail to establish media. Moving STUN/TURN to environment configuration (and optionally adding a self-hosted TURN like coturn) is tracked as a follow-up.

#### Scenario: Call succeeds when both peers can reach a public STUN

- **WHEN** both peers can reach `stun.l.google.com:19302` over UDP
- **THEN** ICE candidate gathering succeeds and the WebRTC connection completes

#### Scenario: Call may fail behind restrictive NATs

- **GIVEN** at least one peer is behind a symmetric NAT or firewall blocking outbound UDP to public STUN
- **WHEN** ICE gathering completes without a working candidate pair
- **THEN** the connection fails and the modal SHOULD show a generic "no s'ha pogut connectar" error
- **AND** this is a known limitation pending a TURN-server follow-up

#### Scenario: Future change to env-driven STUN/TURN (out of scope here)

- **WHEN** a follow-up change introduces configurable ICE servers
- **THEN** that change MUST add an env var (e.g. `VITE_RTC_ICE_SERVERS`), update both `.env.example` files and the GitHub Actions `ENV_FILE` template, and replace this requirement with a configurable variant

### Requirement: HTTPS requirement and permission denials

`getUserMedia` requires HTTPS in production. The system SHALL surface a clear error if the call cannot proceed because of permissions or scheme.

#### Scenario: Camera/microphone permission denied

- **WHEN** the user clicks Accept and the browser denies `getUserMedia`
- **THEN** the modal shows an error toast (i18n string from the locale files)
- **AND** the call is dismissed; the offer/answer exchange does NOT start

#### Scenario: Production over HTTP

- **GIVEN** the production deployment is somehow served over HTTP (regression check)
- **WHEN** any user tries to accept a call
- **THEN** `getUserMedia` rejects and the modal shows the HTTPS-required error
- **NOTE** This is a defensive scenario; production MUST always be HTTPS per the deploy spec.

### Requirement: iOS-compatible ringtone

The ringtone SHALL be generated via the Web Audio API and the `useRingtone` hook SHALL pre-unlock the `AudioContext` on the first user gesture (touchstart/click) so iOS Safari plays the tone when needed.

#### Scenario: First gesture pre-unlocks audio

- **GIVEN** an iOS Safari user has just logged in and not yet interacted
- **WHEN** the user taps anywhere on the page
- **THEN** the `AudioContext` is created/resumed inside the gesture handler
- **AND** subsequent ringtones (incoming or outgoing) play correctly without further gestures

### Requirement: Video-call UI is internationalised

Every label in the incoming-call popup, the calling overlay, and the active-call modal SHALL render from `ca.json`, `es.json`, and `en.json`.

#### Scenario: Popup labels and errors translated

- **WHEN** B receives a call in `es`
- **THEN** the "Llamada entrante", "Aceptar", and "Rechazar" labels render in Spanish
- **AND** any error toast (offline, permission denied, HTTPS required) renders the matching Spanish string from `es.json`

### Requirement: Video call is testable

The video-call flow SHALL be exercisable via manual two-browser QA today, and any future automated coverage SHALL stub `RTCPeerConnection` and `navigator.mediaDevices.getUserMedia` inside a Vitest suite once that harness is introduced.

#### Scenario: Manual QA covers the full flow

- **WHEN** a developer runs "Video call between Coach and Client" (two browsers, both authenticated, both with camera) per `doc/Proves_usuari.md`
- **THEN** invite → delivered → accept → media flowing → mute → hang up all succeed
- **AND** a future Vitest suite (when introduced) SHOULD stub `RTCPeerConnection` and `navigator.mediaDevices.getUserMedia` to assert state transitions in `P2PChat` and `VideoCallModal`

### Requirement: Out of scope for this baseline

The video-call capability MUST NOT be assumed to cover group calls (>2 participants), call recording, TURN server configuration, or call history. These adjacent features SHALL be specified by separate proposals when implemented.

#### Scenario: Group-call attempt

- **WHEN** anyone attempts to initiate a group video call from the current UI
- **THEN** there is no UI affordance for it; the spec does not require this behaviour
