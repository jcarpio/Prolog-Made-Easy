import { serverAuthConfig } from './_lib/auth-config.js';

export async function GET() {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  try {
    const { authUrl } = serverAuthConfig();
    // The public Auth URL is the only field exposed; never serialize process.env.
    return new Response(JSON.stringify({ authUrl }), { headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Authentication is not configured for this environment.' }), { status: 503, headers });
  }
}
