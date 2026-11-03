// Runtime configuration, so the same static files work in Preview and Production.
export async function loadAuthConfig(fetcher = fetch) {
  const response = await fetcher('/api/auth-config', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Sign-in is not configured for this environment. Please contact the course author.');
  const data = await response.json();
  try {
    const url = new URL(data.authUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.pathname.endsWith('/auth')) throw new Error();
    return { authUrl: url.href };
  } catch { throw new Error('The sign-in configuration could not be loaded. Please try again later.'); }
}
