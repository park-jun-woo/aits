/**
 * Ionic Framework 컴포넌트 타입 정의
 */

// Button & Interactive
export interface IonButton extends HTMLElement {
    color?: string;
    buttonType?: string;
    disabled: boolean;
    expand?: 'block' | 'full';
    fill?: 'clear' | 'default' | 'outline' | 'solid';
    mode?: 'ios' | 'md';
    readonly?: boolean;
    routerDirection?: 'back' | 'forward' | 'root';
    routerLink?: string;
    shape?: 'round';
    size?: 'small' | 'default' | 'large';
    strong: boolean;
    target?: string;
    type: 'button' | 'submit' | 'reset';
    download?: string;
    href?: string;
    rel?: string;
}

export interface IonFab extends HTMLElement {
    activated: boolean;
    edge?: boolean;
    horizontal?: 'center' | 'end' | 'start';
    vertical?: 'bottom' | 'center' | 'top';
    close(): Promise<void>;
}

export interface IonFabButton extends HTMLElement {
    activated: boolean;
    closeIcon?: string;
    color?: string;
    disabled: boolean;
    download?: string;
    href?: string;
    mode?: 'ios' | 'md';
    rel?: string;
    routerDirection?: 'back' | 'forward' | 'root';
    routerLink?: string;
    show: boolean;
    size?: 'small';
    target?: string;
    translucent: boolean;
    type?: string;
}

// Form Controls
export interface IonCheckbox extends HTMLElement {
    checked: boolean;
    color?: string;
    disabled: boolean;
    indeterminate: boolean;
    mode?: 'ios' | 'md';
    name: string;
    value: string;
}

export interface IonRadio extends HTMLElement {
    color?: string;
    disabled: boolean;
    mode?: 'ios' | 'md';
    name: string;
    value?: any;
}

export interface IonRadioGroup extends HTMLElement {
    allowEmptySelection: boolean;
    name: string;
    value?: any;
}

export interface IonToggle extends HTMLElement {
    checked: boolean;
    color?: string;
    disabled: boolean;
    mode?: 'ios' | 'md';
    name: string;
    value?: string;
}

export interface IonRange extends HTMLElement {
    color?: string;
    debounce?: number;
    disabled: boolean;
    dualKnobs: boolean;
    max: number;
    min: number;
    mode?: 'ios' | 'md';
    name: string;
    pin: boolean;
    pinFormatter?: (value: number) => string | number;
    snaps: boolean;
    step: number;
    ticks: boolean;
    value: number | { lower: number; upper: number };
}

// Input & Text
export interface IonInput extends HTMLElement {
    accept?: string;
    autocapitalize?: string;
    autocomplete?: string;
    autocorrect?: string;
    autofocus: boolean;
    clearInput: boolean;
    clearOnEdit?: boolean;
    color?: string;
    counter?: boolean;
    counterFormatter?: (inputLength: number, maxLength: number) => string;
    debounce?: number;
    disabled: boolean;
    enterkeyhint?: string;
    errorText?: string;
    fill?: 'outline' | 'solid';
    helperText?: string;
    // inputmode is already in HTMLElement
    label?: string;
    labelPlacement?: 'end' | 'fixed' | 'floating' | 'stacked' | 'start';
    max?: string | number;
    maxlength?: number;
    min?: string | number;
    minlength?: number;
    mode?: 'ios' | 'md';
    multiple?: boolean;
    name: string;
    pattern?: string;
    placeholder?: string;
    readonly: boolean;
    required: boolean;
    shape?: 'round';
    size?: number;
    spellcheck?: boolean;
    step?: string;
    type?: string;
    value?: string | number | null;
    
    getInputElement(): Promise<HTMLInputElement>;
    setFocus(): Promise<void>;
}

export interface IonTextarea extends HTMLElement {
    autoGrow: boolean;
    autocapitalize?: string;
    autofocus: boolean;
    clearOnEdit: boolean;
    color?: string;
    cols?: number;
    counter?: boolean;
    counterFormatter?: (inputLength: number, maxLength: number) => string;
    debounce?: number;
    disabled: boolean;
    enterkeyhint?: string;
    errorText?: string;
    fill?: 'outline' | 'solid';
    helperText?: string;
    label?: string;
    labelPlacement?: 'end' | 'fixed' | 'floating' | 'stacked' | 'start';
    maxlength?: number;
    minlength?: number;
    mode?: 'ios' | 'md';
    name: string;
    placeholder?: string;
    readonly: boolean;
    required: boolean;
    rows?: number;
    shape?: 'round';
    spellcheck?: boolean;
    value?: string | null;
    wrap?: 'hard' | 'off' | 'soft';
    
