# Component reference

One entry per custom element in `@nuk-ui/elements` 0.1 (25 elements). Each entry lists the public
API, keyboard behavior, styling hooks, and what assistive technology is told. Tag names below use
the default `nuk-` prefix; a configured prefix changes the tag and the event prefix together
(`acme-button` emits `acme-press`).

Conventions that hold for every element:

- **Events** bubble, are cancelable and composed, and carry their data in `event.detail`. The React
  adapters expose them as `on…` props (`nuk-press` → `onPress`).
- **Parts** are styled from outside with `::part()`. **Tokens** are `--nuk-*` custom properties,
  which inherit through shadow roots. Every element has a system-color fallback, so it works with no
  theme loaded.
- **`label`** sets the accessible name on the inner native control when visible text is not enough.
- All elements render in an open shadow root that is attached by script. Until the script runs,
  slotted content shows as plain light DOM. See “Known limits” at the end.
- Screen-reader notes describe the roles, names and states the element exposes. They are not a
  substitute for testing with a screen reader; that manual check is still outstanding.

## Actions

### `nuk-button`

A native `<button>` in a shadow root. Form-associated: it can submit or reset its form.

| Kind      | Name                                                                                                                                                                                                                                       | Notes                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Attribute | `variant`                                                                                                                                                                                                                                  | `secondary` or `quiet`. Default is the filled accent button.          |
| Attribute | `type`                                                                                                                                                                                                                                     | `button` (default), `submit` or `reset`.                              |
| Attribute | `disabled`                                                                                                                                                                                                                                 | Boolean. Also follows a disabled `<fieldset>`.                        |
| Attribute | `name`, `value`                                                                                                                                                                                                                            | Submitted with the form when `type="submit"`.                         |
| Attribute | `formnovalidate`                                                                                                                                                                                                                           | Skips constraint validation on submit.                                |
| Attribute | `label`                                                                                                                                                                                                                                    | `aria-label` for icon-only buttons.                                   |
| Property  | `disabled`, `type`, `value`, `form`                                                                                                                                                                                                        | Reflect the attributes; `form` is read-only.                          |
| Method    | `focus()`                                                                                                                                                                                                                                  | Focuses the inner button.                                             |
| Event     | `nuk-press`                                                                                                                                                                                                                                | `detail.source` is `keyboard` or `pointer`. Not fired while disabled. |
| Slot      | default                                                                                                                                                                                                                                    | Button content.                                                       |
| Part      | `button`                                                                                                                                                                                                                                   | The native button.                                                    |
| Tokens    | `--nuk-color-accent`, `--nuk-color-accent-hover`, `--nuk-color-on-accent`, `--nuk-color-accent-text` (quiet), `--nuk-color-surface`, `--nuk-color-border`, `--nuk-color-text`, `--nuk-radius-sm`, `--nuk-color-focus`, `--nuk-focus-width` |                                                                       |

**Keyboard:** Tab focuses it; Enter and Space activate it. **Screen readers:** announced as a button
with its text or `label`; disabled state is conveyed.

### `nuk-link`

A native `<a>` in a shadow root.

| Kind      | Name                                                                                                                 | Notes                        |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Attribute | `href`, `target`, `rel`, `download`, `hreflang`                                                                      | Copied to the inner anchor.  |
| Attribute | `label`                                                                                                              | `aria-label` for the anchor. |
| Property  | `href`                                                                                                               | Reflects the attribute.      |
| Method    | `focus()`                                                                                                            | Focuses the inner anchor.    |
| Slot      | default                                                                                                              | Link text.                   |
| Part      | `link`                                                                                                               | The native anchor.           |
| Tokens    | `--nuk-color-accent-text` (falls back to `--nuk-color-accent`), `--nuk-color-accent-text-hover`, `--nuk-color-focus` |                              |

**Keyboard:** Tab focuses it; Enter follows it. **Screen readers:** announced as a link. Without
`href` it is not a link, as with a bare `<a>`. **Limit:** before the script runs there is no anchor,
so the link cannot be followed. Use a plain `<a>` where navigation must work without JavaScript.

## Form controls

`nuk-text-field`, `nuk-textarea`, `nuk-select`, `nuk-checkbox`, `nuk-radio` and `nuk-switch` are
form-associated. They submit under `name`, reset with the form, restore state, and take part in
constraint validation.

Shared API:

