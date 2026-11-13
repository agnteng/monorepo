// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// Event data and talks live in content/ at the repository root.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  site: 'https://agnteng.com',
  // Speaker photos, event photos and logos are shared with the branding app.
  publicDir: '../branding/public',
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '@content': `${repoRoot}content` } },
  },
  server: { host: '127.0.0.1', port: 4330 },
});
