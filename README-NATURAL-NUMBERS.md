# Your First Prolog Program — Natural Numbers

Interactive English chapter for **Prolog Made Easy**, with a real Tau Prolog engine in a browser Web Worker.

## Files added

- `chapters/04-natural-numbers.html` — chapter and playground
- `assets/natural-editorial.css` — Chapter 1 editorial styling + responsive playground
- `assets/js/natural-lab.js` — exercises, feedback and controls
- `assets/js/natural-worker.js` — isolated interpreter and automatic checks
- `index.html` — updated with a chapter link

All other chapters and existing assets from the previous chapter package are retained for a convenient full-site ZIP.

## Try locally

Run `python3 -m http.server 8000` from the project root, then visit `http://localhost:8000/chapters/04-natural-numbers.html`.

The Tau Prolog 0.3.4 interpreter is currently loaded from a version-pinned jsDelivr CDN by the Web Worker and **requires an Internet connection**. Other site assets are local. To make it fully offline, download `modules/core.js` from the `tau-prolog@0.3.4` npm package into `assets/vendor/tau-prolog/core.js`, update `importScripts(...)` in `assets/js/natural-worker.js` to `importScripts('../vendor/tau-prolog/core.js')` (worker relative URL resolution), and retain the dependency's BSD-3-Clause licence.

## Deployment

Preserves `vercel.json` with Git auto-deploy disabled. From the local root folder: `npx vercel --prod`.

## Teaching note

Peano numbers use terms like `s(s(0))`, not built-in Prolog integer arithmetic. `natural(X).` is open-ended, so answers are requested one by one (max 12); the worker is terminated if computation runs over 5 seconds. The exercise checks use example queries rather than a formal proof of program correctness.

## Licences

Tau Prolog by tau-prolog contributors, BSD-3-Clause: https://github.com/tau-prolog/tau-prolog
The original site files retain their prior licences, image credits and policies.

## Design update

This version matches the visual language of **Think Differently!**: dark photographic hero, teal accents, Space Grotesk / DM Sans typography, cream reading background, sticky table of contents, and the same full-width narrative rhythm. Tau Prolog missions and worker-based execution are retained. The hero reuses the credited surfing photograph from Chapter 1.
