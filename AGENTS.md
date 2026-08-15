# Memoria del Proyecto — Envías C.A.

## Contexto Clave
- **Empresa:** Envías C.A. (Logística y entregas en Venezuela).
- **Regla Visual:** CERO EMOJIS. Usar únicamente SVG limpios.
- **Producción:** Desplegado en Railway con PostgreSQL: `https://envias-production.up.railway.app`.
- **GitHub:** `https://github.com/daniellacruz03/envias.git`.

## Cuentas de Acceso (PostgreSQL en Railway)
- **Yoleida (Logística):** `yoleida@envias.com` | `yoleida123`
- **Yuliana (Logística):** `yuliana@envias.com` | `yuliana123`
- **Yeraldine (Logística):** `yeraldine@envias.com` | `yeraldine123`
- **Yesica (Logística):** `yesica@envias.com` | `yesica123`
- **Admin Central (Logística):** `admin@envias.com` | `admin123`
- **Carlos Pérez (Chofer):** `carlos@envias.com` | `chofer123`

## Módulos y Rutas
- `/login`: Inicio de sesión seguro y campos limpios.
- `/dashboard`: Panel de logística central con Live Sync cada 3.5s, botón de WhatsApp con cambio automático a `Contactado`, asignación de choferes y enlaces satelitales a Google Maps.
- `/confirmar?guia=ID`: Portal del cliente con 3 métodos de captura de ubicación (GPS, Dirección y Leaflet en Venezuela).
- `/api/guias`, `/api/confirmar`, `/api/choferes`, `/api/auth/login`.

## Estados de Guía
`Por contactar` -> `Contactado` (al enviar WhatsApp) -> `En ruta` -> `Entregado`.
Bandera `gps_confirmado = true` cuando el cliente confirma en su portal.
