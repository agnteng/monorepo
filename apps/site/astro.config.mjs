// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

// Event data and talks live in content/ at the repository root.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const dist = fileURLToPath(new URL('./dist/', import.meta.url));
/** @type {Record<string, string>} */
const types = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.avif': 'image/avif', '.svg': 'image/svg+xml' };

// Under `astro dev`, serve the search index (and the images its results point
// at) from the last build (`pnpm build`), so search works while developing; it
// isn't regenerated on edits.
const pagefindInDev = {
  name: 'pagefind-in-dev',
  configureServer(/** @type {any} */ server) {
    for (const prefix of ['pagefind', '_astro']) {
      const root = join(dist, prefix);
      server.middlewares.use(`/${prefix}/`, (/** @type {any} */ req, /** @type {any} */ res, /** @type {() => void} */ next) => {
        let file;
        try { file = normalize(join(root, decodeURIComponent((req.url ?? '').split('?')[0]))); } catch { return next(); }
        if (!file.startsWith(root + '/') || !statSync(file, { throwIfNoEntry: false })?.isFile()) return next();
        res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
        res.end(readFileSync(file));
      });
    }
  },
};

export default defineConfig({
  site: 'https://agnteng.com',
  // React only for the brand's dither (DuotoneField); everything else is static.
  integrations: [react()],
  // Logos, speaker photos and event photos are shared with the branding app.
  publicDir: '../branding/public',
  vite: {
    plugins: [tailwindcss(), pagefindInDev],
    resolve: { alias: { '@content': `${repoRoot}content` }, dedupe: ['react', 'react-dom'] },
  },
  server: { host: '127.0.0.1', port: 4330 },
});
