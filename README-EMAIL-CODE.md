# Email-code sign-in — Prolog Made Easy

Adds passwordless email-code sign-in alongside Google using the existing Neon Auth client (`@neondatabase/auth` 0.7.0-beta). No new database table, mailer dependency, password storage or auth provider is introduced. Neon generates, delivers and verifies codes. The existing server-side JWT verification continues to protect APIs.

## Install on the development branch

This package contains only new or changed files, relative to the repository root. It is based on `origin/feature/learning-path` commit dc657241, with the full base SHA recorded below. Keep all other files.

```bash
git switch feature/learning-path
# Unzip the package into ~/Downloads/prolog-made-easy-email-code first.
rsync -avhn ~/Downloads/prolog-made-easy-email-code/ ./
rsync -avh ~/Downloads/prolog-made-easy-email-code/ ./
node --test tests/*.test.js
git diff --check
git add login.html assets/css/auth.css assets/js/auth.js auth-build/auth-entry.js auth-build/email-code-flow.js tests/email-code.test.js README-EMAIL-CODE.md
git commit -m "Add passwordless email code sign-in alongside Google"
git push origin feature/learning-path
npx vercel
```

Use the existing Vercel project and preview deployment. No production deployment is required. The browser bundle `assets/js/auth.js` is already built; you do not need to install or rebuild dependencies to try this package. If you later modify auth sources, use the existing `npm run build` from `auth-build/` with dependencies installed for your computer's platform.

## Required Neon setting

In the Neon Console, select the Auth instance/branch currently used by the course. Enable **Sign-up and Sign-in with Email** under **Settings → Better Auth** (the console may label this section Auth). Email OTP support is managed by Neon; do not install an application-side Better Auth server plugin. If this console exposes a separate Email OTP setting, enable it for the same branch. These settings are not changed by this package.

For this development test, Neon supports managed email delivery. Check your actual project delivery settings if no code arrives. A dedicated mail provider can be configured separately for production.

Email and Google both use the Auth URL returned by /api/auth-config. See README-AUTH-ENVIRONMENTS.md for configuring NEON_AUTH_URL separately in Preview and Production. Changing DATABASE_URL alone does not select a different authentication instance.

Email OTP avoids the Google redirect flow; it does not waive Neon's trusted-origin rules. If Neon rejects this preview origin, authorize its exact HTTPS origin in the Auth instance's trusted domains. For repeated tests, use a stable development address and authorize it once. Do not whitelist all vercel.app deployments.

## Real test after deploying

1. Open `/login.html` on the preview and sign out of the course if necessary. Vercel preview protection is a separate login.
2. Enter an email address you control and select **Send me a code**.
3. Keep the page open, check your inbox/spam folder and enter the received code.
4. Verify that **Signed in successfully** appears, then use **Continue learning**.
5. Check an incorrect/expired code, resend after the cooldown, change-email, and sign-out flows.
6. Test an existing Google user's email and a new email separately. Verify how your Neon account-linking policy handles the existing identity; do not assume matching email alone guarantees shared progress. The application does not merge identities itself.

Email authentication does not apply the learning-path migration. Account progress still requires `social/003_learning_path.sql` in the database configured for Preview. Authentication can succeed while the progress API reports a missing table or environment setting.

## Behaviour and validation

- Code request and verification stay on the same page; no password is requested.
- The email that received the code is retained as the verification target; use **Use a different email** to change it.
- A 60-second browser cooldown discourages repeated sends. Actual attempt limits, expiry and delivery are enforced by Neon. Browser throttling is not a security boundary.
- Concurrent requests are blocked in the UI and controller. Codes are cleared on verification attempts, address changes and successful sign-in; codes and emails are not persisted in localStorage by this feature.
- Error messages use textContent and do not display raw server errors or credentials. No newsletter consent is changed.
- Automated tests: six email flow cases, four learning-path cases and six environment configuration cases (16 passing).
- Browser QA used an isolated auth test double: send, resend cooldown, wrong code, successful sign-in and logout. No real email was sent and live Neon settings/session delivery remain to be tested after configuration.
- The test double is outside the repository and absent from the deliverable; the production browser bundle uses the real Neon SDK.

Official reference: https://neon.com/docs/auth/guides/plugins/email-otp

Base source commit: `dc657241e5284929cc29e388c47a19554052b269`
