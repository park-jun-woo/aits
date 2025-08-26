// plugin/vite-plugin-defect.ts
/// <reference types="vite/client" />

/**
 * =================================================================
 * vite-plugin-defect.ts - Vite용 코드 결함 감지 플러그인
 * =================================================================
 * @description
 * - 빌드 타임 코드 분석
 * - 런타임 에러 감지
 * - HMR을 통한 자동 패치 적용
 * @author Aits Framework
 * @version 1.0.0
 */

import type { Plugin, ViteDevServer } from 'vite';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs/promises';
import { BuildTimeAnalyzer, DefectInfo, DefectType } from './defect/Defect';

export interface DefectPluginOptions {
  // 분석 활성화 옵션
  enabled?: boolean;
  enableBuildTime?: boolean;
  enableRuntime?: boolean;
  
  // 분석 대상
  include?: string[];
  exclude?: string[];
  
  // 보고 옵션
  reportLevel?: 'error' | 'warning' | 'info';
  outputFile?: string;
  
  // 자동 수정 옵션
  autoFix?: boolean;
  autoFixInProduction?: boolean;
  
  // UI 옵션
  showOverlay?: boolean;
  overlayPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function defect(options: DefectPluginOptions = {}): Plugin {
  const config: DefectPluginOptions = {
    enabled: true,
    enableBuildTime: true,
    enableRuntime: true,
    include: ['**/*.{ts,tsx,js,jsx}'],
    exclude: ['node_modules/**', 'dist/**'],
    reportLevel: 'warning',
    autoFix: true,
    autoFixInProduction: false,
    showOverlay: true,
    overlayPosition: 'bottom-right',
    ...options
  };
  
  let server: ViteDevServer | null = null;
  let analyzer: BuildTimeAnalyzer | null = null;
  let defects: DefectInfo[] = [];
  let tsProgram: ts.Program | null = null;
  
  return {
    name: 'vite-plugin-defect',
    enforce: 'pre',
    
    /**
     * 빌드 시작 시 초기화
     */
    async buildStart() {
      if (!config.enabled || !config.enableBuildTime) return;
      
      analyzer = new BuildTimeAnalyzer();
      defects = [];
      
      // TypeScript 프로그램 생성
      const configPath = ts.findConfigFile(
        process.cwd(),
        ts.sys.fileExists,
        'tsconfig.json'
      );
      
      if (configPath) {
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        const compilerOptions = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          process.cwd()
        );
        
        tsProgram = ts.createProgram(
          compilerOptions.fileNames,
          compilerOptions.options
        );
      }
    },
    
    /**
     * 각 파일 변환 시 분석
     */
    async transform(code: string, id: string) {
      if (!config.enabled || !config.enableBuildTime || !analyzer) {
        return null;
      }
      
      // 제외 파일 체크
      if (config.exclude?.some(pattern => id.includes(pattern))) {
        return null;
      }
      
      const ext = path.extname(id);
      let fileDefects: DefectInfo[] = [];  // 여기에 선언 추가
      
      // TypeScript 파일 분석
      if (ext === '.ts' || ext === '.tsx') {
        if (tsProgram) {
          const sourceFile = tsProgram.getSourceFile(id);
          if (sourceFile) {
            const fileDefects = analyzer.analyzeTypeScript(sourceFile);
            defects.push(...fileDefects);
            
            // 자동 수정
            if (config.autoFix && fileDefects.some(d => d.autoFixable)) {
              code = await applyAutoFixes(code, fileDefects);
            }
          }
        }
      }
      
      // JavaScript 파일 분석
      if (ext === '.js' || ext === '.jsx') {
        const fileDefects = analyzer.analyzeJavaScript(code, id);
        defects.push(...fileDefects);
        
        // 자동 수정
        if (config.autoFix && fileDefects.some(d => d.autoFixable)) {
          code = await applyAutoFixes(code, fileDefects);
        }
      }
      
      // 에러/경고 출력
      reportDefects(fileDefects, config.reportLevel!);
      
      return { code };
    },
    
    /**
     * 개발 서버 설정
     */
    configureServer(devServer) {
      server = devServer;
      
      // HMR 핸들러 등록
      server.ws.on('aits:apply-patch', async (data) => {
        const { file, line, patch } = data;
        
        try {
          // 파일 읽기
          const filePath = path.resolve(process.cwd(), file);
          let content = await fs.readFile(filePath, 'utf-8');
          
          // 패치 적용
          const lines = content.split('\n');
          if (lines[line - 1]) {
            lines[line - 1] = patch;
            content = lines.join('\n');
            
            // 파일 저장
            await fs.writeFile(filePath, content);
            
            // HMR 트리거 - server null 체크
            if (server) {  // null 체크 추가
                const module = server.moduleGraph.getModuleById(filePath);
                if (module) {
                    server.reloadModule(module);
                }
            }
            
            console.log(`✅ [Defect] Auto-fix applied to ${file}:${line}`);
          }
        } catch (error) {
          console.error('[Defect] Failed to apply patch:', error);
        }
      });
      
      // 실시간 파일 감시
      server.watcher.on('change', async (file) => {
        if (!config.enabled || !config.enableBuildTime) return;
        
        const ext = path.extname(file);
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          // 변경된 파일 재분석
          await analyzeFile(file);
        }
      });
    },
    
