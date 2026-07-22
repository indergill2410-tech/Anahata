# Changelog

All notable changes to Anahata are documented here.

## [Unreleased]

### Changed
- Visual refresh (foundation + shared shell), keeping the Cosmic Ivory identity:
  a new design-token layer (signature aurora gradients, a layered elevation
  scale, a glass-surface recipe, and an "on-dark" text set for content over the
  cosmic backgrounds), deeper glassmorphic cards, primary buttons on the
  signature violet→blue aurora, and visible keyboard focus rings for
  accessibility. Fixed low-contrast dark-on-dark text on the signed-out
  Dashboard prompt by placing it on a readable glass card.

### Removed
- Email verification has been removed entirely. Signup no longer sends a
  verification email, and accounts are fully usable immediately — private saves
  (journal, sessions, mixes, favourites, biometric personalization, profile
  settings) no longer require a "verify your email" step. The `/api/auth/
  verification/*` endpoints and the `VerificationNotice` UI are gone. The
  `verified` field is retained but dormant on the user record/JWT, and
  `requireVerified` is now a pass-through so enforcement can be reinstated in one
  place if ever needed.

## [1.0.0] — 2026-05-29

### Added
- 111-track meditation music library (binaural + Indian classical + Solfeggio)
- Full PWA support with offline caching via Workbox
- Auth system: JWT login/register with auto-expiry
- 3-step onboarding flow
- Dashboard with live biometric display
- Bluetooth heart rate monitor integration (Web BLE)
- Practice signal mode for users without smartwatches
- WebSocket real-time biometric streaming
- Session history with Supabase persistence
- Profile page with preference toggles
- Music library with filter, search, sort, pagination
- Sticky floating track player
- Error boundaries on all page components
- Toast notification system
- Skeleton loading states
- GitHub Actions CI/CD pipeline
- Jest test suite with 14 tests across 3 files
- Docker Compose for local development
- Supabase schema with RLS policies
