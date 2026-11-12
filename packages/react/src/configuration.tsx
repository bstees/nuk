import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';

import {
  createTagNames,
  DEFAULT_ELEMENT_PREFIX,
  eventName,
  formatElementPrefix,
  type ElementTagNames,
} from '@nuk-ui/elements/prefix';

export interface NukConfiguration {
  readonly autoDefine: boolean;
  /** Normalized prefix including its trailing hyphen, exactly as `defineElements()` reports it. */
  readonly prefix: `${string}-`;
  readonly tags: ElementTagNames;
  readonly registry: CustomElementRegistry | undefined;
  event(name: string): `${string}-${string}`;
}

const defaultConfiguration: NukConfiguration = {
  autoDefine: true,
  event: (name) => eventName(DEFAULT_ELEMENT_PREFIX, name),
  prefix: formatElementPrefix(DEFAULT_ELEMENT_PREFIX),
  registry: undefined,
  tags: createTagNames(DEFAULT_ELEMENT_PREFIX),
};

const ConfigurationContext = createContext<NukConfiguration>(defaultConfiguration);

export interface NukProviderProps extends PropsWithChildren {
  /** Prefix with or without a trailing hyphen. Defaults to `nuk-`. */
  readonly prefix?: string;
  /** Register elements after hydration. Disable when another bundle owns registration. */
  readonly autoDefine?: boolean;
  /** Optional scoped custom-element registry. */
  readonly registry?: CustomElementRegistry;
}

export function NukProvider({
  autoDefine = true,
  children,
  prefix = DEFAULT_ELEMENT_PREFIX,
  registry,
}: NukProviderProps) {
  const normalized = formatElementPrefix(prefix);
  const value = useMemo<NukConfiguration>(
    () => ({
      autoDefine,
      event: (name) => eventName(normalized, name),
      prefix: normalized,
      registry,
      tags: createTagNames(normalized),
    }),
    [autoDefine, normalized, registry],
  );
  return <ConfigurationContext.Provider value={value}>{children}</ConfigurationContext.Provider>;
}

export function useNukConfiguration(): NukConfiguration {
  const configuration = useContext(ConfigurationContext);
  useEffect(() => {
    if (!configuration.autoDefine || typeof customElements === 'undefined') return;
    let active = true;
    void import('@nuk-ui/elements').then(({ defineElements }) => {
      if (active) {
        defineElements({
          prefix: configuration.prefix,
          ...(configuration.registry === undefined ? {} : { registry: configuration.registry }),
        });
      }
    });
    return () => {
      active = false;
    };
  }, [configuration.autoDefine, configuration.prefix, configuration.registry]);
  return configuration;
}
