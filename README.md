# Anahata Install

This repo is Render-ready. The install page is available at the repository root so Render can publish it directly as a static site.

For the tap-to-install route to work best, Render should serve these files from the live site root:

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `install.js`
- `styles.css`
- `assets/*`

Android browsers can show the PWA install prompt from the Install Anahata button once the live HTTPS page is eligible. iPhone Safari uses Apple's Add to Home Screen path.