| Kind      | Name                                                                                                                       | Notes                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Attribute | `name`, `value`, `disabled`, `required`, `label`                                                                           | `label` names the control when it is not inside a `nuk-field`.            |
| Attribute | `invalid`                                                                                                                  | Set by the element after validation fails; style with `:host([invalid])`. |
| Property  | `form`, `validity`, `validationMessage`, `willValidate`                                                                    | Read-only, as on native controls.                                         |
| Method    | `focus()`, `checkValidity()`, `reportValidity()`                                                                           |                                                                           |
| Part      | `control`                                                                                                                  | The native `<input>`, `<textarea>` or `<select>`.                         |
| Tokens    | `--nuk-control-bg`, `--nuk-color-border`, `--nuk-color-text`, `--nuk-color-danger`, `--nuk-color-focus`, `--nuk-radius-sm` |                                                                           |

**Screen readers (all):** the native control is exposed, so role, value, required and invalid states
come from the platform. `aria-invalid` is set when validation fails and the field's help and error
text are linked with `aria-describedby`.

### `nuk-text-field`

Extra attributes: `type`, `placeholder`, `autocomplete`, `inputmode`, `pattern`, `min`, `max`,
`step`, `minlength`, `maxlength`, `readonly`. Property `readOnly`. Events: `nuk-input` on each edit
and `nuk-change` on commit, both with `detail.value`. **Keyboard:** native text input.

### `nuk-textarea`

Extra attributes: `rows`, `placeholder`, `minlength`, `maxlength`, `readonly`. Events: `nuk-input`,
`nuk-change` with `detail.value`. **Keyboard:** native textarea; Enter inserts a line break.

### `nuk-select`

Author `<option>` elements as children; they are mirrored into the native select. Event:
`nuk-change` with `detail.value`. Extra parts: `select-wrap`, `indicator`. **Keyboard:** native
select: arrow keys change the value; Space, Enter or Alt+ArrowDown open the list, depending on the
platform.

### `nuk-checkbox`

| Kind      | Name                                    | Notes                              |
| --------- | --------------------------------------- | ---------------------------------- |
| Attribute | `checked`, `indeterminate`              | Boolean. `value` defaults to `on`. |
| Property  | `checked`, `indeterminate`              |                                    |
| Event     | `nuk-change`                            | `detail.checked`, `detail.value`.  |
| Slot      | default                                 | The visible label text.            |
| Parts     | `label`, `control`, `indicator`, `text` |                                    |

**Keyboard:** Space toggles. **Screen readers:** native checkbox named by the slotted text;
`aria-checked` on the host is `true`, `false` or `mixed`.

### `nuk-radio`

Same API and parts as `nuk-checkbox`, without `indeterminate`. Radios that share a `name` inside the
same form are one group. **Keyboard:** Tab enters the group; ArrowRight/ArrowDown and
ArrowLeft/ArrowUp move to the next or previous enabled radio, check it and fire `nuk-change`. Space
checks the focused radio. **Screen readers:** native radio named by the slotted text. Each radio
lives in its own shadow root, so wrap the group in a `<fieldset>` with a `<legend>` to give it a
group name; position ("2 of 3") may not be announced.

### `nuk-switch`

Same API and parts as `nuk-checkbox`; the inner input has `role="switch"`. **Keyboard:** Space
toggles. **Screen readers:** announced as a switch, on or off.

### `nuk-field`

Wraps one control with a label, help text and an error message.

| Kind      | Name                                                                  | Notes                                                     |
| --------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| Attribute | `required`                                                            | Shows the required marker and marks the control required. |
| Slot      | `label`, default (the control), `help`, `error`                       | Empty help and error rows are hidden.                     |
| Parts     | `field`, `label-row`, `label`, `required`, `control`, `help`, `error` |                                                           |

**Keyboard:** none of its own. **Screen readers:** the label names the slotted control; help and
error text are linked as its description; a non-empty error sets `aria-invalid`. The error row is a
polite live region, so a new error is announced without moving focus.

## Disclosure and tabs

### `nuk-disclosure`

A native `<details>`.

| Kind      | Name                                         | Notes          |
| --------- | -------------------------------------------- | -------------- |
| Attribute | `open`                                       | Boolean.       |
| Property  | `open`                                       |                |
| Event     | `nuk-toggle`                                 | `detail.open`. |
| Slot      | `summary` (defaults to “Details”), default   |                |
| Parts     | `details`, `summary`, `indicator`, `content` |                |

