/**
 * =================================================================
 * Error.ts - 시스템 레벨 에러 자동 복구 시스템
 * =================================================================
 * @description
 * - 네트워크, 서버, 외부 서비스 에러 처리
 * - 자동 재시도, 캐시, 폴백 전략
 * - Circuit Breaker 패턴
 * @author Aits Framework
 * @version 1.0.0
 */

// 시스템 에러 타입
export enum ErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  DATABASE = 'database',
  PERMISSION = 'permission',
  RATE_LIMIT = 'rate_limit',
  SERVICE_UNAVAILABLE = 'service_unavailable'
}

// 복구 전략
export interface RecoveryStrategy {
  type: 'retry' | 'cache' | 'fallback' | 'degrade' | 'offline';
  execute: () => Promise<any>;
  priority: number;
  condition?: () => boolean;
}

// 시스템 에러 정보
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: string;
  statusCode?: number;
  endpoint?: string;
  retryable?: boolean;
  suggestion?: string;
  context?: any;
}

// Circuit Breaker
export class CircuitBreaker {
  private static circuits = new Map<string, {
    failures: number;
    lastFailure: Date;
    state: 'closed' | 'open' | 'half-open';
    nextRetry?: Date;
  }>();
  
  static async execute<T>(
    key: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const circuit = this.circuits.get(key) || {
      failures: 0,
      lastFailure: new Date(0),
      state: 'closed'
    };
    
    // 회로 열림 상태 체크
    if (circuit.state === 'open') {
      if (circuit.nextRetry && new Date() < circuit.nextRetry) {
        if (fallback) return fallback();
        throw new SystemError({
          type: ErrorType.SERVICE_UNAVAILABLE,
          message: `Service ${key} is temporarily unavailable`
        });
      }
      circuit.state = 'half-open';
    }
    
    try {
      const result = await fn();
      
      // 성공: 회로 닫기
      if (circuit.state === 'half-open') {
        circuit.state = 'closed';
        circuit.failures = 0;
      }
      
      this.circuits.set(key, circuit);
      return result;
      
    } catch (error) {
      circuit.failures++;
      circuit.lastFailure = new Date();
      
      // 5회 실패 시 회로 열기
      if (circuit.failures >= 5) {
        circuit.state = 'open';
        circuit.nextRetry = new Date(Date.now() + 30000); // 30초 후 재시도
      }
      
      this.circuits.set(key, circuit);
      
      if (fallback) return fallback();
      throw error;
    }
  }
  
  static reset(key?: string): void {
    if (key) {
      this.circuits.delete(key);
    } else {
      this.circuits.clear();
    }
  }
  
  static getStatus(key: string) {
    return this.circuits.get(key);
  }
}

// 캐시 매니저
export class CacheManager {
  private static cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>();
  
  static set(key: string, data: any, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  static get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  static getStale(key: string): any | null {
    const entry = this.cache.get(key);
    return entry?.data || null;
  }
  
  static clear(): void {
    this.cache.clear();
  }
}

// 메인 SystemError 클래스
export class SystemError {
  private strategies: RecoveryStrategy[] = [];
  
  constructor(
    public readonly info: ErrorInfo,
    public readonly originalError?: Error
  ) {
    this.setupStrategies();
  }
  
  /**
   * 복구 전략 설정
   */
  private setupStrategies(): void {
    // 1. 재시도 전략
    if (this.info.retryable !== false) {
      this.strategies.push({
        type: 'retry',
        priority: 1,
        execute: () => this.retryWithBackoff(),
        condition: () => this.info.type !== ErrorType.PERMISSION
      });
    }
    
    // 2. 캐시 전략
    if (this.info.endpoint) {
      this.strategies.push({
        type: 'cache',
        priority: 2,
        execute: () => this.serveFromCache(),
        condition: () => CacheManager.get(this.info.endpoint!) !== null
      });
    }
    
    // 3. Stale 캐시 전략
    this.strategies.push({
      type: 'cache',
      priority: 3,
      execute: () => this.serveStaleCache(),
      condition: () => CacheManager.getStale(this.info.endpoint!) !== null
    });
    
    // 4. 폴백 전략
    this.strategies.push({
      type: 'fallback',
      priority: 4,
      execute: () => this.useFallback()
    });
    
    // 5. 품질 저하 전략
    this.strategies.push({
      type: 'degrade',
      priority: 5,
      execute: () => this.degradeGracefully()
    });
    
    // 우선순위 정렬
    this.strategies.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * 자동 복구 시도
   */
  async autoRecover(): Promise<any> {
    for (const strategy of this.strategies) {
      if (strategy.condition && !strategy.condition()) {
        continue;
      }
      
      try {
        console.log(`[SystemError] Attempting ${strategy.type} recovery`);
        return await strategy.execute();
      } catch (error) {
        console.log(`[SystemError] ${strategy.type} recovery failed`, error);
        continue;
      }
    }
    
    throw this;
  }
  
  /**
   * 지수 백오프 재시도
   */
  private async retryWithBackoff(maxRetries: number = 3): Promise<any> {
    let delay = 1000;
    
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      
      // 재시도 시그널 발생
      throw new Error('RETRY_SIGNAL');
    }
    
    throw new Error('Max retries exceeded');
  }
  
