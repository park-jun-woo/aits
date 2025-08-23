/**
 * =================================================================
 * Error.ts - Aits Framework AI-First Runtime Error System
 * =================================================================
 * @description
 * - 런타임 오류를 AI가 자동으로 분석하고 복구 시도
 * - 오류 패턴 학습 및 자가 치유(Self-healing) 메커니즘
 * - 경계 검증으로 오류 사전 방지
 * @author Aits Framework
 * @version 2.0.0
 */

import { z } from 'zod';
import type { Aits } from './Aits';
import type { Context } from './Context';
import type { Model } from './Model';

// Chrome의 performance.memory 타입 확장
interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

declare global {
  interface Window {
    performance: ExtendedPerformance;
  }
}

// ============================================================================
// 공용 타입
// ============================================================================

export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum SystemBoundary {
  INPUT = 'input',
  OUTPUT = 'output',
  DATABASE = 'database',
  NETWORK = 'network',
  EXTERNAL_API = 'external_api',
  CACHE = 'cache',
  COMPONENT = 'component',
  RUNTIME = 'runtime'
}

export enum RecoveryStrategy {
  AUTO_RETRY = 'auto_retry',
  FALLBACK = 'fallback',
  REGENERATE = 'regenerate',
  CACHE = 'cache',
  DEGRADE = 'degrade',
  IGNORE = 'ignore',
  NONE = 'none'
}

// AI 복구 프롬프트
export interface AIRepairPrompt {
  error: {
    type: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context: {
    boundary: SystemBoundary;
    operation: string;
    input?: unknown;
    state?: unknown;
  };
  patterns: ErrorPattern[];
  suggestedFixes: RepairStrategy[];
}

// 오류 패턴
export interface ErrorPattern {
  signature: string;
  frequency: number;
  lastOccurred: Date;
  successfulFixes: RepairStrategy[];
  failedFixes: RepairStrategy[];
}

// 복구 전략
export interface RepairStrategy {
  type: RecoveryStrategy;
  action: () => Promise<any>;
  confidence: number; // 0-1
  description: string;
}

// 런타임 오류 컨텍스트
export interface RuntimeContext {
  timestamp: Date;
  url: string;
  userAgent: string;
  memory?: {
    used: number;
    limit: number;
  };
  performance?: {
    fps?: number;
    latency?: number;
  };
  previousErrors: Error[];
}

// ============================================================================
// AI 자가 복구 시스템
// ============================================================================

export class AISelfHealing {
  private static errorPatterns = new Map<string, ErrorPattern>();
  private static repairHistory = new Map<string, RepairStrategy[]>();
  private static learningMode = true;
  
  /**
   * 런타임 오류 분석 및 자동 복구
   */
  static async handleRuntimeError(
    error: Error,
    context: RuntimeContext,
    boundary: SystemBoundary = SystemBoundary.RUNTIME
  ): Promise<any> {
    const errorSignature = this.generateErrorSignature(error);
    
    // 1. 오류 패턴 학습
    this.learnErrorPattern(errorSignature, error);
    
    // 2. 복구 전략 생성
    const strategies = await this.generateRepairStrategies(error, context, boundary);
    
    // 3. 전략 실행 (신뢰도 순)
    strategies.sort((a, b) => b.confidence - a.confidence);
    
    for (const strategy of strategies) {
      try {
        console.log(`[AI Self-Healing] Attempting ${strategy.type}: ${strategy.description}`);
        const result = await strategy.action();
        
        // 성공한 전략 기록
        this.recordSuccessfulRepair(errorSignature, strategy);
        
        return result;
      } catch (repairError) {
        console.warn(`[AI Self-Healing] Strategy ${strategy.type} failed:`, repairError);
        this.recordFailedRepair(errorSignature, strategy);
      }
    }
    
    // 4. 모든 전략 실패 시 품질 저하 모드
    return this.degradeGracefully(error, context);
  }
  
