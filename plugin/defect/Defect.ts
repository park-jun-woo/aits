/// <reference types="vite/client" />
/**
 * =================================================================
 * Defect.ts - 코드 결함 감지 및 자동 수정 시스템
 * =================================================================
 * @description
 * - 빌드 타임 코드 분석
 * - 런타임 코드 에러 감지
 * - AI 자동 패치 생성
 * @author Aits Framework
 * @version 1.0.0
 */

import * as ts from 'typescript';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

// 결함 타입
export enum DefectType {
  UNDEFINED_REFERENCE = 'undefined_reference',
  NULL_POINTER = 'null_pointer',
  TYPE_MISMATCH = 'type_mismatch',
  INFINITE_LOOP = 'infinite_loop',
  MEMORY_LEAK = 'memory_leak',
  RACE_CONDITION = 'race_condition',
  DEAD_CODE = 'dead_code',
  SECURITY_VULNERABILITY = 'security_vulnerability'
}

// 결함 정보
export interface DefectInfo {
  type: DefectType;
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  autoFixable?: boolean;
  patch?: string;
}

// 빌드 타임 분석기
export class BuildTimeAnalyzer {
  private defects: DefectInfo[] = [];
  
  /**
   * TypeScript 코드 분석
   */
  analyzeTypeScript(sourceFile: ts.SourceFile): DefectInfo[] {
    const defects: DefectInfo[] = [];
    
    const visit = (node: ts.Node) => {
      // 1. undefined 참조 검사
      if (ts.isPropertyAccessExpression(node)) {
        const symbol = this.getSymbol(node.expression);
        if (!symbol) {
          defects.push({
            type: DefectType.UNDEFINED_REFERENCE,
            file: sourceFile.fileName,
            line: ts.getLineAndCharacterOfPosition(sourceFile, node.pos).line,
            column: ts.getLineAndCharacterOfPosition(sourceFile, node.pos).character,
            message: `Possible undefined reference: ${node.getText()}`,
            severity: 'warning',
            autoFixable: true,
            suggestion: `${node.expression.getText()}?.${node.name.getText()}`,
            patch: this.generateOptionalChainingPatch(node)
          });
        }
      }
      
      // 2. null 체크 누락
      if (ts.isIfStatement(node)) {
        const condition = node.expression;
        if (ts.isBinaryExpression(condition) && 
            condition.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken) {
          defects.push({
            type: DefectType.TYPE_MISMATCH,
            file: sourceFile.fileName,
            line: ts.getLineAndCharacterOfPosition(sourceFile, node.pos).line,
            column: ts.getLineAndCharacterOfPosition(sourceFile, node.pos).character,
            message: 'Use === instead of ==',
            severity: 'warning',
            autoFixable: true,
            suggestion: condition.getText().replace('==', '===')
          });
        }
      }
      
      // 3. 무한 루프 감지
      if (ts.isWhileStatement(node) || ts.isForStatement(node)) {
        if (this.isPotentialInfiniteLoop(node)) {
          defects.push({
            type: DefectType.INFINITE_LOOP,
            file: sourceFile.fileName,
            line: ts.getLineAndCharacterOfPosition(sourceFile, node.pos).line,
            column: ts.getLineAndCharacterOfPosition(sourceFile, node.pos).character,
            message: 'Potential infinite loop detected',
            severity: 'error',
            autoFixable: false
          });
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return defects;
  }
  
  /**
   * JavaScript/JSX 코드 분석 (Babel)
   */
  analyzeJavaScript(code: string, filename: string): DefectInfo[] {
    const defects: DefectInfo[] = [];
    
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
      });
      
      traverse(ast, {
        MemberExpression(path) {
          // Optional chaining 제안
          if (!path.node.optional && path.node.object.type === 'Identifier') {
            defects.push({
              type: DefectType.NULL_POINTER,
              file: filename,
              line: path.node.loc?.start.line || 0,
              column: path.node.loc?.start.column || 0,
              message: 'Consider using optional chaining',
              severity: 'info',
              autoFixable: true,
              suggestion: '?.'
            });
          }
        },
        
        CallExpression(path) {
          // console.log 제거 제안
          if (path.node.callee.type === 'MemberExpression' &&
              path.node.callee.object.type === 'Identifier' &&
              path.node.callee.object.name === 'console') {
            defects.push({
              type: DefectType.DEAD_CODE,
              file: filename,
              line: path.node.loc?.start.line || 0,
              column: path.node.loc?.start.column || 0,
              message: 'Remove console statement in production',
              severity: 'warning',
              autoFixable: true,
              patch: ''
            });
          }
        }
      });
      
    } catch (error) {
      console.error(`Failed to analyze ${filename}:`, error);
    }
    
    return defects;
  }
  
  private getSymbol(node: ts.Node): ts.Symbol | undefined {
    // TypeScript 컴파일러 API를 사용한 심볼 확인
    return undefined; // 실제 구현 필요
  }
  
