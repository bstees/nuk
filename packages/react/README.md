# `@nuk-ui/react`

Typed React 19 adapters over `@nuk-ui/elements`. They render declarative custom elements during SSR
and register behavior after hydration, so importing the React package does not require a browser.

```tsx
import { NukButton, NukProvider, NukTextField } from '@nuk-ui/react';

export function Form() {
  return (
    <NukProvider prefix="nuk">
      <NukTextField label="Project name" name="project" required />
      <NukButton type="submit" onPress={(event) => console.log(event.detail.source)}>
        Create project
      </NukButton>
    </NukProvider>
  );
}
```

Use a company namespace once at the provider:

```tsx
<NukProvider prefix="acme-ui-">
  <NukButton>Save</NukButton> {/* renders <acme-ui-button> */}
</NukProvider>
```

The provider can accept a scoped `CustomElementRegistry` or set `autoDefine={false}` when another
bundle owns registration. Callback props (`onPress`, `onValueChange`, `onCheckedChange`,
`onOpenChange`) attach listeners to the event name derived from the configured prefix.
