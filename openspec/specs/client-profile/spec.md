# Spec: Perfil del Client

## Propòsit

Gestiona les capacitats del dashboard principal del client (`ClientDashboard`), incloent els punts d'entrada de navegació cap a altres seccions de l'aplicació client.

## Requisits

### Requisit: El dashboard del client exposa un enllaç a la pàgina d'Historial i Estadístiques
El sistema HA DE renderitzar un botó o enllaç de navegació a `ClientDashboard` (la pàgina principal del client) que navegui l'usuari a `/client/history`.

#### Escenari: L'enllaç de navegació és visible al dashboard del client
- **QUAN** un CLIENT autenticat visita `/client-home`
- **ALESHORES** l'àrea de capçalera del dashboard conté un enllaç/botó amb l'etiqueta de la clau i18n `history.navLabel` que apunta a `/client/history`

#### Escenari: En fer clic a l'enllaç es navega a la pàgina d'historial
- **QUAN** el CLIENT fa clic a l'enllaç de navegació d'Historial al dashboard
- **ALESHORES** React Router navega a `/client/history` sense recarregar la pàgina completa

#### Escenari: i18n — l'etiqueta de navegació existeix en tots els idiomes
- **QUAN** el dashboard es renderitza en català, castellà o anglès
- **ALESHORES** l'etiqueta de l'enllaç d'historial es llegeix de `history.navLabel` a l'arxiu de localització actiu