  private isPotentialInfiniteLoop(node: ts.Node): boolean {
    // 간단한 무한 루프 감지 로직
    return false; // 실제 구현 필요
  }
  
  private generateOptionalChainingPatch(node: ts.PropertyAccessExpression): string {
    return `${node.expression.getText()}?.${node.name.getText()}`;
  }
}

// 런타임 결함 감지
export class Defect {
  private static defects: DefectInfo[] = [];
  private static patches = new Map<string, string>();
  
  constructor(
    public readonly info: DefectInfo,
    public readonly stack?: string
  ) {}
  
  /**
   * 자동 패치 생성
   */
  async generatePatch(): Promise<string | null> {
    if (!this.info.autoFixable) return null;
    
    // 이미 생성된 패치가 있으면 반환
    const key = `${this.info.file}:${this.info.line}:${this.info.column}`;
    if (Defect.patches.has(key)) {
      return Defect.patches.get(key)!;
    }
    
    // AI를 통한 패치 생성
    const patch = await this.aiGeneratePatch();
    if (patch) {
      Defect.patches.set(key, patch);
    }
    
    return patch;
  }
  
  /**
   * AI 패치 생성
   */
  private async aiGeneratePatch(): Promise<string | null> {
    // 실제로는 AI API 호출
    // 여기서는 간단한 규칙 기반 패치
    switch (this.info.type) {
      case DefectType.UNDEFINED_REFERENCE:
        return this.info.suggestion || null;
        
      case DefectType.NULL_POINTER:
        return `${this.info.suggestion} ?? defaultValue`;
        
      case DefectType.TYPE_MISMATCH:
        return this.info.suggestion || null;
        
      default:
        return null;
    }
  }
  
  /**
   * 개발자에게 알림
   */
  notifyDeveloper(): void {
    if (process.env.NODE_ENV === 'development') {
      // 개발 모드: 화면에 오버레이 표시
      this.showDeveloperOverlay();
    } else {
      // 프로덕션: 에러 리포팅 서비스로 전송
      this.reportToService();
    }
  }
  
  private showDeveloperOverlay(): void {
    const overlay = document.createElement('div');
    overlay.className = 'aits-defect-overlay';
    overlay.innerHTML = `
      <div class="header">
        <span class="title">🐛 Code Defect Detected</span>
        <button class="close">×</button>
      </div>
      <div class="content">
        <div class="file">${this.info.file}:${this.info.line}:${this.info.column}</div>
        <div class="message">${this.info.message}</div>
        ${this.info.suggestion ? `
          <div class="suggestion">
            <strong>Suggestion:</strong>
            <code>${this.info.suggestion}</code>
          </div>
        ` : ''}
        ${this.stack ? `
          <details>
            <summary>Stack Trace</summary>
            <pre>${this.stack}</pre>
          </details>
        ` : ''}
      </div>
      ${this.info.autoFixable ? `
        <div class="actions">
          <button class="auto-fix">Apply Auto-Fix</button>
        </div>
      ` : ''}
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('.close')?.addEventListener('click', () => {
      overlay.remove();
    });
    
    overlay.querySelector('.auto-fix')?.addEventListener('click', async () => {
      const patch = await this.generatePatch();
      if (patch) {
        console.log('Auto-fix patch:', patch);
        // HMR을 통한 패치 적용
        if (import.meta.hot) {
          import.meta.hot.send('aits:apply-patch', {
            file: this.info.file,
            line: this.info.line,
            patch
          });
        }
      }
      overlay.remove();
    });
  }
  
  private reportToService(): void {
    // Sentry, LogRocket 등으로 전송
    console.error('[Defect]', this.info);
  }
  
  /**
   * 전역 에러 핸들러
   */
  static install(): void {
    window.addEventListener('error', (event) => {
      const defect = new Defect({
        type: DefectType.UNDEFINED_REFERENCE,
        file: event.filename || 'unknown',
        line: event.lineno || 0,
        column: event.colno || 0,
        message: event.message,
        severity: 'error',
        autoFixable: false
      }, event.error?.stack);
      
      defect.notifyDeveloper();
      Defect.defects.push(defect.info);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      const defect = new Defect({
        type: DefectType.UNDEFINED_REFERENCE,
        file: 'promise',
        line: 0,
        column: 0,
        message: event.reason?.message || 'Unhandled promise rejection',
        severity: 'error',
        autoFixable: false
      }, event.reason?.stack);
      
      defect.notifyDeveloper();
      Defect.defects.push(defect.info);
    });
  }
  
  static getDefects(): DefectInfo[] {
    return Defect.defects;
  }
  
  static clear(): void {
    Defect.defects = [];
    Defect.patches.clear();
  }
}

// Vite 플러그인용 export
export function createDefectAnalyzer() {
  return new BuildTimeAnalyzer();
}