**Keyboard:** Enter or Space on the summary toggles it. **Screen readers:** native disclosure: the
summary is announced with its expanded or collapsed state. Find-in-page can open it in browsers that
support that for `<details>`.

### `nuk-tabs`, `nuk-tab`, `nuk-tab-panel`

Author tabs with `slot="tab"` and panels as default children, in matching order.

| Element         | Kind      | Name                          | Notes                                       |
| --------------- | --------- | ----------------------------- | ------------------------------------------- |
| `nuk-tabs`      | Attribute | `label`                       | Names the tab list. Defaults to “Sections”. |
| `nuk-tabs`      | Attribute | `orientation`                 | `horizontal` (default) or `vertical`.       |
| `nuk-tabs`      | Attribute | `active`                      | The `value` (or `id`) of the active tab.    |
| `nuk-tabs`      | Event     | `nuk-change`                  | `detail.index`, `detail.value`.             |
| `nuk-tabs`      | Parts     | `tablist`, `panels`           |                                             |
| `nuk-tab`       | Attribute | `active`, `disabled`, `value` |                                             |
| `nuk-tab`       | Part      | `tab`                         |                                             |
| `nuk-tab-panel` | Attribute | `active`                      | Inactive panels are `hidden`.               |
| `nuk-tab-panel` | Part      | `panel`                       |                                             |

**Keyboard:** Tab moves into the tab list onto the active tab, then on to the active panel.
ArrowRight/ArrowLeft (ArrowDown/ArrowUp when vertical) move focus between enabled tabs and wrap;
Home and End jump to the first and last. Enter or Space activates the focused tab. Disabled tabs are
skipped. **Screen readers:** `tablist` with a label and orientation; each tab has `role="tab"`,
`aria-selected` and `aria-controls`; each panel has `role="tabpanel"` and `aria-labelledby`. Roles
sit on the hosts so the ID references do not cross a shadow boundary.

## Overlays

### `nuk-dialog`

A native `<dialog>`.

| Kind      | Name                                            | Notes                                                           |
| --------- | ----------------------------------------------- | --------------------------------------------------------------- |
| Attribute | `modal`                                         | Opens with `showModal()` (focus trap, inert page, backdrop).    |
| Attribute | `dismissible`                                   | A click on the backdrop closes it with return value `backdrop`. |
| Attribute | `open`, `label`                                 |                                                                 |
| Property  | `open`, `returnValue`                           |                                                                 |
| Method    | `show()`, `showModal()`, `close(value)`         |                                                                 |
| Event     | `nuk-close`                                     | `detail.returnValue`.                                           |
| Slot      | `heading`, default, `footer`                    |                                                                 |
| Parts     | `dialog`, `surface`, `header`, `body`, `footer` |                                                                 |

**Keyboard:** Escape closes a modal dialog. Tab cycles within a modal dialog; focus returns to the
element that opened it when it closes (browser behavior). **Screen readers:** announced as a dialog
named by `label`; while modal, the rest of the page is inert. Give it a `label` when the heading
alone does not name it.

### `nuk-menu`, `nuk-menu-item`

A button that opens a menu of commands. Not for site navigation; use `nuk-nav` with links.

| Element         | Kind      | Name                                 | Notes                                                |
| --------------- | --------- | ------------------------------------ | ---------------------------------------------------- |
| `nuk-menu`      | Attribute | `label`                              | Names the trigger. Defaults to “Menu”.               |
| `nuk-menu`      | Attribute | `open`, `disabled`                   |                                                      |
| `nuk-menu`      | Method    | `show(index)`, `close(restoreFocus)` |                                                      |
| `nuk-menu`      | Event     | `nuk-select`                         | `detail.item`, `detail.value`. The menu then closes. |
| `nuk-menu`      | Event     | `nuk-toggle`                         | `detail.open`.                                       |
| `nuk-menu`      | Slot      | `trigger`, default                   |                                                      |
| `nuk-menu`      | Parts     | `trigger`, `popover`                 |                                                      |
| `nuk-menu-item` | Attribute | `value`, `disabled`                  |                                                      |
| `nuk-menu-item` | Part      | `item`                               |                                                      |

**Keyboard:** on the trigger, Enter, Space or ArrowDown open the menu on the first item and ArrowUp
opens it on the last. In the menu, ArrowDown/ArrowUp move and wrap, Home and End jump, a printable
character moves to the next item that starts with it, Enter or Space selects, Escape closes and
returns focus to the trigger, and Tab closes the menu and moves on. A pointer press outside closes
it. **Screen readers:** the trigger is a button with `aria-haspopup="menu"` and `aria-expanded`; the
popup has `role="menu"` and items have `role="menuitem"`. Items live in their own shadow roots, so
some screen readers may not announce the item count.

