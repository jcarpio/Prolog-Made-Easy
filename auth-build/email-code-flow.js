// Neon owns code generation, email delivery and verification. Never persist codes.
export function createEmailCodeFlow(auth, { now = Date.now, cooldownMs = 60000 } = {}) {
  let email = null, nextSendAt = 0, pending = false;
  const state = () => ({ email, pending, retryAfter: Math.max(0, Math.ceil((nextSendAt - now()) / 1000)) });
  async function send(address) {
    if (pending) throw new Error('Please wait for the current request.');
    if (now() < nextSendAt) throw new Error('Please wait before requesting another code.');
    const target = String(address || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target) || target.length > 254) throw new Error('Enter a valid email address.');
    pending = true;
    try {
      const result = await auth.emailOtp.sendVerificationOtp({ email: target, type: 'sign-in' });
      if (result?.error) throw result.error;
      email = target; nextSendAt = now() + cooldownMs;
    } finally { pending = false; }
  }
  async function verify(value) {
    if (pending) throw new Error('Please wait for the current request.');
    if (!email) throw new Error('Request a code first.');
    const otp = String(value || '').trim();
    if (!otp || otp.length > 64) throw new Error('Enter the code from your email.');
    pending = true;
    try {
      const result = await auth.signIn.emailOtp({ email, otp });
      if (result?.error) throw result.error;
      return result;
    } finally { pending = false; }
  }
  function reset() {
    if (pending) throw new Error('Please wait for the current request.');
    email = null;
  }
  return { send, verify, reset, state };
}
export function emailCodeError(error) {
  const code = String(error?.code || error?.error?.code || '').toUpperCase();
  if (/TOO_MANY|RATE_LIMIT/.test(code) || error?.status === 429) return 'Too many attempts. Please wait before requesting a new code.';
  if (/OTP|EXPIRED|INVALID_CODE/.test(code)) return 'That code could not be verified. Check it or request a new code.';
  if (/DISABLED|NOT_ENABLED|NOT_FOUND/.test(code) || error?.status === 404) return 'Email sign-in is not available yet. Please try Google or contact the course author.';
  return 'We could not complete email sign-in. Please try again. If it continues, check the email sign-in settings with the course author.';
}
