## Why

Els harness de tests unitaris per al backend (LW-448) i el frontend (LW-447) ja estan configurats amb Vitest, però l'equip no té encara una llista clara de quines àrees del codi cal cobrir primer. Sense aquesta priorització, l'esforç de tests es dispersa o es concentra en codi de baix risc (controladors triviales, components purs sense lògica). Aquesta tasca (LW-449) defineix la llista prioritzada que servirà com a entrada per a totes les tasques d'implementació posteriors de tests unitaris, garantint que el primer esforç es dirigeix als mòduls més crítics (autenticació, rutines, sessions, invitacions) i als components/utilitats amb lògica no trivial.

## What Changes

- Afegir una nova capacitat `unit-testing-priorities` que documenta la llista prioritzada (aprovada) de mòduls de backend i features/utilitats de frontend a cobrir amb tests unitaris.
- Cada entrada de la llista HAURÀ DE definir: l'àmbit (ruta del fitxer/mòdul), una justificació (risc / complexitat / freqüència de canvi) i una franja de prioritat (P0 / P1 / P2).
- L'spec inclourà criteris de revisió perquè la llista es mantingui viva (revisable quan apareguin nous mòduls o canvis significatius).
- No s'escriuen tests unitaris en aquesta tasca; només es defineix i aprova la priorització.
- No s'introdueix cap canvi al codi d'aplicació ni a la configuració dels harnesses existents.

## Capabilities

### New Capabilities

- `unit-testing-priorities`: Llista prioritzada (P0/P1/P2) i revisada de mòduls de backend i features/components/utilitats de frontend a cobrir amb tests unitaris, amb criteris de selecció (risc, complexitat, freqüència de canvi) i procés de revisió.

### Modified Capabilities

<!-- Cap. backend-unit-testing i frontend-unit-testing es mantenen sense canvis: cobreixen el harness, no què es prova. -->

## Impact

- **Documentació afegida**: nou spec a `openspec/specs/unit-testing-priorities/spec.md` amb la taula priorititzada.
- **Mòduls backend revisats** (referència, no es modifiquen en aquest canvi): `auth`, `routines`, `invitations`, `session`, `clients`, `chat`, `exercises`, `events`, `room`.
- **Features frontend revisades** (referència, no es modifiquen en aquest canvi): `auth` (ProtectedRoute, AuthContext), `routines` (routineService), `workout` (socket singleton, càlcul d'estat de sessió), `chat` (chatService, signalling WebRTC), `notifications` (NotificationContext), `shared/utils/api.ts` (interceptor JWT i 401), shared hooks amb lògica no trivial.
- **Sense impacte a Socket.IO, ni a APIs ni a la base de dades** — és una tasca d'anàlisi i documentació.
- **Sense canvis a dependències** — no s'instal·la res nou.
- **Cross-cutting**: la sortida d'aquest canvi serà l'input directe per a les properes tasques d'implementació de tests (backend i frontend) sota l'epic de testing.
- **Jira**: LW-449 (Definir àrees prioritàries per a tests unitaris). Depèn de LW-447/LW-448 (harness) i desbloca les tasques d'escriptura de tests reals.
- **Nota de testing**: la verificació d'aquest canvi és revisió humana de la llista (criteri d'acceptació de la US).
