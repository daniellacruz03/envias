# Memoria del Proyecto — Envías C.A.

## Contexto Clave
- **Empresa:** Envías C.A. (Logística y entregas en Venezuela).
- **Sedes Oficiales (Coordenadas Exactas de Google Maps):**
  - **Sede Principal / Hub Central Barquisimeto (Estado Lara):** Calle 6, Zona Industrial II (`Lat: 10.0808, Lon: -69.3756`).
  - **Sede Caracas (Distrito Capital):** Quinta Crespo / San Martín (`Lat: 10.4934, Lon: -66.9299`).
  - **Sede Mérida (Estado Mérida):** Sector La Parroquia / Av. Los Próceres (`Lat: 8.5738, Lon: -71.1851`).
- **Regla Visual:** CERO EMOJIS. Usar únicamente SVG limpios.
- **Producción:** Desplegado en Railway con PostgreSQL: `https://envias-production.up.railway.app`.
- **GitHub:** `https://github.com/daniellacruz03/envias.git`.

## Cuentas de Acceso (PostgreSQL en Railway)
### Logística Central y Sedes
- **Admin Central:** `admin@envias.com` | `admin123`
- **Yoleida:** `yoleida@envias.com` | `yoleida123`
- **Yuliana:** `yuliana@envias.com` | `yuliana123`
- **Yeraldine:** `yeraldine@envias.com` | `yeraldine123`
- **Yesica:** `yesica@envias.com` | `yesica123`

### Choferes / Flota de Transporte
- **Carlos Pérez:** `carlos@envias.com` | `chofer123`
- **Eulogio Morales:** `eulogio@envias.com` | `chofer123`
- **Albert González:** `albert@envias.com` | `chofer123`
- **José Mendoza:** `mendoza@envias.com` | `chofer123`
- **Mario Rivas:** `mario@envias.com` | `chofer123`
- **Emiro Colmenárez:** `emiro@envias.com` | `chofer123`

## Módulos y Rutas
- `/login`: Inicio de sesión seguro y buscador público de guías con redirección por rol.
- `/dashboard`: Panel de logística central con 3 vistas (`Lista General`, `Agrupado por Ciudad`, `Estado de Choferes` con 3 fases: Almacén, En Ruta, Entregado y visor de fotos de entrega en vivo), Live Sync cada 3.5s, botón de WhatsApp con cambio automático a `Contactado`, asignación de choferes, selector satelital de mapas con motor de decodificación OLC (Plus Codes), optimizador de rutas por jerarquía de cercanía satelital (TSP desde Salida), visor interactivo de ruta completa para 25+ paradas en mapa Leaflet y enlaces inteligentes desglosados para Google Maps por tramos (superando el límite de 10 destinos de Google).
- `/chofer`: Portal móvil de choferes con mapa interactivo Leaflet/OSRM de paradas numeradas, navegación satelital 1-toque individual por entrega (Google Maps/Waze), WhatsApp/Llamada rápida, confirmación de entrega con foto obligatoria y Live Sync cada 4.5s.
- `/confirmar?guia=ID`: Portal del cliente con 3 métodos de captura de ubicación (GPS, Dirección y Leaflet en Venezuela).
- `/api/guias`, `/api/confirmar`, `/api/choferes`, `/api/chofer/guias`, `/api/auth/login`.

## Estados de Guía
`Por contactar` -> `Contactado` (al enviar WhatsApp) -> `En ruta` -> `Entregado`.
Bandera `gps_confirmado = true` cuando el cliente confirma en su portal.
