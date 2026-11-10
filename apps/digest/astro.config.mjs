import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_DIGEST_URL ?? 'https://digest.example.test';

export default defineConfig({
  build: {
    format: 'directory',
  },
  compressHTML: true,
  output: 'static',
  scopedStyleStrategy: 'where',
  site,
});