## Data display

### `nuk-alert` and `nuk-status`

| Kind      | Name                                                                                       | Notes                                                            |
| --------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Attribute | `severity`                                                                                 | `danger`, `success` or `warning`. Default uses the accent color. |
| Attribute | `label`                                                                                    | Optional accessible name.                                        |
| Slot      | default                                                                                    | The message.                                                     |
| Part      | `message`                                                                                  |                                                                  |
| Tokens    | `--nuk-color-danger`, `--nuk-color-success`, `--nuk-color-warning`, `--nuk-message-accent` |                                                                  |

**Keyboard:** none. **Screen readers:** `nuk-alert` has `role="alert"` and interrupts; use it for
errors that need attention now. `nuk-status` has `role="status"` and is announced politely, as a
whole, when its content changes. Severity is shown by color only, so say it in the text.

### `nuk-card`

| Kind      | Name                                  | Notes                            |
| --------- | ------------------------------------- | -------------------------------- |
| Attribute | `label`                               | Accessible name for the article. |
| Slot      | `heading`, default, `footer`          |                                  |
| Parts     | `article`, `header`, `body`, `footer` |                                  |

**Keyboard:** none; interactive content inside keeps its own behavior. **Screen readers:** an
`article`. Put a real heading in the `heading` slot.

### `nuk-table`

A scrollable region around an authored `<table>`.

| Kind      | Name       | Notes                                                     |
| --------- | ---------- | --------------------------------------------------------- |
| Attribute | `label`    | Names the region. Defaults to “Scrollable data table”.    |
| Slot      | default    | One semantic `<table>` with `<caption>` and `<th scope>`. |
| Part      | `scroller` |                                                           |

**Keyboard:** the region is in the tab order so it can be scrolled with the arrow keys when the
table is wider than its container. **Screen readers:** a labelled region containing a native table;
headers and captions come from the authored markup.

## Navigation

### `nuk-nav`

| Kind      | Name    | Notes                                                                      |
| --------- | ------- | -------------------------------------------------------------------------- |
| Attribute | `label` | Names the landmark. Required when a page has more than one navigation.     |
| Slot      | default | A `<ul>` or `<ol>` of links (list margin and padding are reset), or links. |
| Part      | `nav`   | The native `<nav>`.                                                        |

**Keyboard:** none of its own; the slotted links are in the tab order. **Screen readers:** a
navigation landmark with the given name. Mark the current link with `aria-current` in your own
markup.

### `nuk-breadcrumbs`

| Kind      | Name    | Notes                                                  |
| --------- | ------- | ------------------------------------------------------ |
| Attribute | `label` | Defaults to “Breadcrumb”.                              |
| Slot      | default | An `<ol>` of links; the last item is the current page. |
| Part      | `nav`   |                                                        |

**Keyboard:** none of its own. **Screen readers:** a navigation landmark named “Breadcrumb”. Put
`aria-current="page"` on the last item. Separators are yours to add in CSS so they are not read out.

## Layout

`nuk-stack`, `nuk-cluster` and `nuk-grid` have no roles, events or parts. They only arrange their
children, so reading order is always source order.

| Element       | Attributes                                                              | Tokens                               |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| `nuk-stack`   | `gap` (`small`, `large`), `align` (`start`, `center`, `end`, `stretch`) | `--nuk-layout-gap`                   |
| `nuk-cluster` | `gap` (`small`, `large`), `justify` (`between`, `center`, `end`)        | `--nuk-layout-gap`                   |
| `nuk-grid`    | `gap` (`small`, `large`), `min` (`small`, `large`)                      | `--nuk-layout-gap`, `--nuk-grid-min` |

**Keyboard and screen readers:** no effect.

## Known limits

- **No rendering before script.** Shadow roots are attached in the constructor. There is no
  declarative shadow DOM or server-rendered output yet, so landmarks, links and layout from these
  elements are missing until the script runs. This matters most for static sites.
- **ARIA across shadow roots.** Group semantics that rely on sibling relationships (radio position,
  menu item count) can be incomplete because each item has its own shadow root.
- **Manual assistive-technology checks are still required.** Automated axe checks run on every
  Storybook story in both themes; they do not replace screen-reader testing.