  /**
   * 캐시에서 제공
   */
  private async serveFromCache(): Promise<any> {
    const cached = CacheManager.get(this.info.endpoint!);
    if (cached) {
      console.log('[SystemError] Serving from cache');
      return cached;
    }
    throw new Error('No cache available');
  }
  
  /**
   * Stale 캐시 제공
   */
  private async serveStaleCache(): Promise<any> {
    const stale = CacheManager.getStale(this.info.endpoint!);
    if (stale) {
      console.log('[SystemError] Serving stale cache');
      return { ...stale, _stale: true };
    }
    throw new Error('No stale cache available');
  }
  
  /**
   * 폴백 데이터 사용
   */
  private async useFallback(): Promise<any> {
    console.log('[SystemError] Using fallback data');
    
    // 엔드포인트별 폴백 데이터
    const fallbacks: Record<string, any> = {
      '/api/users': [],
      '/api/config': { version: '1.0.0', features: [] }
    };
    
    if (this.info.endpoint && fallbacks[this.info.endpoint]) {
      return fallbacks[this.info.endpoint];
    }
    
    return { error: true, message: 'Service temporarily unavailable' };
  }
  
  /**
   * 품질 저하 모드
   */
  private async degradeGracefully(): Promise<any> {
    console.log('[SystemError] Degrading gracefully');
    
    document.body.classList.add('aits-degraded');
    
    // 오프라인 모드 활성화
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'ENABLE_OFFLINE_MODE'
      });
    }
    
    return {
      degraded: true,
      features: ['basic'],
      message: 'Running in limited mode'
    };
  }
  
  /**
   * 사용자 알림
   */
  notifyUser(): void {
    const notification = document.createElement('div');
    notification.className = 'aits-system-error';
    notification.innerHTML = `
      <div class="icon">⚠️</div>
      <div class="message">${this.getUserMessage()}</div>
      <div class="action">
        <button class="retry">재시도</button>
        <button class="dismiss">닫기</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    notification.querySelector('.retry')?.addEventListener('click', () => {
      window.location.reload();
    });
    
    notification.querySelector('.dismiss')?.addEventListener('click', () => {
      notification.remove();
    });
  }
  
  private getUserMessage(): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: '네트워크 연결을 확인해주세요',
      [ErrorType.TIMEOUT]: '요청 시간이 초과되었습니다',
      [ErrorType.SERVER]: '서버에 일시적인 문제가 발생했습니다',
      [ErrorType.DATABASE]: '데이터를 불러올 수 없습니다',
      [ErrorType.PERMISSION]: '권한이 없습니다',
      [ErrorType.RATE_LIMIT]: '너무 많은 요청을 보냈습니다',
      [ErrorType.SERVICE_UNAVAILABLE]: '서비스를 일시적으로 사용할 수 없습니다'
    };
    
    return messages[this.info.type] || '일시적인 오류가 발생했습니다';
  }
}

// 전역 SystemError 핸들러
export class SystemErrorHandler {
  private static errors: SystemError[] = [];
  
  static async handle(error: SystemError): Promise<any> {
    this.errors.push(error);
    
    // Circuit Breaker로 실행
    if (error.info.endpoint) {
      return CircuitBreaker.execute(
        error.info.endpoint,
        async () => {
          throw error; // 원본 에러 재발생
        },
        async () => {
          return error.autoRecover(); // 자동 복구
        }
      );
    }
    
    // Circuit Breaker 없이 직접 복구
    return error.autoRecover();
  }
  
  static getErrors(): SystemError[] {
    return this.errors;
  }
  
  static clear(): void {
    this.errors = [];
  }
}