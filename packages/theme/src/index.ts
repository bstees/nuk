export const themeNames = ['light', 'dark'] as const;
export type ThemeName = (typeof themeNames)[number];

/** Apply an explicit theme or remove the override to follow the operating-system preference. */
export function setTheme(root: HTMLElement, theme: ThemeName | 'system'): void {
  if (theme === 'system') {
    root.removeAttribute('data-nuk-theme');
    return;
  }

  root.dataset.nukTheme = theme;
}
