# Prolog Made Easy — Google Login (Neon Better Auth)

This is an **additive patch**, not a replacement for the book. It keeps the HTML/CSS chapters, Tau Prolog and community API intact.

## Files

- `login.html` — standalone login and logged-in account view.
- `assets/css/auth.css` — editorial visual style.
- `auth-build/auth-entry.js` — plain JavaScript Neon Auth client source.
- `auth-build/package.json` — isolated builder dependencies; does not alter your root `package.json`.
- `assets/js/auth.js` — **generated locally by the build command**; deliberately not included in the ZIP.

## Build on your Mac

Copy all these files into the root of your existing `~/Prolog-Made-Easy` checkout. Then run:

```sh
cd ~/Prolog-Made-Easy
npm install --prefix auth-build
npm run build --prefix auth-build
ls -lh assets/js/auth.js
python3 -m http.server 8000
```

Open `http://localhost:8000/login.html` for local rendering. OAuth redirect tests should use `https://prologmadeeasy.pl/login.html` after deployment, unless localhost was explicitly allowed in Neon. Do not open the HTML by double-clicking (`file://`).

Add a link to `login.html` in the header of the existing `index.html`, e.g. `<a href="/login.html">Sign in</a>`. This avoids overwriting your customized homepage.

Commit and deploy:

```sh
git add login.html assets/css/auth.css assets/js/auth.js auth-build/auth-entry.js auth-build/package.json auth-build/package-lock.json
git commit -m "Add Google login through Neon Auth"
git push origin main
npx vercel --prod
```

## Required settings

- Neon Better Auth trusted domain `https://prologmadeeasy.pl`.
- Google OAuth credentials configured in Neon.
- Google OAuth app test user added while Google app is in Testing.
- Authorized Google redirect URI is the Neon Auth callback `/callback/google`, not `/login.html`.
- The browser code uses a **public Neon Auth URL**, not `DATABASE_URL` or the Google Client Secret.

## Scope / next steps

This patch implements **Google sign-in, session display and sign-out only**. It does **not** authorize posting comments/votes, create profile rows, implement nickname selection, or subscribe anyone to the newsletter. Those require verified server-side identity, permissions, and explicit consent.

Potential issue: cross-site cookie restrictions can affect direct browser-to-Neon Auth sessions in some browsers. If login redirects successfully but session isn't retained, check browser DevTools for blocked cookies/CORS before changing code, and consider Neon-supported domain/proxy setups.

## Not yet browser-tested

Source JavaScript syntax is checked, but live OAuth cannot be exercised from here. The local package install/build and browser test will validate the actual SDK version against your environment.
