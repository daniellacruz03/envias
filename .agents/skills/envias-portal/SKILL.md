---
name: envias-portal
description: Memoria integral del proyecto Envias C.A. (Arquitectura, Base de Datos PostgreSQL en Railway, Credenciales de personal, Endpoints, Flujo de negocio y Estado de desarrollo). Incluye modulo GIS/Geofencing con poligonos vectoriales completado el 18-08-2026.
---

# Memoria Tecnica y de Negocio — Envias C.A.

Este documento contiene todo el conocimiento contextual, arquitectura, decisiones tecnicas y estado actual del sistema **Envias C.A.** para que cualquier agente o sesion mantenga continuidad total sin repetir explicaciones.

---

## 1. Identidad Corporativa y Arquitectura General
- **Empresa:** Envías C.A.
- **Actividad:** Logística, despacho, encomiendas y entregas de última milla a nivel nacional en Venezuela.
## 2. Red de Sedes e Infraestructura Satelital
- **Sede Principal / Hub Central Barquisimeto (Estado Lara):** Calle 6, Zona Industrial II (`Lat: 10.0808, Lon: -69.3756`).
- **Puntos de Cierre / Destino:** Cualquier ciudad o zona de Venezuela, retorno a sedes oficiales o culminación en la última parada de entrega. SVGs limpios corporativos.ales SVG limpios, modernos y profesionales (Tailwind CSS / Heroicons).
- **Alcance Geografico:** Venezuela. Todos los mapas (Leaflet.js) abren centrados en el mapa de Venezuela (`[7.8500, -66.0000]`, zoom: 6) sin pines precargados.
- **Formato Telefonico Universal:** Acepta codigos internacionales (`+1`, `+57`, `+34`, `+58`, etc.). Si se ingresa un formato nacional venezolano con `0` inicial (ej. `0414...`), se normaliza a `58414...` para WhatsApp.

---

## 2. Infraestructura y Despliegue Cloud

- **Backend & Base de Datos:** PostgreSQL en Railway con conexion SSL activa (`rejectUnauthorized: false`).
- **Aplicacion Web:** Astro SSR (Node.js en modo `standalone`) alojada en Railway con despliegue automatico desde GitHub.
- **URL de Produccion:** `https://envias-production.up.railway.app`
- **Repositorio en GitHub:** `https://github.com/daniellacruz03/envias.git` (rama `main`).
- **Seguridad de Secretos:** Todo secret (`DATABASE_URL`, passwords) vive en `.env` local y en las variables de entorno de Railway. En GitHub solo sube el codigo fuente limpio protegido por `.gitignore`.

---

## 3. Cuentas y Credenciales de Trabajadores

Las credenciales estan almacenadas en la tabla `usuarios` de PostgreSQL en Railway:

### Personal de Oficina / Logistica:
| Nombre | Rol | Correo de Acceso | Contrasena |
| :--- | :--- | :--- | :--- |
| Yoleida | Logistica | yoleida@envias.com | yoleida123 |
| Yuliana | Logistica | yuliana@envias.com | yuliana123 |
| Yeraldine | Logistica | yeraldine@envias.com | yeraldine123 |
| Yesica | Logistica | yesica@envias.com | yesica123 |
| Admin Central | Logistica | admin@envias.com | admin123 |

### B. Choferes Registrados (Flota de Transporte)
- **Carlos Leal:** `carlos@envias.com` | `chofer123` | ID: 4
- **Eulogio Morales:** `eulogio@envias.com` | `chofer123` | ID: 10
- **Albert González:** `albert@envias.com` | `chofer123` | ID: 11
- **José Mendoza:** `mendoza@envias.com` | `chofer123` | ID: 12
- **Mario Rivas:** `mario@envias.com` | `chofer123` | ID: 13
- **Emiro Colmenárez:** `emiro@envias.com` | `chofer123` | ID: 14

---

## 4. Vistas y Modulos de la Aplicacion

