import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type PropsWithoutRef,
  type ReactNode,
  type Ref,
  type RefAttributes,
} from 'react';

import type { ElementName } from '@nuk-ui/elements/prefix';

import { useNukConfiguration } from './configuration.js';

export interface NukEvent<T> extends CustomEvent<T> {
  readonly currentTarget: HTMLElement;
}

export type NukEventHandler<T> = (event: NukEvent<T>) => void;

export interface BaseElementProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'onInput' | 'onSelect'
> {
  readonly children?: ReactNode;
}

export interface EventBinding {
  readonly prop: string;
  readonly suffix: string;
}

function setForwardedRef<E>(ref: Ref<E>, value: E | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref !== null) ref.current = value;
}

function isEventHandler(value: unknown): value is (event: Event) => void {
  return typeof value === 'function';
}

export function createAdapter<E extends HTMLElement, P extends BaseElementProps>(
  component: ElementName,
  displayName: string,
  bindings: readonly EventBinding[] = [],
): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>> {
  const Adapter = forwardRef<E, P>((props, forwardedRef) => {
    const configuration = useNukConfiguration();
    const elementRef = useRef<E | null>(null);
    const latestProps = useRef(props);
    latestProps.current = props;

    const setRef = useCallback(
      (element: E | null) => {
        elementRef.current = element;
        setForwardedRef(forwardedRef, element);
      },
      [forwardedRef],
    );

    useEffect(() => {
      const element = elementRef.current;
      if (element === null) return;
      const listeners = bindings.map((binding) => {
        const listener = (event: Event): void => {
          const runtimeProps = latestProps.current as Readonly<Record<string, unknown>>;
          const handler = runtimeProps[binding.prop];
          if (isEventHandler(handler)) handler(event);
        };
        const name = configuration.event(binding.suffix);
        element.addEventListener(name, listener);
        return { listener, name };
      });
      return () => {
        for (const { listener, name } of listeners) element.removeEventListener(name, listener);
      };
    }, [configuration, elementRef]);

    const boundProperties = new Set(bindings.map((binding) => binding.prop));
    const elementProps = Object.fromEntries(
      Object.entries(props).filter(([name]) => name !== 'children' && !boundProperties.has(name)),
    );
    const children = props.children;
    elementProps.ref = setRef;
    return createElement(configuration.tags[component], elementProps, children);
  });
  Adapter.displayName = displayName;
  return Adapter as ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>;
}
