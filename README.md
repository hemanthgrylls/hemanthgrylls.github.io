# Hemanth Chandravamsi — personal site

A lightweight static site (hand-written HTML/CSS/JS, no build step). Identity is
built around the CFD "coolwarm" diverging colormap; the hero is a curl-noise
particle flow field and the gallery is generated procedurally in the browser.

## Structure

```
index.html          About / home (hero flow field)
cv.html             General info, appointments, education, teaching, honors, service
research.html       Research areas + selected work
publications.html   Papers, talks, theses (metrics from Google Scholar)
gallery.html        Fluid Gallery — procedural flow tiles
misc.html           Music, reading list, influences
assets/
  style.css         all styling + design tokens (:root)
  fields.js         shared: value noise, curl field, coolwarm colormap
  hero.js           hero particle flow animation
  gallery.js        procedural gallery tiles
.nojekyll           tells GitHub Pages to serve files as-is
```

## Preview locally

```bash
cd hcv-site
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Create a repo and push these files (put them at the repo root):
   ```bash
   git init && git add . && git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/hemanthgrylls/<repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a
   branch**, branch `main`, folder `/ (root)`. Save.
3. The site appears at `https://hemanthgrylls.github.io/<repo>/`.
   - For a root domain `hemanthgrylls.github.io`, name the repo
     `hemanthgrylls.github.io`.

## Editing

- **Colors / fonts:** all tokens live in `:root` at the top of `assets/style.css`.
- **Add a real gallery image:** drop it in `assets/gallery/` and replace a
  `<canvas data-field="…">` in `gallery.html` with `<img src="…" alt="…" />`.
- **Add a portrait:** see the `.portrait` block in the CSS / About page.
- **Publications:** edit `publications.html` directly; the count metrics are
  plain text near the top.
