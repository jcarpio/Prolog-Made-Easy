import { createAuthClient } from '@neondatabase/auth';
import { createEmailCodeFlow, emailCodeError } from './email-code-flow.js';
import { loadAuthConfig } from '../assets/js/auth-config.js';

async function start() {

// Public Neon Auth endpoint; it is not a database credential.
const { authUrl: AUTH_URL } = await loadAuthConfig();
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
  if (user) resetEmailUI();
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
    return result?.data?.user || null;
  } catch (e) {
    showSession(null);
    showError(e);
  }
}
googleButton.addEventListener('click', async () => {
  if (emailBusy) return;
  clearError(); emailBusy = true; updateEmailButtons(); googleButton.disabled = true;
  status.textContent = 'Redirecting to Google…';
  try {
    const callbackURL = new URL('/login.html', window.location.origin).href;
    const result = await auth.signIn.social({ provider: 'google', callbackURL });
    if (result?.error) throw result.error;
    // Neon normally redirects the browser automatically.
  } catch (e) {
    showError(e);
    emailBusy = false; updateEmailButtons();
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
// Email OTP uses the existing managed auth client and server-verified sessions.
const emailFlow = createEmailCodeFlow(auth);
const emailForm = byId('email-sign-in-form');
const codeForm = byId('email-code-form');
const emailInput = byId('sign-in-email');
const codeInput = byId('email-code');
const sendButton = byId('send-email-code');
const resendButton = byId('resend-email-code');
const verifyButton = byId('verify-email-code');
const changeButton = byId('change-email');
let emailBusy = false;
let cooldownTimer;
function updateEmailButtons() {
  const retry = emailFlow.state().retryAfter;
  sendButton.disabled = emailBusy || retry > 0;
  resendButton.disabled = emailBusy || retry > 0;
  sendButton.textContent = retry ? `Send a code (${retry}s)` : 'Send me a code';
  resendButton.textContent = retry ? `Send another code (${retry}s)` : 'Send another code';
  verifyButton.disabled = emailBusy; changeButton.disabled = emailBusy;
  googleButton.disabled = emailBusy; emailInput.disabled = emailBusy; codeInput.disabled = emailBusy;
  if (!retry && cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = undefined; }
}
function startCooldown() {
  clearInterval(cooldownTimer); cooldownTimer = setInterval(updateEmailButtons, 1000);
}
function resetEmailUI() {
  clearInterval(cooldownTimer); cooldownTimer = undefined;
  emailFlow.reset(); codeInput.value = ''; emailInput.value = '';
  emailForm.hidden = false; codeForm.hidden = true;
  if (emailFlow.state().retryAfter) startCooldown();
}
async function requestEmailCode(address) {
  if (emailBusy) return;
  clearError(); emailBusy = true; updateEmailButtons(); status.textContent = 'Requesting your email code…';
  try {
    await emailFlow.send(address);
    byId('code-email').textContent = emailFlow.state().email;
    codeInput.value = ''; emailForm.hidden = true; codeForm.hidden = false;
    status.textContent = 'Code requested. Check your inbox and spam folder.';
    startCooldown();
  } catch (error) { showError(emailCodeError(error)); }
  finally { emailBusy = false; updateEmailButtons(); if (!codeForm.hidden) codeInput.focus(); }
}
emailForm.addEventListener('submit', event => { event.preventDefault(); requestEmailCode(emailInput.value.trim()); });
resendButton.addEventListener('click', () => requestEmailCode(emailFlow.state().email));
changeButton.addEventListener('click', () => {
  if (emailBusy) return;
  emailFlow.reset(); codeInput.value = ''; codeForm.hidden = true; emailForm.hidden = false;
  clearError(); status.textContent = 'Enter your email address to receive a sign-in code.';
  updateEmailButtons(); emailInput.focus();
});
codeForm.addEventListener('submit', async event => {
  event.preventDefault(); if (emailBusy) return;
  clearError(); emailBusy = true; updateEmailButtons(); status.textContent = 'Checking your code…';
  try {
    await emailFlow.verify(codeInput.value); codeInput.value = '';
    const user = await refreshSession();
    if (!user) showError('Your session could not be confirmed. Please try signing in again.');
    else byId('signed-in').querySelector('a').focus();
  } catch (error) { codeInput.value = ''; showError(emailCodeError(error)); }
  finally { emailBusy = false; updateEmailButtons(); }
});
refreshSession();
}
start().catch(error => { document.getElementById('auth-status').textContent = 'Sign-in is unavailable.'; const box = document.getElementById('auth-error'); box.textContent = error.message; box.hidden = false; });
