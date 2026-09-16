# Architecture

Photo Guessing Game is a single React app. The web version, the Capacitor
apps for iOS and Android, and the Electron app for macOS all run the same
build in `dist/`. They differ in how photos get in and where settings are
saved.

## The pieces

```
src/
├── main.jsx, App.jsx        entry point; setup screen or game board, by game phase
├── stores/gameStore.js      all game state and rules (Zustand)
├── components/              screens, one selector per question, overlays
├── utils/
│   ├── dateUtils.js         answer checking, points, question order, answer choices
│   ├── geocoding.js         Nominatim request and address reading
│   └── animations.js        Framer Motion variants
├── services/
│   ├── platform.js          web, Capacitor or Electron?
│   ├── capacitorPhotoService.js   the native photo picker (Capacitor or Electron)
│   ├── exifService.js       EXIF reading and geocoding on the device
│   └── storageService.js    one storage API over three back ends
├── hooks/                   synthesised sound, haptics
└── data/
    ├── game-config.json     the rules and settings
    └── constants.js         the config, shaped for the code
scripts/generate-manifest.js the web version's photo manifest
electron/                    macOS main process, preload bridge, menu
ios/, android/               Capacitor native projects
```

## Configuration

Rules and tunable values live in `src/data/game-config.json`, not in code:
the winning score, the points for each question and for a perfect turn, the
minimum number of photos, the number of answer choices and the year range,
the photo picker's limit, and the geocoding settings (service URL, zoom level,
language, request interval and which address fields count as a state or a
city). `constants.js` reads it into
`GAME_CONFIG`. The manifest generator reads the same file.

Some keys (`modes`, `turnRules`, `victoryCondition`, `exifFields`) describe
the rules rather than drive them.

## From photo to question

Every platform ends up with the same photo record:

```js
{ id, url or webPath, date: { year, month, day } | null,
  location: { country, state, city } | null }
```

How it gets there depends on the platform.

**Web.** The browser cannot read a folder, so the photos are prepared before
the app starts. `npm run dev` and `npm run build` first run
`scripts/generate-manifest.js`, which:

1. reads the EXIF data of every image in `public/photos/` with exifr;
2. sends each GPS position to Nominatim, waiting `rateLimitMs` between
   requests, and keeps the country, state and city;
3. writes `public/photos/manifest.json` with each photo's date and place.

The manifest leaves out the GPS positions, because everything in `public/` is
copied into the build. The positions stay in `.manifest-cache.json` at the
project root, together with each file's modification time, so a later run
only processes new or changed photos. `PhotoLoader` fetches the manifest when
the setup screen opens.

**iOS and Android.** `capacitorPhotoService` asks for photo library access and
opens the system picker (`Camera.pickImages`). `exifService` then reads each
picked photo's EXIF data in the web view and geocodes its GPS position,
waiting between requests in the same way. Photos are shown through
`Capacitor.convertFileSrc`.

**macOS.** The renderer calls `window.electronAPI.photos.pick`, which the
preload script forwards over IPC to `dialog.showOpenDialog` in the main
process. Picked files come back as `pgg-media://` URLs, a custom scheme that
the main process serves from disk, so the page (which has no Node access) can
display and read any file the user picked. EXIF reading and geocoding then
happen in the renderer, as on the phones.

Both sides name places through `src/utils/geocoding.js`, a plain ES module that
Node and the browser can both import, so a photo gets the same state and city
whichever way it came in.

## The game store

`gameStore.js` is one Zustand store holding the phase (`setup`, `playing`,
`feedback`, `victory`, `no_photos`), the players, the shuffled photos, the
current question and the tie-breaker state. Components read from it and call
its actions. The rules are in the actions.

- `loadPhotos` keeps the library and collects every distinct country, state
  and city in it. Those lists supply the wrong answers, which is why a
  question can offer places from other countries.
- `startGame` keeps the photos the mode can use (a date, or a country),
  shuffles them and resets the scores.
- `submitGuess` checks the answer against the photo. A correct answer adds the
  question's points to the turn and moves to the next question the photo can
  answer (`getNextAnswerablePhase` skips a missing state or city). The last
  correct answer, or any wrong one, adds the turn's points to the player's
  score and decides whether the game is over.
- `endTurn` moves to the next photo and player, or to `no_photos` when the
  photos run out.

### Ending the game

`determineVictory` runs at the end of each turn. Player 1 always plays first,
so turns are even after each of Player 2's turns.

- Player 1 reaches the winning score: nobody has won yet. The store records
  Player 1 as `pendingWinner` and sets `isTieBreaker`.
- Player 2's turn ends while `isTieBreaker` is set: Player 2 wins if ahead,
  Player 1 wins if Player 2 is behind, and a tie clears both flags so play goes
  on. The same rule applies after Player 1's next turn.
- Player 2 reaches the winning score while Player 1 has not: Player 2 wins.

### What is saved

The store uses Zustand's `persist` middleware over `storageService`, which
writes to `localStorage` on the web, Capacitor Preferences on the phones, and a
JSON file in the app's user-data folder on macOS (through IPC). Only the player
names and the mode are saved. Photos are not (a native photo's file URI does
not outlive the session), so a game in progress cannot be resumed and the app
always reopens at the setup screen.

## Platform extras

- **Sound.** `useSoundEffects` builds every sound from Web Audio oscillators.
- **Haptics.** `useHaptics` calls Capacitor Haptics on the phones. On the web
  it does nothing, and on macOS the IPC handlers are placeholders.
- **macOS.** `electron/menu.cjs` builds the app menu. **New Game** (⌘N) and
  **Select Photos…** (⌘O) reach the renderer as IPC messages, which `App.jsx`
  and `PhotoLoader` handle. `VictoryScreen` posts a system notification through
  the main process. The window uses the hidden-inset title bar with vibrancy,
  and links open in the default browser.

## Building and packaging

- `vite build` bundles the app into `dist/`.
- `npx cap sync` copies `dist/` into the native projects, whose app ID and
  colours come from `capacitor.config.ts`.
- electron-builder packages `dist/` and `electron/` for macOS, using the
  settings under `build` in `package.json` and the icon and entitlements in
  `build/`. See [docs/MACOS_DISTRIBUTION.md](docs/MACOS_DISTRIBUTION.md).
