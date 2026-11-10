# CSS and theming

The library distinguishes structure from taste.

- `@nuk-ui/elements/styles.css` provides layout, visibility, focus geometry, and component
  affordances required to understand and operate components.
- `@nuk-ui/tokens/css` defines named scales and semantic custom properties with no component
  selectors.
- `@nuk-ui/theme/css` applies nuk's visual defaults through semantic properties and stable parts.

Consumers can use elements without the theme or replace the token/theme packages. Avoid selectors
that escape a component to restyle arbitrary application markup.

Element and event prefixes are runtime-configurable; token names are intentionally not. Keeping
`--nuk-*` stable lets browsers cache one static stylesheet and lets branded themes map semantic
properties without generating CSS at runtime. For the small global host fallback sheet, call
`createStructuralStyles('acme')` or author equivalent selectors. Shadow-root structural styles work
under every registered prefix.

## Color modes

The theme declares `color-scheme: light dark`. A dark system preference applies when no explicit
override exists. Set `data-nuk-theme="light"` or `data-nuk-theme="dark"` on the document or a
subtree to override it. Theme selectors keep the explicit value stronger than the preference.

Forced-colors rules use system colors and preserve visible focus/boundaries. Do not set
`forced-color-adjust: none` except for a tested, meaning-bearing swatch that cannot be represented
by system colors.

## Container behavior

Every component is a container or participates in intrinsic layout where local width changes its
composition. Storybook width controls set the **parent container**, not a fake phone/desktop
viewport. A component cannot assume where it is placed.

## Units

Use `rem` for global scales and minimum target sizes, `em` for icon/control proportions, percentages
and intrinsic units for layout, and `cqi` only as a progressive enhancement inside a named
container. A one-pixel border is the documented exception for a CSS-pixel hairline. Raster output
dimensions may use pixels because they address an image grid, not user-scalable layout.
