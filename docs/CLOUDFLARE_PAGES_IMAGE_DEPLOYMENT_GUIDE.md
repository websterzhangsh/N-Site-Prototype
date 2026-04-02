# Cloudflare Pages - Static Image Deployment Guide

> Lessons learned from the Nestopia Gallery image deployment issue (April 2026).
> This document summarizes the root causes, misdiagnosis trail, and the correct solution.

---

## The Problem

Gallery images (Sunroom, Pergola, Zip Blinds) loaded perfectly in local development (`python3 -m http.server` / `localhost`), but **failed to load on both staging and production** Cloudflare Pages deployments. Instead of returning `image/jpeg`, the server returned `text/html` (the SPA fallback page).

**Time spent debugging: ~4 hours across multiple rounds of testing.**

---

## Root Cause Analysis

### The ACTUAL Root Cause: Vite Build Output Directory

Our project uses **Vite** as the build tool with this configuration:

```
# wrangler.toml
pages_build_output_dir = "dist"

# package.json build script
"build": "vite build && cp partners.html ... dist/"
```

**Key fact:** Cloudflare Pages serves files from `dist/`, NOT from the repository root.

Vite's build behavior:
- Files in `public/` directory → automatically copied to `dist/` ✅
- Files in the repository root (e.g., `images/`) → **NOT copied** to `dist/` ❌

**Old images** placed in `public/images/gallery/` worked because Vite copied them to `dist/images/gallery/`.
**New images** placed in root `images/gallery/` were never deployed — they simply didn't exist in the build output.

When Cloudflare Pages receives a request for a non-existent file and SPA mode is active, it returns `index.html` with `content-type: text/html` (HTTP 200, not 404). This makes the failure extremely misleading.

### Misdiagnosis #1: Spaces in File Names

We initially blamed spaces in directory names (`images/Product Matrix/SunRoom/Gallery/`). While Cloudflare Pages CAN have issues URL-encoding spaces, this was **not the primary cause** in our case. We renamed all files to use hyphens — the problem persisted.

### Misdiagnosis #2: Subdirectory Structure

We then hypothesized that Cloudflare Pages couldn't serve files from subdirectories under `images/gallery/sunroom/`. We flattened all images into `images/gallery/` root with prefix naming — the problem still persisted because the files were in root `images/`, not `public/images/`.

### The Correct Fix

Move all static images into the `public/` directory:

```
# WRONG - not included in Vite build output
images/gallery/sunroom-Atrium.jpg

# CORRECT - Vite copies public/ to dist/ automatically
public/images/gallery/sunroom-Atrium.jpg
```

---

## Diagnostic Checklist

When images fail to load on Cloudflare Pages, follow this checklist in order:

### Step 1: Verify HTTP Response Headers

```bash
curl -sI "https://your-site.com/images/gallery/photo.jpg" | head -5
```

| Response | Meaning |
|----------|---------|
| `content-type: image/jpeg` | File exists and is served correctly ✅ |
| `content-type: text/html` | File NOT found — SPA fallback returned ❌ |
| `HTTP 302` redirect | Cloudflare Access blocking the request |

### Step 2: Check Build Output Directory

```bash
# What is your build output directory?
grep "pages_build_output_dir" wrangler.toml

# Does the build script copy images to that directory?
cat package.json | grep "build"
```

### Step 3: Verify File Location

```bash
# For Vite projects, images MUST be in public/
ls public/images/gallery/

# After build, verify they appear in dist/
npm run build && ls dist/images/gallery/
```

### Step 4: Compare Working vs Non-Working Files

```bash
# Find an image that WORKS and check which commit added it
git log --oneline -- public/images/gallery/working-image.jpg

# Find a BROKEN image and check its location
git ls-files | grep broken-image.jpg
# If it's NOT under public/, that's the problem
```

---

## File Naming Best Practices

While not the root cause in our case, these rules prevent other issues:

| Rule | Example | Why |
|------|---------|-----|
| No spaces in paths | `sunroom-Atrium.jpg` not `Sun Room/Atrium.jpg` | URL encoding issues on some CDNs |
| Use hyphens, not underscores | `Pool-Side01.jpg` not `Pool_Side01.jpg` | Consistency with web conventions |
| No special characters | `Pool-Jacuzzi.jpg` not `Pool&Jacuzzi.jpg` | URL-safe characters only |
| Lowercase preferred | `sunroom-atrium.jpg` | Avoids case-sensitivity issues across OS |
| Flat structure preferred | `public/images/gallery/sunroom-atrium.jpg` | Simpler deployment, easier debugging |

---

## Project-Specific Architecture

### Our Deployment Pipeline

```
GitHub Push → Cloudflare Pages Build → Serve from dist/
                    │
                    ├── vite build
                    │     ├── index.html → dist/index.html (transformed)
                    │     └── public/**  → dist/** (copied as-is)
                    │
                    └── cp *.html dist/ (manual copy for non-Vite pages)
```

