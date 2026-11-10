# `@nuk-ui/tokens`

Primitive design values shared by the optional theme and by consumers. The CSS entry point defines
only raw `--nuk-*` values; it does not style elements or choose semantic colors.

```css
@import '@nuk-ui/tokens/css';

.example {
  gap: var(--nuk-space-3);
}
```

JavaScript and TypeScript can import the matching immutable `tokens` object. Measurements use `rem`
except for `--nuk-border-width`: its one CSS pixel value is intentional for crisp control edges and
still scales with device pixel density.
