/**
 * ============================================================
 * MODULO DE COBERTURA GIS � ENVIAS C.A.
 * src/lib/cobertura.ts
 * ============================================================
 * Sistema de Geofencing por radio urbano.
 * Catalogo oficial de rutas y poblaciones 2026.
 *
 * ESTADOS DE COBERTURA:
 *   VERDE    ? Cobertura estandar. Radio <= radioUrbanKm.
 *   AMARILLO ? Zona perimetral. Radio <= radioUrbanKm * 2.5
 *   ROJO     ? Fuera de cobertura (montana / paramo / sin ruta).
 * ============================================================
 */

export type ZonaCobertura = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface ResultadoCobertura {
  zona: ZonaCobertura;
  ciudadMasCercana: string | null;
  distanciaKm: number;
  mensaje: string;
  color: string;
  colorBg: string;
}

export interface CiudadCobertura {
  nombre: string;
  lat: number;
  lng: number;
  region: string;
  ruta: string;
  radioUrbanKm: number;
  esHub?: boolean;
}

export const CIUDADES_COBERTURA: CiudadCobertura[] = [
  // HUBS
  { nombre: 'Caracas', lat: 10.4806, lng: -66.9036, region: 'Capital', ruta: 'HUB', radioUrbanKm: 15, esHub: true },
  { nombre: 'Valencia', lat: 10.1621, lng: -68.0077, region: 'Carabobo', ruta: 'HUB', radioUrbanKm: 12, esHub: true },
  { nombre: 'Barquisimeto', lat: 10.0647, lng: -69.3571, region: 'Lara', ruta: 'HUB', radioUrbanKm: 12, esHub: true },
  { nombre: 'San Cristobal', lat: 7.7653, lng: -72.2250, region: 'Tachira', ruta: 'HUB', radioUrbanKm: 10, esHub: true },
  { nombre: 'Merida', lat: 8.5980, lng: -71.1445, region: 'Merida', ruta: 'HUB', radioUrbanKm: 10, esHub: true },
  // OCCIDENTE R1
  { nombre: 'Bejuma', lat: 10.1742, lng: -68.2669, region: 'Carabobo', ruta: 'Occidente R1', radioUrbanKm: 5 },
  { nombre: 'Miranda', lat: 10.2119, lng: -68.2052, region: 'Carabobo', ruta: 'Occidente R1', radioUrbanKm: 4 },
  { nombre: 'San Felipe', lat: 10.3394, lng: -68.7450, region: 'Yaracuy', ruta: 'Occidente R1', radioUrbanKm: 6 },
  { nombre: 'Cocorote', lat: 10.3300, lng: -68.7867, region: 'Yaracuy', ruta: 'Occidente R1', radioUrbanKm: 4 },
  { nombre: 'Yaritagua', lat: 10.0763, lng: -69.1272, region: 'Yaracuy', ruta: 'Occidente R1', radioUrbanKm: 5 },
  { nombre: 'Chivacoa', lat: 10.1667, lng: -68.9000, region: 'Yaracuy', ruta: 'Occidente R1', radioUrbanKm: 5 },
  { nombre: 'Nirgua', lat: 10.1554, lng: -68.5713, region: 'Yaracuy', ruta: 'Occidente R1', radioUrbanKm: 4 },
  { nombre: 'Cabudare', lat: 10.0277, lng: -69.2726, region: 'Lara', ruta: 'Occidente R1', radioUrbanKm: 6 },
  { nombre: 'La Miel', lat: 10.0950, lng: -69.4150, region: 'Lara', ruta: 'Occidente R1', radioUrbanKm: 3 },
  { nombre: 'Sarare', lat: 9.7833, lng: -69.1667, region: 'Lara', ruta: 'Occidente R1', radioUrbanKm: 4 },
  // OCCIDENTE R2 - Portuguesa
  { nombre: 'Guanare', lat: 9.0418, lng: -69.7421, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 12, esHub: true },
  { nombre: 'Araure', lat: 9.5703, lng: -69.2189, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 8 },
  { nombre: 'Acarigua', lat: 9.5596, lng: -69.1979, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 9 },
  { nombre: 'Ospino', lat: 9.3000, lng: -69.4500, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 5 },
  { nombre: 'Boconoito', lat: 9.2500, lng: -69.5833, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 5 },
  { nombre: 'Guanarito', lat: 8.7042, lng: -69.2158, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 6 },
  { nombre: 'Biscucuy', lat: 9.3556, lng: -69.9806, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 6 },
  { nombre: 'Turen', lat: 9.3333, lng: -69.1167, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 6 },
  { nombre: 'Agua Blanca', lat: 9.6667, lng: -69.1000, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 5 },
  { nombre: 'Piritu', lat: 9.3667, lng: -69.2000, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 5 },
  { nombre: 'San Rafael de Onoto', lat: 9.7167, lng: -68.9667, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 5 },
  { nombre: 'Papelon', lat: 8.9167, lng: -69.5833, region: 'Portuguesa', ruta: 'Occidente R2', radioUrbanKm: 5 },
  // OCCIDENTE R2 - Barinas
  { nombre: 'Barinas', lat: 8.6223, lng: -70.2064, region: 'Barinas', ruta: 'Occidente R2', radioUrbanKm: 9 },
  { nombre: 'Curbati', lat: 8.5333, lng: -70.2333, region: 'Barinas', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'Socopo', lat: 8.2333, lng: -70.8167, region: 'Barinas', ruta: 'Occidente R2', radioUrbanKm: 4 },
  { nombre: 'Santa Barbara', lat: 7.8076, lng: -71.1679, region: 'Barinas', ruta: 'Occidente R2', radioUrbanKm: 4 },
  { nombre: 'Capitanejo', lat: 7.9167, lng: -71.0500, region: 'Barinas', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'Punta de Piedra', lat: 8.0167, lng: -71.1667, region: 'Barinas', ruta: 'Occidente R2', radioUrbanKm: 3 },
  // OCCIDENTE R2 - Tachira
  { nombre: 'La Pedrera', lat: 7.9333, lng: -71.5500, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'El Pinal', lat: 7.9000, lng: -71.6833, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'Chururu', lat: 7.8500, lng: -71.8000, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'Santo Domingo', lat: 7.8167, lng: -71.9667, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'San Josesito', lat: 7.7833, lng: -72.0833, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'Tariba', lat: 7.8208, lng: -72.2364, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 5 },
  { nombre: 'Palmira', lat: 7.7500, lng: -72.3833, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 4 },
  { nombre: 'Patiecitos', lat: 7.7667, lng: -72.3167, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'Tucape', lat: 7.7000, lng: -72.3500, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'Copa de Oro', lat: 7.7333, lng: -72.4000, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'Michelena', lat: 7.9389, lng: -72.0689, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 4 },
  { nombre: 'Lobatera', lat: 7.9167, lng: -72.1833, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  { nombre: 'San Juan de Colon', lat: 8.0322, lng: -72.2747, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 5 },
  { nombre: 'La Fria', lat: 8.2167, lng: -72.2500, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 5 },
  { nombre: 'Coloncito', lat: 8.1667, lng: -72.0833, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 4 },
  { nombre: 'La Tendida', lat: 8.0833, lng: -72.4167, region: 'Tachira', ruta: 'Occidente R2', radioUrbanKm: 3 },
  // OCCIDENTE R3 - Trujillo
  { nombre: 'Carora', lat: 10.1757, lng: -70.0803, region: 'Lara', ruta: 'Occidente R3', radioUrbanKm: 6 },
  { nombre: 'La Pastora', lat: 9.8000, lng: -70.3833, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Monay', lat: 9.7167, lng: -70.5000, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Pampan', lat: 9.3667, lng: -70.5167, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Pampanito', lat: 9.3833, lng: -70.5000, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Flor de Patria', lat: 9.5000, lng: -70.5000, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Tres Esquinas', lat: 9.5333, lng: -70.4833, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Trujillo', lat: 9.3667, lng: -70.4333, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 7 },
  { nombre: 'Carvajal', lat: 9.3667, lng: -70.4167, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 4 },
  { nombre: 'Valera', lat: 9.3157, lng: -70.6070, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 8 },
  { nombre: 'Betijoque', lat: 9.3833, lng: -70.7333, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 4 },
  { nombre: 'Sabana de Mendoza', lat: 9.4500, lng: -70.7833, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 4 },
  { nombre: 'Sabana Grande', lat: 9.5000, lng: -70.7833, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Buena Vista', lat: 9.4333, lng: -70.8167, region: 'Trujillo', ruta: 'Occidente R3', radioUrbanKm: 3 },
  // OCCIDENTE R3 - Sur del Lago / Panamericana
  { nombre: 'Arapuey', lat: 9.2167, lng: -70.8833, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Aguacil', lat: 9.1500, lng: -70.9500, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Nueva Bolivia', lat: 9.0833, lng: -71.0500, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Tucani', lat: 8.7667, lng: -71.2833, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Santa Elena de Arenales', lat: 8.8500, lng: -71.4500, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Guayabones', lat: 8.8000, lng: -71.3500, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Mucujepe', lat: 8.7500, lng: -71.3833, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'La Blanca', lat: 8.7000, lng: -71.4167, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'El Vigia', lat: 8.6151, lng: -71.6537, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 7 },
  // OCCIDENTE R3 - Eje Mocot�es / M�rida
  { nombre: 'Tovar', lat: 8.3380, lng: -71.7560, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 5 },
  { nombre: 'Santa Cruz de Mora', lat: 8.3833, lng: -71.5833, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 4 },
  { nombre: 'El Anis', lat: 8.4500, lng: -71.5500, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Lagunillas', lat: 8.5333, lng: -71.2667, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 4 },
  { nombre: 'San Juan de Lagunillas', lat: 8.5333, lng: -71.2500, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Las Gonzalez', lat: 8.4667, lng: -71.4500, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 3 },
  { nombre: 'Ejido', lat: 8.5500, lng: -71.2333, region: 'Merida', ruta: 'Occidente R3', radioUrbanKm: 5 },
  // OCCIDENTE R4 - Cojedes
  { nombre: 'Tinaquillo', lat: 9.9167, lng: -68.3000, region: 'Cojedes', ruta: 'Occidente R4', radioUrbanKm: 5 },
  { nombre: 'Tinaco', lat: 9.7167, lng: -68.4000, region: 'Cojedes', ruta: 'Occidente R4', radioUrbanKm: 4 },
  { nombre: 'San Carlos', lat: 9.6694, lng: -68.5752, region: 'Cojedes', ruta: 'Occidente R4', radioUrbanKm: 7 },
  { nombre: 'San Rafael de Onoto', lat: 9.5167, lng: -68.7667, region: 'Cojedes', ruta: 'Occidente R4', radioUrbanKm: 4 },
  { nombre: 'Agua Blanca', lat: 9.3667, lng: -68.9333, region: 'Portuguesa', ruta: 'Occidente R4', radioUrbanKm: 4 },
  // ZULIA R1 - Costa Oriental
  { nombre: 'Mene Grande', lat: 9.8167, lng: -70.9333, region: 'Zulia', ruta: 'Zulia R1', radioUrbanKm: 5 },
  { nombre: 'Bachaquero', lat: 9.9333, lng: -71.1167, region: 'Zulia', ruta: 'Zulia R1', radioUrbanKm: 4 },
  { nombre: 'Lagunillas Zulia', lat: 10.1167, lng: -71.2500, region: 'Zulia', ruta: 'Zulia R1', radioUrbanKm: 5 },
  { nombre: 'Ciudad Ojeda', lat: 10.1997, lng: -71.3063, region: 'Zulia', ruta: 'Zulia R1', radioUrbanKm: 7 },
  { nombre: 'Tia Juana', lat: 10.2667, lng: -71.3667, region: 'Zulia', ruta: 'Zulia R1', radioUrbanKm: 4 },
  { nombre: 'Cabimas', lat: 10.3925, lng: -71.4547, region: 'Zulia', ruta: 'Zulia R1', radioUrbanKm: 8 },
  { nombre: 'Santa Rita', lat: 10.5333, lng: -71.5167, region: 'Zulia', ruta: 'Zulia R1', radioUrbanKm: 4 },
  { nombre: 'El Venado', lat: 10.6167, lng: -71.5500, region: 'Zulia', ruta: 'Zulia R1', radioUrbanKm: 3 },
  // ZULIA R2 - Maracaibo
  { nombre: 'Maracaibo', lat: 10.6666, lng: -71.6124, region: 'Zulia', ruta: 'Zulia R2', radioUrbanKm: 18 },
  { nombre: 'San Francisco', lat: 10.6057, lng: -71.6548, region: 'Zulia', ruta: 'Zulia R2', radioUrbanKm: 8 },
  // ZULIA R3 - Sur del Lago
  { nombre: 'Santa Barbara del Zulia', lat: 9.1250, lng: -71.1667, region: 'Zulia', ruta: 'Zulia R3', radioUrbanKm: 5 },
  { nombre: 'El Caracoli', lat: 9.3667, lng: -71.4000, region: 'Zulia', ruta: 'Zulia R3', radioUrbanKm: 3 },
  { nombre: 'San Carlos del Zulia', lat: 9.0089, lng: -71.9278, region: 'Zulia', ruta: 'Zulia R3', radioUrbanKm: 5 },
  { nombre: 'Caja Seca', lat: 8.8167, lng: -71.6667, region: 'Zulia', ruta: 'Zulia R3', radioUrbanKm: 4 },
  // ORIENTE
  { nombre: 'Boca de Uchire', lat: 10.1667, lng: -65.5000, region: 'Anzoategui', ruta: 'Oriente R1', radioUrbanKm: 4 },
  { nombre: 'Puerto Piritu', lat: 10.0667, lng: -65.0333, region: 'Anzoategui', ruta: 'Oriente R1', radioUrbanKm: 4 },
  { nombre: 'Barcelona', lat: 10.1339, lng: -64.6861, region: 'Anzoategui', ruta: 'Oriente R1', radioUrbanKm: 10 },
  { nombre: 'Lecheria', lat: 10.1667, lng: -64.6833, region: 'Anzoategui', ruta: 'Oriente R1', radioUrbanKm: 6 },
  { nombre: 'Puerto La Cruz', lat: 10.2137, lng: -64.6366, region: 'Anzoategui', ruta: 'Oriente R1', radioUrbanKm: 9 },
  { nombre: 'Anaco', lat: 9.4333, lng: -64.4833, region: 'Anzoategui', ruta: 'Oriente R1', radioUrbanKm: 6 },
  { nombre: 'Cantaura', lat: 9.3000, lng: -64.3667, region: 'Anzoategui', ruta: 'Oriente R1', radioUrbanKm: 5 },
  { nombre: 'El Tigre', lat: 8.8889, lng: -64.2500, region: 'Anzoategui', ruta: 'Oriente R1', radioUrbanKm: 7 },
  { nombre: 'El Furrial', lat: 9.8667, lng: -62.6500, region: 'Monagas', ruta: 'Oriente R1', radioUrbanKm: 4 },
  { nombre: 'Punta de Mata', lat: 9.7000, lng: -63.6000, region: 'Monagas', ruta: 'Oriente R1', radioUrbanKm: 4 },
  { nombre: 'Maturin', lat: 9.7456, lng: -63.1806, region: 'Monagas', ruta: 'Oriente R1', radioUrbanKm: 12 },
  { nombre: 'Puerto Ordaz', lat: 8.3000, lng: -62.7333, region: 'Bolivar', ruta: 'Oriente R1', radioUrbanKm: 12 },
  { nombre: 'San Felix', lat: 8.2667, lng: -62.6167, region: 'Bolivar', ruta: 'Oriente R1', radioUrbanKm: 7 },
  { nombre: 'Ciudad Bolivar', lat: 8.1220, lng: -63.5497, region: 'Bolivar', ruta: 'Oriente R1', radioUrbanKm: 10 },
];

// --- Constantes ---
const FACTOR_AMARILLO = 2.5;

// --- Haversine ---
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- BBox Venezuela ---
function dentroDeBBoxVenezuela(lat: number, lng: number): boolean {
  return lat >= 0.6 && lat <= 12.5 && lng >= -73.5 && lng <= -59.5;
}

// --- Funcion Principal ---
export function validarZonaEntrega(lat: number, lng: number, ciudadHint?: string): ResultadoCobertura {
  // PASO 0: Verificar BBox Venezuela
  if (!dentroDeBBoxVenezuela(lat, lng)) {
    return {
      zona: 'ROJO',
      ciudadMasCercana: null,
      distanciaKm: Infinity,
      mensaje: 'Ubicacion fuera de Venezuela. Envias C.A. solo opera a nivel nacional.',
      color: '#ef4444',
      colorBg: 'bg-red-50 border-red-200 text-red-800',
    };
  }

  // PASO 1: Consultar poligonos vectoriales (alta precision, prioridad absoluta)
  const polyResult = validarConPoligonos(lat, lng);
  if (polyResult.encontrado && polyResult.zona) {
    const mensajes: Record<string, string> = {
      VERDE: `Cobertura confirmada en ${polyResult.ciudad}. Zona de entrega directa validada por mapa oficial.`,
      AMARILLO: `Zona especial en ${polyResult.ciudad}. ${polyResult.descripcion ?? 'Sujeta a validacion del equipo de logistica.'}`,
      ROJO: polyResult.descripcion ?? `Ubicacion fuera de cobertura segun mapa oficial de rutas 2026.`,
    };
    const colores: Record<string, string> = { VERDE: '#16a34a', AMARILLO: '#d97706', ROJO: '#ef4444' };
    const fondos: Record<string, string> = {
      VERDE: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      AMARILLO: 'bg-amber-50 border-amber-200 text-amber-800',
      ROJO: 'bg-red-50 border-red-200 text-red-800',
    };
    return {
      zona: polyResult.zona,
      ciudadMasCercana: polyResult.ciudad ?? null,
      distanciaKm: 0,
      mensaje: mensajes[polyResult.zona],
      color: colores[polyResult.zona],
      colorBg: fondos[polyResult.zona],
    };
  }

  let ciudadesOrdenadas = [...CIUDADES_COBERTURA];
  if (ciudadHint) {
    const hint = ciudadHint.toLowerCase().trim();
    ciudadesOrdenadas.sort((a, b) => {
      const aM = a.nombre.toLowerCase().includes(hint) ? -1 : 0;
      const bM = b.nombre.toLowerCase().includes(hint) ? -1 : 0;
      return aM - bM;
    });
  }

  let mejorCiudad: CiudadCobertura | null = null;
  let mejorDistancia = Infinity;
  for (const ciudad of ciudadesOrdenadas) {
    const dist = haversineKm(lat, lng, ciudad.lat, ciudad.lng);
    if (dist < mejorDistancia) {
      mejorDistancia = dist;
      mejorCiudad = ciudad;
    }
  }

  if (!mejorCiudad) {
    return { zona: 'ROJO', ciudadMasCercana: null, distanciaKm: Infinity, mensaje: 'No se pudo determinar la zona.', color: '#ef4444', colorBg: 'bg-red-50 border-red-200 text-red-800' };
  }

  const radio = mejorCiudad.radioUrbanKm;

  if (mejorDistancia <= radio) {
    return {
      zona: 'VERDE',
      ciudadMasCercana: mejorCiudad.nombre,
      distanciaKm: Math.round(mejorDistancia * 10) / 10,
      mensaje: `Cobertura confirmada en ${mejorCiudad.nombre} (${mejorCiudad.region}). Puedes confirmar tu entrega.`,
      color: '#16a34a',
      colorBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    };
  }

  if (mejorDistancia <= radio * FACTOR_AMARILLO) {
    return {
      zona: 'AMARILLO',
      ciudadMasCercana: mejorCiudad.nombre,
      distanciaKm: Math.round(mejorDistancia * 10) / 10,
      mensaje: `Zona especial cerca de ${mejorCiudad.nombre}, sujeta a validacion por el equipo de logistica.`,
      color: '#d97706',
      colorBg: 'bg-amber-50 border-amber-200 text-amber-800',
    };
  }

  return {
    zona: 'AMARILLO',
    ciudadMasCercana: mejorCiudad.nombre,
    distanciaKm: Math.round(mejorDistancia * 10) / 10,
    mensaje: `Ubicacion en territorio nacional cerca de ${mejorCiudad.nombre} (${Math.round(mejorDistancia)} km).`,
    color: '#d97706',
    colorBg: 'bg-amber-50 border-amber-200 text-amber-800',
  };
}

// --- Serializar para cliente ---
export function getCatalogoParaCliente() {
  return CIUDADES_COBERTURA.map((c) => ({
    nombre: c.nombre,
    lat: c.lat,
    lng: c.lng,
    radio: c.radioUrbanKm,
    radioAmarillo: c.radioUrbanKm * FACTOR_AMARILLO,
    esHub: c.esHub ?? false,
    region: c.region,
    ruta: c.ruta,
  }));
}

export { FACTOR_AMARILLO };

// ============================================================
// SECCI�N 2: POL�GONOS VECTORIALES GeoJSON � RUTAS T�CHIRA / BARINAS 2026
// Extra�dos de las im�genes oficiales de delimitaci�n de rutas.
// Algoritmo de validaci�n: Ray Casting (punto en pol�gono).
// ============================================================

export interface PoligonoZona {
  tipo: 'VERDE' | 'AMARILLO' | 'ROJO';
  ciudad: string;
  region: string;
  descripcion: string;
  /** Pol�gono cerrado como array de [lat, lng]. El primer y �ltimo punto no necesitan ser iguales. */
  coordenadas: [number, number][];
}

/**
 * Ray Casting Algorithm � Determina si un punto (lat, lng)
 * est� dentro de un pol�gono dado.
 */
export function puntoEnPoligono(lat: number, lng: number, poligono: [number, number][]): boolean {
  let dentro = false;
  const n = poligono.length;
  let j = n - 1;
  for (let i = 0; i < n; i++) {
    const [latI, lngI] = poligono[i];
    const [latJ, lngJ] = poligono[j];
    const intersecta =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (intersecta) dentro = !dentro;
    j = i;
  }
  return dentro;
}

// ------------------------------------------------------------
// POL�GONOS OFICIALES � T�CHIRA NORTE (Imagen 1: 4:38)
// Corredor La Fr�a ? La Urac� ? San Juan de Col�n ? Michelena ? Lobatera
// Verde: ciudades circundadas en verde. Cruz roja = sin cobertura.
// ------------------------------------------------------------

export const POLIGONOS_COBERTURA: PoligonoZona[] = [

  // ----------------------------------------------------------
  // T�CHIRA NORTE � IMAGEN 1
  // ----------------------------------------------------------

  {
    tipo: 'VERDE',
    ciudad: 'La Fria',
    region: 'Tachira',
    descripcion: 'Zona urbana de La Fr�a, circundada en verde. Entrega directa.',
    coordenadas: [
      [8.232, -72.272], [8.238, -72.258], [8.235, -72.242], [8.224, -72.232],
      [8.210, -72.235], [8.204, -72.248], [8.207, -72.263], [8.218, -72.273],
      [8.232, -72.272],
    ],
  },

  {
    tipo: 'VERDE',
    ciudad: 'San Juan de Colon',
    region: 'Tachira',
    descripcion: 'Zona urbana de San Juan de Col�n, circundada en verde.',
    coordenadas: [
      [8.052, -72.298], [8.060, -72.280], [8.055, -72.262], [8.040, -72.255],
      [8.025, -72.260], [8.018, -72.278], [8.022, -72.295], [8.037, -72.303],
      [8.052, -72.298],
    ],
  },

  {
    tipo: 'VERDE',
    ciudad: 'Michelena',
    region: 'Tachira',
    descripcion: 'Zona urbana Michelena-Lobatera, circundada en verde.',
    coordenadas: [
      [7.950, -72.215], [7.958, -72.195], [7.952, -72.170], [7.938, -72.158],
      [7.920, -72.162], [7.910, -72.180], [7.912, -72.200], [7.925, -72.215],
      [7.940, -72.220], [7.950, -72.215],
    ],
  },

  // Corredor vial La Fr�a ? San Juan de Col�n (ruta verde)
  {
    tipo: 'VERDE',
    ciudad: 'Corredor La Fria - San Juan de Colon',
    region: 'Tachira',
    descripcion: 'V�a principal La Fr�a-La Urac�-San F�lix-San Juan de Col�n.',
    coordenadas: [
      [8.215, -72.258], [8.190, -72.250], [8.165, -72.248], [8.140, -72.252],
      [8.110, -72.256], [8.082, -72.272], [8.058, -72.285],
      [8.062, -72.294], [8.088, -72.280], [8.116, -72.264], [8.145, -72.260],
      [8.170, -72.256], [8.195, -72.258], [8.215, -72.265], [8.215, -72.258],
    ],
  },

  // Corredor San Juan de Col�n ? Michelena (ruta verde)
  {
    tipo: 'VERDE',
    ciudad: 'Corredor San Juan de Colon - Michelena',
    region: 'Tachira',
    descripcion: 'V�a San Juan de Col�n ? San Pedro del R�o ? Michelena.',
    coordenadas: [
      [8.022, -72.285], [7.998, -72.272], [7.978, -72.255], [7.960, -72.238],
      [7.942, -72.222],
      [7.936, -72.228], [7.952, -72.245], [7.972, -72.262], [7.992, -72.278],
      [8.016, -72.292], [8.022, -72.285],
    ],
  },

  // ----------------------------------------------------------
  // T�CHIRA NOROESTE � IMAGEN 2
  // La Tendida, Coloncito (VERDE). La Grita (ROJO).
  // ----------------------------------------------------------

  {
    tipo: 'VERDE',
    ciudad: 'La Tendida',
    region: 'Tachira',
    descripcion: 'Zona urbana de La Tendida, circundada en verde.',
    coordenadas: [
      [8.098, -72.440], [8.105, -72.422], [8.098, -72.405], [8.083, -72.398],
      [8.068, -72.405], [8.062, -72.422], [8.068, -72.440], [8.083, -72.448],
      [8.098, -72.440],
    ],
  },

  {
    tipo: 'VERDE',
    ciudad: 'Coloncito',
    region: 'Tachira',
    descripcion: 'Zona urbana de Coloncito, circundada en verde.',
    coordenadas: [
      [8.182, -72.105], [8.190, -72.088], [8.183, -72.070], [8.168, -72.062],
      [8.153, -72.070], [8.147, -72.088], [8.153, -72.105], [8.168, -72.113],
      [8.182, -72.105],
    ],
  },

  // Corredor La Fr�a ? La Tendida
  {
    tipo: 'VERDE',
    ciudad: 'Corredor La Fria - La Tendida',
    region: 'Tachira',
    descripcion: 'V�a secundaria que conecta La Fr�a con La Tendida.',
    coordenadas: [
      [8.218, -72.258], [8.210, -72.290], [8.200, -72.322], [8.188, -72.358],
      [8.175, -72.388], [8.158, -72.415], [8.090, -72.435],
      [8.085, -72.443], [8.162, -72.423], [8.180, -72.395], [8.192, -72.365],
      [8.205, -72.330], [8.215, -72.298], [8.224, -72.264], [8.218, -72.258],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'La Grita',
    region: 'Tachira',
    descripcion: 'La Grita marcada con c�rculo ROJO. Sin cobertura. Zona de p�ramo y monta�a.',
    coordenadas: [
      [8.155, -72.015], [8.163, -71.995], [8.158, -71.972], [8.143, -71.960],
      [8.125, -71.965], [8.115, -71.985], [8.120, -72.008], [8.135, -72.020],
      [8.155, -72.015],
    ],
  },

  // Zona monta�osa general al este de La Tendida (X rojas)
  {
    tipo: 'ROJO',
    ciudad: 'Serran�a Este Tachira Norte',
    region: 'Tachira',
    descripcion: 'Monta�as y p�ramos al este del corredor. Inaccesible.',
    coordenadas: [
      [8.250, -72.150], [8.250, -71.900], [8.050, -71.900], [7.980, -71.950],
      [7.950, -72.050], [7.980, -72.100], [8.010, -72.120], [8.050, -72.130],
      [8.100, -72.120], [8.150, -72.100], [8.200, -72.120], [8.250, -72.150],
    ],
  },

  // ----------------------------------------------------------
  // BARINAS/T�CHIRA FRONTERA � IMAGEN 3
  // El Pi�al (AMARILLO), Corredor a Pedrera (VERDE), Parque Nacional (ROJO)
  // ----------------------------------------------------------

  {
    tipo: 'AMARILLO',
    ciudad: 'El Pinal',
    region: 'Tachira',
    descripcion: 'El Pi�al marcado en amarillo. Zona perimetral, entrega sujeta a validaci�n.',
    coordenadas: [
      [7.915, -71.702], [7.920, -71.688], [7.915, -71.673], [7.902, -71.667],
      [7.888, -71.672], [7.883, -71.688], [7.888, -71.703], [7.902, -71.710],
      [7.915, -71.702],
    ],
  },

  {
    tipo: 'VERDE',
    ciudad: 'Corredor El Pinal - Pedrera',
    region: 'Tachira',
    descripcion: 'Corredor vial verde entre El Pi�al y Pedrera (Barinas/T�chira).',
    coordenadas: [
      [7.908, -71.672], [7.910, -71.640], [7.908, -71.610], [7.905, -71.580],
      [7.905, -71.555], [7.908, -71.530], [7.912, -71.505], [7.920, -71.480],
      [7.925, -71.455],
      [7.918, -71.450], [7.912, -71.475], [7.904, -71.500], [7.900, -71.525],
      [7.898, -71.550], [7.898, -71.578], [7.900, -71.605], [7.902, -71.635],
      [7.900, -71.668], [7.908, -71.672],
    ],
  },

  {
    tipo: 'VERDE',
    ciudad: 'Pedrera',
    region: 'Tachira',
    descripcion: 'Zona de Pedrera, entrega directa con acceso vial.',
    coordenadas: [
      [7.928, -71.462], [7.935, -71.445], [7.928, -71.428], [7.914, -71.422],
      [7.900, -71.428], [7.894, -71.445], [7.900, -71.462], [7.914, -71.468],
      [7.928, -71.462],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Parque Nacional Juan Pablo Penaloza',
    region: 'Tachira-Barinas',
    descripcion: 'Parque Nacional y serran�a. Sin acceso vial. Estrictamente prohibido.',
    coordenadas: [
      [8.100, -71.850], [8.120, -71.750], [8.100, -71.650], [8.060, -71.580],
      [8.000, -71.540], [7.950, -71.540], [7.900, -71.560],
      [7.860, -71.620], [7.840, -71.700], [7.850, -71.800],
      [7.900, -71.870], [7.960, -71.920], [8.020, -71.930],
      [8.060, -71.910], [8.085, -71.880], [8.100, -71.850],
    ],
  },

  // ----------------------------------------------------------
  // SAN CRIST�BAL METRO � IMAGEN 4
  // Verde: gran �rea urbana. Amarillo: casco central. Rojo: cordilleras.
  // ----------------------------------------------------------

  {
    tipo: 'VERDE',
    ciudad: 'San Cristobal Metro',
    region: 'Tachira',
    descripcion: 'Gran pol�gono urbano: Palmira, T�riba, San Crist�bal, El Corozo. Cobertura total.',
    coordenadas: [
      // Norte: Borota / Palo Grande / Palmira
      [7.840, -72.375], [7.848, -72.348], [7.842, -72.315],
      // Este hacia T�riba
      [7.832, -72.280], [7.828, -72.252], [7.822, -72.228],
      // Flanco este (Paramillo excluido)
      [7.808, -72.215], [7.792, -72.210], [7.775, -72.208],
      // Sur: hacia El Corozo
      [7.752, -72.212], [7.730, -72.220], [7.705, -72.232],
      [7.692, -72.242], [7.698, -72.262],
      // Suroeste
      [7.712, -72.285], [7.728, -72.310], [7.742, -72.332],
      // Oeste: Capacho Nuevo / El Pueblito
      [7.758, -72.352], [7.772, -72.368], [7.792, -72.375],
      [7.812, -72.378], [7.828, -72.375], [7.840, -72.375],
    ],
  },

  {
    tipo: 'AMARILLO',
    ciudad: 'San Cristobal Centro',
    region: 'Tachira',
    descripcion: 'Casco central de San Crist�bal (�valo naranja). Zona especial: alto tr�fico, acceso validado.',
    coordenadas: [
      [7.795, -72.252], [7.804, -72.242], [7.808, -72.228],
      [7.804, -72.215], [7.793, -72.208], [7.778, -72.212],
      [7.768, -72.222], [7.764, -72.238], [7.768, -72.252],
      [7.780, -72.260], [7.795, -72.252],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Cordero',
    region: 'Tachira',
    descripcion: 'Cordero marcado con c�rculo rojo y X. Zona monta�osa al norte sin cobertura.',
    coordenadas: [
      [7.878, -72.188], [7.885, -72.172], [7.880, -72.155], [7.867, -72.148],
      [7.852, -72.153], [7.845, -72.170], [7.850, -72.188], [7.863, -72.198],
      [7.878, -72.188],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Serran�a Paramillo Este',
    region: 'Tachira',
    descripcion: 'Cordillera Paramillo y zonas monta�osas al este de San Crist�bal.',
    coordenadas: [
      [7.850, -72.200], [7.850, -72.050], [7.780, -72.050],
      [7.730, -72.080], [7.700, -72.130], [7.710, -72.200],
      [7.750, -72.210], [7.800, -72.210], [7.850, -72.200],
    ],
  },

  // ----------------------------------------------------------
  // BARINAS SUR � IMAGEN 5
  // Verde: Santa B�rbara, Socop�. Rojo: gran elipse selva/llanos sur.
  // ----------------------------------------------------------

  {
    tipo: 'VERDE',
    ciudad: 'Santa Barbara Barinas',
    region: 'Barinas',
    descripcion: 'Corredor urbano de Santa B�rbara (Barinas). Entrega directa.',
    coordenadas: [
      [7.828, -71.218], [7.835, -71.198], [7.828, -71.178], [7.812, -71.165],
      [7.795, -71.170], [7.788, -71.190], [7.795, -71.210], [7.812, -71.222],
      [7.828, -71.218],
    ],
  },

  {
    tipo: 'VERDE',
    ciudad: 'Socopo',
    region: 'Barinas',
    descripcion: 'Zona urbana de Socop�, circundada en verde. Entrega directa.',
    coordenadas: [
      [8.250, -70.845], [8.258, -70.825], [8.250, -70.805], [8.235, -70.797],
      [8.220, -70.805], [8.215, -70.825], [8.222, -70.845], [8.238, -70.853],
      [8.250, -70.845],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Llanos Sur Barinas',
    region: 'Barinas',
    descripcion: 'Gran elipse roja sur de Barinas. Selva, r�os y zonas inundables. Sin acceso vial.',
    coordenadas: [
      [7.700, -71.200], [7.720, -71.050], [7.715, -70.900],
      [7.692, -70.750], [7.655, -70.620], [7.600, -70.550],
      [7.520, -70.510], [7.440, -70.535], [7.380, -70.620],
      [7.355, -70.740], [7.365, -70.900], [7.390, -71.060],
      [7.440, -71.195], [7.510, -71.300], [7.590, -71.348],
      [7.655, -71.328], [7.695, -71.268], [7.700, -71.200],
    ],
  },


  // ======================================================
  // BARQUISIMETO / LARA — Imagen 3:39 PM
  // ======================================================

  {
    tipo: 'VERDE',
    ciudad: 'Barquisimeto Centro',
    region: 'Lara',
    descripcion: 'Zona urbana central de Barquisimeto. Cobertura directa.',
    coordenadas: [
      [10.092, -69.348], [10.100, -69.320], [10.092, -69.295],
      [10.075, -69.280], [10.055, -69.278], [10.040, -69.295],
      [10.038, -69.320], [10.048, -69.345], [10.065, -69.358],
      [10.082, -69.358], [10.092, -69.348],
    ],
  },

  {
    tipo: 'VERDE',
    ciudad: 'Cabudare',
    region: 'Lara',
    descripcion: 'Zona urbana Cabudare. Cobertura directa.',
    coordenadas: [
      [10.042, -69.278], [10.048, -69.258], [10.040, -69.240],
      [10.025, -69.232], [10.010, -69.238], [10.005, -69.255],
      [10.012, -69.272], [10.028, -69.282], [10.042, -69.278],
    ],
  },

  {
    tipo: 'AMARILLO',
    ciudad: 'Cercado Barquisimeto',
    region: 'Lara',
    descripcion: 'Sector Cercado, periferia este de Barquisimeto. Zona especial.',
    coordenadas: [
      [10.062, -69.252], [10.070, -69.238], [10.062, -69.225],
      [10.048, -69.220], [10.038, -69.228], [10.035, -69.245],
      [10.042, -69.258], [10.055, -69.265], [10.062, -69.252],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Tamaca El Cuji Norte Barquisimeto',
    region: 'Lara',
    descripcion: 'Cerros norte Barquisimeto. Sin cobertura.',
    coordenadas: [
      [10.155, -69.370], [10.165, -69.310], [10.160, -69.255],
      [10.140, -69.225], [10.108, -69.220], [10.095, -69.240],
      [10.092, -69.268], [10.105, -69.300], [10.118, -69.340],
      [10.135, -69.370], [10.155, -69.370],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'El Manzano Sur Barquisimeto',
    region: 'Lara',
    descripcion: 'Cerros sur Barquisimeto. Parque Terepaima. Sin cobertura.',
    coordenadas: [
      [10.030, -69.380], [10.042, -69.330], [10.035, -69.295],
      [10.015, -69.270], [9.988, -69.265], [9.965, -69.280],
      [9.955, -69.320], [9.962, -69.365], [9.985, -69.395],
      [10.010, -69.400], [10.030, -69.380],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Cerros Oeste Barquisimeto',
    region: 'Lara',
    descripcion: 'Serranias al oeste de Barquisimeto. Inaccesible.',
    coordenadas: [
      [10.115, -69.428], [10.130, -69.395], [10.118, -69.368],
      [10.095, -69.355], [10.065, -69.358], [10.050, -69.378],
      [10.055, -69.412], [10.075, -69.435], [10.100, -69.440],
      [10.115, -69.428],
    ],
  },

  // ======================================================
  // ACARIGUA / PORTUGUESA — Imagen 4:24 PM
  // ======================================================

  {
    tipo: 'VERDE',
    ciudad: 'Corredor Barquisimeto Acarigua',
    region: 'Portuguesa',
    descripcion: 'Eje vial Barquisimeto -> Sarare -> Araure -> Acarigua.',
    coordenadas: [
      [9.780, -69.210], [9.750, -69.215], [9.720, -69.218],
      [9.680, -69.215], [9.640, -69.210], [9.600, -69.205], [9.565, -69.200],
      [9.560, -69.210], [9.598, -69.215], [9.638, -69.220],
      [9.678, -69.225], [9.720, -69.228], [9.750, -69.225],
      [9.780, -69.220], [9.780, -69.210],
    ],
  },

  {
    tipo: 'VERDE',
    ciudad: 'Corredor Acarigua Agua Blanca',
    region: 'Portuguesa',
    descripcion: 'Eje vial Acarigua -> Agua Blanca -> San Rafael de Onoto.',
    coordenadas: [
      [9.558, -69.195], [9.530, -69.160], [9.500, -69.130],
      [9.470, -69.100], [9.438, -69.065],
      [9.432, -69.072], [9.462, -69.108], [9.492, -69.138],
      [9.522, -69.168], [9.550, -69.202], [9.558, -69.195],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Montana Oeste Portuguesa',
    region: 'Portuguesa',
    descripcion: 'Serranias al oeste de Acarigua. Sin acceso vial.',
    coordenadas: [
      [9.800, -69.360], [9.810, -69.260], [9.780, -69.215],
      [9.720, -69.195], [9.650, -69.185], [9.580, -69.195],
      [9.550, -69.230], [9.560, -69.290], [9.600, -69.340],
      [9.650, -69.370], [9.720, -69.375], [9.780, -69.370], [9.800, -69.360],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Llanos Sureste Portuguesa',
    region: 'Portuguesa',
    descripcion: 'Llanos del sureste. Sin ruta de entrega.',
    coordenadas: [
      [9.420, -69.050], [9.430, -68.850], [9.400, -68.680],
      [9.350, -68.580], [9.270, -68.550], [9.200, -68.600],
      [9.180, -68.750], [9.210, -68.920], [9.280, -69.050],
      [9.360, -69.100], [9.420, -69.050],
    ],
  },

  // ======================================================
  // GUANARE / PORTUGUESA — Imagen 4:27 PM
  // ======================================================

  {
    tipo: 'VERDE',
    ciudad: 'Guanare',
    region: 'Portuguesa',
    descripcion: 'Zona urbana de Guanare. Cobertura directa.',
    coordenadas: [
      [9.072, -69.755], [9.080, -69.730], [9.072, -69.705],
      [9.055, -69.695], [9.038, -69.700], [9.030, -69.722],
      [9.038, -69.748], [9.055, -69.762], [9.072, -69.755],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Mesa de Cavacas Noroeste Guanare',
    region: 'Portuguesa',
    descripcion: 'Mesa de Cavacas y colinas noroeste. Sin cobertura.',
    coordenadas: [
      [9.180, -69.870], [9.195, -69.800], [9.180, -69.730],
      [9.148, -69.700], [9.110, -69.705], [9.090, -69.738],
      [9.095, -69.790], [9.120, -69.840], [9.155, -69.870], [9.180, -69.870],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Gato Negro Sur Guanare',
    region: 'Portuguesa',
    descripcion: 'Sector Gato Negro, sur de Guanare. Zona rural inaccesible.',
    coordenadas: [
      [8.988, -69.728], [9.000, -69.700], [8.992, -69.672],
      [8.972, -69.658], [8.950, -69.665], [8.940, -69.690],
      [8.948, -69.718], [8.968, -69.735], [8.988, -69.728],
    ],
  },

  // ======================================================
  // BARINAS CIUDAD — Imagen 4:30 PM
  // ======================================================

  {
    tipo: 'VERDE',
    ciudad: 'Barinas Ciudad',
    region: 'Barinas',
    descripcion: 'Gran zona urbana de Barinas. Entrega directa en toda el area metropolitana.',
    coordenadas: [
      [8.660, -70.262], [8.670, -70.238], [8.665, -70.212],
      [8.650, -70.192], [8.632, -70.182], [8.612, -70.185],
      [8.595, -70.200], [8.582, -70.220], [8.580, -70.248],
      [8.590, -70.272], [8.610, -70.288], [8.635, -70.295],
      [8.658, -70.285], [8.660, -70.262],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'El Jobal Norte Barinas',
    region: 'Barinas',
    descripcion: 'Cerros al norte de Barinas. Sin acceso.',
    coordenadas: [
      [8.750, -70.310], [8.762, -70.248], [8.752, -70.188],
      [8.722, -70.155], [8.682, -70.148], [8.658, -70.168],
      [8.655, -70.210], [8.668, -70.252], [8.690, -70.285],
      [8.722, -70.308], [8.750, -70.310],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'El Guamito Sur Barinas',
    region: 'Barinas',
    descripcion: 'Selva y llanos del sur de Barinas. Inaccesible.',
    coordenadas: [
      [8.500, -70.388], [8.512, -70.248], [8.502, -70.148],
      [8.472, -70.048], [8.428, -69.988], [8.368, -69.968],
      [8.308, -70.008], [8.278, -70.108], [8.288, -70.228],
      [8.328, -70.348], [8.392, -70.428], [8.452, -70.448], [8.500, -70.388],
    ],
  },

  // ======================================================
  // BARINAS NORTE / BARINITAS — Imagen 4:28 PM
  // ======================================================

  {
    tipo: 'VERDE',
    ciudad: 'Corredor Barinas Barinitas',
    region: 'Barinas',
    descripcion: 'Eje vial Barinas -> Barinitas. Entrega en ruta.',
    coordenadas: [
      [8.662, -70.210], [8.668, -70.188], [8.672, -70.162],
      [8.675, -70.135], [8.672, -70.108],
      [8.665, -70.108], [8.668, -70.135], [8.665, -70.162],
      [8.660, -70.188], [8.655, -70.210], [8.662, -70.210],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Parque Guaramacal Norte Barinas',
    region: 'Barinas',
    descripcion: 'Parque Guaramacal y serranias al norte. Sin acceso.',
    coordenadas: [
      [8.900, -70.340], [8.912, -70.220], [8.895, -70.108],
      [8.858, -70.028], [8.798, -69.988], [8.728, -70.008],
      [8.680, -70.075], [8.665, -70.155], [8.685, -70.235],
      [8.732, -70.305], [8.798, -70.345], [8.858, -70.348], [8.900, -70.340],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Llanos Sureste Barinas',
    region: 'Barinas',
    descripcion: 'Llanos y rios al sureste. Sin ruta.',
    coordenadas: [
      [8.520, -70.068], [8.535, -69.888], [8.508, -69.728],
      [8.458, -69.618], [8.378, -69.568], [8.288, -69.598],
      [8.228, -69.718], [8.228, -69.878], [8.278, -70.008],
      [8.368, -70.088], [8.458, -70.108], [8.520, -70.068],
    ],
  },

  // ======================================================
  // SOCOPO - CIUDAD BOLIVIA — Imagen 4:31 PM
  // ======================================================

  {
    tipo: 'ROJO',
    ciudad: 'Ciudad Bolivia Barinas',
    region: 'Barinas',
    descripcion: 'Ciudad Bolivia marcada con circulo rojo doble. Sin cobertura de Envias.',
    coordenadas: [
      [8.318, -70.598], [8.330, -70.572], [8.322, -70.545],
      [8.305, -70.532], [8.285, -70.538], [8.275, -70.562],
      [8.282, -70.592], [8.300, -70.608], [8.318, -70.598],
    ],
  },

  {
    tipo: 'ROJO',
    ciudad: 'Llanos Sur Barinas Central',
    region: 'Barinas',
    descripcion: 'Gran elipse sur central de Barinas. Selva y llanos inundables.',
    coordenadas: [
      [8.265, -70.900], [8.285, -70.700], [8.278, -70.500],
      [8.248, -70.328], [8.195, -70.208], [8.118, -70.158],
      [8.035, -70.178], [7.968, -70.278], [7.945, -70.438],
      [7.958, -70.618], [8.005, -70.788], [8.075, -70.908],
      [8.162, -70.975], [8.248, -70.978], [8.265, -70.900],
    ],
  },
];

// ------------------------------------------------------------
// VALIDACI�N MEJORADA CON POL�GONOS
// Primero revisa los pol�gonos vectoriales (alta precisi�n),
// luego fallback al sistema de radio urbano (cobertura general).
// ------------------------------------------------------------

/**
 * Valida si un punto cae dentro de alg�n pol�gono registrado.
 * Devuelve el primer pol�gono que lo contenga, priorizando ROJO
 * (restricciones) sobre los dem�s.
 */
export function validarConPoligonos(lat: number, lng: number): {
  encontrado: boolean;
  zona: 'VERDE' | 'AMARILLO' | 'ROJO' | null;
  ciudad: string | null;
  descripcion: string | null;
} {
  // Chequeo ROJO primero (zonas prohibidas tienen prioridad absoluta)
  for (const poly of POLIGONOS_COBERTURA) {
    if (poly.tipo === 'ROJO' && puntoEnPoligono(lat, lng, poly.coordenadas)) {
      return { encontrado: true, zona: 'ROJO', ciudad: poly.ciudad, descripcion: poly.descripcion };
    }
  }
  // Luego VERDE
  for (const poly of POLIGONOS_COBERTURA) {
    if (poly.tipo === 'VERDE' && puntoEnPoligono(lat, lng, poly.coordenadas)) {
      return { encontrado: true, zona: 'VERDE', ciudad: poly.ciudad, descripcion: poly.descripcion };
    }
  }
  // Luego AMARILLO
  for (const poly of POLIGONOS_COBERTURA) {
    if (poly.tipo === 'AMARILLO' && puntoEnPoligono(lat, lng, poly.coordenadas)) {
      return { encontrado: true, zona: 'AMARILLO', ciudad: poly.ciudad, descripcion: poly.descripcion };
    }
  }
  return { encontrado: false, zona: null, ciudad: null, descripcion: null };
}

/**
 * Serializa los pol�gonos para uso en el cliente (Leaflet).
 */
export function getPoligonosParaCliente() {
  return POLIGONOS_COBERTURA.map((p) => ({
    tipo: p.tipo,
    ciudad: p.ciudad,
    region: p.region,
    descripcion: p.descripcion,
    coordenadas: p.coordenadas,
  }));
}
