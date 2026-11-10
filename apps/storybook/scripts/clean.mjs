import { rm } from 'node:fs/promises';

await rm(new URL('../storybook-static', import.meta.url), { force: true, recursive: true });
