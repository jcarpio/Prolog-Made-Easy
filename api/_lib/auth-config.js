// One environment-specific source of truth for browser sessions and JWT validation.
export function serverAuthConfig(env = process.env) {
  const invalid = () => Object.assign(new Error('Authentication is not configured for this environment.'), { status: 503 });
  try {
    if (!env.NEON_AUTH_URL) throw invalid();
    const url = new URL(env.NEON_AUTH_URL.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.pathname.replace(/\/$/, '').endsWith('/auth')) throw invalid();
    const authUrl = url.href.replace(/\/$/, '');
    const jwks = new URL(env.NEON_AUTH_JWKS_URL?.trim() || `${authUrl}/.well-known/jwks.json`);
    if (jwks.protocol !== 'https:' || jwks.origin !== url.origin || jwks.username || jwks.password || jwks.search || jwks.hash || jwks.pathname !== `${new URL(authUrl).pathname}/.well-known/jwks.json`) throw invalid();
    return { authUrl, jwksUrl: jwks.href, issuer: url.origin };
  } catch { throw invalid(); }
}