    getInputElement(): Promise<HTMLTextAreaElement>;
    setFocus(): Promise<void>;
}

export interface IonSearchbar extends HTMLElement {
    animated: boolean;
    autocomplete?: string;
    autocorrect?: string;
    cancelButtonIcon?: string;
    cancelButtonText?: string;
    clearIcon?: string;
    color?: string;
    debounce?: number;
    disabled: boolean;
    enterkeyhint?: string;
    inputmode?: string;
    mode?: 'ios' | 'md';
    placeholder?: string;
    searchIcon?: string;
    showCancelButton?: 'always' | 'focus' | 'never';
    showClearButton?: 'always' | 'focus' | 'never';
    spellcheck?: boolean;
    type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
    value?: string | null;
    
    getInputElement(): Promise<HTMLInputElement>;
    setFocus(): Promise<void>;
}

// Select
export interface IonSelect extends HTMLElement {
    cancelText?: string;
    compareWith?: string | Function;
    disabled: boolean;
    fill?: 'outline' | 'solid';
    interface?: 'action-sheet' | 'alert' | 'popover';
    interfaceOptions?: any;
    justify?: 'end' | 'space-between' | 'start';
    label?: string;
    labelPlacement?: 'end' | 'fixed' | 'floating' | 'stacked' | 'start';
    mode?: 'ios' | 'md';
    multiple?: boolean;
    name: string;
    okText?: string;
    placeholder?: string;
    selectedText?: string;
    shape?: 'round';
    value?: any;
    
    open(event?: UIEvent): Promise<any>;
}

export interface IonSelectOption extends HTMLElement {
    disabled: boolean;
    value?: any;
}

// DateTime
export interface IonDatetime extends HTMLElement {
    cancelText?: string;
    clearText?: string;
    color?: string;
    dayValues?: number[] | number | string;
    disabled: boolean;
    doneText?: string;
    firstDayOfWeek?: number;
    highlightedDates?: any;
    hourCycle?: 'h12' | 'h23';
    hourValues?: number[] | number | string;
    isDateEnabled?: (dateString: string) => boolean;
    locale?: string;
    max?: string;
    min?: string;
    minuteValues?: number[] | number | string;
    mode?: 'ios' | 'md';
    monthValues?: number[] | number | string;
    multiple?: boolean;
    name?: string;
    preferWheel?: boolean;
    presentation?: 'date' | 'date-time' | 'month' | 'month-year' | 'time' | 'time-date' | 'year';
    readonly: boolean;
    showClearButton?: boolean;
    showDefaultButtons?: boolean;
    showDefaultTimeLabel?: boolean;
    showDefaultTitle?: boolean;
    size?: 'cover' | 'fixed';
    titleSelectedDatesFormatter?: (selectedDates: string[]) => string;
    value?: string | string[] | null;
    yearValues?: number[] | number | string;
    
    cancel(closeOverlay?: boolean): Promise<void>;
    confirm(closeOverlay?: boolean): Promise<void>;
    reset(startDate?: string): Promise<void>;
}

// Navigation
export interface IonSegment extends HTMLElement {
    color?: string;
    disabled: boolean;
    mode?: 'ios' | 'md';
    scrollable?: boolean;
    selectOnFocus?: boolean;
    swipeGesture?: boolean;
    value?: string | null;
}

export interface IonSegmentButton extends HTMLElement {
    disabled: boolean;
    layout?: 'icon-bottom' | 'icon-end' | 'icon-hide' | 'icon-start' | 'icon-top' | 'label-hide';
    mode?: 'ios' | 'md';
    type?: 'button' | 'submit' | 'reset';
    value?: string;
}

export interface IonTabs extends HTMLElement {
    getSelected(): Promise<string | undefined>;
    getTab(tab: string | HTMLIonTabElement): Promise<HTMLIonTabElement | undefined>;
    select(tab: string | HTMLIonTabElement): Promise<boolean>;
}

export interface IonTab extends HTMLElement {
    component?: Function | HTMLElement | null | string;
    delegate?: any;
    tab: string;
    active: boolean;
    setActive(): Promise<void>;
}

export interface IonTabBar extends HTMLElement {
    color?: string;
    mode?: 'ios' | 'md';
    selectedTab?: string;
    translucent: boolean;
}

