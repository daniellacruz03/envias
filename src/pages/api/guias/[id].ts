// SERVICIO SUSPENDIDO
const SUSPENDED = new Response(
  JSON.stringify({ error: 'Servicio suspendido temporalmente.' }),
  { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '86400' } }
);

export const ALL = () => SUSPENDED;
export const GET = () => SUSPENDED;
export const POST = () => SUSPENDED;
export const PUT = () => SUSPENDED;
export const PATCH = () => SUSPENDED;
export const DELETE = () => SUSPENDED;
