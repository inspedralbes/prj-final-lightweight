## ADDED Requirements

### Requirement: The platform SHALL define prioritized E2E critical user flows

The system MUST provide a documented list of user flows that should be covered by E2E tests, prioritized by business impact and usage frequency.

#### Scenario: Auth flow - Registration
- **WHEN** a new user visits the registration page
- **THEN** the user can create an account with username, email, password, and role selection

#### Scenario: Auth flow - Login
- **WHEN** an existing user visits the login page
- **THEN** the user can authenticate with credentials and access the appropriate dashboard

#### Scenario: Coach creates routine
- **WHEN** a coach navigates to routine creation
- **THEN** the coach can build a routine with exercises from the catalog

#### Scenario: Coach assigns routine to client
- **WHEN** a coach assigns an existing routine to a client
- **THEN** the client receives the assigned routine in their dashboard

#### Scenario: Client runs solo workout
- **WHEN** a client starts an assigned routine
- **THEN** the client can complete exercises with set/rep tracking and view summary

#### Scenario: Coach creates co-op session
- **WHEN** a coach creates a live session with a session code
- **THEN** clients can join the session using the code

#### Scenario: Client joins co-op session
- **WHEN** a client joins an existing co-op session
- **THEN** both coach and client see live workout state synchronized

#### Scenario: P2P chat between coach and client
- **WHEN** a user sends a chat message to their coach/client
- **THEN** the message is delivered in real-time and persisted

#### Scenario: Video call initiation
- **WHEN** a user initiates a video call from chat
- **THEN** the callee receives the call invite and can accept/reject

#### Scenario: Invitation acceptance
- **WHEN** a client accepts a coach invitation
- **THEN** the coach-client relationship is established

#### Scenario: Notification delivery
- **WHEN** a relevant event occurs (invitation, message, call)
- **THEN** the user receives a notification

#### Scenario: Theme switching
- **WHEN** a user toggles dark/light mode
- **THEN** the theme persists across sessions

#### Scenario: Client creates own routine
- **WHEN** a client creates a routine without coach assignment
- **THEN** the client can add exercises from the catalog

#### Scenario: Exercise catalog search
- **WHEN** a user searches for exercises
- **THEN** results are filtered by name/category/muscle

#### Scenario: Coach client list
- **WHEN** a coach views their clients
- **THEN** the coach sees a list of assigned clients

#### Scenario: Client profile notes
- **WHEN** a coach adds notes to a client profile
- **THEN** the notes are saved privately

#### Scenario: Client views coach info
- **WHEN** a client views their assigned coach
- **THEN** coach contact info is displayed

#### Scenario: Notification delivery (offline)
- **WHEN** a relevant event occurs while user is offline
- **THEN** the user receives a notification upon next login
- **NOTE**: NOT YET IMPLEMENTED

#### Scenario: Theme switching
- **WHEN** a user toggles dark/light mode
- **THEN** the theme persists across sessions
- **NOTE**: NOT YET IMPLEMENTED

#### Scenario: Profile settings
- **WHEN** a user updates their profile settings
- **THEN** the changes are saved
- **NOTE**: NOT YET IMPLEMENTED

### Requirement: The platform SHALL prioritize flows by impact and frequency

The system MUST assign a priority level (P0-P3) to each flow based on business impact × usage frequency.

#### Scenario: P0 - Critical business flows
- **WHEN** identifying P0 flows
- **THEN** include: login, routine execution, co-op session (core platform differentiators)

#### Scenario: P1 - High value flows
- **WHEN** identifying P1 flows
- **THEN** include: registration, invitation, video call (direct revenue/enagement)

#### Scenario: P2 - Important flows
- **WHEN** identifying P2 flows
- **THEN** include: routine creation, chat, notifications (regular usage)

#### Scenario: P3 - Nice to have
- **WHEN** identifying P3 flows
- **THEN** include: theming, profile settings (low frequency)