// Bundled for use by ordinary HTML pages; no React or Next.js required.
import { createAuthClient } from '@neondatabase/auth';

// Public Neon Auth endpoint; it is not a database credential.
const AUTH_URL = 'https://ep-calm-mouse-bapjwd5s.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth';
const auth = createAuthClient(AUTH_URL);
const byId = (id) => document.getElementById(id);
const status = byId('auth-status');
const errorBox = byId('auth-error');
const signedOut = byId('signed-out');
const signedIn = byId('signed-in');
const googleButton = byId('google-sign-in');
const logoutButton = byId('sign-out');
const message = (e) => e?.message || e?.error?.message || String(e || 'Unknown error');

function showError(err) {
  errorBox.textContent = message(err);
  errorBox.hidden = false;
  status.textContent = 'Authentication needs attention.';
}
function clearError() { errorBox.textContent = ''; errorBox.hidden = true; }
function showSession(user) {
  signedIn.hidden = !user;
  signedOut.hidden = !!user;
  byId('user-name').textContent = user?.name || 'Logic Explorer';
  byId('user-email').textContent = user?.email || '(email unavailable)';
  status.textContent = user ? 'Signed in successfully.' : 'You are not signed in.';
}
async function refreshSession() {
  clearError();
  try {
    const result = await auth.getSession();
    if (result?.error) throw result.error;
    showSession(result?.data?.user || null);
  } catch (e) {
    showSession(null);
    showError(e);
  }
}
googleButton.addEventListener('click', async () => {
  clearError(); googleButton.disabled = true;
  status.textContent = 'Redirecting to Google…';
  try {
    const callbackURL = new URL('/login.html', window.location.origin).href;
    const result = await auth.signIn.social({ provider: 'google', callbackURL });
    if (result?.error) throw result.error;
    // Neon normally redirects the browser automatically.
  } catch (e) {
    showError(e);
    googleButton.disabled = false;
  }
});
logoutButton.addEventListener('click', async () => {
  clearError(); logoutButton.disabled = true;
  status.textContent = 'Signing out…';
  try {
    const result = await auth.signOut();
    if (result?.error) throw result.error;
    await refreshSession();
  } catch (e) { showError(e); }
  finally { logoutButton.disabled = false; }
});
refreshSession();