  /**
   * 복구 전략 생성
   */
  private static async generateRepairStrategies(
    error: Error,
    context: RuntimeContext,
    boundary: SystemBoundary
  ): Promise<RepairStrategy[]> {
    const strategies: RepairStrategy[] = [];
    const errorSignature = this.generateErrorSignature(error);
    const pattern = this.errorPatterns.get(errorSignature);
    
    // 이전에 성공한 전략 우선
    if (pattern?.successfulFixes.length) {
      strategies.push(...pattern.successfulFixes.map(fix => ({
        ...fix,
        confidence: 0.9
      })));
    }
    
    // 경계별 특화 전략
    switch (boundary) {
      case SystemBoundary.NETWORK:
        strategies.push(
          {
            type: RecoveryStrategy.AUTO_RETRY,
            action: () => this.retryWithBackoff(3, 1000),
            confidence: 0.8,
            description: 'Retry with exponential backoff'
          },
          {
            type: RecoveryStrategy.CACHE,
            action: () => this.getFromCache(context.url),
            confidence: 0.7,
            description: 'Serve from cache'
          },
          {
            type: RecoveryStrategy.FALLBACK,
            action: () => this.useOfflineMode(),
            confidence: 0.6,
            description: 'Switch to offline mode'
          }
        );
        break;
        
      case SystemBoundary.COMPONENT:
        strategies.push(
          {
            type: RecoveryStrategy.REGENERATE,
            action: () => this.regenerateComponent(error),
            confidence: 0.7,
            description: 'Regenerate component'
          },
          {
            type: RecoveryStrategy.DEGRADE,
            action: () => this.renderFallbackUI(),
            confidence: 0.8,
            description: 'Render fallback UI'
          }
        );
        break;
        
      case SystemBoundary.EXTERNAL_API:
        strategies.push(
          {
            type: RecoveryStrategy.FALLBACK,
            action: () => this.useMockData(),
            confidence: 0.6,
            description: 'Use mock data'
          },
          {
            type: RecoveryStrategy.CACHE,
            action: () => this.getStaleCache(),
            confidence: 0.7,
            description: 'Use stale cache'
          }
        );
        break;
        
      default:
        // 범용 전략
        strategies.push(
          {
            type: RecoveryStrategy.DEGRADE,
            action: () => this.degradeGracefully(error, context),
            confidence: 0.5,
            description: 'Graceful degradation'
          }
        );
    }
    
    // 메모리 부족 시 추가 전략
    if (context.memory && context.memory.used / context.memory.limit > 0.9) {
      strategies.push({
        type: RecoveryStrategy.AUTO_RETRY,
        action: () => this.freeMemoryAndRetry(),
        confidence: 0.85,
        description: 'Free memory and retry'
      });
    }
    
    return strategies;
  }
  
  /**
   * 오류 시그니처 생성
   */
  private static generateErrorSignature(error: Error): string {
    const stack = error.stack || '';
    const key = `${error.name}:${error.message}`;
    
    // 스택 트레이스에서 첫 번째 의미있는 라인 추출
    const meaningfulLine = stack.split('\n')
      .find(line => line.includes('.ts') || line.includes('.js')) || '';
    
    return `${key}:${meaningfulLine.trim()}`;
  }
  
  /**
   * 오류 패턴 학습
   */
  private static learnErrorPattern(signature: string, error: Error): void {
    const existing = this.errorPatterns.get(signature);
    
    if (existing) {
      existing.frequency++;
      existing.lastOccurred = new Date();
    } else {
      this.errorPatterns.set(signature, {
        signature,
        frequency: 1,
        lastOccurred: new Date(),
        successfulFixes: [],
        failedFixes: []
      });
    }
    
    // 패턴 분석 (빈도가 높은 오류는 우선순위 상승)
    if (existing && existing.frequency > 5) {
      console.warn(`[AI Pattern] Recurring error detected (${existing.frequency}x): ${signature}`);
    }
  }
  
  /**
   * 성공한 복구 전략 기록
   */
  private static recordSuccessfulRepair(signature: string, strategy: RepairStrategy): void {
    const pattern = this.errorPatterns.get(signature);
    if (pattern) {
      // 중복 제거 후 추가
      pattern.successfulFixes = pattern.successfulFixes
        .filter(s => s.type !== strategy.type);
      pattern.successfulFixes.push(strategy);
    }
  }
  
  /**
   * 실패한 복구 전략 기록
   */
  private static recordFailedRepair(signature: string, strategy: RepairStrategy): void {
    const pattern = this.errorPatterns.get(signature);
    if (pattern) {
      pattern.failedFixes = pattern.failedFixes
        .filter(s => s.type !== strategy.type);
      pattern.failedFixes.push(strategy);
    }
  }
  
  // === 복구 액션 구현 ===
  
  private static async retryWithBackoff(maxRetries: number, initialDelay: number): Promise<any> {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
      // 재시도 로직은 호출 컨텍스트에서 처리
      throw new Error('Retry signal');
    }
  }
  
  private static async getFromCache(key: string): Promise<any> {
    // 캐시에서 데이터 가져오기
    const cached = localStorage.getItem(`aits_cache_${key}`);
    if (cached) {
      return JSON.parse(cached);
    }
    throw new Error('No cache available');
  }
  
