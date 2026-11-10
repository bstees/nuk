# Accessibility review checklist

Target: WCAG 2.2 AA. This checklist supplements, and does not replace, testing with disabled users
and representative assistive technology.

## Semantics and names

- [ ] The native element/landmark matches the intended action or content.
- [ ] Every interactive control has a stable, accurate accessible name and visible instruction.
- [ ] Labels, help, requirements, units, and errors are programmatically associated.
- [ ] ARIA roles/states are necessary, valid, and synchronized; no native semantic is overwritten.
- [ ] Headings, lists, tables/captions/headers, regions, and reading order remain meaningful without
      CSS.

## Keyboard and focus

- [ ] Every action works with keyboard alone using the expected native/APG keys.
- [ ] Tab order follows reading order; composite widgets use one documented roving/active focus
      model.
- [ ] Focus is visible in default, themed, dark, and forced-colors modes and is not obscured.
- [ ] Opening, closing, adding, removing, disabling, and validation do not lose focus.
- [ ] Modal focus is contained while open and restored to a sensible target when closed.
- [ ] No shortcut uses an unmodified printable character without a way to disable/remap it.

## Perception and motion

- [ ] Text and essential graphics meet AA contrast; state is not expressed by color alone.
- [ ] Content reflows at 320 CSS pixels and remains usable at 400% zoom without two-dimensional
      scrolling except for genuinely two-dimensional content such as data tables.
- [ ] Text spacing overrides do not clip, overlap, or hide content.
- [ ] Target size meets WCAG 2.2 requirements or a documented exception.
- [ ] Motion is nonessential and disabled/reduced under `prefers-reduced-motion`.
- [ ] Forced-colors mode retains boundaries, selected/disabled state, icons, and focus indication.

## Forms, errors, and status

- [ ] Required/invalid state appears in text and programmatically before submission when known.
- [ ] Errors identify the field and correction; submission focus moves to an error summary or first
      invalid field only when helpful.
- [ ] Native autofill, input purpose, keyboard type, and form submission/reset behavior are intact.
- [ ] Async/progress/status updates use a deliberate, concise live-region strategy.

## Tests and manual evidence

- [ ] Unit tests cover state reflection, form behavior, events, and accessible relationships.
- [ ] Interaction tests cover pointer, keyboard, escape, outside-dismissal, and focus return.
- [ ] Axe reports no serious/critical issues in representative stories/pages.
- [ ] Browser tests cover light/dark, narrow/wide containers, 200% zoom, reduced motion, and high
      contrast where the runner supports it.
- [ ] Manual passes include keyboard-only, VoiceOver + Safari on macOS/iOS, and NVDA + Firefox or
      Chrome on Windows before a stable release claim.
- [ ] Known exceptions have an owner, rationale, user impact, and review date.
