/** Stable token names. Values are also available as `--nuk-*` custom properties. */
export const tokens = {
  color: {
    neutral0: '#ffffff',
    neutral50: '#f7f8fa',
    neutral100: '#eceff3',
    neutral300: '#c5cbd4',
    neutral600: '#515a67',
    neutral800: '#252a31',
    neutral950: '#101216',
    blue300: '#8cc8ff',
    blue600: '#1769aa',
    blue700: '#0d568f',
    red300: '#ffaaa3',
    red700: '#a6261e',
    green300: '#85d6a3',
    green700: '#18753a',
    amber300: '#f2c866',
    amber800: '#755300',
  },
  font: {
    sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "ui-monospace, 'SFMono-Regular', Consolas, monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    xxl: '2rem',
  },
  lineHeight: {
    compact: 1.25,
    body: 1.5,
    relaxed: 1.7,
  },
  space: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.5rem',
    6: '2rem',
    7: '3rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    pill: '999rem',
  },
  shadow: {
    sm: '0 0.0625rem 0.125rem rgb(16 18 22 / 0.12)',
    md: '0 0.5rem 1.5rem rgb(16 18 22 / 0.16)',
  },
  duration: {
    fast: '120ms',
    normal: '200ms',
  },
  zIndex: {
    menu: 20,
    dialog: 40,
  },
} as const;

export type Tokens = typeof tokens;
