
# CycleSense — Frontend-Only (GitHub Pages)

Play CycleSense virtually or in-person. 100% frontend (no backend). Data persists for the current game in your browser (localStorage). Export at any time to CSV/XLSX; auto-downloads on End Game.

## Quick Start
```bash
npm ci
npm run dev
```

## Build & Deploy (GitHub Pages)
- Update `vite.config.ts` base to your repo name (e.g. `/cyclesense-frontend/`).
- Push to `main` — the workflow in `.github/workflows/deploy.yml` publishes to `gh-pages`.
- Ensure GitHub Pages is set to **Deploy from Branch -> gh-pages**.

## Seeds
Edit JSON files in `/seeds/*`. Add your full deck & returns. Place matching images in `/public/cards/color` and `/public/cards/black`.

## Notes
- Undo restores exact pre-round state.
- Rescore recomputes after edits.
- Validations: allocations sum to 100%; ≤20pp total shift; emotion required; scores 0–5.
- Mode selector: Start a new game as Virtual or In-Person from the Admin panel.


---

## Deploy to GitHub Pages (Steps)
1. Create a new GitHub repo and push this project.
2. Edit `vite.config.ts` → set `base` to `/<your-repo-name>/`.
3. Push to `main`. The workflow at `.github/workflows/deploy.yml` builds and publishes to `gh-pages`.
4. In GitHub → Settings → Pages → Source: **Deploy from a branch**, Branch: `gh-pages`.
5. Visit `https://<your-username>.github.io/<your-repo-name>/`.

## Deploy to GitLab Pages (Yes, similar)
1. Create a GitLab project and push this code.
2. Add `.gitlab-ci.yml` with a Pages job that runs `npm ci && npm run build` and publishes `dist/`.
3. In **Settings → Pages**, your site will appear once the pipeline succeeds.
4. URL will be `https://<namespace>.gitlab.io/<project-name>/` (respect base path in `vite.config.ts`).

Example `.gitlab-ci.yml`:
```yaml
image: node:20
pages:
  stage: deploy
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - public
  before_script:
    - mkdir -p public
    - cp -r dist/* public/
  only:
    - main
```


### Asset filenames in lowercase
This build expects your image files to be named in **lowercase** (e.g., `b1.png`, `g3.png`).
Seed entries already point to lowercase paths like `/cards/color/b1.png` and `/cards/black/w4.png`.
