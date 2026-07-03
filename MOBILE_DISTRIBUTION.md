# Store-Free Mobile Install

Anahata can reach phones without a public app-store release through the Home Screen app flow.

## Recommended: Home Screen App

Use the deployed HTTPS URL as the mobile app entry point. The app includes a web manifest, icons, service worker setup, and in-app install guidance.

- iPhone: open Anahata in Safari, tap Share, then Add to Home Screen.
- Android: open Anahata in Chrome and use the in-app Install button when it appears.
- If a browser cannot install directly, use the permanent dashboard control to share or copy the link to the phone.

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
