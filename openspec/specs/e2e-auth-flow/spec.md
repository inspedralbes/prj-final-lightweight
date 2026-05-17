# Especificació: Flux d'Autenticació Complet (E2E)

## Propòsit

Defineix els requisits funcionals per al flux d'autenticació complet de l'aplicació, incloent registre d'usuaris, login, logout i persistència de sessió. Inclou els criteris de comprovabilitat per a tests E2E amb Playwright i el suport d'internacionalització (i18n) per a totes les cadenes visibles per a l'usuari.

## Requisits

### Requisit: Registre d'Usuaris

El sistema HA DE permetre a un visitant anònim registrar-se com a nou usuari proporcionant nom d'usuari, correu electrònic, contrasenya i confirmació de contrasenya. Després del registre exitós, l'usuari HA DE rebre un token JWT i poder iniciar sessió.

#### Escenari: Registre exitós de nou usuari
- **QUAN** un visitant omple el formulari de registre amb un nom d'usuari únic, un correu electrònic vàlid i contrasenyes coincidents
- **ALESHORES** el sistema crea un nou registre d'usuari a la base de dades, emmagatzema el token JWT a localStorage, redirigeix al dashboard apropiat (entrenador o client segons el rol) i mostra un missatge d'èxit

#### Escenari: Registre amb nom d'usuari duplicat
- **QUAN** un visitant intenta registrar-se amb un nom d'usuari que ja existeix
- **ALESHORES** el sistema retorna HTTP 409 Conflicte amb un missatge d'error "Usuari ja existeix" (Català), evita el registre i manté l'usuari a la pàgina de registre

#### Escenari: Registre amb format de correu electrònic invàlid
- **QUAN** un visitant presenta el formulari de registre amb un correu electrònic invàlid (p. ex., "noésuncorreu")
- **ALESHORES** el sistema mostra un error de validació del costat del client, evita l'enviament del formulari i destaca el camp de correu electrònic

#### Escenari: Registre amb contrasenyes no coincidents
- **QUAN** un visitant omple el camp de contrasenya amb "contrasenya123" i el camp de confirmació de contrasenya amb "contrasenya456"
- **ALESHORES** el sistema mostra un error de validació del costat del client "Les contrasenyes no coincideixen", evita l'enviament del formulari

#### Escenari: Registre amb camps requerits buits
- **QUAN** un visitant presenta el formulari de registre sense omplir els camps de nom d'usuari, correu electrònic o contrasenya
- **ALESHORES** el sistema mostra errors de validació HTML5 i evita l'enviament del formulari

#### Escenari: El registre reïxeix per a ambdós rols COACH i CLIENT
- **QUAN** un visitant completa el registre i el backend li assigna un rol (COACH o CLIENT) basant-se en invitació o per defecte
- **ALESHORES** el sistema emmagatzema el rol assignat al registre d'usuari, crea un ClientProfile si el rol és CLIENT, i l'usuari pot iniciar sessió amb la visibilitat del dashboard correcta basada en el rol

---

### Requisit: Login amb Credencials Vàlides

El sistema HA DE permetre a un usuari registrat iniciar sessió amb el seu nom d'usuari i contrasenya. Després del login exitós, l'usuari HA DE rebre un token JWT, tenir-lo emmagatzemat a localStorage i ser redirigit al seu dashboard específic del rol.

#### Escenari: Login exitós com a COACH
- **QUAN** un usuari COACH omple el nom d'usuari i la contrasenya amb les credencials correctes i fa clic a enviar
- **ALESHORES** el sistema valida les credencials, retorna HTTP 200 amb access_token i objecte d'usuari, emmagatzema el token a localStorage, estableix AuthContext, redirigeix a /dashboard (o ruta específica de l'entrenador) i mostra notificació d'èxit

#### Escenari: Login exitós com a CLIENT
- **QUAN** un usuari CLIENT omple el nom d'usuari i la contrasenya amb les credencials correctes i fa clic a enviar
- **ALESHORES** el sistema valida les credencials, retorna HTTP 200 amb access_token, emmagatzema el token a localStorage, estableix AuthContext, redirigeix a /client-home (o ruta específica del client) i mostra notificació d'èxit