  private static async getStaleCache(): Promise<any> {
    // 만료된 캐시라도 사용
    const cacheKeys = Object.keys(localStorage)
      .filter(k => k.startsWith('aits_cache_'));
    
    if (cacheKeys.length > 0) {
      const latestKey = cacheKeys[cacheKeys.length - 1];
      return JSON.parse(localStorage.getItem(latestKey) || '{}');
    }
    throw new Error('No stale cache available');
  }
  
  private static async useOfflineMode(): Promise<any> {
    document.body.classList.add('aits-offline');
    return { offline: true, message: 'Operating in offline mode' };
  }
  
  private static async regenerateComponent(error: Error): Promise<any> {
    // 컴포넌트 재생성 시도
    const targetElement = document.querySelector('[data-error="true"]');
    if (targetElement) {
      targetElement.removeAttribute('data-error');
      targetElement.innerHTML = '<div>Component regenerated</div>';
      return targetElement;
    }
    throw new Error('Cannot regenerate component');
  }
  
  private static async renderFallbackUI(): Promise<any> {
    const fallback = document.createElement('div');
    fallback.className = 'aits-error-fallback';
    fallback.innerHTML = `
      <div style="padding: 20px; background: #f3f4f6; border-radius: 8px;">
        <h3>Content temporarily unavailable</h3>
        <p>We're working on restoring this section.</p>
      </div>
    `;
    return fallback;
  }
  
  private static async useMockData(): Promise<any> {
    return {
      mock: true,
      data: [],
      message: 'Using mock data due to API unavailability'
    };
  }
  
  private static async freeMemoryAndRetry(): Promise<any> {
    // 메모리 정리
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
    
    // 불필요한 DOM 요소 제거
    const heavyElements = document.querySelectorAll('img[src^="data:"], video, iframe');
    heavyElements.forEach(el => el.remove());
    
    // 캐시 일부 정리
    const cacheKeys = Object.keys(localStorage)
      .filter(k => k.startsWith('aits_cache_'))
      .slice(0, Math.floor(localStorage.length / 2));
    
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    return { memoryFreed: true };
  }
  
  private static async degradeGracefully(error: Error, context: RuntimeContext): Promise<any> {
    console.warn('[AI Self-Healing] Degrading gracefully:', error.message);
    
    // 기본 UI로 폴백
    document.body.classList.add('aits-degraded');
    
    return {
      degraded: true,
      error: error.message,
      context
    };
  }
  
  /**
   * 오류 패턴 분석 리포트
   */
  static getErrorReport(): {
    totalErrors: number;
    patterns: ErrorPattern[];
    mostFrequent: ErrorPattern | null;
    successRate: number;
  } {
    const patterns = Array.from(this.errorPatterns.values());
    const totalErrors = patterns.reduce((sum, p) => sum + p.frequency, 0);
    const totalSuccess = patterns.reduce((sum, p) => sum + p.successfulFixes.length, 0);
    const totalAttempts = patterns.reduce((sum, p) => 
      sum + p.successfulFixes.length + p.failedFixes.length, 0);
    
    return {
      totalErrors,
      patterns: patterns.sort((a, b) => b.frequency - a.frequency),
      mostFrequent: patterns[0] || null,
      successRate: totalAttempts > 0 ? totalSuccess / totalAttempts : 0
    };
  }
  
  /**
   * 학습 데이터 내보내기 (AI 모델 훈련용)
   */
  static exportLearningData(): string {
    const data = {
      patterns: Array.from(this.errorPatterns.entries()),
      history: Array.from(this.repairHistory.entries()),
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }
}

// ============================================================================
// 경계 검증 시스템 (런타임 오류 방지)
// ============================================================================

export class BoundaryValidator {
  private static schemas = new Map<string, z.ZodTypeAny>();
  
  /**
   * 스키마 등록
   */
  static register(name: string, schema: z.ZodTypeAny): void {
    if (this.schemas.has(name)) {
      throw new Error(`Schema ${name} already registered`);
    }
    this.schemas.set(name, schema);
  }
  
  /**
   * 안전한 검증 (오류 시 자동 복구)
   */
  static async validateSafe(
    schemaName: string,
    data: unknown,
    boundary: SystemBoundary = SystemBoundary.INPUT
  ): Promise<unknown> {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      console.warn(`Schema ${schemaName} not found, passing through`);
      return data;
    }
    
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // AI 자동 복구 시도
        const repaired = await AISelfHealing.handleRuntimeError(
          error as Error,  // Type assertion 추가
          this.createRuntimeContext(),
          boundary
        );
        
