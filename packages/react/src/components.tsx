import type { BaseElementProps, NukEventHandler } from './adapter.js';
import { createAdapter } from './adapter.js';

export interface ButtonPressDetail {
  readonly source: 'keyboard' | 'pointer';
}

export interface NukButtonProps extends BaseElementProps {
  readonly disabled?: boolean;
  readonly formnovalidate?: boolean;
  readonly label?: string;
  readonly name?: string;
  readonly onPress?: NukEventHandler<ButtonPressDetail>;
  readonly type?: 'button' | 'reset' | 'submit';
  readonly value?: string;
  readonly variant?: 'primary' | 'quiet' | 'secondary';
}

export const NukButton = createAdapter<HTMLElement, NukButtonProps>('button', 'NukButton', [
  { prop: 'onPress', suffix: 'press' },
]);

export interface NukLinkProps extends BaseElementProps {
  readonly download?: string;
  readonly href: string;
  readonly hreflang?: string;
  readonly label?: string;
  readonly rel?: string;
  readonly target?: '_blank' | '_parent' | '_self' | '_top';
}

export const NukLink = createAdapter<HTMLElement, NukLinkProps>('link', 'NukLink');

export interface ValueDetail {
  readonly value: string;
}

export interface FormControlProps extends BaseElementProps {
  readonly disabled?: boolean;
  readonly label?: string;
  readonly name?: string;
  readonly onValueChange?: NukEventHandler<ValueDetail>;
  readonly required?: boolean;
  readonly value?: string;
}

export interface NukTextFieldProps extends FormControlProps {
  readonly autocomplete?: string;
  readonly inputmode?: string;
  readonly max?: string;
  readonly maxlength?: number;
  readonly min?: string;
  readonly minlength?: number;
  readonly onValueInput?: NukEventHandler<ValueDetail>;
  readonly pattern?: string;
  readonly placeholder?: string;
  readonly readonly?: boolean;
  readonly step?: string;
  readonly type?:
    | 'date'
    | 'email'
    | 'month'
    | 'number'
    | 'password'
    | 'search'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week';
}

const valueBindings = [
  { prop: 'onValueChange', suffix: 'change' },
  { prop: 'onValueInput', suffix: 'input' },
] as const;

export const NukTextField = createAdapter<HTMLElement, NukTextFieldProps>(
  'text-field',
  'NukTextField',
  valueBindings,
);

export interface NukTextareaProps extends FormControlProps {
  readonly maxlength?: number;
  readonly minlength?: number;
  readonly onValueInput?: NukEventHandler<ValueDetail>;
  readonly placeholder?: string;
  readonly readonly?: boolean;
  readonly rows?: number;
}

export const NukTextarea = createAdapter<HTMLElement, NukTextareaProps>(
  'textarea',
  'NukTextarea',
  valueBindings,
);

export type NukSelectProps = FormControlProps;
export const NukSelect = createAdapter<HTMLElement, NukSelectProps>('select', 'NukSelect', [
  { prop: 'onValueChange', suffix: 'change' },
]);

export interface CheckedDetail extends ValueDetail {
  readonly checked: boolean;
}

export interface CheckControlProps extends Omit<FormControlProps, 'onValueChange'> {
  readonly checked?: boolean;
  readonly onCheckedChange?: NukEventHandler<CheckedDetail>;
}

const checkedBinding = [{ prop: 'onCheckedChange', suffix: 'change' }] as const;
export const NukCheckbox = createAdapter<HTMLElement, CheckControlProps>(
  'checkbox',
  'NukCheckbox',
  checkedBinding,
);
export const NukRadio = createAdapter<HTMLElement, CheckControlProps>(
  'radio',
  'NukRadio',
  checkedBinding,
);
export const NukSwitch = createAdapter<HTMLElement, CheckControlProps>(
  'switch',
  'NukSwitch',
  checkedBinding,
);

export interface NukFieldProps extends BaseElementProps {
  readonly required?: boolean;
}
export const NukField = createAdapter<HTMLElement, NukFieldProps>('field', 'NukField');

export interface OpenDetail {
  readonly open: boolean;
}

export interface NukDisclosureProps extends BaseElementProps {
  readonly onOpenChange?: NukEventHandler<OpenDetail>;
  readonly open?: boolean;
}
export const NukDisclosure = createAdapter<HTMLElement, NukDisclosureProps>(
  'disclosure',
  'NukDisclosure',
  [{ prop: 'onOpenChange', suffix: 'toggle' }],
);