#### Escenari: La pàgina de login mostra tots els camps requerits
- **QUAN** un visitant navega a /login
- **ALESHORES** la pàgina renderitza camp de nom d'usuari, camp de contrasenya, botó d'enviament i un enllaç "Registrar-se", amb etiquetes adequades a la configuració local actual (Català per defecte)

#### Escenari: El formulari de login s'envia mitjançant la tecla Enter
- **QUAN** un usuari omple el nom d'usuari i la contrasenya i prem Retorn al camp de contrasenya
- **ALESHORES** l'enviament del formulari es declanxa, igual que fer clic al botó d'enviament

---

### Requisit: Login amb Credencials Invàlides

El sistema HA DE rebutjar els intents de login amb credencials incorrectes i mostrar un missatge d'error apropiat sense comprometre la seguretat (p. ex., no revelant si el nom d'usuari existeix).

#### Escenari: Login amb contrasenya incorrecta
- **QUAN** un usuari omple un nom d'usuari vàlid i una contrasenya incorrecta i fa clic a enviar
- **ALESHORES** el sistema retorna HTTP 401 No Autoritzat amb missatge d'error "Credencials incorrectes" (o similar), mostra l'error en un element d'alerta amb role="alert", no s'emmagatzema cap token a localStorage i l'usuari roman a la pàgina de login

#### Escenari: Login amb nom d'usuari inexistent
- **QUAN** un usuari omple un nom d'usuari que no existeix i qualsevol contrasenya i fa clic a enviar
- **ALESHORES** el sistema retorna HTTP 401 No Autoritzat amb un missatge d'error genèric "Credencials incorrectes", mostra l'alerta d'error, no s'emmagatzema cap token i l'usuari roman a la pàgina de login (no revela si el nom d'usuari existeix)

#### Escenari: Missatge d'error mostrat en la configuració local correcta
- **QUAN** el navegador està establert a espanyol o anglès i el login falla
- **ALESHORES** el missatge d'error "Credenciales incorrectas" (espanyol) o "Credenciales incorrectas" (anglès) es mostra, coincidint amb la clau i18n del fitxer de configuració local

#### Escenari: Múltiples intents de login fallits no bloquegen el compte
- **QUAN** un usuari fa 5+ intents de login consecutius fallits (contrasenya incorrecta)
- **ALESHORES** el sistema continua acceptant intents de login sense bloqueig de compte (sense limitació de velocitat implementada en aquesta fase), però registra els intents fallits per a auditoria de seguretat

---

### Requisit: Logout i Invalidació de Sessió

El sistema HA DE permetre a un usuari autenticat tancar sessió netejant el token de sessió i redirigint a la pàgina de login. Després del logout, l'usuari NO HA DE poder accedir a rutes protegides.

#### Escenari: El logout exitós neteja el token
- **QUAN** un usuari autenticat fa clic al botó "Logout" (o "Tancar sessió" en Català)
- **ALESHORES** el sistema neteja el token de localStorage, neteja AuthContext, elimina la connexió Socket.IO si està activa, redirigeix a /login i mostra un missatge de confirmació de logout

#### Escenari: Logout del dashboard del coach
- **QUAN** un usuari COACH autenticat fa clic a logout del dashboard (p. ex., menú de barra de navegació)
- **ALESHORES** localStorage es neteja, AuthContext es reinicia, la redirecció de ProtectedRoute evita accedir a /dashboard i l'usuari es redirigeix a /login

#### Escenari: Logout del dashboard del client
- **QUAN** un usuari CLIENT autenticat fa clic a logout del seu dashboard
- **ALESHORES** localStorage es neteja, AuthContext es reinicia, la redirecció de ProtectedRoute evita accedir a /client-home i l'usuari es redirigeix a /login

#### Escenari: La ruta protegida és inaccessible després del logout
- **QUAN** un usuari fa logout i després navega directament a una ruta protegida (p. ex., /dashboard)
- **ALESHORES** la guàrdia de ProtectedRoute detecta que no hi ha token a localStorage, redirigeix a /login i l'usuari no pot accedir al contingut protegit