    /**
     * HTML에 런타임 스크립트 주입
     */
    transformIndexHtml() {
      if (!config.enabled || !config.enableRuntime) return;
      
      const runtimeScript = generateRuntimeScript(config);
      const overlayStyles = generateOverlayStyles(config);
      
      return [
        {
          tag: 'style',
          attrs: { type: 'text/css' },
          children: overlayStyles,
          injectTo: 'head'
        },
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: runtimeScript,
          injectTo: 'body'
        }
      ];
    },
    
    /**
     * 빌드 완료 시 보고서 생성
     */
    async buildEnd() {
      if (!config.enabled || defects.length === 0) return;
      
      // 심각도별 그룹화
      const grouped = defects.reduce((acc, defect) => {
        acc[defect.severity] = acc[defect.severity] || [];
        acc[defect.severity].push(defect);
        return acc;
      }, {} as Record<string, DefectInfo[]>);
      
      // 콘솔 출력
      console.log('\n📊 Code Defect Report:');
      console.log('=======================');
      
      if (grouped.error) {
        console.log(`❌ Errors: ${grouped.error.length}`);
      }
      if (grouped.warning) {
        console.log(`⚠️  Warnings: ${grouped.warning.length}`);
      }
      if (grouped.info) {
        console.log(`ℹ️  Info: ${grouped.info.length}`);
      }
      
      // 파일 출력
      if (config.outputFile) {
        const report = {
          timestamp: new Date().toISOString(),
          summary: {
            total: defects.length,
            errors: grouped.error?.length || 0,
            warnings: grouped.warning?.length || 0,
            info: grouped.info?.length || 0
          },
          defects: defects.map(d => ({
            ...d,
            file: path.relative(process.cwd(), d.file)
          }))
        };
        
        await fs.writeFile(
          config.outputFile,
          JSON.stringify(report, null, 2)
        );
        
        console.log(`\n📝 Report saved to: ${config.outputFile}`);
      }
    },
    
    /**
     * HMR API 타입 정의
     */
    handleHotUpdate({ file, server, modules }) {
      if (!config.enabled) return;
      
      // 결함이 있는 파일이 업데이트되면 재분석
      const hasDefects = defects.some(d => d.file === file);
      if (hasDefects) {
        console.log(`🔍 [Defect] Re-analyzing ${path.basename(file)}...`);
      }
      
      return modules;
    }
  };
  
  /**
   * 개별 파일 분석
   */
  async function analyzeFile(filePath: string): Promise<void> {
    if (!analyzer) return;
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath);
      let fileDefects: DefectInfo[] = [];
      
      if (ext === '.ts' || ext === '.tsx') {
        if (tsProgram) {
          const sourceFile = tsProgram.getSourceFile(filePath);
          if (sourceFile) {
            fileDefects = analyzer.analyzeTypeScript(sourceFile);
          }
        }
      } else if (ext === '.js' || ext === '.jsx') {
        fileDefects = analyzer.analyzeJavaScript(content, filePath);
      }
      
      // 기존 결함 제거
      defects = defects.filter(d => d.file !== filePath);
      defects.push(...fileDefects);
      
      // 브라우저에 알림
      if (server && fileDefects.length > 0) {
        server.ws.send({
          type: 'custom',
          event: 'defect:detected',
          data: fileDefects
        });
      }
    } catch (error) {
      console.error(`[Defect] Failed to analyze ${filePath}:`, error);
    }
  }
}

/**
 * 자동 수정 적용
 */
