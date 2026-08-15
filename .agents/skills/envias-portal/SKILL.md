---
name: envias-portal
description: Memoria integral del proyecto Envías C.A. (Arquitectura, Base de Datos PostgreSQL en Railway, Credenciales de personal, Endpoints, Flujo de negocio y Estado de desarrollo).
---

# Memoria Técnica y de Negocio — Envías C.A.

Este documento contiene todo el conocimiento contextual, arquitectura, decisiones técnicas y estado actual del sistema **Envías C.A.** para que cualquier agente o sesión mantenga continuidad total sin repetir explicaciones.

---

## 1. Identidad de la Empresa y Reglas de Diseño

- **Empresa:** Envías C.A. — Empresa de transporte, mensajería y logística nacional en **Venezuela**.
- **Regla Estricta de Iconografía:** **CERO EMOJIS**. Utilizar únicamente iconos vectoriales SVG limpios, modernos y profesionales (Tailwind CSS / Heroicons).
- **Alcance Geográfico:** Venezuela. Todos los mapas (Leaflet.js) abren centrados en el mapa de Venezuela (`[7.8500, -66.0000]`, zoom: 6) sin pines precargados.
- **Formato Telefónico Universal:** Acepta códigos internacionales (`+1`, `+57`, `+34`, `+58`, etc.). Si se ingresa un formato nacional venezolano con `0` inicial (ej. `0414...`), se normaliza inteligentemente a `58414...` para WhatsApp.

---

## 2. Infraestructura y Despliegue Cloud

- **Backend & Base de Datos:** PostgreSQL en Railway con conexión SSL activa (`rejectUnauthorized: false`).
- **Aplicación Web:** Astro SSR (Node.js en modo `standalone`) alojada en Railway con despliegue automático desde GitHub.
- **URL de Producción:** `https://envias-production.up.railway.app`
- **Repositorio en GitHub:** `https://github.com/daniellacruz03/envias.git` (rama `main`).
- **Seguridad de Secretos:** 
  - Todo secret (`DATABASE_URL`, passwords) vive en `.env` local y en las variables de entorno de Railway.
  - En GitHub solo sube el código fuente limpio protegido por `.gitignore`.

---

## 3. Cuentas y Credenciales de Trabajadores

Las credenciales están almacenadas en la tabla `usuarios` de PostgreSQL en Railway:

### Personal de Oficina / Logística:
| Nombre | Rol | Correo de Acceso | Contraseña |
| :--- | :--- | :--- | :--- |
| **Yoleida** | Logistica | `yoleida@envias.com` | `yoleida123` |
| **Yuliana** | Logistica | `yuliana@envias.com` | `yuliana123` |
| **Yeraldine** | Logistica | `yeraldine@envias.com` | `yeraldine123` |
| **Yesica** | Logistica | `yesica@envias.com` | `yesica123` |
| **Admin Central** | Logistica | `admin@envias.com` | `admin123` |

### Choferes / Repartidores:
| Nombre | Rol | Correo de Acceso | Contraseña |
| :--- | :--- | :--- | :--- |
| **Carlos Pérez** | Chofer | `carlos@envias.com` | `chofer123` |

---

## 4. Vistas y Módulos de la Aplicación

### A. Acceso y Seguridad (`/login`)
- Ruta: `src/pages/login.astro`
- Manejo de sesión mediante cookies cifradas (`user_session`).
- Pantalla limpia: Los campos de usuario y contraseña inician vacíos. Sin botones ni credenciales de prueba expuestas.

### B. Dashboard Central de Logística (`/dashboard`)
- Ruta: `src/pages/dashboard.astro`
- **Formulario de Registro Rápido:** Crea guías en PostgreSQL en tiempo real sin recargar página.
- **KPIs en Tiempo Real:** Total de guías, Por contactar, En ruta/tránsito, GPS confirmado.
- **Búsqueda y Filtros:** Búsqueda en vivo por guía/destinatario y filtros por ciudad y estado (`Por contactar`, `Contactado`, `En ruta`, `Entregado`).
- **Live Sync en Segundo Plano:** Sondeo silencioso cada 3.5 segundos (`silentRefresh()`) para actualizar el dashboard en tiempo real cuando un cliente confirma su GPS sin necesidad de recargar la página.
- **Acción de WhatsApp:** Construye mensaje oficial con plantilla corporativa y cambia automáticamente el estado de `Por contactar` a **`Contactado`**.
- **Enlace a Google Maps:** Cuando el GPS está confirmado, el badge es un hipervínculo clickeable hacia las coordenadas satelitales exactas.
- **Asignación de Choferes:** Selector dinámico conectado a `/api/choferes` que actualiza vía `PATCH /api/guias/[id]`.

### C. Portal Autoservicio del Cliente (`/confirmar?guia=ID_GUIA`)
- Ruta: `src/pages/confirmar.astro`
- Consulta SSR protegida por `id_guia`.
- Texto superior explicativo: *"Tu número de guía es: #..."*.
- Contenedor estilizado `max-w-lg`.
- **3 Métodos de Captura de Ubicación:**
  1. GPS Nativo del dispositivo.
  2. Dirección escrita manual con puntos de referencia.
  3. Mapa interactivo Leaflet sobre Venezuela con pin arrastrable.
- Meta tags Open Graph (`og:image`, `og:title`, etc.) para tarjetas de vista previa enriquecidas en WhatsApp.

---

## 5. Endpoints de API REST (`src/pages/api/`)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/guias` | Lista todas las guías con `LEFT JOIN usuarios` para datos del chofer. |
| `POST` | `/api/guias` | Registra nueva guía (`estado = 'Por contactar'`, `gps_confirmado = false`). |
| `GET` | `/api/guias/[id]` | Consulta información detallada de una guía específica. |
| `PATCH` | `/api/guias/[id]` | Actualiza campos dinámicos (`estado`, `chofer_asignado_id`, `gps_latitud`, etc.). |
| `DELETE` | `/api/guias/[id]` | Elimina una guía de la base de datos. |
| `POST` | `/api/confirmar` | Endpoint receptor de la confirmación del cliente (guarda GPS/dirección y activa `gps_confirmado = true`). |
| `GET` | `/api/choferes` | Lista los conductores activos con rol `Chofer`. |
| `POST` | `/api/auth/login` | Autentica usuario contra PostgreSQL y emite cookie de sesión. |
| `GET` | `/api/auth/logout`| Destruye la sesión y redirige a `/login`. |
| `GET` | `/api/auth/me` | Retorna los datos del usuario autenticado en la sesión actual. |

---

## 6. Estados del Flujo de una Guía

1. **`Por contactar`**: Estado inicial al cargar el paquete en el almacén.
2. **`Contactado`**: Transición automática al hacer clic en el botón de WhatsApp.
3. **`En ruta`**: Asignado al chofer para entrega.
4. **`Entregado`**: Paquete entregado exitosamente al cliente.
- **`gps_confirmado` (booleano):** Se vuelve `true` cuando el cliente guarda su ubicación en el portal de confirmación.

---

## 7. Hoja de Ruta Pendiente (Próximas Tareas)

1. **Portal Móvil para Choferes (`/chofer`):** Vista exclusiva para repartidores donde vean sus entregas asignadas con botón de "Navegar GPS" y "Marcar como Entregado".
2. **Módulo de Gestión de Trabajadores:** Panel para crear/editar/eliminar usuarios desde la interfaz sin tocar la base de datos directamente.
3. **Generación de Etiquetas / Recibos PDF con Código QR:** Para impresión física en almacén.