#### Escenari: Les crides API després del logout retornen 401 No Autoritzat
- **QUAN** un usuari autenticat fa logout i després un component intenta fer una cridada API a un endpoint protegit
- **ALESHORES** l'interceptor axios a `api.ts` detecta la resposta 401, neteja localStorage, neteja AuthContext i redirigeix a /login

---

### Requisit: Persistència de Sessió en Recarregues de Pàgina

El sistema HA DE persistir la sessió d'autenticació de l'usuari en recarregues de pàgina emmagatzemant el token JWT a localStorage i restaurant AuthContext en el muntatge de l'app.

#### Escenari: El token persista a localStorage després del login
- **QUAN** un usuari inicia sessió correctament i el token s'emmagatzema a localStorage
- **ALESHORES** el token roman a localStorage després de recarregar la pàgina, pot recuperar-se via `localStorage.getItem('token')` i coincideix amb el valor de token original

#### Escenari: L'usuari roman autenticat després de recarregar la pàgina
- **QUAN** un usuari autenticat recarrega la pàgina (p. ex., via actualització del navegador o F5)
- **ALESHORES** AuthContext llegeix el token de localStorage en el muntatge de l'app, estableix l'estat de l'usuari i la barra de navegació mostra el nom d'usuari de l'usuari, confirmant que l'autenticació va persistir

#### Escenari: El dashboard és accessible sense re-login després de recarregar
- **QUAN** un usuari COACH es troba a /dashboard, recarrega la pàgina i AuthContext es restaura
- **ALESHORES** la pàgina roman accessible sense redirecció a /login i tots els components protegits es renderitzen correctament

#### Escenari: La sessió persista en múltiples navegacions de pàgina
- **QUAN** un usuari autenticat navega entre /dashboard, /clients, /routines i /profile, recarregant en cada pàgina
- **ALESHORES** el token a localStorage es manté sense canvis, AuthContext persista i l'usuari no es redirigeix mai a /login inesperadament