async function applyAutoFixes(code: string, defects: DefectInfo[]): Promise<string> {
  let fixedCode = code;
  const lines = code.split('\n');
  
  // 라인 번호 역순으로 정렬 (아래서부터 수정)
  const sortedDefects = defects
    .filter(d => d.autoFixable && d.patch)
    .sort((a, b) => b.line - a.line);
  
  for (const defect of sortedDefects) {
    if (defect.patch && lines[defect.line - 1]) {
      // 간단한 패치 적용
      const line = lines[defect.line - 1];
      const indent = line.match(/^\s*/)?.[0] || '';
      lines[defect.line - 1] = indent + defect.patch;
      
      console.log(`🔧 [Defect] Auto-fixed: ${defect.message} at line ${defect.line}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * 결함 보고
 */
function reportDefects(defects: DefectInfo[], level: string): void {
  defects.forEach(defect => {
    const location = `${defect.file}:${defect.line}:${defect.column}`;
    const message = `${defect.message}${defect.suggestion ? ` (Suggestion: ${defect.suggestion})` : ''}`;
    
    switch (defect.severity) {
      case 'error':
        console.error(`❌ ${location} - ${message}`);
        break;
      case 'warning':
        if (level !== 'error') {
          console.warn(`⚠️  ${location} - ${message}`);
        }
        break;
      case 'info':
        if (level === 'info') {
          console.info(`ℹ️  ${location} - ${message}`);
        }
        break;
    }
  });
}

/**
 * 런타임 스크립트 생성
 */
function generateRuntimeScript(config: DefectPluginOptions): string {
  return `
    import { Defect } from '/plugin/defect/Defect.js';
    
    // 전역 에러 핸들러 설치
    Defect.install();
    
    // HMR 연결
    if (import.meta.hot) {
      import.meta.hot.on('defect:detected', (defects) => {
        defects.forEach(defect => {
          const d = new Defect(defect);
          ${config.showOverlay ? 'd.notifyDeveloper();' : ''}
          
          // 자동 수정 시도
          ${config.autoFix ? `
          d.generatePatch().then(patch => {
            if (patch) {
              console.log('[Defect] Auto-fix available:', patch);
            }
          });
          ` : ''}
        });
      });
    }
    
    // 개발자 도구 확장
    window.__AITS_DEFECT__ = {
      getDefects: () => Defect.getDefects(),
      clear: () => Defect.clear(),
      config: ${JSON.stringify(config)}
    };
    
    console.log('[Defect] Runtime monitoring enabled');
  `;
}

/**
 * 오버레이 스타일 생성
 */
function generateOverlayStyles(config: DefectPluginOptions): string {
  const positions = {
    'top-right': 'top: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;',
    'bottom-right': 'bottom: 20px; right: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;'
  };
  
  return `
    .aits-defect-overlay {
      position: fixed;
      ${positions[config.overlayPosition || 'bottom-right']}
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 16px;
      max-width: 400px;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    .aits-defect-overlay .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .aits-defect-overlay .title {
      font-weight: 600;
      color: #111827;
    }
    
    .aits-defect-overlay .close {
      background: none;
      border: none;
      font-size: 20px;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .aits-defect-overlay .close:hover {
      color: #111827;
    }
    
    .aits-defect-overlay .content {
      font-size: 14px;
    }
    
    .aits-defect-overlay .file {
      color: #6b7280;
      font-size: 12px;
      margin-bottom: 8px;
      font-family: 'Courier New', monospace;
    }
    
    .aits-defect-overlay .message {
      color: #111827;
      margin-bottom: 8px;
    }
    
    .aits-defect-overlay .suggestion {
      background: #f9fafb;
      border-left: 3px solid #3b82f6;
      padding: 8px;
      margin: 8px 0;
    }
    
    .aits-defect-overlay .suggestion code {
      background: white;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    
    .aits-defect-overlay details {
      margin-top: 8px;
    }
    
    .aits-defect-overlay summary {
      cursor: pointer;
      color: #6b7280;
      font-size: 12px;
    }
    
    .aits-defect-overlay pre {
      background: #f9fafb;
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 11px;
      margin: 4px 0 0 0;
    }
    
    .aits-defect-overlay .actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;
    }
    
    .aits-defect-overlay button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .aits-defect-overlay .auto-fix {
      background: #3b82f6;
      color: white;
      border: none;
    }
    
    .aits-defect-overlay .auto-fix:hover {
      background: #2563eb;
    }
    
    .aits-defect-overlay .auto-fix:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  `;
}