# Prolog Made Easy

**Learn Logic Programming the Fun Way!**

A lightweight, free, English-language introduction to Prolog. The homepage is plain HTML/CSS; lessons use [Reveal.js](https://revealjs.com/) through a CDN.

## Files

- `index.html`: public homepage and lesson index
- `assets/style.css`: homepage styling
- `assets/slides.css`: shared Reveal.js styling
- `chapters/*.html`: standalone slide decks
- `vercel.json`: disables automatic Git-based deployments

## Run locally

From the repository root:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser. Reveal.js loads from jsDelivr, so presentations require an internet connection for now.

## Deploy to Vercel

Keep **Framework Preset: Other**, **Root Directory: ./**, and no build command. Deploy manually when ready using the Vercel dashboard or `npx vercel --prod` from the repository directory.

Note: `git.deploymentEnabled: false` prevents automatic Git-triggered deployments; it does not prohibit manually initiated deployments.

## Editorial notes

The first three chapters are a short **starter draft**, not the finished course. Examples intentionally use ordinary ISO-style Prolog relations and should be reviewed and extended with runnable exercises, deeper explanations, and accessibility testing.
