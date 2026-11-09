import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bmstechnik.pl',
  output: 'static',
  trailingSlash: 'always',
  publicDir: './generated/public',
  build: { format: 'directory' },
  // Keep preloads and CSS on the same fingerprinted font URLs, even for the
  // small Polish subset. Inlining would create a different preload resource.
  vite: { build: { assetsInlineLimit: 0 } },
});
