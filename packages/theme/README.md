# `@nuk-ui/theme`

Optional semantic color assignments for the structural components. Importing the theme also imports
the raw token CSS.

```css
@import '@nuk-ui/theme/css';
```

With no override, the theme follows `prefers-color-scheme`. Set `data-nuk-theme="light"` or
`data-nuk-theme="dark"` on an ancestor to override it; remove the attribute to return to the system
preference. Forced-colors users receive system color keywords instead of fixed palette values.

```ts
import { setTheme } from '@nuk-ui/theme';

setTheme(document.documentElement, 'dark');
setTheme(document.documentElement, 'system');
```