        // 복구된 데이터로 재검증
        try {
          return schema.parse(repaired);
        } catch {
          // 복구 실패 시 기본값 반환
          return this.getDefaultValue(schema);
        }
      }
      throw error;
    }
  }
  
  /**
   * 스키마에서 기본값 추출
   */
  private static getDefaultValue(schema: z.ZodTypeAny): any {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const defaults: any = {};
      
      for (const [key, value] of Object.entries(shape)) {
        const zodValue = value as z.ZodTypeAny;
        
        // default() 메서드가 있는 경우 처리
        if ('_def' in zodValue && (zodValue._def as any).defaultValue) {
          defaults[key] = (zodValue._def as any).defaultValue();
        } else if (zodValue instanceof z.ZodOptional) {
          defaults[key] = undefined;
        } else if (zodValue instanceof z.ZodNullable) {
          defaults[key] = null;
        } else {
          // 타입에 따른 기본값 설정
          if (zodValue instanceof z.ZodString) {
            defaults[key] = '';
          } else if (zodValue instanceof z.ZodNumber) {
            defaults[key] = 0;
          } else if (zodValue instanceof z.ZodBoolean) {
            defaults[key] = false;
          } else if (zodValue instanceof z.ZodArray) {
            defaults[key] = [];
          } else if (zodValue instanceof z.ZodObject) {
            defaults[key] = {};
          } else {
            defaults[key] = null;
          }
        }
      }
      
      return defaults;
    }
    
    // 기본 타입들의 기본값
    if (schema instanceof z.ZodString) return '';
    if (schema instanceof z.ZodNumber) return 0;
    if (schema instanceof z.ZodBoolean) return false;
    if (schema instanceof z.ZodArray) return [];
    if (schema instanceof z.ZodNull) return null;
    if (schema instanceof z.ZodUndefined) return undefined;
    
    return null;
  }
  
  private static createRuntimeContext(): RuntimeContext {
    const perf = window.performance as ExtendedPerformance;
    return {
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      memory: perf.memory ? {
        used: perf.memory.usedJSHeapSize,
        limit: perf.memory.jsHeapSizeLimit
      } : undefined,
      previousErrors: []
    };
  }
}

// ============================================================================
// 회로 차단기 (자동 복구 포함)
// ============================================================================

export class CircuitBreaker {
  private static circuits = new Map<string, {
    failures: number;
    lastFailure: Date;
    state: 'closed' | 'open' | 'half-open';
    nextRetry?: Date;
  }>();
  
  /**
   * AI 복구 기능이 있는 회로 차단기
   */
  static async execute<T>(
    key: string,
    primary: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.circuits.get(key) || {
      failures: 0,
      lastFailure: new Date(0),
      state: 'closed' as const
    };
    
    if (circuit.state === 'open') {
      if (circuit.nextRetry && new Date() < circuit.nextRetry) {
        // AI가 대체 전략 선택
        const strategy = await AISelfHealing.handleRuntimeError(
          new Error(`Circuit open for ${key}`),
          this.createRuntimeContext(),
          SystemBoundary.RUNTIME
        );
        
        if (strategy && strategy !== 'retry') {
          return strategy;
        }
        
        if (fallback) {
          return await fallback();
        }
        
        throw new Error(`Circuit breaker open for ${key}`);
      }
      circuit.state = 'half-open';
    }
    
    try {
      const result = await primary();
      
      if (circuit.state === 'half-open') {
        circuit.state = 'closed';
        circuit.failures = 0;
      }
      
      this.circuits.set(key, circuit);
      return result;
      
    } catch (error) {
      circuit.failures++;
      circuit.lastFailure = new Date();
      
      if (circuit.failures >= 5) {
        circuit.state = 'open';
        circuit.nextRetry = new Date(Date.now() + 30000);
      }
      
      this.circuits.set(key, circuit);
      
      // AI 자동 복구 시도
      const repaired = await AISelfHealing.handleRuntimeError(
        error as Error,
        this.createRuntimeContext(),
        SystemBoundary.RUNTIME
      );
      
      if (repaired && repaired !== 'retry') {
        return repaired;
      }
      
      if (fallback) {
        return await fallback();
      }
      
      throw error;
    }
  }
  
  private static createRuntimeContext(): RuntimeContext {
    const errors: Error[] = [];
    this.circuits.forEach((circuit, key) => {
      if (circuit.failures > 0) {
        errors.push(new Error(`Circuit ${key}: ${circuit.failures} failures`));
      }
    });
    
    const perf = window.performance as ExtendedPerformance;
    return {
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      memory: perf.memory ? {
        used: perf.memory.usedJSHeapSize,
        limit: perf.memory.jsHeapSizeLimit
      } : undefined,
      previousErrors: errors
    };
  }
}

