/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The app never makes a network call carrying user data — the production
// build can afford connect-src 'none' as a hard guarantee of that. Dev mode
// keeps connect-src 'self', which Vite's HMR websocket (same-origin) needs.
function strictProductionCsp(): Plugin {
  return {
    name: 'strict-production-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace("connect-src 'self';", "connect-src 'none';");
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), strictProductionCsp()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