### Where to Put New Images

```
public/
└── images/
    ├── gallery/           ← Product gallery images go here
    │   ├── sunroom-*.jpg
    │   ├── pergola-*.jpg
    │   └── zipblinds-*.jpg
    ├── hero/              ← Hero section backgrounds
    ├── products/          ← Product showcase images
    │   ├── sunroom/
    │   ├── pergola/
    │   └── windproof/
    └── *.jpg              ← Other static images
```

### How to Reference Images in HTML/JS

```javascript
// In index.html or any page served by Vite:
// Reference as if public/ is the root
{ src: 'images/gallery/sunroom-Atrium.jpg' }
// This maps to: public/images/gallery/sunroom-Atrium.jpg (source)
//           →   dist/images/gallery/sunroom-Atrium.jpg (build output)
```

---

## Key Takeaways

1. **"Works locally, broken in production" almost always means the file isn't in the build output.** Don't chase file naming or CDN issues first — verify the build pipeline.

2. **Cloudflare Pages SPA fallback is misleading.** It returns HTTP 200 with `text/html` for missing files, making it look like the file exists but is corrupt. Always check `content-type` in response headers.

3. **For Vite projects: all static assets must be in `public/`.** This is Vite's design — `public/` is the only directory that gets copied verbatim to the build output.

4. **Local dev servers serve from the repo root**, so files outside `public/` work locally but not in production. This is the fundamental mismatch that causes confusion.

5. **Test the build locally before pushing:**
   ```bash
   npm run build
   # Then check: does dist/images/gallery/your-new-image.jpg exist?
   ls dist/images/gallery/
   ```

---

## Quick Reference: Adding a New Gallery Image

```bash
# 1. Place the image in the correct directory
cp new-photo.jpg public/images/gallery/sunroom-new-photo.jpg

# 2. Verify it's tracked by git
git add public/images/gallery/sunroom-new-photo.jpg

# 3. Test the build locally
npm run build && ls dist/images/gallery/sunroom-new-photo.jpg

# 4. Add the reference in index.html
#    { src: 'images/gallery/sunroom-new-photo.jpg', zh: '...', en: '...' }

# 5. Commit and push
git add . && git commit -m "feat: Add new sunroom gallery image"
git push origin main
# Then merge to production branch
```

---

## Automated Prevention: verify-assets.sh

To ensure this issue **never happens again**, we added a post-build verification step that automatically catches missing assets before deployment.

### What It Does

The script `scripts/verify-assets.sh` runs **after every build** and:

1. Scans all HTML/JS files in `dist/` for image references (`src="..."`, `url(...)`, template literals)
2. Filters out external URLs (CDNs, https://, data:)
3. Checks each referenced local image file actually exists in `dist/`
4. If ANY image is missing → **build fails with exit code 1**, blocking deployment
5. Prints the exact missing file paths and the `cp` commands to fix them

### How It's Integrated

```jsonc
// package.json
{
  "scripts": {
    "build": "vite build && cp *.html ... dist/ && bash scripts/verify-assets.sh",
    "verify": "bash scripts/verify-assets.sh"  // standalone check
  }
}
```

The verification is chained into `npm run build`, so:
- **Cloudflare Pages auto-build** → runs `npm run build` → includes verification → fails if assets missing
- **Manual deployment** → same pipeline, same protection
- **Local testing** → `npm run verify` to check without full rebuild

### Example Output: Missing Assets Detected

```
============================================
  Asset Verification - Post Build Check
============================================

Scanning dist/ for image references...

  MISSING  images/gallery/sunroom-NewPhoto.jpg
           Expected at: dist/images/gallery/sunroom-NewPhoto.jpg

--------------------------------------------
  Results: 15 assets checked
--------------------------------------------

  ERROR: 1 missing asset(s) detected!

  To fix: Move the source files to public/
  Example:
    cp images/gallery/sunroom-NewPhoto.jpg public/images/gallery/sunroom-NewPhoto.jpg

  Then rebuild: npm run build
```

### Example Output: All Assets OK

```
============================================
  Asset Verification - Post Build Check
============================================

Scanning dist/ for image references...

--------------------------------------------
  Results: 15 assets checked
--------------------------------------------
  All referenced assets found in dist/ ✅
```

### Why This Works

| Failure Scenario | How It's Caught |
|-----------------|-----------------|
| Image placed in root `images/` instead of `public/images/` | Script finds it missing from `dist/` |
| Image referenced in code but never uploaded | Script detects the reference, file doesn't exist |
| Image filename typo in HTML/JS | Referenced name won't match any file in `dist/` |
| Build config changed, breaking asset copy | Script validates the final output regardless of config |

This transforms image deployment from a **"discover in production"** problem into a **"fail at build time"** guarantee.

