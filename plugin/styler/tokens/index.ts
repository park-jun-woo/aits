// src/styles/tokens/index.ts
/**
 * Design Token 로더
 */
import colorsJson from './colors.json';
import spacingJson from './spacing.json';
import typographyJson from './typography.json';
import shadowsJson from './shadows.json';
import radiusJson from './radius.json';
import breakpointsJson from './breakpoints.json';

export interface DesignTokens {
  colors: Record<string, any>;
  spacing: Record<string, string>;
  typography: Record<string, any>;
  shadows: Record<string, string>;
  radius: Record<string, string>;
  breakpoints: Record<string, string>;
}

export class TokenManager {
  private static instance: TokenManager;
  private tokens: DesignTokens;
  
  private constructor() {
    this.tokens = this.loadTokens();
  }
  
  static getInstance(): TokenManager {
    if (!this.instance) {
      this.instance = new TokenManager();
    }
    return this.instance;
  }
  
  private loadTokens(): DesignTokens {
    return {
      colors: colorsJson,
      spacing: spacingJson,
      typography: typographyJson,
      shadows: shadowsJson || {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'none': 'none'
      },
      radius: radiusJson || {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px'
      },
      breakpoints: breakpointsJson || {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      }
    };
  }
  
  /**
   * CSS 변수 생성
   */
  generateCSSVariables(): string {
    const lines: string[] = [':root {'];
    
    // Colors
    this.flattenObject(this.tokens.colors, 'color').forEach(([key, value]) => {
      lines.push(`  --aits-${key}: ${value};`);
    });
    
    // Spacing
    Object.entries(this.tokens.spacing).forEach(([key, value]) => {
      lines.push(`  --aits-spacing-${key}: ${value};`);
    });
    
    // Typography
    Object.entries(this.tokens.typography.fontSize).forEach(([key, value]) => {
      lines.push(`  --aits-text-${key}: ${value};`);
    });
    
    Object.entries(this.tokens.typography.fontWeight).forEach(([key, value]) => {
      lines.push(`  --aits-font-${key}: ${value};`);
    });
    
    // Shadows
    Object.entries(this.tokens.shadows).forEach(([key, value]) => {
      const name = key === 'DEFAULT' ? 'shadow' : `shadow-${key}`;
      lines.push(`  --aits-${name}: ${value};`);
    });
    
    // Radius
    Object.entries(this.tokens.radius).forEach(([key, value]) => {
      const name = key === 'DEFAULT' ? 'radius' : `radius-${key}`;
      lines.push(`  --aits-${name}: ${value};`);
    });
    
    lines.push('}');
    
    return lines.join('\n');
  }
  
  /**
   * 중첩 객체를 평탄화
   */
  private flattenObject(obj: any, prefix: string = ''): Array<[string, string]> {
    const result: Array<[string, string]> = [];
    
    const flatten = (current: any, path: string[] = []) => {
      Object.entries(current).forEach(([key, value]) => {
        const newPath = [...path, key];
        
        if (typeof value === 'object' && value !== null) {
          flatten(value, newPath);
        } else {
          const fullKey = newPath.join('-');
          result.push([`${prefix}${prefix ? '-' : ''}${fullKey}`, String(value)]);
        }
      });
    };
    
    flatten(obj);
    return result;
  }
  
  getTokens(): DesignTokens {
    return this.tokens;
  }
  
  /**
   * 토큰 업데이트
   */
  updateTokens(updates: Partial<DesignTokens>): void {
    this.tokens = {
      ...this.tokens,
      ...updates
    };
  }
}