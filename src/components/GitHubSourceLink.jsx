const REPO_URL = 'https://github.com/geoffmyers/photo-guessing-game';

// Octicons "mark-github" (MIT) — inlined so no external request or CSP change
// is needed to render it.
const GitHubIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    aria-hidden="true"
    focusable="false"
    fill="currentColor"
  >
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
);

/**
 * Persistent "View source on GitHub" footer, present on every screen (setup,
 * game board, and the overlays on top of it). In Electron, target="_blank"
 * already routes through main.cjs's setWindowOpenHandler, which hands
 * http(s) URLs to shell.openExternal instead of opening them in the app
 * window — so this link opens the system browser there too.
 */
const GitHubSourceLink = () => (
  <a
    href={REPO_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-2 right-2 z-[60] inline-flex items-center gap-1.5
               rounded-full bg-black/40 backdrop-blur-sm px-3 py-1.5
               text-xs font-medium text-white/70 hover:text-white
               hover:bg-black/60 transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
  >
    <GitHubIcon />
    <span>View source on GitHub</span>
  </a>
);

export default GitHubSourceLink;
