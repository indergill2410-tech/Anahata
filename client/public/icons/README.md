# PWA Icons

Place the following icon files in this directory:

| File | Size | Usage |
|------|------|-------|
| `icon-32.png` | 32×32 | Browser favicon |
| `icon-192.png` | 192×192 | Android home screen / PWA |
| `icon-512.png` | 512×512 | Splash screen / maskable |

## Generating Icons

Use [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator):

```bash
npx pwa-asset-generator logo.svg ./client/public/icons
```

Or use [Favicon.io](https://favicon.io) to generate from text or image.

The icon should use:
- Background: `#0e0e1a`
- Foreground: `#6d4aff`
- Symbol: A stylised lotus / heart / sound wave
