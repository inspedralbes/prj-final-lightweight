# Especificació: friend-session-user-search

## Requisits AFEGITS

### Requisit: Cercar usuaris en línia per nom

El sistema HA DE proporcionar un endpoint que retorna una llista d'usuaris actualment connectats i filtrats per nom d'usuari o nom de visualització.

#### Escenari: La cerca retorna usuaris en línia coincidents
- **GIVEN** usuari Alice està connectat
- **GIVEN** usuari Bob està connectat
- **GIVEN** usuari Charlie està desconnectat
- **WHEN** Alice crida `GET /api/users/search?q=Bo`
- **THEN** la resposta és HTTP 200 amb una llista que conté només Bob
- **THEN** cada objecte d'usuari inclou `id`, `username`, i `role`

#### Escenari: La cerca requereix longitud mínima de consulta
- **GIVEN** usuari Alice està connectat
- **WHEN** Alice crida `GET /api/users/search?q=A`
- **THEN** la resposta és HTTP 400 amb error "Query must be at least 2 characters"

#### Escenari: La cerca retorna llista buida quan no hi ha coincidències
- **GIVEN** usuari Alice està connectat
- **WHEN** Alice crida `GET /api/users/search?q=Zzzzzz`
- **THEN** la resposta és HTTP 200 amb un array buit

#### Escenari: Els resultats de cerca es limiten a 10 usuaris
- **GIVEN** 50 usuaris estan connectats amb noms similars
- **WHEN** usuari Alice crida `GET /api/users/search?q=user`
- **THEN** la resposta és HTTP 200 amb com a màxim 10 usuaris

#### Escenari: La cerca és sense distinció de majúscules/minúscules
- **GIVEN** usuari "BobSmith" està connectat
- **WHEN** Alice crida `GET /api/users/search?q=bob`
- **THEN** la resposta inclou BobSmith

#### Escenari: Usuari no autenticat no pot cercar
- **GIVEN** usuari no està autenticat (sense token JWT)
- **WHEN** usuari crida `GET /api/users/search?q=bob`
- **THEN** la resposta és HTTP 401 Unauthorized

### Requisit: La cerca exclou l'usuari actual

El sistema NO HA DE retornar l'usuari que cerca en els seus propis resultats de cerca.

#### Escenari: L'usuari actual és exclòs dels resultats
- **GIVEN** usuari Alice està connectat
- **WHEN** Alice crida `GET /api/users/search?q=Alice`
- **THEN** el registre d'usuari propi d'Alice no està a la resposta

#### Escenari: Coincidència parcial de nom propi també és exclosa
- **GIVEN** usuari "Alice_Coach" està connectat
- **WHEN** Alice_Coach crida `GET /api/users/search?q=Alice`
- **THEN** el registre d'Alice_Coach és exclòs, encara que coincideixi amb la consulta

### Requisit: La cerca no exposa dades sensibles d'usuari

El sistema HA DE retornar només informació mínima d'usuari (id, username, role) en resultats de cerca.

#### Escenari: La resposta de cerca exclou camps sensibles
- **GIVEN** usuari Alice crida `GET /api/users/search?q=bob`
- **WHEN** la resposta és retornada
- **THEN** no s'inclouen camps email, hash de contrasenya, o `createdAt`
- **THEN** només `id`, `username`, i `role` són presents

### Requisit: Només usuaris en línia apareixen a la cerca

El sistema HA DE filtrar resultats per mostrar només usuaris amb una connexió Socket.IO activa.

#### Escenari: Usuari desconnectat no apareix a la cerca
- **GIVEN** usuari Bob estava connectat i s'ha desconnectat des de llavors
- **WHEN** Alice crida `GET /api/users/search?q=bob`
- **THEN** Bob no apareix als resultats

#### Escenari: Usuari que tanca app dins de 60 segons pot encara aparèixer
- **GIVEN** usuari Bob tanca la seva app a temps T0
- **WHEN** Alice crida `GET /api/users/search?q=bob` a temps T0 + 30 segons
- **THEN** Bob pot encara aparèixer (timeout Socket.IO no encara activat)
- **NOTE** Això és acceptable; presència exacta no és garantida abans de timeout

## Testabilitat

**Enfocament de Test Unitari Jest:**
- Mock instància de servidor `socket.io` i cridar `.allSockets()` o un conjunt en memòria d'usuaris connectats
- Mock `PrismaService.user.findMany()` per retornar registres d'usuari de test
- Assert que resposta filtra usuaris desconnectats, exclou l'usuari actual, i limita resultats a 10
- Assert control d'accés basat en rols (tots els rols autenticats poden cercar)

**Passos QA Manuals (afegir a `doc/Proves_usuari.md`):**
1. Iniciar sessió com Usuari A en pestanya de navegador 1, Usuari B en pestanya 2
2. En pestanya 1, navegar a Friend Session Lobby i cercar nom d'Usuari B
3. Verificar Usuari B apareix als resultats amb nom d'usuari i rol correctes
4. Tancar pestanya 2 (Usuari B tanca sessió)
5. En pestanya 1, cercar Usuari B de nou
6. Verificar Usuari B ja no apareix als resultats
7. Refrescar pestanya 1 (Usuari A encara connectat)
8. Cercar "Usuari A" — verificar Usuari A NO apareix als seus propis resultats de cerca

**Client de Test Socket.IO (si s'afegeixen tests d'integració):**
- Connectar dos clients Socket.IO amb userIds diferents
- Verify both are added to the connected users set
- Call search endpoint and confirm both appear in results
- Disconnect one client
- Verify the disconnected client no longer appears in search results
