## ADDED Requirements

### Requirement: Light and dark mode

The SPA SHALL support a light and a dark theme via Tailwind CSS 4. The `ThemeSwitcher` component SHALL toggle between them and persist the choice client-side.

#### Scenario: Default theme on first visit

- **GIVEN** a Visitant with no theme value in localStorage
- **WHEN** the SPA mounts
- **THEN** `ThemeContext` reads `prefers-color-scheme` and applies `dark` or `light` accordingly
- **AND** the `<html>` element gets the `dark` class if the system preference is dark, and no class if light
- **NOTE** The React state is initialised as `'dark'` before the `useEffect` runs; a brief flash of dark styling may occur on light-system devices before the effect applies the correct theme

#### Scenario: Toggle to dark

- **WHEN** the user clicks the moon icon in `ThemeSwitcher`
- **THEN** the `<html>` (or `<body>`) class is updated to apply Tailwind's `dark` variant globally
- **AND** localStorage stores the chosen theme under the key used by the switcher

#### Scenario: Persisted across reloads

- **GIVEN** the user previously selected dark mode
- **WHEN** they reload the page
- **THEN** the SPA mounts in dark mode without a flash of light styling

### Requirement: Theme covers every screen

Every component SHALL render correctly in both themes. Custom one-off colours SHALL be sourced from the Tailwind theme tokens, not hardcoded hex values.

#### Scenario: Page audit

- **GIVEN** the dark theme is active
- **WHEN** a developer navigates Login, Register, Dashboard, Routines, Chat, Workout, Notifications, Coach pages, and Client pages
- **THEN** every page is fully styled (no white backgrounds inside dark layouts, no unreadable contrast)

### Requirement: Theming is testable

The theme toggle and per-page rendering SHALL be exercisable via manual QA today; future automated coverage MAY add per-component dark/light snapshots in a Vitest suite once that harness is introduced.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer follows "Toggle dark mode and audit every page" in `doc/Proves_usuari.md`
- **THEN** all primary screens render correctly in both themes
- **AND** a future Vitest snapshot suite (when introduced) MAY add per-component dark/light snapshots; this is OPTIONAL for the baseline
