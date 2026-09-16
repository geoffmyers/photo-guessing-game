import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base ensures dist/index.html loads its assets via relative paths,
// which is required for Electron's `loadFile(...)` in the production app.
// Capacitor's WebView and the Vite dev preview server both handle './' correctly.
export default defineConfig({
  base: './',
  plugins: [react()],
})
