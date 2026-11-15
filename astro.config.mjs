import { rm } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://selinlee.github.io',
  base: '/ai-moe-atlas',
  trailingSlash: 'always',
  output: 'static',
  integrations: [{
    name: 'exclude-archived-whale-model',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        await rm(new URL('models/deep-whale-maid/', dir), { recursive: true, force: true });
      },
    },
  }],
});
