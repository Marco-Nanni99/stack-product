# STACK Hero — Shopify Section

A standalone Shopify section that embeds the spinning 3D bottle hero
(Three.js + GSAP) with no build step required.

---

## Files

| File | Upload to |
|------|-----------|
| `sections/stack-hero.liquid` | Shopify theme → `sections/` |
| `assets/stack-hero.css` | Shopify theme → `assets/` |
| your `stack-bottle.glb` | Shopify Admin → Content → Files (or theme `assets/`) |

---

## Setup

### 1. Upload the files

**Option A — Shopify theme editor (Online Store → Themes → Edit code)**
1. In `sections/`, click **Add a new section** → name it `stack-hero` → replace the content with `sections/stack-hero.liquid`
2. In `assets/`, click **Add a new asset** → upload `assets/stack-hero.css`
3. In `assets/`, click **Add a new asset** → upload `stack-bottle.glb`

**Option B — Shopify CLI**
```bash
shopify theme push
```
(make sure the files are in the correct folders of your local theme copy)

### 2. Add the section to a template

In your theme's `templates/index.json` (or whichever page you want), add:
```json
{
  "sections": {
    "stack-hero": {
      "type": "stack-hero",
      "settings": {}
    }
  },
  "order": ["stack-hero"]
}
```

Or in a `.liquid` template file:
```liquid
{% section 'stack-hero' %}
```

---

## Editing the text

The hero headline, eyebrow, and subtitle are static HTML inside the liquid file.
Edit them directly in `sections/stack-hero.liquid` (look for the `<!-- Hero copy -->` comment).
They are intentionally not exposed as theme editor settings.

---

## Dependencies (loaded from CDN — no npm needed)

| Library | Version | Source |
|---------|---------|--------|
| Three.js | 0.183.2 | jsdelivr |
| Three.js addons (GLTFLoader, EffectComposer, UnrealBloomPass) | 0.183.2 | jsdelivr |
| GSAP | 3.14.2 | jsdelivr |
| Inter font | — | Google Fonts |

---

## Notes

- The section is **not editable** via the Shopify visual theme editor (by design).
- Bloom post-processing is disabled on mobile for performance (same as the standalone site).
- The GLB layer names (`bottom`, `middle`, `top`, `lid`) must match the object names in Blender. If the model is updated, keep those names consistent.
- The main site (`index.html`) is completely unaffected by these files.
