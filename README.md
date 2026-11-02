# Prolog Made Easy — Chapter 1 (HTML + Reveal.js)

Static site for Vercel (`Framework Preset: Other`, `Root Directory: ./`).

## Included
- `index.html` — course homepage (from starter)
- `chapters/01-think-differently.html` — complete English reading chapter, accessible/responsive
- `chapters/01-think-differently-slides.html` — companion Reveal.js presentation
- `assets/chapter-one.css` — new chapter styles
- other existing starter chapters and styles retained
- `vercel.json` — Git automatic deployment disabled (as in starter)

## Preview
Run `python3 -m http.server 8000` from this directory and open `http://localhost:8000/chapters/01-think-differently.html`.

## Image credits and licences
Photos are **real photographs**, hosted via `images.unsplash.com` (not generated with AI). They are free to use under the **Unsplash License**, **not necessarily in the public domain**. Links to the original pages and author credits appear in the HTML chapter. All image files load remotely: internet is needed to display them. For completely self-contained hosting, download the original files from their Unsplash source pages and change the image URLs to local paths.

| Section | Photographer | Source |
| --- | --- | --- |
| driving | Paul Esch-Laurent | https://unsplash.com/photos/a-person-driving-a-car-with-a-steering-wheel--Mep3_Xuw8g |
| van | Daniel J. Schwarz | https://unsplash.com/photos/a-van-driving-down-a-winding-road-in-the-mountains-Wkkm_sIFtaw |
| surf | Mike Perry | https://unsplash.com/photos/man-surfs-on-big-wave-GP-Jn-dfqMw |
| japan | Ramon Buçard | https://unsplash.com/photos/japanese-signs-illuminate-a-night-scene-in-tokyo-A51aIjA7eg8 |

Licence: https://unsplash.com/license

## Scholarly references
- McCauley et al. (2015), https://doi.org/10.1080/08993408.2015.1033205
- Scherz et al. (1990), https://doi.org/10.2190/UHFF-4LNQ-63VA-Q60C

## Publishing
1. Copy the repository contents over your existing clone (keep your current git history).
2. Commit and push to GitHub.
3. Publish **manually** from the project directory with `npx vercel --prod`.

Note: This zip is a starter snapshot, not a live checkout of your GitHub repository. Check any files that changed since the earlier starter before overwriting them.
