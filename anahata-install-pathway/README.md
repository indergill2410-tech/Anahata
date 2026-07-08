# Anahata Browser-to-App Install Pathway

This folder is a store-independent install funnel for Anahata. It gives users a browser-first route that works on iPhone, Android, and desktop without requiring App Store or Play Store publishing.

## Recommended Path

1. User opens the official Anahata domain.
2. The page detects the device.
3. The Install Anahata button is always visible.
4. Android users get the browser install prompt when the PWA is eligible.
5. iPhone users get the Safari Add to Home Screen path Apple allows.
6. Desktop users can install from the browser address bar.
7. Advanced Android APK distribution stays separate and disabled until a signed APK is uploaded.

## Deploy

Host these files from the HTTPS origin you want users to trust, ideally the production Anahata domain:

```text
index.html
styles.css
install.js
manifest.webmanifest
service-worker.js
assets/app-icon-192.png
assets/app-icon-512.png
assets/anahata-screen.png
```

Keep `manifest.webmanifest`, `service-worker.js`, and the app start URL on the same origin. Browser install prompts usually require HTTPS, a manifest, a service worker, icons, and a user gesture. The phone-facing files should be served at the live web root when possible so `/manifest.webmanifest` and `/service-worker.js` stay inside the install scope.

## Render

For Render Static Sites, publish the folder that contains `index.html`, `manifest.webmanifest`, and `service-worker.js`. If the GitHub repo has these files at the root, set the publish directory to `.`. If the repo uses this package folder, set the publish directory to `anahata-install-pathway`.

## Customize Before Launch

- Replace footer `#privacy` and `#support` links with real pages.
- Set the final `start_url`, `scope`, and `id` in `manifest.webmanifest` if Anahata will live below a subpath.
- Replace the generated preview image with a real Anahata screenshot.
- If you publish an Android APK fallback, place it at `downloads/anahata-latest.apk`, update the disabled link in `index.html`, and publish a SHA-256 checksum beside it.

## iPhone Reality

For most countries, an iPhone cannot install a native IPA directly from an ordinary website. The practical non-store route is a PWA installed through Safari's Add to Home Screen. Apple's official Web Distribution path is currently limited to eligible EU developers and users, with notarization and Apple approval requirements.

## Android Reality

Android can install PWAs from the browser and can also sideload APKs. APK sideloading requires explicit user approval and is becoming stricter as Google rolls out developer verification for apps distributed outside Google Play. Keep the web app route primary and the APK route clearly marked as advanced.

## Launch Checklist

- Test on iPhone Safari.
- Test on Android Chrome and Samsung Internet.
- Confirm the app opens in standalone mode after install.
- Confirm offline reload works after the first visit.
- Run a PWA audit in Chrome Lighthouse.
- Publish only from the official Anahata domain.
