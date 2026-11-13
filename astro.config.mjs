// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // React islands for interactive components; static .astro for everything else.
  integrations: [react()],

  // Output stays static (everything prerendered) except routes that opt out
  // with `export const prerender = false` — currently just the live Luma
  // audience endpoint and the deck page that polls it. Standalone mode means
  // the built server also serves the prerendered static assets itself, so
  // one node process is the whole app; no nginx needed in front of it.
  adapter: node({ mode: 'standalone' }),

  // Tailwind v4 is wired in as a Vite plugin (no separate config file needed).
  vite: {
    plugins: [tailwindcss()],
  },

  // Dev server only. host:true binds all interfaces, and allowedHosts:true
  // lets Vite accept a proxied Host header (it otherwise blocks any host that
  // isn't localhost). Neither applies to the production build.
  server: {
    host: true,
    port: 4321,
    allowedHosts: true,
  },
});
