# Pattern Until Meaning

Mid-semester NLP portfolio site for Lucas Levine — a scrollytelling walk through six homework projects.

## Run locally

```bash
cd portfolio-site
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Deploy (Vercel)

1. Push this `portfolio-site` folder (or the parent repo) to GitHub.
2. Import the project in Vercel with **Root Directory** set to `portfolio-site` if the repo is the parent folder.
3. Framework preset: Next.js. Build command: `npm run build`. Output: default.
4. Deploy. No env vars required for the static portfolio data.

Do **not** commit `../hw6/spotify/.env` or any API keys.

## Data & precompute

Interactive charts read JSON from `public/data/`:

| File | Source |
|------|--------|
| `hw1.json` | Coded passages from `hw1_levine.md` |
| `hw2.json` | Ablation tables from `hw2_levine.md` |
| `hw3.json` | Verified CER/WER from `hw3/hw3_levine.ipynb` |
| `hw4.json` | `hw4/hw4_pairs_read.csv` + notebook stats |
| `hw5.json` | `hw5/hw5_outputs/*` (points, neighborhoods, neighbors) |
| `hw6.json` | Generated samples / copy-run table from `hw6_levine.md` |
| `site.json` | Curator statement + chapter index |

Figures copied into `public/figures/` from homework folders.  
Refresh figure copies:

```bash
python3 scripts/prepare_data.py
```

Heavy models are **not** run in the browser. Embeddings, OCR scores, and n-gram samples are precomputed.

## Image slots

Dashed **Image slot** blocks are intentional placeholders. Drop your show stills, persona art, and page scans into those marked regions (or replace `ImageSlot` components with `next/image`).

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion (available) · Google fonts: Fraunces, Source Serif 4, IBM Plex Mono
