/**
 * Shoelace 컴포넌트 타입 정의
 */

export interface SlAlert extends HTMLElement {
  variant: 'primary' | 'success' | 'neutral' | 'warning' | 'danger';
  closable: boolean;
  duration: number;
  open: boolean;
  toast(): void;
  show(): Promise<void>;
  hide(): Promise<void>;
}

export interface SlDialog extends HTMLElement {
  label: string;
  open: boolean;
  noHeader?: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
}

export interface SlDrawer extends HTMLElement {
  label: string;
  open: boolean;
  placement: 'top' | 'end' | 'bottom' | 'start';
  contained?: boolean;
  noHeader?: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
}

export interface SlButton extends HTMLElement {
  variant: 'default' | 'primary' | 'success' | 'neutral' | 'warning' | 'danger' | 'text';
  size: 'small' | 'medium' | 'large';
  disabled: boolean;
  loading: boolean;
  pill: boolean;
  circle: boolean;
  outline: boolean;
  caret: boolean;
  type: 'button' | 'submit' | 'reset';
  href?: string;
  target?: string;
  download?: string;
}

export interface SlInput extends HTMLElement {
  type: string;
  name: string;
  value: string;
  size: 'small' | 'medium' | 'large';
  filled: boolean;
  pill: boolean;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  clearable: boolean;
  passwordToggle: boolean;
  passwordVisible: boolean;
  noSpinButtons: boolean;
  placeholder: string;
  helpText: string;
  label: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  pattern?: string;
  minlength?: number;
  maxlength?: number;
}

export interface SlSelect extends HTMLElement {
  multiple: boolean;
  maxOptionsVisible: number;
  disabled: boolean;
  name: string;
  placeholder: string;
  size: 'small' | 'medium' | 'large';
  hoist: boolean;
  value: string | string[];
  filled: boolean;
  pill: boolean;
  label: string;
  helpText: string;
  clearable: boolean;
  required: boolean;
}

export interface SlCheckbox extends HTMLElement {
  name?: string;
  value?: string;
  disabled: boolean;
  required: boolean;
  checked: boolean;
  indeterminate: boolean;
  size: 'small' | 'medium' | 'large';
}

export interface SlSwitch extends HTMLElement {
  name?: string;
  value?: string;
  disabled: boolean;
  required: boolean;
  checked: boolean;
  size: 'small' | 'medium' | 'large';
}

export interface SlTextarea extends HTMLElement {
  name: string;
  value: string;
  size: 'small' | 'medium' | 'large';
  filled: boolean;
  label: string;
  helpText: string;
  placeholder: string;
  rows: number;
  resize: 'none' | 'vertical' | 'horizontal' | 'auto';
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  minlength?: number;
  maxlength?: number;
}

export interface SlDropdown extends HTMLElement {
  open: boolean;
  placement: string;
  disabled: boolean;
  distance: number;
  skidding: number;
  hoist: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
}

export interface SlTooltip extends HTMLElement {
  content: string;
  placement: string;
  disabled: boolean;
  distance: number;
  open: boolean;
  skidding: number;
  trigger: string;
  hoist: boolean;
}

export interface SlCarousel extends HTMLElement {
  loop: boolean;
  navigation: boolean;
  pagination: boolean;
  autoplay: boolean;
  autoplayInterval: number;
  slidesPerPage: number;
  slidesPerMove: number;
  orientation: 'horizontal' | 'vertical';
  mouseDragging: boolean;
  goToSlide(index: number, behavior?: 'auto' | 'smooth'): void;
  next(): void;
  previous(): void;
}

export type ShoelaceComponent = 
  // 버튼 & 입력
  | 'sl-button' | 'sl-button-group' | 'sl-icon-button'
  | 'sl-input' | 'sl-textarea' | 'sl-select' | 'sl-checkbox' 
  | 'sl-radio' | 'sl-radio-group' | 'sl-radio-button'
  | 'sl-range' | 'sl-rating' | 'sl-switch' | 'sl-color-picker'
  
  // 데이터 표시
  | 'sl-alert' | 'sl-badge' | 'sl-card' | 'sl-details'
  | 'sl-dialog' | 'sl-drawer' | 'sl-dropdown' | 'sl-menu'
  | 'sl-menu-item' | 'sl-menu-label' | 'sl-divider'
  | 'sl-tooltip' | 'sl-tag' | 'sl-tree' | 'sl-tree-item'
  
  // 피드백
  | 'sl-spinner' | 'sl-progress-bar' | 'sl-progress-ring'
  | 'sl-skeleton' | 'sl-animation'
  
  // 레이아웃
  | 'sl-breadcrumb' | 'sl-breadcrumb-item' | 'sl-tab-group'
  | 'sl-tab' | 'sl-tab-panel' | 'sl-split-panel'
  
  // 유틸리티
  | 'sl-avatar' | 'sl-icon' | 'sl-image-comparer'
  | 'sl-include' | 'sl-mutation-observer' | 'sl-resize-observer'
  | 'sl-format-bytes' | 'sl-format-date' | 'sl-format-number'
  | 'sl-relative-time' | 'sl-qr-code' | 'sl-visually-hidden'
  | 'sl-popup' | 'sl-carousel' | 'sl-carousel-item';