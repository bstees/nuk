# Component authoring rules

## Start with meaning

Write the intended sentence without a component name: “submit this form,” “go to the account,”
“reveal optional details,” or “choose one shipping method.” Choose the native element that expresses
that sentence. A component can standardize labels, events, validation, and presentation; it must not
erase the native contract.

Use a custom element when behavior or cross-framework consistency is genuinely shared. Use a CSS
class or React-only composition when registering an element would add no platform value.

## Public API rules

- Register autonomous elements through the central registry. It defaults to `nuk-`, accepts a
  validated lowercase company prefix, and never registers an unprefixed name.
- Treat attributes as HTML: lowercase, serializable, and useful in static markup.
- Use properties for structured or live objects. Reflect a property only when its serialized state
  helps CSS, forms, accessibility, or debugging.
- Emit composed, bubbling custom events only for meaningful public state transitions. Component code
  supplies an event suffix (`change`, `open`); the base class produces `nuk-change` or the selected
  company-prefixed equivalent. Document `detail` and cancellation.
- Preserve normal `input` and `change` events when a native form control is the source.
- Support labels, descriptions, errors, disabled state, required state, and form reset before adding
  variants.
- React adapters translate callbacks and types; they do not add behavior unavailable to HTML.
- Every export is intentional. Internal helpers stay internal and can change without a Changeset.

## Implementation shape

Prefer one focused module per element plus shared utilities only after reuse is demonstrated. A
module should contain registration, observed attribute/property synchronization, event/focus logic,
and the minimum structural CSS it owns. Do not fetch, read storage, evaluate strings, inject remote
scripts, or create undocumented global listeners.

Native controls inside shadow DOM require extra care: accessible naming relationships must remain in
the same tree, `delegatesFocus` must not conceal focus, and a form-associated element must use
`ElementInternals` or document its fallback. Do not reproduce browser behavior incompletely merely
to hide a native element.

## Sizing and layout

- Use `rem` for user-scalable global dimensions and `em` for dimensions tied to component text.
- Use unitless line-height, logical properties, intrinsic keywords, `min()`, `max()`, `clamp()`,
  grid, and flex wrapping.
- Use container queries for internal layout changes. The component must work in an unknown parent;
  viewport breakpoints cannot answer that question.
- `1px` is allowed only for a visual hairline where one CSS pixel is the intended rendering unit.
  Focus indicators, hit targets, spacing, and layout must use scalable units.
- `:has()` and newer features need a usable baseline. Put optional polish inside `@supports` when
  absence would otherwise break meaning or operation.

## Definition of done

The component has API docs, semantic rationale, plain HTML and React examples, keyboard table,
screen-reader notes, forced-colors/reduced-motion rules, unit/interaction/axe coverage, a Storybook
story at multiple container widths, and a Changeset when the public API changed.
