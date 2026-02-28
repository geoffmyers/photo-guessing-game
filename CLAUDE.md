---
title: CLAUDE.md - Photo Guessing Game
created: 2026-01-18
modified: 2026-01-18
description: Technical guidance for AI assistants working on this codebase.
tags: [react, claude]
---

# CLAUDE.md - Photo Guessing Game

Technical guidance for AI assistants working on this codebase.

## Project Overview

A two-player photo guessing game built with React + Vite, packaged for web and mobile (iOS/Android) via Capacitor. Players guess when (Date mode) or where (Location mode) photos were taken.

## Technology Stack

- **Frontend**: React 18.2, Vite 4.4, TypeScript 5.9
- **Styling**: Tailwind CSS 3.3 with custom animations
- **State**: Zustand 5.0 with localStorage/Capacitor Preferences persistence
- **Animations**: Framer Motion 12.25
- **Audio**: Web Audio API (no external audio files)
- **Mobile**: Capacitor 8.0 (iOS & Android)
- **EXIF**: exifr 7.1 for metadata extraction

## Architecture

### State Management

The app uses Zustand with a single store (`src/stores/gameStore.js`):

```
Game Phases: Setup → Playing → Feedback → Victory → NoPhotos
Game Modes: 'date' | 'location'
```

**Key state slices:**
- `players[]` - Player names and scores
- `photos[]` - Loaded photos with metadata
- `currentPhotoIndex` - Active photo
- `currentPlayerIndex` - Whose turn (0 or 1)
- `guessingPhase` - Current phase ('year'|'month'|'day' or 'country'|'state'|'city')
- `turnScore` - Points accumulated this turn

**Store persistence:**
- Web: localStorage via Zustand middleware
- Native: Capacitor Preferences API via custom storage adapter

### Component Structure

```
src/
├── App.jsx                 # Root with AnimatePresence for transitions
├── components/
│   ├── SetupScreen.jsx     # Player setup, mode selection, photo loading
│   ├── GameBoard.jsx       # Main game layout (3-column grid)
│   ├── PhotoDisplay.jsx    # Current photo with metadata badge
│   ├── PlayerPanel.jsx     # Player name, score, turn indicator
│   ├── GuessingInterface.jsx # Container for phase-specific selectors
│   ├── YearSelector.jsx    # 8-year button grid
│   ├── MonthSelector.jsx   # 12-month grid
│   ├── DaySelector.jsx     # Calendar-style 7x5 grid
│   ├── CountrySelector.jsx # Country options from photo pool
│   ├── StateSelector.jsx   # State options filtered by country
│   ├── CitySelector.jsx    # City options filtered by state
│   ├── FeedbackOverlay.jsx # Correct/incorrect modal with animations
│   ├── VictoryScreen.jsx   # Winner celebration
│   └── Confetti.jsx        # Particle animation system
├── hooks/
│   ├── useSoundEffects.js  # Web Audio API synthesis
│   └── useHaptics.js       # Capacitor haptic feedback
├── services/
│   ├── capacitorPhotoService.js  # Native photo picker
│   ├── exifService.js      # EXIF extraction + geocoding
│   ├── storageService.js   # Cross-platform storage
│   └── platform.js         # Platform detection
├── utils/
│   ├── dateUtils.js        # Game logic, scoring, date formatting
│   └── animations.js       # Framer Motion variants
└── data/
    └── constants.js        # Scoring rules, phase configs
```

### Game Flow

1. **Setup**: Enter names → Select mode → Load photos → Validate minimum (3 photos)
2. **Playing**: Show photo → Player guesses phase → Check answer
3. **Feedback**: Show result (1-2 sec) → Update score → Next phase or end turn
4. **Victory**: First to 10 points → Tie-breaker if needed → Show winner

### Scoring System

| Mode | Phase 1 | Phase 2 | Phase 3 | Perfect |
|------|---------|---------|---------|---------|
| Date | Year: 1pt | Month: +2pt | Day: +3pt | 6pts |
| Location | Country: 1pt | State: +2pt | City: +3pt | 6pts |

### Photo Requirements

**Date Mode:**
- EXIF `DateTimeOriginal` or `CreateDate` tag
- Parsed as `{ year, month, day }`