export interface IonTabButton extends HTMLElement {
    disabled: boolean;
    download?: string;
    href?: string;
    layout?: 'icon-bottom' | 'icon-end' | 'icon-hide' | 'icon-start' | 'icon-top' | 'label-hide';
    mode?: 'ios' | 'md';
    rel?: string;
    selected: boolean;
    tab?: string;
    target?: string;
}

// List & Item
export interface IonList extends HTMLElement {
    inset: boolean;
    lines?: 'full' | 'inset' | 'none';
    mode?: 'ios' | 'md';
    
    closeSlidingItems(): Promise<boolean>;
}

export interface IonItem extends HTMLElement {
    button: boolean;
    color?: string;
    counter?: boolean;
    counterFormatter?: (inputLength: number, maxLength: number) => string;
    detail?: boolean;
    detailIcon?: string;
    disabled: boolean;
    download?: string;
    fill?: 'outline' | 'solid';
    href?: string;
    lines?: 'full' | 'inset' | 'none';
    mode?: 'ios' | 'md';
    rel?: string;
    routerDirection?: 'back' | 'forward' | 'root';
    routerLink?: string;
    shape?: 'round';
    target?: string;
    type?: 'button' | 'submit' | 'reset';
}

export interface IonItemSliding extends HTMLElement {
    disabled: boolean;
    
    close(): Promise<void>;
    closeOpened(): Promise<boolean>;
    getOpenAmount(): Promise<number>;
    getSlidingRatio(): Promise<number>;
    open(side: string): Promise<void>;
}

export interface IonItemOptions extends HTMLElement {
    side: 'start' | 'end';
    
    fireSwipeEvent(): Promise<void>;
}

export interface IonItemOption extends HTMLElement {
    color?: string;
    disabled: boolean;
    download?: string;
    expandable: boolean;
    href?: string;
    mode?: 'ios' | 'md';
    rel?: string;
    target?: string;
    type?: 'button' | 'submit' | 'reset';
}

// Card
export interface IonCard extends HTMLElement {
    button: boolean;
    color?: string;
    disabled: boolean;
    download?: string;
    href?: string;
    mode?: 'ios' | 'md';
    rel?: string;
    routerDirection?: 'back' | 'forward' | 'root';
    routerLink?: string;
    target?: string;
    type?: 'button' | 'submit' | 'reset';
}

// Modal & Popover
export interface IonModal extends HTMLElement {
    animated: boolean;
    backdropBreakpoint?: number;
    backdropDismiss: boolean;
    breakpoints?: number[];
    canDismiss?: boolean | ((data?: any, role?: string) => Promise<boolean>);
    enterAnimation?: any;
    handle?: boolean;
    handleBehavior?: 'none' | 'cycle' | 'drag';
    htmlAttributes?: any;
    initialBreakpoint?: number;
    isOpen: boolean;
    keepContentsMounted: boolean;
    keyboardClose: boolean;
    leaveAnimation?: any;
    mode?: 'ios' | 'md';
    presentingElement?: HTMLElement;
    showBackdrop: boolean;
    translucent: boolean;
    trigger?: string;
    
    dismiss(data?: any, role?: string): Promise<boolean>;
    onDidDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    onWillDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    present(): Promise<void>;
    setCurrentBreakpoint(breakpoint: number): Promise<void>;
    getCurrentBreakpoint(): Promise<number | undefined>;
}

export interface IonPopover extends HTMLElement {
    alignment?: 'center' | 'end' | 'start';
    animated: boolean;
    arrow?: boolean;
    backdropDismiss: boolean;
    cssClass?: string | string[];
    dismissOnSelect: boolean;
    enterAnimation?: any;
    event?: Event;
    htmlAttributes?: any;
    isOpen: boolean;
    keepContentsMounted: boolean;
    keyboardClose: boolean;
    leaveAnimation?: any;
    mode?: 'ios' | 'md';
    reference?: 'event' | 'trigger';
    showBackdrop: boolean;
    side?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';
    size?: 'auto' | 'cover';
    translucent: boolean;
    trigger?: string;
    triggerAction?: 'click' | 'context-menu' | 'hover';
    
    dismiss(data?: any, role?: string): Promise<boolean>;
    onDidDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    onWillDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    present(): Promise<void>;
}

