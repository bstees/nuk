# `@nuk-ui/elements`

Dependency-free, semantic custom elements with the default `nuk-` namespace.

## Register the default namespace

The side-effect entry registers every element as `nuk-*`:

```js
import '@nuk-ui/elements/define';
```

For explicit control, including server-rendered applications, call the registry API in the browser:

```js
import { defineElements } from '@nuk-ui/elements';

const nuk = defineElements();
document.createElement(nuk.tags.button); // <nuk-button>
window.addEventListener(nuk.event('press'), handlePress); // nuk-press
```

## Choose a company prefix

```js
import { createStructuralStyles, defineElements } from '@nuk-ui/elements';

const acme = defineElements({ prefix: 'acme-ui-' });
// acme.tags['text-field'] === 'acme-ui-text-field'
// acme.event('change') === 'acme-ui-change'

const style = document.createElement('style');
style.textContent = createStructuralStyles(acme.prefix);
document.head.append(style);
```

The option accepts the prefix with or without its final hyphen. It must contain lowercase ASCII
letters, digits, and internal hyphens, start with a letter, and not begin with the reserved `xml`
sequence. A tag collision fails rather than replacing an existing definition.

Registration creates lightweight subclasses, so the same authored behavior can be registered under
another prefix without violating the platform's one-name-per-constructor rule. CSS semantic tokens
remain `--nuk-*`; a company theme should assign or alias those variables rather than generate a
second token vocabulary at runtime.
