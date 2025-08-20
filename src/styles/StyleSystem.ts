// src/styles/StyleSystem.ts
/**
 * 재설계된 StyleSystem - 전역 스타일만 관리
 */
import { TokenManager } from './tokens';
import { UtilityGenerator } from './utilities/UtilityGenerator';
import { glob } from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

export interface StyleSystemConfig {
  viewPaths?: string[];
  outputPath?: string;
  includePaths?: string[];
  customTokens?: any;
}

export class StyleSystem {
  private static instance: StyleSystem;
  private tokenManager: TokenManager;
  private utilityGenerator: UtilityGenerator;
  private usedClasses: Set<string> = new Set();
  private viewStyles: Map<string, string> = new Map();
  private config: StyleSystemConfig;
  
  private constructor(config: StyleSystemConfig = {}) {
    this.config = {
      viewPaths: ['src/views/**/*.html', 'views/**/*.html'],
      outputPath: 'dist',
      includePaths: ['src/styles'],
      ...config
    };
    
    this.tokenManager = TokenManager.getInstance();
    if (config.customTokens) {
      this.tokenManager.updateTokens(config.customTokens);
    }
    
    this.utilityGenerator = new UtilityGenerator(this.tokenManager.getTokens());
  }
  
  static getInstance(config?: StyleSystemConfig): StyleSystem {
    if (!this.instance) {
      this.instance = new StyleSystem(config);
    }
    return this.instance;
  }
  
  /**
   * 빌드 프로세스 실행
   */
  async build(): Promise<void> {
    console.log('🚀 Starting Aits style build...');
    
    // 1. View 파일 스캔
    await this.scanViews();
    
    // 2. Controller 파일 스캔
    await this.scanControllers();
    
    // 3. CSS 생성
    const css = await this.generateCSS();
    
    // 4. 파일 출력
    await this.outputCSS(css);
    
    console.log('✅ Style build complete!');
  }
  
  /**
   * View 파일 스캔
   */
  private async scanViews(): Promise<void> {
    console.log('📖 Scanning view files...');
    
    for (const pattern of this.config.viewPaths!) {
      const files = await glob(pattern);
      
      for (const file of files) {
        await this.scanFile(file);
      }
    }
    
    console.log(`Found ${this.usedClasses.size} unique classes`);
  }
  
  /**
   * Controller 파일 스캔
   */
  private async scanControllers(): Promise<void> {
    console.log('🔍 Scanning controller files...');
    
    const patterns = [
      'src/controllers/**/*.{ts,js}',
      'controllers/**/*.{ts,js}'
    ];
    
    for (const pattern of patterns) {
      const files = await glob(pattern);
      
      for (const file of files) {
        await this.scanFile(file);
      }
    }
  }
  
  /**
   * 파일 스캔
   */
  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 클래스 추출
      const classRegex = /class=["']([^"']+)["']/g;
      let match;
      
      while ((match = classRegex.exec(content)) !== null) {
        const classes = match[1].split(/\s+/);
        classes.forEach(cls => {
          if (cls) {
            this.usedClasses.add(cls);
            this.utilityGenerator.trackClass(cls);
          }
        });
      }
      
      // View 전용 스타일 추출
      if (filePath.includes('view')) {
        const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        if (styleMatch) {
          const viewName = path.basename(filePath, path.extname(filePath));
          this.viewStyles.set(viewName, styleMatch[1]);
        }
      }
      
    } catch (error) {
      console.warn(`Failed to scan ${filePath}:`, error);
    }
  }
  
  /**
   * CSS 생성
   */
  private async generateCSS(): Promise<{
    core: string;
    utilities: string;
    views: string;
  }> {
    console.log('🎨 Generating CSS...');
    
    // 1. Core CSS (항상 포함)
    const core = await this.generateCoreCSS();
    
    // 2. Utility CSS (사용된 것만)
    const utilities = this.utilityGenerator.generateUtilities();
    
    // 3. View CSS
    const views = this.generateViewCSS();
    
    return { core, utilities, views };
  }
  
  /**
   * Core CSS 생성
   */
  private async generateCoreCSS(): Promise<string> {
    const parts: string[] = [];
    
    // CSS Variables
    parts.push('@layer aits.tokens {');
    parts.push(this.tokenManager.generateCSSVariables());
    parts.push('}');
    
    // Reset CSS
    const resetPath = path.join(this.config.includePaths![0], 'base/reset.css');
    try {
      const reset = await fs.readFile(resetPath, 'utf-8');
      parts.push('@layer aits.reset {');
      parts.push(reset);
      parts.push('}');
    } catch {}
    
    // Global CSS
    const globalPath = path.join(this.config.includePaths![0], 'base/global.css');
    try {
      const global = await fs.readFile(globalPath, 'utf-8');
      parts.push(global);
    } catch {}
    
    return parts.join('\n\n');
  }
  
  /**
   * View CSS 생성
   */
  private generateViewCSS(): string {
    if (this.viewStyles.size === 0) return '';
    
    const parts: string[] = ['@layer aits.views {'];
    
    this.viewStyles.forEach((css, viewName) => {
      parts.push(`/* View: ${viewName} */`);
      parts.push(`.aits-view-${viewName} {`);
      parts.push(css);
      parts.push('}');
    });
    
    parts.push('}');
    
    return parts.join('\n');
  }
  
  /**
   * CSS 파일 출력
   */
  private async outputCSS(css: {
    core: string;
    utilities: string;
    views: string;
  }): Promise<void> {
    console.log('💾 Writing CSS files...');
    
    const outputDir = this.config.outputPath!;
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write separate files
    await fs.writeFile(
      path.join(outputDir, 'aits-core.css'),
      css.core
    );
    
    if (css.utilities) {
      await fs.writeFile(
        path.join(outputDir, 'aits-utils.css'),
        css.utilities
      );
    }
    
    if (css.views) {
      await fs.writeFile(
        path.join(outputDir, 'aits-views.css'),
        css.views
      );
    }
    
    // Write combined file
    const combined = [css.core, css.utilities, css.views]
      .filter(Boolean)
      .join('\n\n');
    
    await fs.writeFile(
      path.join(outputDir, 'aits.css'),
      combined
    );
    
    console.log(`📁 CSS files written to ${outputDir}/`);
  }
}