// Loading & Toast & Alert
export interface IonLoading extends HTMLElement {
    animated: boolean;
    backdropDismiss: boolean;
    cssClass?: string | string[];
    duration?: number;
    enterAnimation?: any;
    htmlAttributes?: any;
    isOpen: boolean;
    keyboardClose: boolean;
    leaveAnimation?: any;
    message?: string;
    mode?: 'ios' | 'md';
    showBackdrop: boolean;
    spinner?: 'bubbles' | 'circles' | 'circular' | 'crescent' | 'dots' | 'lines' | 'lines-sharp' | 'lines-sharp-small' | 'lines-small' | null;
    translucent: boolean;
    trigger?: string;
    
    dismiss(data?: any, role?: string): Promise<boolean>;
    onDidDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    onWillDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    present(): Promise<void>;
}

export interface IonToast extends HTMLElement {
    animated: boolean;
    buttons?: any[];
    color?: string;
    cssClass?: string | string[];
    duration?: number;
    enterAnimation?: any;
    header?: string;
    htmlAttributes?: any;
    icon?: string;
    isOpen: boolean;
    keyboardClose: boolean;
    layout?: 'baseline' | 'stacked';
    leaveAnimation?: any;
    message?: string;
    mode?: 'ios' | 'md';
    position?: 'top' | 'bottom' | 'middle';
    positionAnchor?: HTMLElement | string;
    swipeGesture?: 'vertical';
    translucent: boolean;
    trigger?: string;
    
    dismiss(data?: any, role?: string): Promise<boolean>;
    onDidDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    onWillDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    present(): Promise<void>;
}

export interface IonAlert extends HTMLElement {
    animated: boolean;
    backdropDismiss: boolean;
    buttons?: any[];
    cssClass?: string | string[];
    enterAnimation?: any;
    header?: string;
    htmlAttributes?: any;
    inputs?: any[];
    isOpen: boolean;
    keyboardClose: boolean;
    leaveAnimation?: any;
    message?: string;
    mode?: 'ios' | 'md';
    subHeader?: string;
    translucent: boolean;
    trigger?: string;
    
    dismiss(data?: any, role?: string): Promise<boolean>;
    onDidDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    onWillDismiss<T = any>(): Promise<OverlayEventDetail<T>>;
    present(): Promise<void>;
}

// Utility types
export interface OverlayEventDetail<T = any> {
    data?: T;
    role?: string;
}

// Component type mapping
export type IonicComponent = 
    | 'ion-button' | 'ion-fab' | 'ion-fab-button' | 'ion-fab-list'
    | 'ion-checkbox' | 'ion-radio' | 'ion-radio-group' | 'ion-toggle' | 'ion-range'
    | 'ion-input' | 'ion-textarea' | 'ion-searchbar'
    | 'ion-select' | 'ion-select-option'
    | 'ion-datetime' | 'ion-picker'
    | 'ion-segment' | 'ion-segment-button'
    | 'ion-tabs' | 'ion-tab' | 'ion-tab-bar' | 'ion-tab-button'
    | 'ion-list' | 'ion-item' | 'ion-item-sliding' | 'ion-item-options' | 'ion-item-option'
    | 'ion-card' | 'ion-card-header' | 'ion-card-title' | 'ion-card-subtitle' | 'ion-card-content'
    | 'ion-modal' | 'ion-popover'
    | 'ion-loading' | 'ion-toast' | 'ion-alert' | 'ion-action-sheet'
    | 'ion-badge' | 'ion-chip' | 'ion-icon' | 'ion-label' | 'ion-note' | 'ion-text'
    | 'ion-avatar' | 'ion-thumbnail' | 'ion-img'
    | 'ion-toolbar' | 'ion-header' | 'ion-footer' | 'ion-title' | 'ion-buttons' | 'ion-back-button'
    | 'ion-content' | 'ion-grid' | 'ion-row' | 'ion-col'
    | 'ion-spinner' | 'ion-progress-bar' | 'ion-skeleton-text'
    | 'ion-accordion' | 'ion-accordion-group' | 'ion-breadcrumb' | 'ion-breadcrumbs'
    | 'ion-menu' | 'ion-menu-button' | 'ion-menu-toggle' | 'ion-split-pane'
    | 'ion-nav' | 'ion-nav-link' | 'ion-router' | 'ion-router-link' | 'ion-router-outlet'
    | 'ion-slides' | 'ion-slide' | 'ion-refresher' | 'ion-refresher-content'
    | 'ion-infinite-scroll' | 'ion-infinite-scroll-content' | 'ion-virtual-scroll'
    | 'ion-reorder' | 'ion-reorder-group';