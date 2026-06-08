# Store-Free Mobile Distribution

Anahata can reach phones without public app-store release through two practical paths.

## Recommended: PWA from Render

Use the deployed HTTPS URL as the mobile app entry point. The app already includes a web manifest, icons, and service worker setup through Vite PWA.

- iPhone: open the Render URL in Safari, use Share, then Add to Home Screen.
- Android: open the Render URL in Chrome and use the in-app install prompt or browser Install option.

This gives users a Home Screen app experience without App Store or Play Store submission.

## Android Native: Direct APK

Android can install APK files outside Google Play when the user allows that source. For local testing:

```powershell
cd client
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
```

The debug APK will be under `client/android/app/build/outputs/apk/debug/`. For wider distribution, create a signed release APK instead of sharing debug builds.

## iOS Native Reality

Normal public iPhone native app distribution still needs an approved Apple route. Store-free native options are limited to:

- installing to your own device from Xcode,
- Apple-approved beta or private distribution paths,
- eligible region-specific alternative distribution,
- or using the PWA Home Screen route above.

For iPhone users outside those Apple-approved routes, the PWA is the practical store-free option.

## Bluetooth Note

The current watch connection uses Web Bluetooth. That works best on Android Chrome-compatible devices. iPhone web apps do not expose Bluetooth device connections to websites, so iPhone watch biometrics will require a future native iOS Bluetooth implementation.
