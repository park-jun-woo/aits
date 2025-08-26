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
      
      // variant 매핑
      const variant = el.getAttribute('variant');
      if (variant) {
        const variantMap: Record<string, string> = {
          'primary': 'primary',
          'secondary': 'default',
          'success': 'success',
          'warning': 'warning',
          'danger': 'danger',
          'neutral': 'neutral'
        };
        attrs.variant = variantMap[variant] || variant;
      }
      
      // size 매핑
      const size = el.getAttribute('size');
      if (size) attrs.size = size;
      
      // 기타 속성
      ['disabled', 'loading', 'pill', 'circle', 'type', 'href', 'target', 'download'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value !== null) attrs[attr] = value === '' ? true : value;
      });
      
      return attrs;
    },
    events: (ctx) => ({
      'sl-blur': ctx.forward('blur'),
      'sl-focus': ctx.forward('focus'),
      'click': ctx.forward('click')
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
      'sl-hide': ctx.forward('hide')
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
      'sl-show': ctx.forward('open'),
      'sl-after-show': ctx.forward('opened'),
      'sl-hide': ctx.forward('close'),
      'sl-after-hide': ctx.forward('closed'),
      'sl-initial-focus': ctx.forward('initialfocus'),
      'sl-request-close': ctx.forward('requestclose')
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
      'sl-show': ctx.forward('open'),
      'sl-after-show': ctx.forward('opened'),
      'sl-hide': ctx.forward('close'),
      'sl-after-hide': ctx.forward('closed'),
      'sl-initial-focus': ctx.forward('initialfocus'),
      'sl-request-close': ctx.forward('requestclose')
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
      'sl-after-show': ctx.forward('shown'),
      'sl-hide': ctx.forward('hide'),
      'sl-after-hide': ctx.forward('hidden')
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
      'sl-after-show': ctx.forward('shown'),
      'sl-hide': ctx.forward('hide'),
      'sl-after-hide': ctx.forward('hidden')
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
      'sl-tab-show': ctx.forward('tabshow'),
      'sl-tab-hide': ctx.forward('tabhide')
    })
  }
};

// 기본 변환 규칙 (정의되지 않은 컴포넌트용)
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