# CLAUDE.md - Photo Guessing Game

Technical guidance for AI assistants working on this codebase.

## Project Overview

A two-player photo guessing game built with React + Vite, packaged for web,
mobile (iOS/Android via Capacitor), and macOS desktop (Electron). Players guess
when (Date mode) or where (Location mode) photos were taken. The README is the
user-facing description; [ARCHITECTURE.md](ARCHITECTURE.md) explains how the
pieces fit together.

## Technology Stack

- **Frontend**: React 19.2, Vite 7 (JavaScript/JSX; TypeScript only for `capacitor.config.ts`)
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/postcss`)
- **State**: Zustand 5, persisted through `storageService` (player names and mode only)
- **Animations**: Framer Motion 12
- **Icons**: lucide-react
- **Audio**: Web Audio API (no audio files)
- **Mobile**: Capacitor 8 (iOS 15+, Android API 24+; needs Node 22+, Xcode 26+)
- **Desktop**: Electron 33 + electron-builder 25 (macOS 11+)
- **EXIF**: exifr 7
- **Geocoding**: OpenStreetMap Nominatim, through `src/utils/geocoding.js`

## Architecture

### State Management

One Zustand store (`src/stores/gameStore.js`) holds the state and the rules:

```
Game phases: setup → playing ⇄ feedback → victory | no_photos
Game modes:  'date' | 'location'
```

**Key state:**
- `players[]` - `{ id, name, score }`
- `allPhotos[]` - the loaded library; `allCountries` / `allStates` / `allCities` are its distinct places
- `photos[]` - the shuffled photos for the current game; `currentPhotoIndex` is the one on screen
- `currentPlayerIndex` - whose turn (0 or 1)
- `guessPhase` - `'year'|'month'|'day'` or `'country'|'state'|'city'`
- `turnScore` - points banked this turn
- `pendingWinner`, `isTieBreaker` - the end-of-game rule (below)

**Persistence:** only `gameMode` and the player names (`partialize` + `merge`).
Photos cannot be saved (native file URIs do not outlive the session), so a
restored in-game phase used to show "No photo available"; the app now always
reopens at setup.

### Component Structure

```
src/
├── App.jsx                 # Setup screen or game board; macOS menu events
├── components/
│   ├── SetupScreen.jsx     # Mode, player names, photo loader, rules, start
│   ├── PhotoLoader.jsx     # Web: fetch manifest. Native/Electron: picker + EXIF
│   ├── GameBoard.jsx       # Player panels, photo, questions, overlays
│   ├── PhotoDisplay.jsx    # Current photo with counter
│   ├── PlayerPanel.jsx     # Name, score, turn / tie-breaker badges
│   ├── GuessingInterface.jsx # Step indicator + the current question's selector
│   ├── YearSelector.jsx    # yearOptions years near the answer, sorted
│   ├── MonthSelector.jsx   # 12-month grid
│   ├── DaySelector.jsx     # Calendar of the answer's month
│   ├── CountrySelector.jsx # Up to locationOptions countries from the whole library
│   ├── StateSelector.jsx   # ...states from the whole library (NOT filtered by country)
│   ├── CitySelector.jsx    # ...cities from the whole library
│   ├── FeedbackOverlay.jsx # Correct/wrong card with Continue
│   ├── VictoryScreen.jsx   # Winner; macOS notification
│   └── Confetti.jsx        # Particle animation
├── hooks/
│   ├── useSoundEffects.js  # Web Audio synthesis
│   └── useHaptics.js       # Capacitor Haptics (no-op on web and macOS)
├── services/
│   ├── capacitorPhotoService.js  # Photo picker (Capacitor or Electron IPC)
│   ├── exifService.js      # EXIF + geocoding on the device
│   ├── storageService.js   # localStorage / Capacitor Preferences / Electron JSON file
│   └── platform.js         # Platform detection
├── utils/
│   ├── dateUtils.js        # Answer checking, points, phase order, answer choices
│   ├── geocoding.js        # Nominatim URL + address → place (shared with the generator)
│   ├── animations.js       # Framer Motion variants
│   └── exifExtractor.js    # Unused older EXIF helper
└── data/
    ├── game-config.json    # Rules and settings (the single source)
    └── constants.js        # GAME_CONFIG, built from game-config.json