// ============================================================================
// 런타임 에러 클래스
// ============================================================================

export abstract class AitsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly severity: ErrorSeverity,
    public readonly boundary: SystemBoundary,
    public readonly recovery?: RecoveryStrategy,
    public readonly context?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * AI가 이해할 수 있는 형태로 변환
   */
  toAIPrompt(): AIRepairPrompt {
    return {
      error: {
        type: this.name,
        message: this.message,
        stack: this.stack,
        code: this.code
      },
      context: {
        boundary: this.boundary,
        operation: this.code,
        state: this.context
      },
      patterns: [],
      suggestedFixes: []
    };
  }
}

// ============================================================================
// 전역 에러 핸들러 (AI-First)
// ============================================================================

export class GlobalErrorHandler {
  private static isInitialized = false;
  
  /**
   * 전역 에러 핸들러 설정
   */
  static initialize(aits: Aits): void {
    if (this.isInitialized) return;
    
    // 처리되지 않은 에러 캐치
    window.addEventListener('error', async (event) => {
      event.preventDefault();
      
      console.error('[Aits Runtime Error]', event.error);
      
      // AI 자동 복구
      const result = await AISelfHealing.handleRuntimeError(
        event.error,
        this.createRuntimeContext(),
        SystemBoundary.RUNTIME
      );
      
      if (!result || result.degraded) {
        this.showErrorNotification('An error occurred. The system is running in degraded mode.');
      }
    });
    
    // Promise rejection 캐치
    window.addEventListener('unhandledrejection', async (event) => {
      event.preventDefault();
      
      console.error('[Aits Unhandled Promise]', event.reason);
      
      // AI 자동 복구
      const result = await AISelfHealing.handleRuntimeError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        this.createRuntimeContext(),
        SystemBoundary.RUNTIME
      );
      
      if (!result || result.degraded) {
        this.showErrorNotification('A background operation failed. Some features may be limited.');
      }
    });
    
    // 메모리 압박 감지
    const perf = window.performance as ExtendedPerformance;
    if (perf.memory) {
      setInterval(() => {
        const memory = perf.memory!;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usage > 0.9) {
          console.warn('[Aits Memory] High memory usage:', usage);
          AISelfHealing.handleRuntimeError(
            new Error('High memory usage detected'),
            this.createRuntimeContext(),
            SystemBoundary.RUNTIME
          );
        }
      }, 30000); // 30초마다 체크
    }
    
    this.isInitialized = true;
    console.log('[Aits Error System] AI-First error handling initialized');
  }
  
  private static createRuntimeContext(): RuntimeContext {
    const perf = window.performance as ExtendedPerformance;
    return {
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      memory: perf.memory ? {
        used: perf.memory.usedJSHeapSize,
        limit: perf.memory.jsHeapSizeLimit
      } : undefined,
      previousErrors: []
    };
  }
  
  private static showErrorNotification(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'aits-error-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="display: flex; align-items: start; gap: 12px;">
          <svg style="width: 24px; height: 24px; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">System Notice</div>
            <div style="opacity: 0.95; font-size: 14px;">${message}</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
}

// ============================================================================
// Export
// ============================================================================

// UUID 생성 폴리필
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 생성
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const ErrorSystem = {
  // AI 자가 치유
  ai: AISelfHealing,
  
  // 경계 검증
  boundary: BoundaryValidator,
  
  // 회로 차단기
  circuit: CircuitBreaker,
  
  // 전역 핸들러
  global: GlobalErrorHandler,
  
  // 초기화
  initialize(aits: Aits): void {
    GlobalErrorHandler.initialize(aits);
  },
  
  // 오류 리포트
  getReport(): any {
    return AISelfHealing.getErrorReport();
  },
  
  // 학습 데이터 내보내기
  exportLearning(): string {
    return AISelfHealing.exportLearningData();
  },
  
  // 정리
  destroy(): void {
    BoundaryValidator['schemas'].clear();
    CircuitBreaker['circuits'].clear();
    AISelfHealing['errorPatterns'].clear();
    AISelfHealing['repairHistory'].clear();
  }
};

// CSS 애니메이션 주입
if (typeof document !== 'undefined' && !document.getElementById('aits-error-styles')) {
  const style = document.createElement('style');
  style.id = 'aits-error-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .aits-degraded {
      filter: grayscale(0.2);
    }
    .aits-offline::before {
      content: 'Offline Mode';
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      background: #fbbf24;
      color: #000;
      padding: 4px 16px;
      font-size: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);
}