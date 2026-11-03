# Authentication per environment — Prolog Made Easy

This update includes email-code sign-in and removes fixed Neon Auth URLs from login, profile, community, header and learning progress. It preserves the existing HTML site and installed Neon SDK. No React/Vite migration is required.

## Vercel configuration

Keep the existing Production settings. For Preview (either all previews or specifically feature/learning-path), set:

NEON_AUTH_URL=https://ep-winter-salad-bayed6xr.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth

This is the exact public Auth URL shown in the development quickstart. Do not change its /neondb/auth path to match the application database name. The application DATABASE_URL is separately configured for the development branch's prolog_made_easy database.

NEON_AUTH_JWKS_URL is optional: if absent, the server derives NEON_AUTH_URL + '/.well-known/jwks.json'. If you set it in Preview, its exact value is:

https://ep-winter-salad-bayed6xr.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth/.well-known/jwks.json

Do not assign Production's JWKS URL to Preview. Inconsistent values cause an explicit configuration error. The existing Production NEON_AUTH_URL and NEON_AUTH_JWKS_URL must remain unchanged.

## How it works

The browser requests /api/auth-config on the current deployment. The function exposes only the public Auth URL selected by the deployment's NEON_AUTH_URL, with Cache-Control: no-store. Database URLs, passwords and other environment variables are never returned.

All browser entry points use that configuration to create their auth client or obtain tokens. Protected APIs use the same server configuration to select the JWT issuer and JWKS. There is no default production endpoint: an unconfigured environment displays an error instead of silently authenticating against production.

The JWT algorithm/issuer contract remains the existing project's EdDSA and Auth origin. No JWT audience, origin or signature checks have been relaxed. This patch does not merge identities, rewrite user IDs or update any database rows.

## Install and deploy only to Preview

Unzip prolog-made-easy-auth-environments.zip into ~/Downloads/prolog-made-easy-auth-environments. From the repository root:

```bash
git switch feature/learning-path
rsync -avhn ~/Downloads/prolog-made-easy-auth-environments/ ./
rsync -avh ~/Downloads/prolog-made-easy-auth-environments/ ./
node --test tests/*.test.js
git diff --check
git add .
git commit -m "Configure authentication per environment"
git push origin feature/learning-path
npx vercel
```

The package contains prebuilt browser bundles. No npm installation is needed to apply it. For future source edits, auth-build/package.json adds build:header and build:all alongside the existing scripts; npm run build:all inside auth-build rebuilds all auth bundles using dependencies installed for your platform.

This is an additive patch over the learning-path version. It also includes the previous email-code changes, so you can apply this package if that earlier ZIP has not been copied yet. Do not use --delete when copying. Inspect local changes before overwriting files if you have edited these same files since the previous package.

No GitHub write, live Neon configuration or Vercel deployment was performed from this environment. Production remains on its existing source. After eventually merging, ensure its existing Auth settings are present before publishing.

## Neon configuration (development branch only)

Close the quickstart, select development and open Configure Auth. Enable Sign-up and Sign-in with Email / Email OTP according to the branch's console settings. Neon handles generation, expiry, attempt limits and email delivery. Authorize the preview's exact origin if required; passwordless login does not remove trusted-origin requirements. A stable development domain avoids registering changing preview URLs.

The development branch is a copy of its parent, so users listed immediately after branching are not evidence that the new preview has signed in successfully. Test a real sign-in after deploying.

## Verification after deployment

1. Visit /api/auth-config on the new preview. It must return only {"authUrl":"https://ep-winter-salad-bayed6xr.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth"}.
2. Visit /login.html and request an email code using an address you control. Check inbox/spam, verify and sign out.
3. Sign in again, open /progress.html and save learning preferences or complete chapter one.
4. In Neon development / prolog_made_easy, confirm the authenticated user's row in pme_learning. Compare user IDs in the development Auth instance when checking identity.
5. Confirm the saved path on a second device and that logout does not expose account progress as guest data.
6. Verify the existing production website still behaves as before; no changes to its environment or source are needed for these Preview tests.

If /api/auth-config returns 503, check NEON_AUTH_URL and any NEON_AUTH_JWKS_URL for Preview and create a new preview deployment. If it returns development but a browser token request fails, inspect Neon email settings, trusted domains and cookie behaviour. If login succeeds but progress fails, check Preview DATABASE_URL and the development migration separately.

## Validation performed

16 automated cases pass: six for environment selection, required configuration, wrong-environment keys, URL validation, public response field allowlisting and browser error handling; six email-code flow tests; four learning path tests. All browser entry points compile and JavaScript syntax/whitespace checks pass. Browser QA uses an isolated mock auth client and runtime configuration file to check initialization and successful email-code UI. The mock is outside the repository and absent from the ZIP; the shipped bundles contain the real Neon SDK. Live email delivery, JWT/session verification and account progress remain to be checked in your deployed Preview.

Base source commit: `dc657241e5284929cc29e388c47a19554052b269`
