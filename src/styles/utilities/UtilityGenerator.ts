// src/styles/utilities/UtilityGenerator.ts
/**
 * 유틸리티 클래스 생성기
 */
export class UtilityGenerator {
  private usedClasses: Set<string> = new Set();
  private tokens: any;
  
  constructor(tokens: any) {
    this.tokens = tokens;
  }
  
  /**
   * 사용된 클래스 추적
   */
  trackClass(className: string): void {
    this.usedClasses.add(className);
  }
  
  /**
   * 유틸리티 CSS 생성
   */
  generateUtilities(): string {
    const utilities: string[] = [];
    
    // Spacing utilities
    if (this.hasClassPattern('p-', 'm-')) {
      utilities.push(this.generateSpacingUtilities());
    }
    
    // Text utilities
    if (this.hasClassPattern('text-')) {
      utilities.push(this.generateTextUtilities());
    }
    
    // Background utilities
    if (this.hasClassPattern('bg-')) {
      utilities.push(this.generateBackgroundUtilities());
    }
    
    // Display utilities
    if (this.hasClassPattern('flex', 'grid', 'block', 'hidden')) {
      utilities.push(this.generateDisplayUtilities());
    }
    
    // Shadow utilities
    if (this.hasClassPattern('shadow-')) {
      utilities.push(this.generateShadowUtilities());
    }
    
    return utilities.join('\n\n');
  }
  
  private hasClassPattern(...patterns: string[]): boolean {
    return patterns.some(pattern => 
      Array.from(this.usedClasses).some(cls => cls.includes(pattern))
    );
  }
  
  private generateSpacingUtilities(): string {
    const rules: string[] = [];
    
    Object.entries(this.tokens.spacing).forEach(([key, value]) => {
      // Padding
      if (this.usedClasses.has(`p-${key}`)) {
        rules.push(`.p-${key} { padding: ${value}; }`);
      }
      if (this.usedClasses.has(`px-${key}`)) {
        rules.push(`.px-${key} { padding-left: ${value}; padding-right: ${value}; }`);
      }
      if (this.usedClasses.has(`py-${key}`)) {
        rules.push(`.py-${key} { padding-top: ${value}; padding-bottom: ${value}; }`);
      }
      
      // Margin
      if (this.usedClasses.has(`m-${key}`)) {
        rules.push(`.m-${key} { margin: ${value}; }`);
      }
      if (this.usedClasses.has(`mx-${key}`)) {
        rules.push(`.mx-${key} { margin-left: ${value}; margin-right: ${value}; }`);
      }
      if (this.usedClasses.has(`my-${key}`)) {
        rules.push(`.my-${key} { margin-top: ${value}; margin-bottom: ${value}; }`);
      }
    });
    
    return rules.join('\n');
  }
  
  private generateTextUtilities(): string {
    const rules: string[] = [];
    
    // Font sizes
    Object.entries(this.tokens.typography.fontSize).forEach(([key, value]) => {
      if (this.usedClasses.has(`text-${key}`)) {
        rules.push(`.text-${key} { font-size: ${value}; }`);
      }
    });
    
    // Font weights
    Object.entries(this.tokens.typography.fontWeight).forEach(([key, value]) => {
      if (this.usedClasses.has(`font-${key}`)) {
        rules.push(`.font-${key} { font-weight: ${value}; }`);
      }
    });
    
    // Text colors
    this.generateColorUtilities('text', 'color', rules);
    
    return rules.join('\n');
  }
  
  private generateBackgroundUtilities(): string {
    const rules: string[] = [];
    this.generateColorUtilities('bg', 'background-color', rules);
    return rules.join('\n');
  }
  
  private generateColorUtilities(prefix: string, property: string, rules: string[]): void {
    const processColors = (colors: any, path: string[] = []) => {
      Object.entries(colors).forEach(([key, value]) => {
        if (typeof value === 'object') {
          processColors(value, [...path, key]);
        } else {
          const className = path.length > 0 
            ? `${prefix}-${path.join('-')}-${key}`
            : `${prefix}-${key}`;
          
          if (this.usedClasses.has(className)) {
            rules.push(`.${className} { ${property}: ${value}; }`);
          }
        }
      });
    };
    
    processColors(this.tokens.colors);
  }
  
  private generateDisplayUtilities(): string {
    const rules: string[] = [];
    
    const displays = {
      'flex': 'display: flex;',
      'inline-flex': 'display: inline-flex;',
      'grid': 'display: grid;',
      'block': 'display: block;',
      'inline-block': 'display: inline-block;',
      'inline': 'display: inline;',
      'hidden': 'display: none;'
    };
    
    Object.entries(displays).forEach(([key, value]) => {
      if (this.usedClasses.has(key)) {
        rules.push(`.${key} { ${value} }`);
      }
    });
    
    // Flex utilities
    if (this.usedClasses.has('flex')) {
      if (this.usedClasses.has('flex-row')) rules.push('.flex-row { flex-direction: row; }');
      if (this.usedClasses.has('flex-col')) rules.push('.flex-col { flex-direction: column; }');
      if (this.usedClasses.has('items-center')) rules.push('.items-center { align-items: center; }');
      if (this.usedClasses.has('justify-center')) rules.push('.justify-center { justify-content: center; }');
      if (this.usedClasses.has('gap-2')) rules.push('.gap-2 { gap: 0.5rem; }');
      if (this.usedClasses.has('gap-4')) rules.push('.gap-4 { gap: 1rem; }');
    }
    
    return rules.join('\n');
  }
  
  private generateShadowUtilities(): string {
    const rules: string[] = [];
    
    Object.entries(this.tokens.shadows).forEach(([key, value]) => {
      const className = key === 'DEFAULT' ? 'shadow' : `shadow-${key}`;
      if (this.usedClasses.has(className)) {
        rules.push(`.${className} { box-shadow: ${value}; }`);
      }
    });
    
    return rules.join('\n');
  }
}