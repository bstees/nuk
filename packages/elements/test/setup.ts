import { afterEach } from 'vitest';

afterEach(() => {
  document.body.replaceChildren();
  document.head.querySelectorAll('[data-test-style]').forEach((style) => style.remove());
});
