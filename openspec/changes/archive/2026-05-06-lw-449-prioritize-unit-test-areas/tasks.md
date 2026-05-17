## 1. Anàlisi i recopilació

- [x] 1.1 Llistar tots els mòduls de `src/back/src/` (auth, routines, exercises, session, room, chat, invitations, clients, events, prisma) i identificar per a cadascun: serveis, controllers, gateways i guards rellevants
- [x] 1.2 Llistar totes les features de `src/front/src/features/` (auth, chat, routines, exercises, workout, notifications, coach, client) i extreure els elements amb lògica: services, contexts, hooks, components amb estat condicional
- [x] 1.3 Llistar utilitats compartides de `src/front/src/shared/` (utils/api.ts, hooks, services) i identificar les que tenen lògica testable
- [x] 1.4 Per a cada element identificat als passos 1.1-1.3, anotar les dependències que caldria mockar (PrismaService, JwtService, axios api, socket, react-router, i18next, etc.)

## 2. Priorització

- [x] 2.1 Aplicar els tres eixos (risc, complexitat, freqüència de canvi) a cada element del backend i assignar P0 / P1 / P2 segons les definicions del design
- [x] 2.2 Aplicar els mateixos eixos a cada element del frontend i assignar P0 / P1 / P2
- [x] 2.3 Validar que la classificació P0 inclou com a mínim: backend `auth.service`, `invitations.service`, `routines.service`; frontend `shared/utils/api.ts` interceptor, `AuthContext`, `ProtectedRoute`
- [x] 2.4 Validar que la classificació P1 inclou com a mínim: backend `session.service`, `chat.service`, `clients.service`; frontend `NotificationContext`, socket singleton, càlcul d'estat de sessió co-op
- [x] 2.5 Identificar elements explícitament fora d'àmbit (controllers passthrough, components purament presentacionals, peer-to-peer WebRTC)

## 3. Redacció de l'spec final

- [x] 3.1 Crear `openspec/specs/unit-testing-priorities/spec.md` amb les seccions: Purpose, Backend (taula priorityzada), Frontend (taula priorityzada), Criteris de priorització, Nivells de prioritat (P0/P1/P2), Fora d'àmbit, Procés de revisió
- [x] 3.2 Per a cada fila de la taula backend documentar: mòdul, ruta (`src/back/src/...`), prioritat, justificació amb els tres eixos, dependències a mockar
- [x] 3.3 Per a cada fila de la taula frontend documentar: element, ruta (`src/front/src/...`), prioritat, justificació, dependències a mockar
- [x] 3.4 Redactar la secció "Fora d'àmbit" amb almenys tres tipologies excloses i exemples concrets
- [x] 3.5 Redactar la secció "Procés de revisió" amb regles per a mòduls nous, promocions de prioritat i retirades

## 4. Revisió

- [x] 4.1 Auto-revisió amb el checklist (taules amb P0/P1/P2; justificació de tres eixos a P0; dependències a mockar declarades; seccions Criteris/Nivells/Fora d'àmbit/Procés de revisió presents)
- [x] 4.2 Executar `openspec validate lw-449-prioritize-unit-test-areas` i confirmar exit code 0
