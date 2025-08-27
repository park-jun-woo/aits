import type { BridgeContext } from '@aits/core';

export interface ComponentTransform {
    attributes?: (el: Element) => Record<string, any>;
    events?: (ctx: BridgeContext) => Record<string, EventListener>;
    slots?: (el: Element) => Record<string, Node[]>;
}

export const componentTransforms: Record<string, ComponentTransform> = {
    // Buttons
    'ion-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'color', 'button-type', 'disabled', 'expand', 'fill', 'mode',
                'readonly', 'router-direction', 'router-link', 'shape', 'size',
                'strong', 'target', 'type', 'download', 'href', 'rel'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionFocus': ctx.forward('focus'),
            'ionBlur': ctx.forward('blur')
        })
    },
    
    'ion-fab': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['activated', 'edge', 'horizontal', 'vertical'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    'ion-fab-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'activated', 'close-icon', 'color', 'disabled', 'download',
                'href', 'mode', 'rel', 'router-direction', 'router-link',
                'show', 'size', 'target', 'translucent', 'type'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionFocus': ctx.forward('focus'),
            'ionBlur': ctx.forward('blur')
        })
    },
    
    // Form Controls
    'ion-checkbox': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['checked', 'color', 'disabled', 'indeterminate', 'mode', 'name', 'value'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'ionChange': ctx.forward('change'),
            'ionFocus': ctx.forward('focus'),
            'ionBlur': ctx.forward('blur')
        })
    },
    
    'ion-radio': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['color', 'disabled', 'mode', 'name', 'value'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'ionFocus': ctx.forward('focus'),
            'ionBlur': ctx.forward('blur')
        })
    },
    
    'ion-radio-group': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['allow-empty-selection', 'name', 'value'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'ionChange': ctx.forward('change')
        })
    },
    
    'ion-toggle': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['checked', 'color', 'disabled', 'mode', 'name', 'value'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'ionChange': ctx.forward('change'),
            'ionFocus': ctx.forward('focus'),
            'ionBlur': ctx.forward('blur')
        })
    },
    
    'ion-range': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'color', 'debounce', 'disabled', 'dual-knobs', 'max', 'min',
                'mode', 'name', 'pin', 'snaps', 'step', 'ticks', 'value'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionChange': ctx.forward('change'),
            'ionInput': ctx.forward('input'),
            'ionFocus': ctx.forward('focus'),
            'ionBlur': ctx.forward('blur'),
            'ionKnobMoveStart': ctx.forward('knobmovestart'),
            'ionKnobMoveEnd': ctx.forward('knobmoveend')
        })
    },
    
    // Input & Text
    'ion-input': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'accept', 'autocapitalize', 'autocomplete', 'autocorrect', 'autofocus',
                'clear-input', 'clear-on-edit', 'color', 'counter', 'debounce',
                'disabled', 'enterkeyhint', 'error-text', 'fill', 'helper-text',
                'inputmode', 'label', 'label-placement', 'max', 'maxlength', 'min',
                'minlength', 'mode', 'multiple', 'name', 'pattern', 'placeholder',
                'readonly', 'required', 'shape', 'size', 'spellcheck', 'step',
                'type', 'value'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionInput': ctx.forward('input'),
            'ionChange': ctx.forward('change'),
            'ionBlur': ctx.forward('blur'),
            'ionFocus': ctx.forward('focus')
        })
    },
    
    'ion-textarea': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'auto-grow', 'autocapitalize', 'autofocus', 'clear-on-edit',
                'color', 'cols', 'counter', 'debounce', 'disabled',
                'enterkeyhint', 'error-text', 'fill', 'helper-text', 'label',
                'label-placement', 'maxlength', 'minlength', 'mode', 'name',
                'placeholder', 'readonly', 'required', 'rows', 'shape',
                'spellcheck', 'value', 'wrap'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionInput': ctx.forward('input'),
            'ionChange': ctx.forward('change'),
            'ionBlur': ctx.forward('blur'),
            'ionFocus': ctx.forward('focus')
        })
    },
    
    'ion-searchbar': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'animated', 'autocomplete', 'autocorrect', 'cancel-button-icon',
                'cancel-button-text', 'clear-icon', 'color', 'debounce',
                'disabled', 'enterkeyhint', 'inputmode', 'mode', 'placeholder',
                'search-icon', 'show-cancel-button', 'show-clear-button',
                'spellcheck', 'type', 'value'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionInput': ctx.forward('input'),
            'ionChange': ctx.forward('change'),
            'ionCancel': ctx.forward('cancel'),
            'ionClear': ctx.forward('clear'),
            'ionBlur': ctx.forward('blur'),
            'ionFocus': ctx.forward('focus')
        })
    },
    
    // Select
    'ion-select': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'cancel-text', 'disabled', 'fill', 'interface',
                'justify', 'label', 'label-placement', 'mode', 'multiple',
                'name', 'ok-text', 'placeholder', 'selected-text', 'shape', 'value'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            // Handle interfaceOptions separately
            const interfaceOptions = el.getAttribute('interface-options');
            if (interfaceOptions) {
                try {
                    attrs.interfaceOptions = JSON.parse(interfaceOptions);
                } catch {
                    attrs.interfaceOptions = interfaceOptions;
                }
            }
            
            return attrs;
        },
        events: (ctx) => ({
            'ionChange': ctx.forward('change'),
            'ionCancel': ctx.forward('cancel'),
            'ionDismiss': ctx.forward('dismiss'),
            'ionFocus': ctx.forward('focus'),
            'ionBlur': ctx.forward('blur')
        })
    },
    
    'ion-select-option': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'value'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    // DateTime
    'ion-datetime': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'cancel-text', 'clear-text', 'color', 'day-values', 'disabled',
                'done-text', 'first-day-of-week', 'hour-cycle', 'hour-values',
                'locale', 'max', 'min', 'minute-values', 'mode', 'month-values',
                'multiple', 'name', 'prefer-wheel', 'presentation', 'readonly',
                'show-clear-button', 'show-default-buttons', 'show-default-time-label',
                'show-default-title', 'size', 'value', 'year-values'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionChange': ctx.forward('change'),
            'ionCancel': ctx.forward('cancel'),
            'ionFocus': ctx.forward('focus'),
            'ionBlur': ctx.forward('blur')
        })
    },
    
    // Navigation
    'ion-segment': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'color', 'disabled', 'mode', 'scrollable', 'select-on-focus',
                'swipe-gesture', 'value'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionChange': ctx.forward('change')
        })
    },
    
    'ion-segment-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'layout', 'mode', 'type', 'value'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    'ion-tabs': {
        attributes: (el) => {
            return {};
        },
        events: (ctx) => ({
            'ionTabsWillChange': ctx.forward('tabswillchange'),
            'ionTabsDidChange': ctx.forward('tabsdidchange')
        })
    },
    
    'ion-tab': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['tab', 'component'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value;
            });
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    'ion-tab-bar': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['color', 'mode', 'selected-tab', 'translucent'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    'ion-tab-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'disabled', 'download', 'href', 'layout', 'mode', 'rel',
                'selected', 'tab', 'target'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    // List & Item
    'ion-list': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['inset', 'lines', 'mode'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    'ion-item': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'button', 'color', 'counter', 'detail', 'detail-icon', 'disabled',
                'download', 'fill', 'href', 'lines', 'mode', 'rel',
                'router-direction', 'router-link', 'shape', 'target', 'type'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    'ion-item-sliding': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const disabled = el.getAttribute('disabled');
            if (disabled !== null) attrs.disabled = disabled === '' ? true : disabled;
            return attrs;
        },
        events: (ctx) => ({
            'ionDrag': ctx.forward('drag')
        })
    },
    
    'ion-item-options': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const side = el.getAttribute('side');
            if (side) attrs.side = side;
            return attrs;
        },
        events: (ctx) => ({
            'ionSwipe': ctx.forward('swipe')
        })
    },
    
    'ion-item-option': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'color', 'disabled', 'download', 'expandable', 'href',
                'mode', 'rel', 'target', 'type'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    // Card
    'ion-card': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'button', 'color', 'disabled', 'download', 'href', 'mode',
                'rel', 'router-direction', 'router-link', 'target', 'type'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    // Modal
    'ion-modal': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'animated', 'backdrop-breakpoint', 'backdrop-dismiss',
                'handle', 'handle-behavior', 'initial-breakpoint', 'is-open',
                'keep-contents-mounted', 'keyboard-close', 'mode',
                'show-backdrop', 'translucent', 'trigger'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            // Handle breakpoints array
            const breakpoints = el.getAttribute('breakpoints');
            if (breakpoints) {
                try {
                    attrs.breakpoints = JSON.parse(breakpoints);
                } catch {
                    attrs.breakpoints = breakpoints.split(',').map(Number);
                }
            }
            
            return attrs;
        },
        events: (ctx) => ({
            'ionModalWillPresent': ctx.forward('modalwillpresent'),
            'ionModalDidPresent': ctx.forward('modaldidpresent'),
            'ionModalWillDismiss': ctx.forward('modalwilldismiss'),
            'ionModalDidDismiss': ctx.forward('modaldiddismiss'),
            'ionBreakpointDidChange': ctx.forward('breakpointdidchange')
        })
    },
    
    // Popover
    'ion-popover': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'alignment', 'animated', 'arrow', 'backdrop-dismiss',
                'dismiss-on-select', 'is-open', 'keep-contents-mounted',
                'keyboard-close', 'mode', 'reference', 'show-backdrop',
                'side', 'size', 'translucent', 'trigger', 'trigger-action'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionPopoverWillPresent': ctx.forward('popoverwillpresent'),
            'ionPopoverDidPresent': ctx.forward('popoverdidpresent'),
            'ionPopoverWillDismiss': ctx.forward('popoverwilldismiss'),
            'ionPopoverDidDismiss': ctx.forward('popoverdiddismiss')
        })
    },
    
    // Loading
    'ion-loading': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'animated', 'backdrop-dismiss', 'duration', 'is-open',
                'keyboard-close', 'message', 'mode', 'show-backdrop',
                'spinner', 'translucent', 'trigger'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionLoadingWillPresent': ctx.forward('loadingwillpresent'),
            'ionLoadingDidPresent': ctx.forward('loadingdidpresent'),
            'ionLoadingWillDismiss': ctx.forward('loadingwilldismiss'),
            'ionLoadingDidDismiss': ctx.forward('loadingdiddismiss')
        })
    },
    
    // Toast
    'ion-toast': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'animated', 'color', 'duration', 'header', 'icon',
                'is-open', 'keyboard-close', 'layout', 'message', 'mode',
                'position', 'position-anchor', 'swipe-gesture', 'translucent', 'trigger'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            // Handle buttons array
            const buttons = el.getAttribute('buttons');
            if (buttons) {
                try {
                    attrs.buttons = JSON.parse(buttons);
                } catch {
                    attrs.buttons = buttons;
                }
            }
            
            return attrs;
        },
        events: (ctx) => ({
            'ionToastWillPresent': ctx.forward('toastwillpresent'),
            'ionToastDidPresent': ctx.forward('toastdidpresent'),
            'ionToastWillDismiss': ctx.forward('toastwilldismiss'),
            'ionToastDidDismiss': ctx.forward('toastdiddismiss')
        })
    },
    
    // Alert
    'ion-alert': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrList = [
                'animated', 'backdrop-dismiss', 'header', 'is-open',
                'keyboard-close', 'message', 'mode', 'sub-header',
                'translucent', 'trigger'
            ];
            
            attrList.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            // Handle complex attributes
            ['buttons', 'inputs'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value) {
                    try {
                        attrs[attr] = JSON.parse(value);
                    } catch {
                        attrs[attr] = value;
                    }
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'ionAlertWillPresent': ctx.forward('alertwillpresent'),
            'ionAlertDidPresent': ctx.forward('alertdidpresent'),
            'ionAlertWillDismiss': ctx.forward('alertwilldismiss'),
            'ionAlertDidDismiss': ctx.forward('alertdiddismiss')
        })
    }
};

// Default transform for unknown Ionic components
export const defaultTransform: ComponentTransform = {
    attributes: (el) => {
        const attrs: Record<string, any> = {};
        Array.from(el.attributes).forEach(attr => {
            if (attr.name !== 'is') {
                // Convert kebab-case to camelCase for Ionic properties
                const camelCase = attr.name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                attrs[camelCase] = attr.value === '' ? true : attr.value;
            }
        });
        return attrs;
    },
    events: () => ({})
};