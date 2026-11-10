# Architecture overview

The repository has three deliberately separate trust and delivery planes.

1. **Authored library:** tokens, structural custom elements, React adapters, and optional theme CSS.
2. **Review applications:** Storybook and the static Signal / Interface digest consume packages but
   do not publish them.
3. **Untrusted inputs:** component-generation requests and remote feeds enter constrained staging
   areas. Automation can create candidates or draft issues; only a human can promote or approve.

## Runtime graph

```text
@nuk-ui/tokens ────────┐
                            ├── @nuk-ui/theme (optional CSS)
@nuk-ui/elements ──────┼── @nuk-ui/react
             │              └── Storybook
             └───────────────── plain HTML consumers

@nuk-ui/editorial ──────── Signal / Interface (static Astro output)

normalized spec ── Forge candidate ── static/conformance checks ── HUMAN APPROVAL ── package source
curated feeds ──── draft issue ───── citation/quote checks ─────── HUMAN APPROVAL ── main branch
```

The default custom-element prefix is `nuk-`. `defineElements({ prefix: 'acme' })` validates a
consumer prefix, registers fresh subclasses as `acme-*`, returns the exact tag map, and derives
matching public event names. Package scope and element prefix are related branding choices, not a
security boundary. CSS properties remain `--nuk-*` so a theme is static, cacheable, and does not
depend on registration order; companies can map those semantic properties in their theme.

## Why autonomous custom elements

Autonomous elements are portable across HTML and frameworks and can encapsulate behavior without a
runtime dependency. They are not used reflexively: native `<a>`, `<button>`, `<details>`,
`<dialog>`, forms, tables, and landmarks remain the semantic center. Shadow DOM is used only when it
protects a control implementation without hiding necessary relationships. Display/layout components
enhance light DOM.

React adapters expose typed props, refs, and callback names while delegating to the same behavior.
React is a peer dependency so the web-component path remains framework-free.

## CSS layering

Consumers opt into packages in this order:

```css
@import '@nuk-ui/tokens/css';
@import '@nuk-ui/elements/styles.css';
@import '@nuk-ui/theme/default.css';
```

Layers are ordered `nuk.reset`, `nuk.tokens`, `nuk.structure`, `nuk.theme`, then consumer layers.
Structural styles are enough to operate and understand a component. Theme styles add color, depth,
and typographic personality. Custom properties cross shadow boundaries; stable shadow parts are
documented rather than accidental.

## Static applications

Storybook builds to static files and uses only local component assets. The digest uses Astro static
generation: issue JSON, archive/topic pages, RSS, sitemap, and metadata are all emitted at build
time. There is no production application server or database in v1.

## Reproducibility

- Exact package versions and one pnpm lockfile describe dependencies.
- Fixture timestamps and generated IDs are explicit; tests never depend on the current network.
- Build outputs (`dist`, `storybook-static`) are ignored. Reviewed generated **source** records are
  tracked and carry their schema/prompt/source versions.
- SBOM and provenance reports are CI artifacts, not hand-edited source.