**Location Mode:**
- EXIF GPS coordinates (`GPSLatitude`, `GPSLongitude`)
- Reverse geocoded to `{ country, state, city }`

### Sound Effects (Web Audio API)

Sounds are synthesized, not loaded from files:

- **Correct**: Ascending arpeggio (C5→E5→G5)
- **Incorrect**: Descending tone with tremolo
- **Victory**: Fanfare chord progression
- **Button click**: Short blip

### Platform Differences

| Feature | Web | iOS/Android |
|---------|-----|-------------|
| Photo loading | File input + manifest | Capacitor Camera plugin |
| Storage | localStorage | Capacitor Preferences |
| Haptics | N/A | Capacitor Haptics |
| Photo display | URL or data URL | `Capacitor.convertFileSrc()` |

## Development Commands

```bash
# Development
npm run dev                 # Start Vite dev server (port 5173)
npm run build               # Production build to dist/
npm run preview             # Preview production build

# Photo manifest
npm run generate-manifest   # Extract EXIF from public/photos/
npm run generate-manifest -- --force  # Regenerate ignoring cache

# Mobile development
npm run cap:sync            # Build web + sync to native
npm run cap:ios             # Open Xcode
npm run cap:android         # Open Android Studio
npm run cap:run:ios         # Build + run on iOS device
npm run cap:run:android     # Build + run on Android device
```

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/stores/gameStore.js` | All game state and actions (435 lines) |
| `src/utils/dateUtils.js` | Scoring logic, phase transitions |
| `src/components/GuessingInterface.jsx` | Selector orchestration |
| `src/services/exifService.js` | EXIF extraction and geocoding |
| `capacitor.config.ts` | Mobile app configuration |
| `scripts/generate-manifest.js` | Photo metadata extraction script |

## Common Tasks

### Adding a new game mode

1. Add mode to `constants.js` with phases
2. Add selectors in `components/`
3. Update `GuessingInterface.jsx` to render new selectors
4. Add phase logic to `dateUtils.js`
5. Update store for new mode handling

### Modifying scoring

Edit `src/data/constants.js`:
```javascript
export const SCORING = {
  date: { year: 1, month: 2, day: 3 },
  location: { country: 1, state: 2, city: 3 }
};
```

### Adding sound effects

Edit `src/hooks/useSoundEffects.js`:
```javascript
const playNewSound = () => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  // Configure oscillator...
};
```

### Testing mobile builds

```bash
# iOS Simulator
npm run cap:ios
# In Xcode: Product → Run (Cmd+R)

# Android Emulator
npm run cap:android
# In Android Studio: Run → Run 'app'
```

## Important Notes

### Photo Manifest Privacy

The `public/photos/manifest.json` and `.manifest-cache.json` files contain GPS coordinates extracted from photos. These are gitignored and should never be committed or shared.

### Capacitor Native Projects

The `ios/` and `android/` directories contain generated native projects. After modifying:
- `capacitor.config.ts` - Run `npx cap sync`
- Native code - Edit directly in Xcode/Android Studio

### Tie-Breaker Logic

When Player 1 reaches the winning score, Player 2 gets one more turn if they haven't had equal turns. If Player 2 ties, the game continues in "sudden death" until someone leads after both have played.

### Animation Performance

Framer Motion animations run on the main thread. For complex animations:
- Use `transform` and `opacity` only
- Reduce particle counts on mobile
- Consider `will-change: transform` for heavy animations

## Debugging

### State inspection

```javascript
// In browser console
window.__ZUSTAND_DEVTOOLS__ // If devtools enabled
localStorage.getItem('photo-date-game-storage')
```

### Mobile debugging

- **iOS**: Safari → Develop → Device → Inspect
- **Android**: Chrome → `chrome://inspect` → Device

### Common issues

| Issue | Solution |
|-------|----------|
| Photos not loading | Check EXIF metadata exists |
| Geocoding failing | Check network, Nominatim rate limits |
| Sounds not playing | User interaction required first |
| State not persisting | Check storage quota, clear and retry |

## Documentation

- [docs/CAPACITOR_PLAN.md](docs/CAPACITOR_PLAN.md) - Detailed Capacitor implementation guide
- [docs/REACT_NATIVE_PLAN.md](docs/REACT_NATIVE_PLAN.md) - Alternative React Native strategy