```

### Scoring System

| Mode | Question 1 | Question 2 | Question 3 | Perfect |
|------|---------|---------|---------|---------|
| Date | Year: 1pt | Month: +2pt | Day: +3pt | 6pts |
| Location | Country: 1pt | State: +2pt | City: +3pt | 6pts |

The values come from `game-config.json`. A photo with no state or city skips
that question (`getNextAnswerablePhase`), so its best turn is 4 points. A wrong
answer ends the turn and keeps the points banked so far.

### Tie-Breaker Logic

`determineVictory` runs when a turn ends. Player 1 always starts, so turns are
even after each of Player 2's turns.

- Player 1 reaches the winning score → `pendingWinner` = Player 1, `isTieBreaker` = true.
- Player 2's turn ends with `isTieBreaker` set → Player 2 wins if ahead, Player 1
  wins if Player 2 is behind, a tie clears both flags and play continues (the
  rule re-arms after Player 1's next turn).
- Player 2 reaches the winning score while Player 1 has not → Player 2 wins.
- Photos run out → `no_photos` screen with the scores, no winner.

Before 2026-09-16 a tie-breaker turn that stayed under the winning score fell
through and dropped the tie-breaker, so the game never ended; the first branch
of `determineVictory` now decides the tie-breaker turn however it ended.

### Photo Requirements

**Date mode:** EXIF `DateTimeOriginal`, `CreateDate` or `DateTime` (the apps
also try `DateTimeDigitized`), parsed as `{ year, month, day }`.

**Location mode:** EXIF GPS position, reverse geocoded to
`{ country, state, city }`. A photo needs at least a country.

### Platform Differences

| Feature | Web | iOS/Android | macOS (Electron) |
|---------|-----|-------------|------------------|
| Photo loading | `public/photos/` + generated manifest | Capacitor `Camera.pickImages` | `dialog.showOpenDialog` via IPC |
| EXIF + geocoding | At build time (`generate-manifest.js`, Node) | On device (`exifService`) | In the renderer (`exifService`) |
| Storage | localStorage | Capacitor Preferences | JSON file in `app.getPath('userData')` |
| Haptics | None | Capacitor Haptics | No-op IPC handlers |
| Photo display | Manifest URL | `Capacitor.convertFileSrc()` | Custom `pgg-media://` protocol |
| Menus / shortcuts | Browser default | Native | macOS app menu, Cmd+N / Cmd+O |
| Notifications | None | None | macOS Notification Center on victory |

`electron/main.cjs` also broadcasts `theme:update`, but the renderer does not
subscribe to it: the UI is always the dark blue theme.

## Development Commands

```bash
npm run dev                 # Generate manifest, then Vite dev server (port 5173)
npm run build               # Generate manifest, then production build to dist/
npm run preview             # Serve dist/

npm run generate-manifest            # Extract EXIF from public/photos/
npm run generate-manifest -- --force # Ignore the cache
GEOCODE_LANGUAGE=fr npm run generate-manifest -- --force   # Other place-name language

npm run cap:sync            # Build web + sync to native
npm run cap:ios             # Build, sync, open Xcode
npm run cap:android         # Build, sync, open Android Studio
npm run cap:run:ios         # Build, sync, run on device/simulator
npm run cap:run:android

npm run electron:dev        # Vite + Electron with hot reload (VITE_DEV_SERVER_URL)
npm run electron:start      # Electron against the existing dist/
npm run dist:mac            # Package .dmg + .zip for arm64 and x64 (separate builds; run on macOS)
npm run dist:mac:unsigned   # Same, without a signing identity
npm run dist:mac:notarize   # Sign + notarize (APPLE_TEAM_ID etc.)
npm run dist:mac:arm64      # Apple Silicon only
npm run dist:mac:x64        # Intel only
```

There is no test suite or lint script; `npm run build` is the check.

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/stores/gameStore.js` | All game state and actions |
| `src/utils/dateUtils.js` | Phase transitions, answer choices, formatting |
| `src/data/game-config.json` | Rules and settings |
| `src/components/GuessingInterface.jsx` | Selector orchestration |
| `src/services/exifService.js` | EXIF extraction and geocoding on the device |
| `src/utils/geocoding.js` | Nominatim request + address parsing (web and apps) |
| `scripts/generate-manifest.js` | Web photo manifest generator |
| `capacitor.config.ts` | Mobile app configuration |
| `electron/main.cjs` | Electron main process (window, IPC, `pgg-media://`) |
| `electron/preload.cjs` | contextBridge exposing `window.electronAPI` |
| `electron/menu.cjs` | macOS application menu |
| `build/entitlements.mac.plist` | Hardened-runtime entitlements |