### A. Portal de Entrada Dual (`/login`)
- Ruta: `src/pages/login.astro`
- **Pestaña 1: Rastreo Público de Guías (Sin Credenciales):**
  - Permite a cualquier cliente o destinatario consultar el estado en tiempo real de su paquete ingresando el número de guía (ej. `MER-001`).
  - Muestra la etapa visual del paquete (1. Almacén Central ➔ 2. Coordinado ➔ 3. En Ruta ➔ 4. Entregado), datos del envío, chofer asignado, estado de confirmación GPS y botón directo para confirmar ubicación satelital (`/confirmar?guia=ID`).
- **Pestaña 2: Acceso Operativo (Personal de la Empresa):**
  - Autenticación segura para Logística (`/dashboard`) y Choferes (`/chofer`).
  - Redirección inteligente basada en rol con protección anti-caché.

### B. Panel Central de Logística (`/dashboard`)
- Ruta: `src/pages/dashboard.astro`
- Métricas en tiempo real (KPIs): Total Guías, Por Contactar, En Ruta, GPS Confirmadas.
- Registro rápido de nuevas guías con autocompletado y validación de formatos venezolanos.
- Vista dual: **Lista General (Tabla)** y **Agrupado por Ciudad (Rutas)**.
- **Planificador de Rutas Secuencial (Spoke Dispatch):**
  - **Buscador con Autocompletado de Ciudades y Zonas de Venezuela (Estilo Google Maps / Spoke):** Permite escribir y autocompletar cualquier ciudad, municipio, zona o sede de Venezuela tanto para el **Punto de Salida/Origen** como para el **Punto de Destino/Cierre** (ej. *Mérida*, *El Vigía*, *Caracas*, *Valencia*, *Maracay*, *San Cristóbal*, *Valera*, *Barinas*, *Última Parada de Entrega*, etc.).
  - Permite ordenar interactivamente las paradas de entrega (Parada 1, Parada 2, Parada 3...) con botones Subir/Bajar o eliminar.
  - **Optimización Satelital Inteligente por GPS:** Calcula la ruta más corta y eficiente usando las coordenadas satelitales del cliente con el algoritmo de vecino más cercano (*Nearest Neighbor TSP*).
  - Despacho masivo directo al chofer en estado `En ruta` vía `POST /api/guias/ruta`.
- Acciones en 1-clic: Enlace a WhatsApp corporativo (cambia a `Contactado`), llamada, visualización de comprobante de entrega y eliminación.

- **Vistas Duales:**
  - **Lista General:** Tabla operativa con filtros en vivo y acciones individuales.
  - **Agrupado por Ciudad (Rutas):** Tarjetas organizadas por ciudad con métricas (guías, piezas, confirmadas GPS) y **selector masivo para asignar un chofer a todas las entregas de esa ciudad en un solo clic** (transición automática a `En ruta`).
- **Live Sync en Segundo Plano:** Sondeo silencioso cada 3.5 segundos (`silentRefresh()`).