#### Escenari: La sessió s'invalida quan el token s'esborrat manualment de localStorage
- **QUAN** un usuari inicia sessió, després neteja manualment localStorage (simulant una acció d'extensió del navegador o eines de desenvolupador)
- **ALESHORES** en recarregar la pàgina, AuthContext detecta la falta de token, redirigeix a /login i l'usuari fa logout

#### Escenari: El token vençut declanxa re-login en la següent cridada API
- **QUAN** un usuari inicia sessió, el token caduca (p. ex., després de 24 hores o venciment configurat) i l'usuari fa una cridada API
- **ALESHORES** l'interceptor axios rep HTTP 401, neteja localStorage, redirigeix a /login i l'usuari ha de tornar a iniciar sessió

---

### Requisit: Comprovabilitat — Cobertura de Tests E2E

El sistema HA DE ser totalment comprovable mitjançant tests E2E de Playwright que cobreixin tots els escenaris de registre, login, logout i persistència de sessió. Tots els elements de la UI utilitzats en tests HA DE tenir selectores estables (data-testid o rols HTML semàntics).

#### Escenari: El formulari de registre té selectores comprovables
- **QUAN** un test de Playwright obri la pàgina de registre
- **ALESHORES** pot localitzar inputs de nom d'usuari, correu electrònic, contrasenya i confirmació de contrasenya per `data-testid` o selectores semàntics, interactuar amb ells i afirmar estats d'èxit/error

#### Escenari: El formulari de login té selectores comprovables
- **QUAN** un test de Playwright obri la pàgina de login
- **ALESHORES** pot localitzar inputs de nom d'usuari i contrasenya, botó d'enviament i element d'alerta d'error (via `[role="alert"]`), interactuar amb ells i validar estats de resposta

#### Escenari: El botó de logout és comprovable
- **QUAN** un usuari autenticat està autenticat i un test de Playwright busca el botó de logout
- **ALESHORES** pot localitzar el botó de logout (p. ex., per text "Logout" o `[data-testid="logout-btn"]`), fer-hi clic i afirmar que localStorage es neteja i la pàgina es redirigeix

#### Escenari: El token de localStorage pot llegir-se i validar-se en tests
- **QUAN** un test de Playwright inicia sessió a un usuari i crida `page.evaluate(() => localStorage.getItem('token'))`
- **ALESHORES** recupera el token JWT com a cadena, pot descodificar la càrrega per verificar userId i rol i confirmar que l'estructura del token és vàlida

#### Escenari: Els tests poden esperar estat d'autenticació i navegació de pàgina
- **QUAN** un test de Playwright inicia sessió i espera navegació o ociosa de xarxa
- **ALESHORES** utilitza `page.waitForNavigation()`, `page.waitForLoadState('networkidle')` i `page.waitForSelector()` per determinar de forma fiable quan l'app ha acabat de carregar-se i l'autenticació és completa

#### Escenari: L'estat de la base de dades de test es reinicia entre execucions de test
- **QUAN** un test E2E es completa (exitós o fallit) i comença el test següent
- **ALESHORES** el fixture `e2e/fixtures/reset.ts` neteja les dades de test de PostgreSQL, assegurant que no hi ha fuga d'estat entre tests i permetent que els tests de registre utilitzin noms d'usuari de test consistents

#### Escenari: Ruta de QA manual de forgot-password

- **QUAN** un desarrollador envía el formulari ForgotPassword en `http://localhost:5173/forgot-password` amb l'email d'un usuari registrat
- **ALESHORES** el backend registra una URL de previsualització d'Ethereal a la consola (format: `https://ethereal.email/message/...`)
- **I** el desarrollador pot obrir aquella URL en un navegador per verificar que l'HTML de l'email conté un enllaç a `/reset-password?token=<hex>`
- **I** seguir l'enllaç i enviar una nova contrasenya a `/reset-password` completa el restabliment
- **I** el desarrollador pot iniciar sessió amb la nova contrasenya
- **I** qualsevol cobertura automatitzada nova DEBE afegir-se com a `*.spec.ts` co-ubicat a `src/back/src/auth/` usant `@nestjs/testing` amb un `PrismaService` mockeado, un `JwtService.sign` stubbejat i un `MailService` mockeado

---

### Requisit: Suport d'i18n per a Fluxos d'Autenticació

El sistema HA DE mostrar totes les cadenes visibles per a l'usuari per al registre, login, logout i missatges d'error en la configuració local seleccionada per l'usuari (Català, Espanyol o Anglès). Totes les claus HA DE existir en els tres fitxers de configuració local i les traduccions HA DE ser exactes.

#### Escenari: La pàgina de registre es mostra en Català (per defecte)
- **QUAN** un visitant navega a /register sense establir una configuració local explícita
- **ALESHORES** la pàgina mostra etiquetes "Usuari", "Correu electrònic", "Contrasenya", "Confirmar contrasenya", "Registrar-se" en Català

#### Escenari: El missatge d'error de login es tradueix
- **QUAN** un usuari inicia sessió amb una contrasenya incorrecta i es mostra l'error
- **ALESHORES** el missatge d'error coincideix amb la clau de ca.json (Català) o es.json (Espanyol) o en.json (Anglès) segons la configuració local seleccionada

#### Escenari: El missatge de confirmació de logout es tradueix
- **QUAN** un usuari fa clic a logout i apareix un missatge de confirmació o èxit
- **ALESHORES** el missatge es mostra a la configuració local actual de l'usuari (Català "Sessió tancada", Espanyol "Sesión cerrada", Anglès "Session closed")

#### Escenari: Les claus i18n estan completes en totes les configuracions locals
- **QUAN** un desenvolupador comprova `src/front/src/i18n/locales/{ca,es,en}.json`
- **ALESHORES** totes les claus relacionades amb autenticació (auth.register.*, auth.login.*, auth.logout.*, common.error.*) existeixen en els tres fitxers amb valors de cadena no buits i gramàtica correcta
