# Semantic HTML guide

## Native-first mapping

| Intent                          | Start with                                    | Avoid as a substitute                            |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| Execute an in-page action       | `<button type="button">`                      | clickable `<div>` or link                        |
| Navigate to a URL               | `<a href>`                                    | button plus `location` assignment                |
| Submit/reset a form             | `<button type="submit/reset">`                | click handler that bypasses form behavior        |
| Reveal optional content         | `<details><summary>`                          | custom disclosure unless requirements exceed it  |
| Confirm a blocking decision     | `<dialog>` with a real form/button            | generic overlay with hidden page still focusable |
| Choose one option               | radio group or `<select>`                     | menu; menus are application commands             |
| Choose zero or more             | checkboxes                                    | pressed buttons without a documented reason      |
| Tabular relationships           | `<table>` with headers/caption                | visual CSS grid                                  |
| Primary navigation              | `<nav aria-label>` containing links           | toolbar/menu roles                               |
| Status that should be announced | persistent status region updated deliberately | changing `aria-live` subtree wholesale           |
| Article-like content            | `<article>` with a heading                    | anonymous nested containers                      |

## ARIA rules

ARIA can name, describe, or express a state the host language cannot. It does not add keyboard
behavior or form semantics. Never add a role that duplicates or weakens the native role. For custom
widgets, implement the complete authoring pattern: role, states, relationships, focus model, keys,
disabled behavior, and announcements.

Names should be visible whenever possible. `aria-label` is a last-mile label for controls whose
purpose is visually evident in another way; it is not a replacement for clear visible text. Error
messages use stable IDs and descriptions. Do not put interactive controls inside a label.

## Landmarks and headings

Each page has one `<main>`, a discoverable skip link, and labelled repeated landmarks. Heading
levels describe document structure; CSS chooses their size. A component should not hard-code a page
heading level when the consumer knows the surrounding outline—accept a slot or render a neutral
container.

## Dynamic content

Move focus only when the interaction opens a new focus context (for example a modal dialog) or the
user would otherwise lose their place. Append concise status text rather than re-rendering an entire
live region. Restore focus to the invoking control when a temporary surface closes, unless that
control was removed.
