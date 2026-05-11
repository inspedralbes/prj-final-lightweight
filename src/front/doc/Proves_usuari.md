# Proves d'usuari — LightWeight

## Autenticació (LW-441)

### Registre d'usuari nou
1. Navega a `/register`.
2. Omple nom d'usuari, correu electrònic, contrasenya i confirmació.
3. **Esperat**: redirigeix a `/login` i apareix el toast "Compte creat correctament".
4. Inicia sessió amb les credencials creades.
5. **Esperat**: redirigeix al dashboard correcte (COACH → `/dashboard`, CLIENT → `/client-home`).

### Registre amb dades invàlides
1. Envia el formulari amb correu electrònic invàlid (p. ex. "notanemail").
   - **Esperat**: la validació HTML5 evita l'enviament, el camp de correu es marca com a invàlid.
2. Envia el formulari amb contrasenyes no coincidents.
   - **Esperat**: apareix el missatge "Les contrasenyes no coincideixen".
3. Intenta registrar-se amb un nom d'usuari ja existent.
   - **Esperat**: apareix el missatge "Aquest usuari ja existeix".

### Login
1. Navega a `/login` i entra credencials correctes d'un COACH.
   - **Esperat**: redirigeix a `/dashboard`, toast "Sessió iniciada correctament", token a localStorage.
2. Entra credencials correctes d'un CLIENT.
   - **Esperat**: redirigeix a `/client-home`.
3. Entra una contrasenya incorrecta.
   - **Esperat**: apareix l'alerta "Usuari o contrasenya invàlids", romanem a `/login`, cap token emmagatzemat.
4. Prem Enter al camp de contrasenya en lloc de fer clic al botó.
   - **Esperat**: el formulari s'envia igual que amb el botó.

### Logout
1. Inicia sessió i fes clic al botó "Tancar sessió" de la barra lateral.
   - **Esperat**: redirigeix a `/login`, localStorage buit.
2. Intenta navegar directament a `/dashboard` després de logout.
   - **Esperat**: redirigeix a `/login`.

### Persistència de sessió
1. Inicia sessió i recarrega la pàgina (F5).
   - **Esperat**: romanem al dashboard sense necessitat de tornar a iniciar sessió.
2. Inicia sessió, navega entre `/dashboard` i `/clients`, recarrega en cada pàgina.
   - **Esperat**: el token a localStorage no canvia i no hi ha redirects inesperats.

---

## Progrés de clients (LW-279)

### Llista d'activitat de clients
1. Inicia sessió com a entrenador.
2. Fes clic a "Progrés de clients" a la barra lateral.
3. **Esperat**: s'obre `/clients/progress` amb una taula de clients. Per a cada client, es mostra el nom d'usuari, la data de l'última sessió completada (o "—" si no n'hi ha cap) i el total de sessions.
4. **Cas buit**: si cap client té sessions completades, es mostra el missatge "Cap sessió completada".

### Navegació al detall d'un client
1. Des de `/clients/progress`, fes clic sobre qualsevol fila de client.
2. **Esperat**: navega a `/clients/progress/:clientId` i es carrega la pàgina de detall.
3. Fes clic a "Tornar a la llista".
4. **Esperat**: torna a `/clients/progress`.

### Historial de sessions i estadístiques
1. A la pàgina de detall d'un client que té sessions completades:
   - **Esperat**: tres targetes d'estadístiques (Sessions totals, Sèries totals, Exercicis totals) amb valors reals.
   - **Esperat**: taula d'historial amb columnes Rutina, Data, % completat i Sèries.
   - Una sessió amb `completionPercentage` null ha de mostrar "0%" a la taula.

### Gràfic de barres
1. A la pàgina de detall d'un client amb sessions:
   - **Esperat**: apareix un gràfic de barres taronja (fins a 10 barres). L'alçada de cada barra és proporcional al % completat.
   - Una barra amb 0% ha de tenir alçada mínima (pràcticament plana).
2. Per a un client sense sessions, el gràfic no s'ha de renderitzar.

### Control d'accés
1. Tanca la sessió i accedeix directament a `/clients/progress`.
   - **Esperat**: redirigeix a `/login`.
2. Inicia sessió com a client (no entrenador) i accedeix a `/clients/progress`.
   - **Esperat**: redirigeix a `/client-home`.

### Internacionalització
1. A la pàgina de progrés, canvia l'idioma al castellà.
   - **Esperat**: totes les etiquetes (Última sesión, Sesiones totales, etc.) canvien sense recarregar la pàgina.
