import { createRemoteJWKSet, jwtVerify } from 'jose';

const authUrl = process.env.NEON_AUTH_URL || 'https://ep-calm-mouse-bapjwd5s.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth';
const jwksUrl = process.env.NEON_AUTH_JWKS_URL || `${authUrl}/.well-known/jwks.json`;
const jwks = createRemoteJWKSet(new URL(jwksUrl));

export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

export const validExercise = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{1,79}$/.test(value);

export async function requireUser(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(header);
  if (!match) throw Object.assign(new Error('Sign in required'), { status: 401 });
  try {
    // Match the configured Neon Auth instance; never trust unsigned or client-supplied user IDs.
    const { payload } = await jwtVerify(match[1], jwks, {
      issuer: process.env.NEON_AUTH_ISSUER || authUrl,
      algorithms: ['RS256', 'ES256', 'EdDSA'],
      clockTolerance: 10
    });
    if (!payload.sub || typeof payload.sub !== 'string') throw new Error('Missing sub');
    return payload.sub;
  } catch {
    throw Object.assign(new Error('Invalid or expired authentication token'), { status: 401 });
  }
}

export async function readBody(request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 12000) throw Object.assign(new Error('Request too large'), { status: 413 });
  const text = await request.text();
  if (text.length > 12000) throw Object.assign(new Error('Request too large'), { status: 413 });
  try { return JSON.parse(text); }
  catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}
export const errorResponse = err => {
  if (err?.status) return json({ error: err.message }, err.status);
  console.error('Community API failure', err);
  if (err?.code === '23505') return json({ error: 'Nickname is already taken' }, 409);
  return json({ error: 'Server error. Please try again later.' }, 500);
};
