## ADDED Requirements

### Requirement: Three supported languages with English as default

The frontend provides UI translations in Catalan (`ca`), Castilian Spanish (`es`), and English (`en`). English is the default for first-time visitors with no stored preference. The fallback language is also English.

**Known gap:** The spec previously stated Catalan (`ca`) was the default. The actual `i18n/config.ts` uses `localStorage.getItem('language') || 'en'` and `fallbackLng: 'en'`. A follow-up should decide the intended default and update the config accordingly.

#### Scenario: Fresh visitor with no preference

- **GIVEN** a Visitant with no `language` value in localStorage
- **WHEN** the SPA mounts
- **THEN** i18next initialises with `en` and all UI strings render in English

#### Scenario: Browser language detection

- **WHEN** the SPA mounts on a fresh device
- **THEN** no browser language detection is performed; the fallback is always `en` (no `languageDetector` plugin is registered in `i18n/config.ts`)

### Requirement: Language switcher

The shared `LanguageSwitcher` component SHALL allow the user to pick `ca`, `es`, or `en` and SHALL persist the choice in localStorage so it survives reloads.

#### Scenario: Persisting the choice

- **WHEN** the user picks a language from the switcher
- **THEN** i18next switches to that language
- **AND** localStorage stores the chosen language under the key `"language"`
- **AND** reloading the page renders the UI in the chosen language

#### Scenario: Switching during a flow

- **GIVEN** the user is in the middle of editing a routine in `ca`
- **WHEN** they switch to `es`
- **THEN** all visible labels and validation messages re-render in Spanish without losing form state

### Requirement: Locale files are kept in sync

`ca.json`, `es.json`, and `en.json` under `src/front/src/i18n/locales/` SHALL contain the same set of keys at all times. Any new user-facing string added by a feature SHALL be added to all three files.

#### Scenario: Missing key in one locale

- **GIVEN** a key exists in `ca.json` but not in `en.json`
- **WHEN** the user has English active and navigates to the page using that key
- **THEN** i18next falls back to the Catalan string (default) — but the spec deems this a **defect** that the contributing change MUST fix before merge

#### Scenario: Adding a new key

- **WHEN** a future spec adds a new user-visible string
- **THEN** the corresponding `tasks.md` MUST list "Add key X to ca.json / es.json / en.json" under the i18n section (per the `tasks` rules in `openspec/config.yaml`)

### Requirement: i18n is testable

The i18n surface SHALL be exercisable via manual cross-language QA today; future automated coverage MAY include a key-parity check across the three locale files.

#### Scenario: Manual QA + future automated coverage

- **WHEN** a developer toggles all three languages on the home page, dashboard, chat, and settings
- **THEN** every visible string updates and there are no rendered i18n keys (e.g. literal `"chat.empty"` in the DOM)
- **AND** a future check (script or Vitest test) SHOULD compare the key sets of the three locale files and fail on divergence
