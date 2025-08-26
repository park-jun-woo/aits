import type { BridgeContext } from '@aits/core';

export interface ComponentTransform {
  attributes?: (el: Element) => Record<string, any>;
  events?: (ctx: BridgeContext) => Record<string, EventListener>;
  slots?: (el: Element) => Record<string, Node[]>;
}

export const componentTransforms: Record<string, ComponentTransform> = {
  'sl-button': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      // 모든 속성을 camelCase로 변환
      Array.from(el.attributes).forEach(attr => {
        if (attr.name !== 'is') {
          const camelCase = attr.name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          attrs[camelCase] = attr.value === '' ? true : attr.value;
        }
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'click': ctx.forward('click'),
      'sl-blur': ctx.forward('blur'),
      'sl-focus': ctx.forward('focus')
    })
  },
  
  'sl-input': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      ['type', 'name', 'value', 'placeholder', 'size', 'label', 'help-text',
       'disabled', 'readonly', 'required', 'clearable', 'password-toggle',
       'filled', 'pill', 'no-spin-buttons', 'min', 'max', 'step', 'pattern',
       'minlength', 'maxlength', 'autocomplete', 'autocorrect', 'autocapitalize',
       'spellcheck', 'inputmode'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value !== null) {
          const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          attrs[camelCase] = value === '' ? true : value;
        }
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-blur': ctx.forward('blur'),
      'sl-change': ctx.forward('change'),
      'sl-clear': ctx.forward('clear'),
      'sl-focus': ctx.forward('focus'),
      'sl-input': ctx.forward('input'),
      'sl-invalid': ctx.forward('invalid')
    })
  },
  
  'sl-textarea': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      ['name', 'value', 'placeholder', 'size', 'label', 'help-text',
       'rows', 'resize', 'disabled', 'readonly', 'required',
       'filled', 'minlength', 'maxlength', 'autocomplete', 'autocorrect',
       'autocapitalize', 'spellcheck', 'inputmode'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value !== null) {
          const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          attrs[camelCase] = value === '' ? true : value;
        }
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-blur': ctx.forward('blur'),
      'sl-change': ctx.forward('change'),
      'sl-focus': ctx.forward('focus'),
      'sl-input': ctx.forward('input'),
      'sl-invalid': ctx.forward('invalid')
    })
  },
  
  'sl-select': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      ['name', 'value', 'multiple', 'placeholder', 'size', 'label', 'help-text',
       'disabled', 'clearable', 'required', 'hoist', 'filled', 'pill',
       'max-options-visible'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value !== null) {
          const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          attrs[camelCase] = value === '' ? true : value;
        }
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-blur': ctx.forward('blur'),
      'sl-change': ctx.forward('change'),
      'sl-clear': ctx.forward('clear'),
      'sl-focus': ctx.forward('focus'),
      'sl-show': ctx.forward('show'),
      'sl-hide': ctx.forward('hide'),
      'sl-after-show': ctx.forward('after-show'),
      'sl-after-hide': ctx.forward('after-hide')
    })
  },
  
  'sl-checkbox': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      ['name', 'value', 'disabled', 'required', 'checked', 'indeterminate', 'size'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value !== null) attrs[attr] = value === '' ? true : value;
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-blur': ctx.forward('blur'),
      'sl-change': ctx.forward('change'),
      'sl-focus': ctx.forward('focus'),
      'sl-input': ctx.forward('input')
    })
  },
  
  'sl-radio': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      ['name', 'value', 'disabled', 'checked', 'size'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value !== null) attrs[attr] = value === '' ? true : value;
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-blur': ctx.forward('blur'),
      'sl-focus': ctx.forward('focus')
    })
  },
  
  'sl-switch': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      ['name', 'value', 'disabled', 'required', 'checked', 'size'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value !== null) attrs[attr] = value === '' ? true : value;
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-blur': ctx.forward('blur'),
      'sl-change': ctx.forward('change'),
      'sl-focus': ctx.forward('focus'),
      'sl-input': ctx.forward('input')
    })
  },
  
  'sl-dialog': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      const label = el.getAttribute('label') || el.getAttribute('title');
      if (label) attrs.label = label;
      
      if (el.hasAttribute('open')) attrs.open = true;
      if (el.hasAttribute('no-header')) attrs.noHeader = true;
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-show': ctx.forward('show'),
      'sl-after-show': ctx.forward('after-show'),
      'sl-hide': ctx.forward('hide'),
      'sl-after-hide': ctx.forward('after-hide'),
      'sl-initial-focus': ctx.forward('initial-focus'),
      'sl-request-close': ctx.forward('request-close')
    })
  },
  
  'sl-drawer': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      const label = el.getAttribute('label') || el.getAttribute('title');
      if (label) attrs.label = label;
      
      const placement = el.getAttribute('placement');
      if (placement) attrs.placement = placement;
      
      if (el.hasAttribute('open')) attrs.open = true;
      if (el.hasAttribute('contained')) attrs.contained = true;
      if (el.hasAttribute('no-header')) attrs.noHeader = true;
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-show': ctx.forward('show'),
      'sl-after-show': ctx.forward('after-show'),
      'sl-hide': ctx.forward('hide'),
      'sl-after-hide': ctx.forward('after-hide'),
      'sl-initial-focus': ctx.forward('initial-focus'),
      'sl-request-close': ctx.forward('request-close')
    })
  },
  
  'sl-alert': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      const variant = el.getAttribute('variant');
      if (variant) attrs.variant = variant;
      
      if (el.hasAttribute('open')) attrs.open = true;
      if (el.hasAttribute('closable')) attrs.closable = true;
      
      const duration = el.getAttribute('duration');
      if (duration) attrs.duration = parseInt(duration);
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-show': ctx.forward('show'),
      'sl-after-show': ctx.forward('after-show'),
      'sl-hide': ctx.forward('hide'),
      'sl-after-hide': ctx.forward('after-hide')
    })
  },
  
  'sl-dropdown': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      ['placement', 'distance', 'skidding', 'open', 'hoist', 'disabled'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value !== null) attrs[attr] = value === '' ? true : value;
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-show': ctx.forward('show'),
      'sl-after-show': ctx.forward('after-show'),
      'sl-hide': ctx.forward('hide'),
      'sl-after-hide': ctx.forward('after-hide')
    })
  },
  
  'sl-tab-group': {
    attributes: (el) => {
      const attrs: Record<string, any> = {};
      
      ['placement', 'activation', 'no-scroll-controls'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value !== null) {
          const camelCase = attr.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          attrs[camelCase] = value === '' ? true : value;
        }
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-tab-show': ctx.forward('tab-show'),
      'sl-tab-hide': ctx.forward('tab-hide')
    })
  }
};

// 기본 변환 규칙
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