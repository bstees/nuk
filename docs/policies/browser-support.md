# Browser support and progressive enhancement policy

nuk targets WCAG 2.2 AA behavior in the current and previous stable major versions of Chrome, Edge,
Firefox, and Safari. Current iOS Safari and Android Chrome are supported through responsive design
and manual device spot checks; the project does not claim an automated physical-device lab. The
version window advances with browser releases rather than freezing a dated matrix.

## Platform baseline

Semantic HTML and native controls are the baseline. Custom elements may enhance that baseline, but
an unsupported enhancement must not erase content, labels, form instructions, links, or a viable
submission path. ARIA supplements native semantics only where HTML has no equivalent behavior.

Modern CSS is expected within the support window: cascade layers, nesting, custom properties,
logical properties, container queries, `:has()`, `color-scheme`, and media queries for user
preferences. Use `@supports` when absence would otherwise hide content or prevent interaction.
Layouts must remain coherent without a particular container-query enhancement and must not depend on
viewport breakpoints.

JavaScript must feature-detect optional platform APIs. Native `details`, `dialog`, and popover
behavior is preferred; fallback code must preserve focus order, dismissal, accessible names, and
keyboard operation. Form-associated custom elements must document and test their behavior when
`ElementInternals` support is absent.

## Test evidence

The browser workflow installs Playwright's Chromium, Firefox, and WebKit engines and runs the
repository browser suite. Required scenarios include:

- keyboard operation, focus entry/return, escape/dismissal, and no keyboard traps;
- axe checks on representative states, including validation and open overlays;
- explicit light/dark themes plus system preference;
- narrow and wide component containers, text zoom/reflow, and long localized-looking content;
- reduced motion and forced-colors/high-contrast adaptations where the engine exposes them;
- native HTML/custom-element usage and typed React adapter behavior.

Engine automation is evidence, not a screen-reader certification. Before a stable release, perform
manual smoke tests with at least VoiceOver/Safari and NVDA/Firefox or NVDA/Chrome, plus a mobile
screen reader for touch interaction when a component depends on gestures. Record browser, assistive
technology, component states, and any exceptions in the release review.

## Adding or removing support

A feature may enter the baseline when it is present throughout the target window or has a small,
tested fallback. A browser defect may receive a narrow workaround with a linked issue and removal
condition. Dropping a browser or API path is a documented breaking change and requires a changeset.

Do not describe a browser as supported solely because a build compiles. A support claim requires the
relevant automated suite to pass and unresolved manual exceptions to be called out.
