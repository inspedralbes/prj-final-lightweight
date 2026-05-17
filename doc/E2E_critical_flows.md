# Fluxos Crítics d'Usuari E2E — Referència de Prioritats

Aquest document llista els fluxos d'usuari prioritzats per a la cobertura de tests E2E a la plataforma LightWeight.

## Marc de Priorització

**Criteris:** Impacte × Freqüència
- **Impacte:** Valor de negoci crític (ingressos, funcionalitat principal)
- **Freqüència:** Amb quina freqüència utilitzen els usuaris reals el flux

## Nivells de Prioritat

| Prioritat | Descripció | Cobertura |
|-----------|------------|-----------|
| P0 | Fluxos de negoci crítics — diferenciadors principals de la plataforma | Primer |
| P1 | Fluxos d'alt valor — ingressos/engagement directes | Segon |
| P2 | Fluxos importants — ús regular | Tercer |
| P3 | Interessant tenir — baixa freqüència | Últim |

## Fluxos d'Usuari Prioritzats

| # | Flux | Prioritat | Mòdul | Notes |
|---|------|-----------|-------|-------|
| 1 | Login | P0 | auth | |
| 2 | Client executa entrenament en solitari | P0 | workout | |
| 3 | Sessió cooperativa (coach crea + client s'uneix) | P0 | session/room | |
| 4 | Registre | P1 | auth | |
| 5 | Acceptació d'invitació | P1 | invitations | |
| 6 | Inici de videollamada | P1 | events | |
| 7 | Coach crea rutina | P2 | routines | |
| 8 | Coach assigna rutina a client | P2 | routines | |
| 9 | Client crea la seva pròpia rutina | P2 | routines | |
| 10 | Cerca al catàleg d'exercicis | P2 | exercises | |
| 11 | Xat P2P | P2 | chat | Només en temps real (online) |
| 12 | Llista de clients del coach | P2 | clients | |
| 13 | Notes del perfil del client | P2 | clients | |
| 14 | Client veu la informació del coach | P3 | client | |
| 15 | Canvi de tema | P3 | shared | ENCARA NO IMPLEMENTAT |
| 16 | Configuració del perfil | P3 | auth | ENCARA NO IMPLEMENTAT |
| 17 | Lliurament de notificacions (offline) | P2 | events | ENCARA NO IMPLEMENTAT |

## Fluxos que Requereixen Tests amb Socket.IO

Els fluxos següents requereixen tests Socket.IO/WebSocket per al seu comportament en temps real:

| Flux | Events de Socket | Estat d'implementació |
|------|-----------------|----------------------|
| Sessió cooperativa | `room:join`, `room:state`, `room:exercise-progress` | ✅ Implementat |
| Xat P2P | `chat:send`, `chat:message` | ✅ Implementat (només online) |
| Videollamada | `video-call-invite`, `video-call-accept`, `webrtc-*` | ✅ Implementat |
| Notificacions | `notification:new` | ⚠️ Només online - offline pendent |

### Encara No Implementat (Funcionalitats Futures)

| Flux | Descripció | Prioritat |
|------|------------|-----------|
| Canvi de tema | Toggle mode fosc/clar | P3 |
| Configuració del perfil | Gestió del perfil d'usuari | P3 |
| Notificacions offline | Notificacions push quan l'usuari està offline | P2 |

## Revisió Trimestral

Aquesta llista s'ha de réévaluar trimestralment o abans de noves fases d'implementació de tests E2E.

Última actualització: 2026-05-06
