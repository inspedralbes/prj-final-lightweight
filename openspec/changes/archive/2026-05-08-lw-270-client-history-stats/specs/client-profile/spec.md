# Spec: Perfil del Cliente (delta)

## Propósito

Spec delta para la capacidad `client-profile`. Este cambio añade una entrada de navegación en el dashboard del cliente que enlaza con la nueva página de Historial y Estadísticas. No se modifica ningún requisito existente; solo se añade un nuevo elemento de navegación.

## Requisitos AÑADIDOS

### Requisito: El dashboard del cliente expone un enlace a la página de Historial y Estadísticas
El sistema DEBE renderizar un botón o enlace de navegación en `ClientDashboard` (la página principal del cliente) que navegue al usuario a `/client/history`.

#### Escenario: El enlace de navegación es visible en el dashboard del cliente
- **CUANDO** un CLIENT autenticado visita `/client-home`
- **ENTONCES** el área de cabecera del dashboard contiene un enlace/botón con la etiqueta de la clave i18n `history.navLabel` apuntando a `/client/history`

#### Escenario: Al hacer clic en el enlace se navega a la página de historial
- **CUANDO** el CLIENT hace clic en el enlace de navegación de Historial en el dashboard
- **ENTONCES** React Router navega a `/client/history` sin recargar la página completa

#### Escenario: i18n — la etiqueta de navegación existe en todos los idiomas
- **CUANDO** el dashboard se renderiza en catalán, español o inglés
- **ENTONCES** la etiqueta del enlace de historial se lee de `history.navLabel` en el archivo de localización activo