export interface NukTabProps extends BaseElementProps {
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly value?: string;
}
export const NukTab = createAdapter<HTMLElement, NukTabProps>('tab', 'NukTab');

export interface NukTabPanelProps extends BaseElementProps {
  readonly active?: boolean;
}
export const NukTabPanel = createAdapter<HTMLElement, NukTabPanelProps>('tab-panel', 'NukTabPanel');

export interface TabChangeDetail extends ValueDetail {
  readonly index: number;
}
export interface NukTabsProps extends BaseElementProps {
  readonly active?: string;
  readonly label?: string;
  readonly manual?: boolean;
  readonly onValueChange?: NukEventHandler<TabChangeDetail>;
  readonly orientation?: 'horizontal' | 'vertical';
}
export const NukTabs = createAdapter<HTMLElement, NukTabsProps>('tabs', 'NukTabs', [
  { prop: 'onValueChange', suffix: 'change' },
]);

export interface DialogCloseDetail {
  readonly returnValue: string;
}
export interface NukDialogElement extends HTMLElement {
  close(returnValue?: string): void;
  readonly open: boolean;
  readonly returnValue: string;
  show(): void;
  showModal(): void;
}
export interface NukDialogProps extends BaseElementProps {
  readonly dismissible?: boolean;
  readonly label?: string;
  readonly modal?: boolean;
  readonly onClose?: NukEventHandler<DialogCloseDetail>;
  readonly open?: boolean;
}
export const NukDialog = createAdapter<NukDialogElement, NukDialogProps>('dialog', 'NukDialog', [
  { prop: 'onClose', suffix: 'close' },
]);

export interface NukMenuItemProps extends BaseElementProps {
  readonly disabled?: boolean;
  readonly value?: string;
}
export const NukMenuItem = createAdapter<HTMLElement, NukMenuItemProps>('menu-item', 'NukMenuItem');

export interface MenuSelectDetail extends ValueDetail {
  readonly item: HTMLElement;
}
export interface NukMenuProps extends BaseElementProps {
  readonly disabled?: boolean;
  readonly label?: string;
  readonly onOpenChange?: NukEventHandler<OpenDetail>;
  readonly onItemSelect?: NukEventHandler<MenuSelectDetail>;
  readonly open?: boolean;
}
export const NukMenu = createAdapter<HTMLElement, NukMenuProps>('menu', 'NukMenu', [
  { prop: 'onOpenChange', suffix: 'toggle' },
  { prop: 'onItemSelect', suffix: 'select' },
]);

export interface LabelProps extends BaseElementProps {
  readonly label?: string;
}
export const NukTable = createAdapter<HTMLElement, LabelProps>('table', 'NukTable');
export interface MessageProps extends LabelProps {
  readonly severity?: 'danger' | 'info' | 'success' | 'warning';
}
export const NukAlert = createAdapter<HTMLElement, MessageProps>('alert', 'NukAlert');
export const NukStatus = createAdapter<HTMLElement, MessageProps>('status', 'NukStatus');
export interface NukCardProps extends LabelProps {
  readonly horizontal?: boolean;
}
export const NukCard = createAdapter<HTMLElement, NukCardProps>('card', 'NukCard');
export const NukNav = createAdapter<HTMLElement, LabelProps>('nav', 'NukNav');
export const NukBreadcrumbs = createAdapter<HTMLElement, LabelProps>(
  'breadcrumbs',
  'NukBreadcrumbs',
);

export interface LayoutProps extends BaseElementProps {
  readonly gap?: 'large' | 'medium' | 'small';
}
export interface NukStackProps extends LayoutProps {
  readonly align?: 'center' | 'end' | 'start' | 'stretch';
}
export const NukStack = createAdapter<HTMLElement, NukStackProps>('stack', 'NukStack');
export interface NukClusterProps extends LayoutProps {
  readonly justify?: 'between' | 'center' | 'end' | 'start';
}
export const NukCluster = createAdapter<HTMLElement, NukClusterProps>('cluster', 'NukCluster');
export interface NukGridProps extends LayoutProps {
  readonly min?: 'large' | 'medium' | 'small';
}
export const NukGrid = createAdapter<HTMLElement, NukGridProps>('grid', 'NukGrid');
