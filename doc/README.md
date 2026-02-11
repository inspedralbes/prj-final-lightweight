# PRD — Plataforma de Fitness & Coaching en Temps Real (Web)

---

# 1. Visió del Producte

Construir una **plataforma web de fitness i coaching** que permeti:

- Planificar entrenaments
- Crear i gestionar rutines
- Compartir una rutina mitjançant un enllaç únic
- Executar la rutina de forma **sincronitzada en temps real**
- Permetre comunicació directa **coach–client** mitjançant **WebRTC (xat o videotrucada)**

La plataforma està orientada a:

> planificació + execució guiada + seguiment en viu

Tota l’experiència es realitza en **entorn web**.

---

# 2. Objectius del Producte

## Objectius principals

- Permetre a un coach crear i gestionar rutines d’entrenament
- Permetre compartir rutines mitjançant enllaç únic
- Sincronitzar l’execució de la rutina en temps real
- Permetre acompanyament remot mitjançant WebRTC
- Demostrar ús de:
  - WebSockets
  - WebRTC
  - Arquitectura moderna front–back
- Proporcionar un flux funcional mínim real demostrable

---

# 3. Abast del MVP

## Inclòs

- Aplicació web
- Coach crea rutines
- Client accedeix per enllaç
- Sincronització en temps real
- Xat o videotrucada WebRTC
- Estat de progrés en viu

## Fora d’abast del MVP

- App mobile
- Dieta avançada
- APIs de macros
- Gràfiques complexes
- Multi-coach
- Múltiples clients per sessió

---

# 4. Rols

## Coach (Entrenador)

- Crea rutines
- Genera enllaç de sessió
- Inicia sessió en viu
- Veu el progrés del client en temps real
- Es comunica via WebRTC

---

## Client

- Accedeix mitjançant enllaç
- Visualitza la rutina
- Executa exercicis
- Marca sèries completades
- Comparteix estat en viu

No necessita dashboard complex.

---

# 5. Arquitectura del Producte

| Component     | Tecnologia                           |
| ------------- | ------------------------------------ |
| Frontend Web  | React + Vite + Tailwind + TypeScript |
| Backend API   | NestJS + TypeScript                  |
| Temps real    | Socket.IO                            |
| Comunicació   | WebRTC                               |
| Base de dades | PostgreSQL + Prisma                  |

---

# 6. Model de Sessió Compartida

## Enllaç de Rutina Compartida

El coach pot generar un enllaç:
Característiques:

- Enllaç únic
- Vàlid per una sessió
- Només 1 client actiu
- Permet sincronització en temps real

---

## Flux

Coach:

- crea rutina
- prem “Iniciar sessió”
- genera enllaç

Client:

- obre enllaç
- entra a la sessió
- es connecta via socket
- es connecta via WebRTC

---

# 7. Funcionalitat en Temps Real (Sockets)

S’utilitzen sockets per sincronitzar:

## Esdeveniments coach → client

- exercici actual
- inici descans
- final descans
- canvi d’exercici
- finalitzar sessió

---

## Esdeveniments client → coach

- sèrie completada
- exercici completat
- sessió completada
- estat actiu/inactiu

---

## Estat sincronitzat

Ambdós veuen:

- exercici actiu
- sèrie actual
- progrés de sessió
- % completat

---

# 8. WebRTC — Comunicació Coach–Client

## Modalitats MVP

- Xat de text en temps real
- Trucada d’àudio
- Videotrucada simple 1–1

---

## Ús

Durant la sessió compartida:

- coach i client poden:
  - parlar
  - escriure missatges
  - donar feedback immediat

---

## Senyalització

La senyalització WebRTC es realitza mitjançant:

- Socket.IO
- Intercanvi de offer / answer / ICE candidates

---

# 9. Funcionalitats Web — Coach

## Autenticació

- Login coach
- JWT bàsic

---

## Dashboard

- llista de rutines
- crear rutina
- editar rutina

---

## Editor de Rutina

- nom
- exercicis
- sèries
- repeticions
- descans
- notes

---

## Sessió Live

- botó “Iniciar sessió”
- generar enllaç
- panell de control en viu
- veure progrés del client
- panell WebRTC

---

# 10. Funcionalitats Web — Client

## Accés per enllaç

- entrar a la sessió
- veure rutina
- veure exercici actiu

---

## Execució

- marcar sèrie completada
- marcar exercici completat
- veure descans

---

## Comunicació

- xat WebRTC
- videotrucada WebRTC (si està activada)

---

# 11. UI/UX

## Principis

- focus en execució
- mínim soroll visual
- progrés visible
- estat en viu clar

---

## Vista Coach

- layout admin simple
- panell live
- mètriques de sessió

---

## Vista Client

- pantalla neta
- exercici destacat
- CTA gran per completar sèrie

---

# 12. Seguretat MVP

- Autenticació JWT per coach
- sessionCode únic
- una connexió client activa
- expiració de sessió

---

# 13. Declaració Final

> La plataforma permet planificació d’entrenament i execució guiada en temps real mitjançant sincronització amb sockets i comunicació directa via WebRTC, proporcionant una experiència de coaching remot funcional i demostrable tècnicament.
