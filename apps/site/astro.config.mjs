// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// Event data and talks live in content/ at the repository root.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  site: 'https://agnteng.com',
  // React only for the brand's dither (DuotoneField); everything else is static.
  integrations: [react()],
  // Logos, speaker photos and event photos are shared with the branding app.
  publicDir: '../branding/public',
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '@content': `${repoRoot}content` }, dedupe: ['react', 'react-dom'] },
  },
  server: { host: '127.0.0.1', port: 4330 },
});