## Common Tasks

### Changing the rules

Edit `src/data/game-config.json`: `game.winningScore`, `game.perfectScore`,
`game.minimumPhotosRequired`, `game.maxPhotosToLoad`, `scoring.*.points`,
`optionGeneration.{yearOptions,yearRange,locationOptions}`. `constants.js`
exposes them as `GAME_CONFIG`, and every on-screen number (the setup rules, the
question hints, "Perfect!") reads from there. Never add rule literals to
components. `modes`, `turnRules`, `victoryCondition` and `exifFields` describe
the rules but are not read by the code.

### Changing geocoding

`game-config.json` → `geocoding`: `baseUrl`, `zoom`, `language`,
`rateLimitMs` (Nominatim allows one request per second), and
`addressPriority` (which address fields count as state and city). Both the
generator and the apps read it through `src/utils/geocoding.js`, so keep that
module free of browser- or Node-only imports.

### Adding a game mode

1. Add the mode and its phases to `constants.js` / `game-config.json`
2. Add selectors in `components/`
3. Render them in `GuessingInterface.jsx`
4. Add phase logic to `dateUtils.js`
5. Handle the mode in the store

## Important Notes

### Photo privacy

- `public/photos/manifest.json` holds each photo's date and place names, and
  is copied into `dist/` with the photos (which keep their own EXIF GPS). A
  deployed web build therefore publishes all of it.
- GPS positions are deliberately kept **out** of the manifest. They live in
  `.manifest-cache.json` at the project root, outside `public/`. (It used to
  sit in `public/photos/`, which copied every coordinate into `dist/`; the
  generator moves an old cache on its next run.)
- Photos, the manifest and the cache are all gitignored and must never be
  committed.

### Capacitor native projects

The `ios/` and `android/` directories are generated Capacitor projects. After
changing `capacitor.config.ts`, run `npx cap sync`. The iOS project's
`DEVELOPMENT_TEAM` is the placeholder `YOUR_APPLE_TEAM_ID`; never commit a real
team ID.

### Animation performance

Framer Motion animations run on the main thread. Animate `transform` and
`opacity` only, and keep particle counts low on mobile.

## Debugging

- **State:** `localStorage.getItem('photo-date-game-storage')` in the browser
  console (names and mode only).
- **iOS:** Safari → Develop → Device → Inspect
- **Android:** Chrome → `chrome://inspect` → Device

| Issue | Solution |
|-------|----------|
| Photos not loading (web) | Check `public/photos/manifest.json` exists; run `npm run generate-manifest` |
| Photo has no date/place | Check its EXIF data; screenshots and edited copies often lose it |
| Place names in the wrong language | Change `geocoding.language`, then `generate-manifest -- --force` |
| Geocoding failing | Network, or Nominatim rate limiting |
| Sounds not playing | Browsers need a user interaction first |

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - How the pieces fit together
- [CONTRIBUTING.md](CONTRIBUTING.md) - Setup, checks, publishing
- [docs/MACOS_DISTRIBUTION.md](docs/MACOS_DISTRIBUTION.md) - macOS build, signing, notarization

## Gotchas

- This project is published to GitHub (`geoffmyers/photo-guessing-game`) as a
  snapshot. Each publish appends one commit to the public history. Publish with:
  `scripts/publish-subtree-snapshot.sh --prefix=reactjs-projects/photo-guessing-game --publish`
  Exclusions, metadata and the icon are declared in `scripts/subtree-publish.json`.
- **NEVER run `git subtree push` or `git subtree split`.** A raw split has twice
  pushed the entire mono-repo history — and the secrets in it — to a public remote
  (see `docs/security/2026-02-04-` and `2026-05-12-credential-leak-audit.md`). A
  pre-push hook now refuses it.
- The README screenshots come from
  `scripts/public-repo-docs/static-site-screenshots/photo-guessing-game.sh`
  (CC0 photos, seeded shuffle), then `select.py photo-guessing-game`.
