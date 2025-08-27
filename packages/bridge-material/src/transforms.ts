import type { BridgeContext } from '@aits/core';

export interface ComponentTransform {
    attributes?: (el: Element) => Record<string, any>;
    events?: (ctx: BridgeContext) => Record<string, EventListener>;
    slots?: (el: Element) => Record<string, Node[]>;
}

export const componentTransforms: Record<string, ComponentTransform> = {
    // Buttons
    'md-elevated-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'href', 'target', 'type', 'value', 'name', 'form'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    'md-filled-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'href', 'target', 'type', 'value', 'name', 'form'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    'md-outlined-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'href', 'target', 'type', 'value', 'name', 'form'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    'md-text-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'href', 'target', 'type', 'value', 'name', 'form'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    'md-filled-tonal-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'href', 'target', 'type', 'value', 'name', 'form'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    // Icon Buttons
    'md-icon-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'href', 'target', 'toggle', 'selected'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click'),
            'change': ctx.forward('change')
        })
    },
    
    'md-filled-icon-button': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'href', 'target', 'toggle', 'selected'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click'),
            'change': ctx.forward('change')
        })
    },
    
    // Form Controls
    'md-checkbox': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['checked', 'disabled', 'indeterminate', 'required', 'value', 'name'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'change': ctx.forward('change'),
            'input': ctx.forward('input')
        })
    },
    
    'md-switch': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['selected', 'disabled', 'required', 'value', 'name', 'icons', 'show-only-selected-icon'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'change': ctx.forward('change'),
            'input': ctx.forward('input')
        })
    },
    
    'md-radio': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['checked', 'disabled', 'value', 'name'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'change': ctx.forward('change')
        })
    },
    
    // Text Fields
    'md-filled-text-field': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrsToCheck = [
                'disabled', 'error', 'error-text', 'label', 'required', 'value',
                'prefix-text', 'suffix-text', 'supporting-text', 'text-direction',
                'rows', 'cols', 'input-mode', 'max', 'max-length', 'min', 'min-length',
                'pattern', 'placeholder', 'readonly', 'multiple', 'step', 'type',
                'autocomplete', 'name'
            ];
            
            attrsToCheck.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            // Check for icon slots
            attrs.hasLeadingIcon = !!el.querySelector('[slot="leading-icon"]');
            attrs.hasTrailingIcon = !!el.querySelector('[slot="trailing-icon"]');
            
            return attrs;
        },
        events: (ctx) => ({
            'change': ctx.forward('change'),
            'input': ctx.forward('input'),
            'blur': ctx.forward('blur'),
            'focus': ctx.forward('focus')
        })
    },
    
    'md-outlined-text-field': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrsToCheck = [
                'disabled', 'error', 'error-text', 'label', 'required', 'value',
                'prefix-text', 'suffix-text', 'supporting-text', 'text-direction',
                'rows', 'cols', 'input-mode', 'max', 'max-length', 'min', 'min-length',
                'pattern', 'placeholder', 'readonly', 'multiple', 'step', 'type',
                'autocomplete', 'name'
            ];
            
            attrsToCheck.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            attrs.hasLeadingIcon = !!el.querySelector('[slot="leading-icon"]');
            attrs.hasTrailingIcon = !!el.querySelector('[slot="trailing-icon"]');
            
            return attrs;
        },
        events: (ctx) => ({
            'change': ctx.forward('change'),
            'input': ctx.forward('input'),
            'blur': ctx.forward('blur'),
            'focus': ctx.forward('focus')
        })
    },
    
    // Select
    'md-filled-select': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrsToCheck = [
                'disabled', 'error', 'error-text', 'label', 'required', 'value',
                'selected-index', 'display-text', 'menu-align', 'supporting-text', 'name'
            ];
            
            attrsToCheck.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            attrs.hasLeadingIcon = !!el.querySelector('[slot="leading-icon"]');
            
            return attrs;
        },
        events: (ctx) => ({
            'change': ctx.forward('change'),
            'opening': ctx.forward('opening'),
            'opened': ctx.forward('opened'),
            'closing': ctx.forward('closing'),
            'closed': ctx.forward('closed')
        })
    },
    
    'md-outlined-select': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrsToCheck = [
                'disabled', 'error', 'error-text', 'label', 'required', 'value',
                'selected-index', 'display-text', 'menu-align', 'supporting-text', 'name'
            ];
            
            attrsToCheck.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            attrs.hasLeadingIcon = !!el.querySelector('[slot="leading-icon"]');
            
            return attrs;
        },
        events: (ctx) => ({
            'change': ctx.forward('change'),
            'opening': ctx.forward('opening'),
            'opened': ctx.forward('opened'),
            'closing': ctx.forward('closing'),
            'closed': ctx.forward('closed')
        })
    },
    
    'md-select-option': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'selected', 'value'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    // Dialog
    'md-dialog': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['open', 'type', 'no-focus-trap'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'open': ctx.forward('open'),
            'opened': ctx.forward('opened'),
            'close': ctx.forward('close'),
            'closed': ctx.forward('closed'),
            'cancel': ctx.forward('cancel')
        })
    },
    
    // Menu
    'md-menu': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const attrsToCheck = [
                'anchor', 'positioning', 'quick', 'has-overflow', 'open',
                'x-offset', 'y-offset', 'typeahead-delay', 'anchor-corner',
                'menu-corner', 'stay-open-on-outside-click', 'stay-open-on-focusout',
                'skip-restore-focus', 'default-focus'
            ];
            
            attrsToCheck.forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            
            return attrs;
        },
        events: (ctx) => ({
            'opening': ctx.forward('opening'),
            'opened': ctx.forward('opened'),
            'closing': ctx.forward('closing'),
            'closed': ctx.forward('closed')
        })
    },
    
    'md-menu-item': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'type', 'href', 'target', 'keep-open', 'selected'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    // Chips
    'md-chip-set': {
        attributes: (el) => {
            return {};
        },
        events: (ctx) => ({})
    },
    
    'md-assist-chip': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'always-focusable', 'label', 'elevated'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    'md-filter-chip': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'always-focusable', 'label', 'elevated', 'selected', 'removable'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click'),
            'remove': ctx.forward('remove')
        })
    },
    
    'md-input-chip': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'always-focusable', 'label', 'selected', 'remove-only'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click'),
            'remove': ctx.forward('remove')
        })
    },
    
    'md-suggestion-chip': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'always-focusable', 'label', 'elevated'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    // Tabs
    'md-tabs': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['active-tab-index', 'auto-activate'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'change': ctx.forward('change')
        })
    },
    
    'md-primary-tab': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['active', 'has-icon', 'icon-only', 'selected', 'disabled', 'focusable', 'inline-icon'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    'md-secondary-tab': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['active', 'has-icon', 'icon-only', 'selected', 'disabled', 'focusable', 'inline-icon'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    // FAB
    'md-fab': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['variant', 'size', 'label', 'lowered'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    'md-branded-fab': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['variant', 'size', 'label', 'lowered'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    // Slider
    'md-slider': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'min', 'max', 'value', 'value-start', 'value-end', 'step', 
             'tickmarks', 'labeled', 'range', 'name'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) {
                    const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    attrs[camelCase] = value === '' ? true : value;
                }
            });
            return attrs;
        },
        events: (ctx) => ({
            'input': ctx.forward('input'),
            'change': ctx.forward('change')
        })
    },
    
    // Progress
    'md-linear-progress': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['value', 'max', 'indeterminate', 'four-color'].forEach(attr => {
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
    
    'md-circular-progress': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['value', 'max', 'indeterminate', 'four-color'].forEach(attr => {
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
    
    // List
    'md-list': {
        attributes: (el) => {
            return {};
        },
        events: (ctx) => ({})
    },
    
    'md-list-item': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'type', 'href', 'target', 'selected', 'activated'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({
            'click': ctx.forward('click')
        })
    },
    
    // Divider
    'md-divider': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['inset', 'inset-start', 'inset-end'].forEach(attr => {
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
    
    // Ripple
    'md-ripple': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            ['disabled', 'unbounded'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value !== null) attrs[attr] = value === '' ? true : value;
            });
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    // Elevation
    'md-elevation': {
        attributes: (el) => {
            const attrs: Record<string, any> = {};
            const level = el.getAttribute('level');
            if (level) attrs.level = parseInt(level);
            return attrs;
        },
        events: (ctx) => ({})
    },
    
    // Icon
    'md-icon': {
        attributes: (el) => {
            return {};
        },
        events: (ctx) => ({})
    }
};

// Default transform for unknown Material components
export const defaultTransform: ComponentTransform = {
    attributes: (el) => {
        const attrs: Record<string, any> = {};
        Array.from(el.attributes).forEach(attr => {
            if (attr.name !== 'is') {
                attrs[attr.name] = attr.value;
            }
        });
        return attrs;
    },
    events: () => ({})
};