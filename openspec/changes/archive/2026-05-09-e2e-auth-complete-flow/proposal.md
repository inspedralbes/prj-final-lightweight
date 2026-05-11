## Per què

Actualment, els fluxos d'autenticació (registre, login, logout i persistència de sessió) mancen de cobertura integral de tests E2E des de la perspectiva de la UI. La suite de tests existent només cobreix tests de fum bàsics (auth.spec.ts). A mesura que la plataforma creix, l'autenticació és una ruta d'usuari crítica que ha de ser validada exhaustivament en múltiples escenaris (fluxos d'èxit, manejo d'errors i cicle de vida de la sessió). Afegir tests E2E per a aquests fluxos garanteix l'estabilitat i prevé regressions en producció.

## Què canvia

- Afegir tests E2E integral per al registre d'usuaris (creació de nous usuaris amb feedback de validació)
- Afegir tests E2E per a login amb credencials vàlides i invàlides
- Afegir tests E2E per a logout i verificació del cicle de vida de la sessió
- Afegir escenaris de prova per a la persistència de sessió (validació del token a localStorage)
- Estendre els fixtures de Playwright i les utilitats de prova per suportar fluxos d'autenticació
- Documentar patrons de tests E2E per a futures característiques relacionades amb autenticació

No-objectius:
- Flux de restabliment de contrasenya (diferit a una especificació separada)
- Autenticació OAuth / tercers
- Lògica d'autenticació multifactor (MFA)
- Signalling WebRTC per a autenticació (fora de l'abast)

## Capacitats

### Noves Capacitats

- `e2e-auth-flow`: Cobertura completa de tests E2E per als fluxos de registre, login amb credencials vàlides/invàlides, logout i persistència de sessió. Inclou fixtures de prova, models de pàgina i escenaris de prova.

### Capacitats Modificades

- `auth`: El mòdul de backend d'autenticació existent no canvia; aquesta és purament una millora de prova al nivell de frontend i E2E.

## Impacte

**Codi i capes afectats:**
- Frontend: `src/front/src/features/auth/` (components Login, Register) — sense canvis de codi, només validació E2E
- Tests E2E: `e2e/tests/auth.spec.ts` — expandit amb nous casos de prova i fixtures
- Fixtures E2E: `e2e/fixtures/auth.ts` — millerat amb ajudants de registre d'usuaris i sessions
- Backend: `src/back/src/auth/` — sense canvis; els tests validen endpoints existents (`POST /auth/register`, `POST /auth/login`)

**Impacte en la infraestructura de tests:**
- La configuració de Playwright es manté estable; utilitza dades precarregades de PostgreSQL existents + mecanisme de reinici
- Els nous models de pàgina es podrien afegir a `e2e/fixtures/` si és necessari per a mantenibilitat
- Sense nous events Socket.IO o canvis de WebSocket

**Impacte Socket.IO:** Cap — l'autenticació es basa en JWT sense estat; cap event realtime afectat.

**Impacte i18n:** Les asercions de tests poden incloure text de la UI en català (per defecte), espanyol i anglès; totes les claus de traducció ja existeixen a `src/front/src/i18n/locales/`.

**Impacte base de dades:** Els tests utilitzen les dades de seed existents (entrenadors, clients) o creen usuaris temporals mitjançant registre; neteja mitjançant `e2e/fixtures/reset.ts`.

**Definició de Fet:**
- Tots els escenaris de prova passen consistentment en l'entorn local
- Els tests cobreixen: registre exitós, login (credencials vàlides i invàlides), logout i persistència de sessió
- La sortida de test de Playwright mostra una taxa de pass del 100% en tots els escenaris d'autenticació
- Els tests E2E estan documentats a `e2e/README.md` amb instruccions de execució
- Cap buit en QA manual per al flux d'autenticació segons `doc/Proves_usuari.md`
