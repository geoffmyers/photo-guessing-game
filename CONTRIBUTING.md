# Contributing to Photo Guessing Game

Thanks for taking an interest. This project is developed inside a private
mono repo and published here as a snapshot, which shapes a couple of the
rules below. Please read the last section before opening a PR.

## Getting set up

**Stack:** React, Vite and Tailwind CSS, with Capacitor for iOS and Android and
Electron for macOS. You need Node.js 22.12 or newer.

```bash
git clone https://github.com/geoffmyers/photo-guessing-game.git
cd photo-guessing-game
npm install
```

Put at least three photos with EXIF dates and GPS positions in
`public/photos/`, then run `npm run dev`. See the README for the phone and
desktop builds.

## Checks

There is no automated test suite yet. Before pushing:

- `npm run build` must succeed.
- Play a round of each mode you touched, in the browser and, if you changed
  platform code, on that platform.
- If you changed the rules, play a game through to the end, including a tie.
  The tie-breaker is where bugs have hidden before.

Tests for `src/stores/gameStore.js` and `src/utils/dateUtils.js` would be a
welcome contribution.

## Before you open a pull request

- Keep the change focused. One concern per PR is much easier to review.
- Match the surrounding style rather than introducing a new one. There is no
  separate style guide; the existing code is the guide.
- Put tunable values in `src/data/game-config.json`, not in code.
- Update the README if you change behaviour a user can see.
- Never commit photos, `manifest.json` or `.manifest-cache.json`. They hold
  your photos' dates and GPS positions, and `.gitignore` excludes them.
- Explain **why** in the commit message, not just what. The diff already says
  what changed.

## Reporting a bug

Open an issue with what you did, what you expected, and what happened instead.
Say which platform (browser, iOS, Android or macOS) and version, and include
the full error from the console rather than a summary of it.

## Security

Please do **not** open a public issue for a security problem. Report it
privately through GitHub's *Report a vulnerability* button on the Security tab.

## How this repo is published

This project lives in a private mono repo. Each publish adds **one commit** on
top of the history here, so the history grows with every release, but one
commit here can stand for many upstream changes. Two consequences:

- Pull requests are reviewed here and applied upstream, then arrive back in the
  next published commit, which credits your authorship in its message. The pull
  request is closed with a link to that commit rather than merged, because the
  next publish is built from the upstream tree and would undo a change made
  only here.
- Operator configuration (`*.tpl` and similar) is deliberately excluded from
  the snapshot. If a config file looks missing, look for the matching
  `.example` file instead.

## Licence

By contributing you agree that your contribution is licensed under the same
terms as this project. See [LICENSE.md](LICENSE.md).
