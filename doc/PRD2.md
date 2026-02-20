# PRD — Plataforma de Fitness & Coaching en Temps Real (Web)

---

# 1. Visió del Producte

Construir una **plataforma web de fitness i coaching** que permeti:

- Planificar entrenaments
- Crear i gestionar rutines
- Compartir una rutina mitjançant un codi únic a un altre usuari
- Executar la rutina de forma **sincronitzada en temps real**, veient el progrés de l'altre en temps real
- Permetre comunicació directa entre coach i client quan es requereixi

La plataforma està orientada a:

> planificació + execució guiada + seguiment en viu

Tota l’experiència es realitza en **entorn web**.

---

# 2. Objectius del Producte

## Objectius principals

- Permetre a un coach crear i gestionar rutines d’entrenament
- Permetre compartir rutines mitjançant codi únic
- Sincronitzar l’execució de la rutina en temps real, permetent veure el progrés mutu en temps real
- Permetre comunicació directa entre coach i client mitjançant un canal intern en temps real
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
- Usuari accedeix per codi
- Sincronització en temps real (només Friend Session)
- Xat WebRTC opcional per coach–client
- Estat de progrés en viu (només Friend Session)

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
- Genera codi per assignar client
- Inicia sessió en viu (opcional)
- Es comunica via WebRTC quan es requereixi

## Client

- Accedeix mitjançant codi del coach per ser assignat
- Visualitza la rutina
- Executa exercicis
- Marca sèries completades
- Comparteix estat en viu (només en Friend Session)

No necessita dashboard complex.

## Friend Host

- Variant d'usuari sense login
- Comparteix rutina mitjançant codi
- Controla la sessió (pot finalitzar-la)
- Veu progrés del Guest en temps real
- No usa WebRTC

## Friend Guest

- Variant d'usuari sense login
- Accedeix mitjançant codi del Host
- Executa la rutina sincronitzada
- Marca sèries completades
- Veu progrés del Host en temps real
- No usa WebRTC

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

## Codi de Rutina Compartida

Un usuari pot compartir un codi:
Característiques:

- Codi únic
- Vàlid per una sessió
- Només 2 usuaris actius
- Permet sincronització en temps real

## Codi per Assignar Client

El coach pot generar un codi per assignar un client:
Característiques:

- Codi únic per coach
- Vàlid per assignar un client
- No inicia sessió de entrenament automàticament

## Flux

Usuari (Host per Friend Session):

- crea rutina
- prem “Iniciar sessió”
- genera codi

Altres usuaris (Guest):

- introdueixen codi
- entren a la sessió
- es connecten via socket

Coach:

- genera codi per assignar client
- client introdueix codi per ser assignat

---

# 7. Funcionalitat en Temps Real (Sockets)

S’utilitzen sockets per sincronitzar sessions Friend (Host + Guest). No s'usa per coach–client.

## Esdeveniments usuari → usuari

- exercici actual
- inici descans
- final descans
- canvi d’exercici
- finalitzar sessió

---

## Esdeveniments usuari → usuari

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

WebRTC s'usa SOLO per comunicació opcional coach–client quan es requereixi.

## Opció MVP Elegida: Xat de Text WebRTC (DataChannel)

Justificació: És l'opció més simple per MVP, ja que no requereix permisos de micrófono/càmera, evita problemes de latència/audio, i permet feedback immediat sense complexitat addicional. La videotrucada seria més rica però menys estable en entorns web bàsics.

## Modalitats MVP

- Xat de text en temps real via DataChannel

## Ús

Quan coach i client vulguin comunicar-se:

- coach i client poden:
  - escriure missatges
  - donar feedback immediat

No està assignat a sessions de entrenament.

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

- botó “Iniciar sessió” (opcional)
- generar codi per assignar client
- panell de control en viu (si sessió iniciada)
- panell WebRTC (opcional)

---

# 10. Funcionalitats Web — Client

## Accés per codi

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

> La plataforma permet planificació d’entrenament i execució guiada en temps real per amics mitjançant sincronització amb sockets, i comunicació opcional coach–client via WebRTC, proporcionant una experiència de coaching remot funcional i demostrable tècnicament.
