import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://bmstechnik.pl',
  output: 'static',
  trailingSlash: 'always',
  publicDir: './generated/public',
  build: { format: 'directory' },
});
