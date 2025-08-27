/**
 * Material Design 3 Web Components 타입 정의
 */

export interface MdButton extends HTMLElement {
    variant: 'elevated' | 'filled' | 'filled-tonal' | 'outlined' | 'text';
    disabled: boolean;
    href?: string;
    target?: string;
    type: 'button' | 'submit' | 'reset';
    value?: string;
    name?: string;
    form?: string;
}

export interface MdIconButton extends HTMLElement {
    disabled: boolean;
    href?: string;
    target?: string;
    toggle?: boolean;
    selected?: boolean;
}

export interface MdCheckbox extends HTMLElement {
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    required: boolean;
    value: string;
    name?: string;
}

export interface MdSwitch extends HTMLElement {
    selected: boolean;
    disabled: boolean;
    required: boolean;
    value?: string;
    name?: string;
    icons?: boolean;
    showOnlySelectedIcon?: boolean;
}

export interface MdRadio extends HTMLElement {
    checked: boolean;
    disabled: boolean;
    value: string;
    name?: string;
}

export interface MdTextField extends HTMLElement {
    disabled: boolean;
    error: boolean;
    errorText?: string;
    label?: string;
    required: boolean;
    value: string;
    prefixText?: string;
    suffixText?: string;
    hasLeadingIcon: boolean;
    hasTrailingIcon: boolean;
    supportingText?: string;
    textDirection?: string;
    rows?: number;
    cols?: number;
    // inputMode is already defined in HTMLElement as string
    // inputMode?: string;  
    max?: string | number;
    maxLength?: number;
    min?: string | number;
    minLength?: number;
    pattern?: string;
    placeholder?: string;
    readOnly: boolean;
    multiple?: boolean;
    step?: string;
    type: string;
    autocomplete?: string;
}

export interface MdSelect extends HTMLElement {
    disabled: boolean;
    error: boolean;
    errorText?: string;
    label?: string;
    required: boolean;
    value: string;
    selectedIndex: number;
    hasLeadingIcon: boolean;
    displayText?: string;
    menuAlign?: 'start' | 'end';
    supportingText?: string;
    options?: MdSelectOption[];
}

export interface MdSelectOption extends HTMLElement {
    disabled: boolean;
    selected: boolean;
    value: string;
}

export interface MdDialog extends HTMLElement {
    open: boolean;
    returnValue: string;
    type?: 'alert';
    noFocusTrap?: boolean;
    getOpenAnimation(): DialogAnimation;
    getCloseAnimation(): DialogAnimation;
    show(): void;
    close(returnValue?: string): void;
}

export interface MdMenu extends HTMLElement {
    anchor?: string | HTMLElement;
    positioning?: 'absolute' | 'fixed' | 'relative';
    quick?: boolean;
    hasOverflow?: boolean;
    open: boolean;
    xOffset?: number;
    yOffset?: number;
    typeaheadDelay?: number;
    anchorCorner?: Corner;
    menuCorner?: Corner;
    stayOpenOnOutsideClick?: boolean;
    stayOpenOnFocusout?: boolean;
    skipRestoreFocus?: boolean;
    defaultFocus?: FocusState;
}

export interface MdMenuItem extends HTMLElement {
    disabled: boolean;
    type: 'menuitem' | 'option' | 'button' | 'link';
    href?: string;
    target?: string;
    keepOpen?: boolean;
    selected?: boolean;
}

export interface MdChip extends HTMLElement {
    disabled: boolean;
    alwaysFocusable?: boolean;
    label: string;
    elevated?: boolean;
}

export interface MdChipSet extends HTMLElement {
    chips: MdChip[];
}

export interface MdTabs extends HTMLElement {
    activeTabIndex: number;
    autoActivate?: boolean;
    tabs: MdTab[];
    activeTab?: MdTab;
}

export interface MdTab extends HTMLElement {
    active: boolean;
    hasIcon: boolean;
    iconOnly: boolean;
    selected?: boolean;
    disabled?: boolean;
    focusable?: boolean;
    inlineIcon?: boolean;
}

export interface MdFab extends HTMLElement {
    variant: 'surface' | 'primary' | 'secondary' | 'tertiary';
    size: 'small' | 'medium' | 'large';
    label?: string;
    lowered?: boolean;
}

export interface MdSlider extends HTMLElement {
    disabled: boolean;
    min: number;
    max: number;
    value: number;
    valueStart?: number;
    valueEnd?: number;
    step: number;
    tickmarks?: boolean;
    labeled?: boolean;
    range?: boolean;
    name?: string;
}

export interface MdProgressIndicator extends HTMLElement {
    value?: number;
    max?: number;
    indeterminate: boolean;
    fourColor?: boolean;
}

export interface MdRipple extends HTMLElement {
    disabled?: boolean;
    unbounded?: boolean;
}

export interface MdElevation extends HTMLElement {
    level?: number;
}

export interface MdList extends HTMLElement {
    items?: MdListItem[];
}

export interface MdListItem extends HTMLElement {
    disabled: boolean;
    type: 'text' | 'button' | 'link';
    href?: string;
    target?: string;
    selected?: boolean;
    activated?: boolean;
}

export interface MdDivider extends HTMLElement {
    inset?: boolean;
    insetStart?: boolean;
    insetEnd?: boolean;
}

// Helper types
export type Corner = 'start-start' | 'start-end' | 'end-start' | 'end-end';
export type FocusState = 'none' | 'list-root' | 'first-item' | 'last-item';

export interface DialogAnimation {
    dialog?: Animation[];
    scrim?: Animation[];
    container?: Animation[];
    headline?: Animation[];
    content?: Animation[];
    actions?: Animation[];
}

// Component type mapping
export type MaterialComponent = 
    | 'md-elevated-button' | 'md-filled-button' | 'md-filled-tonal-button' 
    | 'md-outlined-button' | 'md-text-button'
    | 'md-icon-button' | 'md-filled-icon-button' | 'md-filled-tonal-icon-button'
    | 'md-outlined-icon-button'
    | 'md-checkbox' | 'md-switch' | 'md-radio'
    | 'md-filled-text-field' | 'md-outlined-text-field'
    | 'md-filled-select' | 'md-outlined-select' | 'md-select-option'
    | 'md-dialog' | 'md-menu' | 'md-menu-item' | 'md-sub-menu'
    | 'md-assist-chip' | 'md-filter-chip' | 'md-input-chip' | 'md-suggestion-chip'
    | 'md-chip-set'
    | 'md-primary-tab' | 'md-secondary-tab' | 'md-tabs'
    | 'md-fab' | 'md-branded-fab'
    | 'md-slider'
    | 'md-linear-progress' | 'md-circular-progress'
    | 'md-ripple' | 'md-elevation'
    | 'md-list' | 'md-list-item'
    | 'md-divider'
    | 'md-icon';