### D. Portal Móvil del Chofer (`/chofer`)
- Ruta: `src/pages/chofer.astro`
- **Mapa Interactivo de Hoja de Ruta Satelital (Leaflet.js + OSRM):**
  - Traza la ruta real por autopistas y carreteras conectando: **Punto de Salida / Origen** (ej. *Sede Principal Barquisimeto*) $\rightarrow$ **Parada #1** $\rightarrow$ **Parada #2** $\rightarrow$ **Parada #3** $\rightarrow$ **Punto de Retorno / Cierre**.
  - **Fijación Inteligente de Zoom:** Los sondeos de Live Sync automáticos (cada 4.5s) ya **no resetean ni alejan el zoom** si el chofer está interactuando o acercándose manualmente al mapa. Botón flotante para re-centrar la ruta completa a demanda.
  - **Navegación Satelital 1-Toque Individual:** Cada tarjeta de parada despachada cuenta con su botón directo para navegar a las coordenadas exactas del cliente en Google Maps / Waze, siguiendo la jerarquía secuencial ordenada (Parada #1, Parada #2, etc.).
- **Confirmación con Comprobante Obligatorio:** Captura de foto con cámara o galería, compresión cliente en Canvas (JPEG 75%, máx 1200px) y subida a `/api/chofer/entregar`.
- **Live Sync en Segundo Plano:** Sondeo silencioso cada 4.5 segundos (`silentRefresh()`).

### C. Portal Autoservicio del Cliente (/confirmar?guia=ID_GUIA)
- Ruta: `src/pages/confirmar.astro`
- Consulta SSR protegida por `id_guia`.
- 3 Metodos de Captura de Ubicacion: GPS nativo, Direccion escrita, Mapa Leaflet con pin arrastrable.
- Sistema GIS/Geofencing integrado (ver Seccion 8).
- Meta tags Open Graph para tarjetas de vista previa enriquecidas en WhatsApp.

### D. Portal Móvil para Choferes (/chofer)
- Ruta: `src/pages/chofer.astro`
- Vista Mobile-First diseñada para una sola mano (Thumb Zone).
- Barra de progreso del día (X de Y entregadas, %).
- Segmented control: "En Ruta (Pendientes)" vs "Entregados".
- Botón "Navegar Satelital (GPS)": Abre Google Maps/Waze con coordenadas directas.
- Botones de acción rápida: WhatsApp, llamada telefónica y modal Bottom Sheet para confirmar entrega.
- **Comprobante Fotográfico Obligatorio y Optimizado:**
  - El chofer debe tomar o subir una foto del comprobante de entrega sin excepción para habilitar la confirmación.
  - **Optimización Automática en Cliente (Canvas HTML5):** Redimensiona a máx. 1200px y comprime a JPEG (75% calidad), reduciendo fotos de 5MB-10MB a tan solo **~80 KB - 150 KB** antes de enviar, cuidando el almacenamiento del backend y el consumo de datos móviles.
  - Almacenamiento en backend (`public/uploads/comprobantes/`) y registro de URL en PostgreSQL (`comprobante_url`).
  - Visor Lightbox integrado para inspeccionar la foto del comprobante en cualquier momento.
- Live Sync silencioso cada 4.5s conectado a `/api/chofer/guias`.

---

## 5. Endpoints de API REST (src/pages/api/)

| Metodo | Endpoint | Descripcion |
| :--- | :--- | :--- |
| GET | /api/guias | Lista todas las guías con LEFT JOIN usuarios para datos del chofer. |
| POST | /api/guias | Registra nueva guía (estado = Por contactar, gps_confirmado = false). |
| POST | /api/guias/lote | Asigna chofer y actualiza estado de forma masiva por ciudad_destino o lista de guías. |
| GET | /api/guias/[id] | Consulta información detallada de una guía específica. |
| `PATCH` | `/api/guias/[id]` | Actualiza campos dinámicos (estado, chofer_asignado_id, gps_latitud, etc.). |
| `DELETE` | `/api/guias/[id]` | Elimina una guía de la base de datos. |
| `POST` | `/api/guias/lote` | Asignación masiva de chofer a un lote de guías o ciudad completa. |
| `POST` | `/api/guias/ruta` | Planifica, secuencia (1..N) y despacha la ruta completa con origen y destino al chofer. |
| `GET` | `/api/chofer/guias` | Lista las guías asignadas al chofer autenticado ordenadas por secuencia de ruta. |
| `POST` | `/api/chofer/entregar` | Registra entrega con comprobante fotográfico obligatorio (FormData) y actualiza estado a `Entregado`. |
| `POST` | `/api/confirmar` | Endpoint receptor de confirmación del cliente (guarda GPS y activa `gps_confirmado = true`). |
| GET | /api/choferes | Lista los conductores activos con rol Chofer. |
| POST | /api/auth/login | Autentica usuario contra PostgreSQL y emite cookie de sesion. |
| GET | /api/auth/logout | Destruye la sesion y redirige a /login. |
| GET | /api/auth/me | Retorna los datos del usuario autenticado en la sesion actual. |
| `GET` | `/api/escaneos` | Lista escaneos de guías físicas agrupados por lote (solo Logistica). Incluye `totalPendientes` para badge. |
| `POST` | `/api/escaneos` | Recibe foto individual del chofer (FormData: `foto`, `lote_id`). Guarda en `/uploads/escaneos/` y en BD. |
| `PATCH` | `/api/escaneos/[id]` | Logística aprueba (`accion: 'procesar'`) creando guía en tabla `guias`, o rechaza (`accion: 'rechazar'`). |
| `POST` | `/api/admin/migrate` | Ejecuta migraciones SQL: crea tabla `guias_escaneos` con índices (solo Logistica). |

---

## 6. Estados del Flujo de una Guia

- **Estructura de Guías:** Números enteros limpios de 6 dígitos sin letras ni caracteres especiales (ej: `982001`, `982002`, `982003`... `982100`).
- **Estados de Guía:** `Por contactar` ➔ `Contactado` (al enviar WhatsApp) ➔ `En ruta` ➔ `Entregado`.
- **Bandera GPS:** `gps_confirmado = true` cuando el cliente o logística valida la ubicación satelital.

---

## 7. Esquema de Base de Datos (PostgreSQL Railway)

### Tabla guias
```
id_guia              TEXT PRIMARY KEY
destinatario         TEXT NOT NULL
telefono_principal   TEXT NOT NULL
telefono_secundario  TEXT
ciudad_destino       TEXT NOT NULL
piezas               INTEGER DEFAULT 1
direccion_referencia TEXT
estado               TEXT DEFAULT 'Por contactar'
gps_latitud          NUMERIC
gps_longitud         NUMERIC
gps_confirmado       BOOLEAN DEFAULT false
chofer_asignado_id   INTEGER REFERENCES usuarios(id)
created_at           TIMESTAMP
```

### Tabla usuarios
```
id         SERIAL PRIMARY KEY
nombre     TEXT NOT NULL
correo     TEXT UNIQUE NOT NULL
password   TEXT NOT NULL
rol        TEXT NOT NULL  -- 'Logistica' | 'Chofer'
telefono   TEXT
activo     BOOLEAN DEFAULT true
created_at TIMESTAMP
```

---

## 8. Modulo GIS / Geofencing (COMPLETADO — 18-08-2026)

### Archivo principal: src/lib/cobertura.ts (~904 lineas)

#### Funciones Exportadas
| Funcion | Descripcion |
| :--- | :--- |
| `validarZonaEntrega(lat, lng, ciudadHint?)` | Principal. Consulta poligonos primero, luego fallback Haversine. |
| `puntoEnPoligono(lat, lng, poligono)` | Ray Casting Algorithm. |
| `validarConPoligonos(lat, lng)` | Valida contra POLIGONOS_COBERTURA. ROJO tiene prioridad absoluta. |
| `getCatalogoParaCliente()` | Serializa CIUDADES_COBERTURA para el cliente (~95 ciudades). |
| `getPoligonosParaCliente()` | Serializa POLIGONOS_COBERTURA para Leaflet (43 poligonos). |

#### Logica de Validacion (en orden de prioridad)
1. BBox Venezuela (0.6 <= lat <= 12.5, -73.5 <= lng <= -59.5): Fuera de Venezuela -> ROJO inmediato.
2. Poligonos ROJO (prioridad absoluta): Zonas prohibidas explicitas.
3. Poligonos VERDE: Zonas de entrega directa confirmadas.
4. Poligonos AMARILLO: Zonas especiales/perimetrales.
5. Fallback radio urbano (Haversine): ~95 ciudades. VERDE <= radio, AMARILLO <= radio*2.5, ROJO = fuera.

#### Catalogo de Poligonos (43 poligonos de 16 imagenes oficiales de rutas)

| Region | VERDE | AMARILLO | ROJO |
| :--- | :--- | :--- | :--- |
| Barquisimeto / Lara | Centro BQT, Cabudare | Cercado | Tamaca/El Cuji norte, El Manzano sur, Cerros oeste |
| Acarigua / Portuguesa | Corredor BQT->Acarigua, Corredor Acarigua->Agua Blanca | - | Montana oeste, Llanos SE |
| Guanare / Portuguesa | Guanare ciudad | - | Mesa de Cavacas, Gato Negro |
| Barinas Ciudad | Gran poligono urbano | - | El Jobal norte, El Guamito sur |
| Barinas Norte | Corredor Barinas->Barinitas | - | Parque Guaramacal, Llanos SE |
| Socopo / Cd. Bolivia | Socopo | - | Ciudad Bolivia (doble circulo), Llanos sur central |
| Santa Barbara / Socopo | Santa Barbara, Socopo | - | Gran elipse selva sur Barinas |
| El Pinal / Pedrera | Corredor->Pedrera | El Pinal | Parque Nacional Penaloza |
| San Cristobal Metro | Gran area (Palmira/Tariba/SC) | SC Centro | Cordero, Paramillo |
| Tachira Norte | La Fria, San Juan de Colon, Michelena, 2 corredores | - | Serranias este/oeste |
| Tachira Noroeste | La Tendida, Coloncito, corredor La Fria | - | La Grita, serranias |

#### Integracion en confirmar.astro
- `poligonosCobertura` se inyecta via `define:vars` desde SSR al script cliente.
- `pintarPoligonosEnMapa()` pinta las 43 zonas en Leaflet con estilos MUY SUTILES:
  - fillOpacity: 0.03-0.04 (casi transparente)
  - weight: 1-1.2, dashArray: '4,6' o '3,5' (borde punteado fino)
  - opacity: 0.28-0.32
  - Tooltip al hover (no sticky) con nombre de ciudad y tipo de zona.
- Al mover el pin, se valida con `validarConPoligonos()` -> badge de zona, color del pin, bloqueo del boton si ROJO.

#### Resultado visual en el portal del cliente
| Zona | Badge | Color pin | Boton Confirmar |
| :--- | :--- | :--- | :--- |
| VERDE | "Cobertura OK" verde | Verde | Habilitado |
| AMARILLO | "Zona Especial" naranja | Naranja | Habilitado + aviso |
| ROJO | "Sin Cobertura" rojo | Rojo | Deshabilitado |

---

## 9. Notas Tecnicas Importantes

- **Encoding de archivos en PowerShell:** Siempre usar `[System.IO.File]::WriteAllText(path, content, [System.Text.Encoding]::UTF8)`. El `Add-Content` genera encoding mixto que rompe la lectura de archivos.
- **npm run dev:** El dev server Astro SSR puede tardar. Verificar con `netstat -ano | findstr 4321`.
- **Leaflet en Astro SSR:** Se carga dinamicamente (`window.L`) porque Astro hace SSR. La funcion `initOrUpdateMap()` espera a que `window.L` este disponible.
- **CDN iconos del mapa:** `raw.githubusercontent.com/pointhi/leaflet-color-markers` para marcadores de colores.
- **Geofencing client-side:** Catalogo de ciudades y poligonos vectoriales se pasan al cliente mediante `define:vars` en el `<script>` de `confirmar.astro`.
- **id_guia es TEXT:** El campo en PostgreSQL es tipo TEXT, no autoincremental. El usuario lo ingresa manualmente (ej. 551236). El API hace `trim().toUpperCase()` antes de guardar.
- **Empresas / Couriers Aliados:** Columna `empresa TEXT` en `guias` y `guias_escaneos`. Catálogo de 18 empresas integradas: Troop, Crazy cargo, Cargo King, JJ, Greymar, Ajbp, Global jats, Su descarga, Rima cargo, Dina cargo, Send logístics, Alas cargo, Aexpress, Priority, Alpi, Venexcargo, DBL, 2BC. Soportado en registro manual, drawer de escaneo y filtro de vistas.

---

## 10. Hoja de Ruta — Tareas Pendientes

### Prioridad Alta
1. **Modulo de Gestion de Trabajadores:** Panel para crear/editar/eliminar usuarios desde la interfaz. Necesita endpoints: `POST /api/usuarios`, `PATCH /api/usuarios/[id]`, `DELETE /api/usuarios/[id]`.
2. **Generacion de Etiquetas / Recibos PDF con QR:** Para impresion fisica en almacen. La URL del QR debe apuntar a `/confirmar?guia=ID`.

### Backlog / Mejoras Futuras
3. **Mas poligonos GIS:** Faltan regiones de Caracas, Valencia, Maracay, Oriente y Llanos (solo tienen cobertura por radio Haversine, sin poligonos vectoriales aun).
4. **Historial de estados de guia:** Log de auditoria con timestamp de cada cambio de estado.
5. **Notificaciones push al chofer:** Alertar al chofer cuando se le asigna una guia nueva.