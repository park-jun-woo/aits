/**
 * =================================================================
 * Invalid.ts - 사용자 입력 검증 및 자동 교정 시스템
 * =================================================================
 * @description
 * - 사용자 입력이 유효하지 않을 때 발생
 * - AI 자동 교정 및 제안 제공
 * - 사용자 친화적 피드백
 * @author Aits Framework
 * @version 1.0.0
 */

import { z } from 'zod';

// 입력 검증 실패 정보
export interface InvalidInfo {
  field: string;
  value: any;
  expected: string;
  message: string;
  suggestion?: any;
  alternatives?: any[];
  confidence?: number;
}

// AI 교정 엔진
export class AICorrector {
  private static patterns = new Map<string, RegExp>([
    ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/],
    ['phone', /^[\d\s\-\(\)]+$/],
    ['url', /^https?:\/\/.+/],
    ['date', /^\d{4}-\d{2}-\d{2}$/]
  ]);
  
  static async correct(value: any, type: string): Promise<{
    corrected: any;
    confidence: number;
    alternatives: any[];
  }> {
    switch (type) {
      case 'email':
        return this.correctEmail(value);
      case 'phone':
        return this.correctPhone(value);
      case 'date':
        return this.correctDate(value);
      default:
        return { corrected: value, confidence: 0, alternatives: [] };
    }
  }
  
  private static correctEmail(value: string): any {
    const common = ['gmail.com', 'naver.com', 'kakao.com', 'hanmail.net'];
    const parts = value.split('@');
    
    if (parts.length === 2) {
      const [local, domain] = parts;
      
      // 일반적인 오타 수정
      const corrections: Record<string, string> = {
        'gmial': 'gmail',
        'gamil': 'gmail',
        'navr': 'naver',
        'kakoa': 'kakao'
      };
      
      for (const [typo, correct] of Object.entries(corrections)) {
        if (domain.includes(typo)) {
          const corrected = `${local}@${domain.replace(typo, correct)}`;
          return {
            corrected,
            confidence: 0.9,
            alternatives: common.map(d => `${local}@${d}`)
          };
        }
      }
    }
    
    return {
      corrected: value,
      confidence: 0.3,
      alternatives: []
    };
  }
  
  private static correctPhone(value: string): any {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 10 || numbers.length === 11) {
      // 한국 전화번호 포맷
      if (numbers.startsWith('01')) {
        const formatted = numbers.length === 11
          ? `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
          : `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
        
        return {
          corrected: formatted,
          confidence: 0.95,
          alternatives: [
            numbers,
            formatted.replace(/-/g, ''),
            formatted.replace(/-/g, '.')
          ]
        };
      }
    }
    
    return {
      corrected: value,
      confidence: 0.2,
      alternatives: []
    };
  }
  
  private static correctDate(value: string): any {
    // 다양한 날짜 형식 처리
    const patterns = [
      /(\d{4})[\.\/-](\d{1,2})[\.\/-](\d{1,2})/,
      /(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})/
    ];
    
    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match) {
        const [_, a, b, c] = match;
        const year = a.length === 4 ? a : c;
        const month = a.length === 4 ? b.padStart(2, '0') : a.padStart(2, '0');
        const day = a.length === 4 ? c.padStart(2, '0') : b.padStart(2, '0');
        
        return {
          corrected: `${year}-${month}-${day}`,
          confidence: 0.85,
          alternatives: [
            `${year}/${month}/${day}`,
            `${year}.${month}.${day}`
          ]
        };
      }
    }
    
    return {
      corrected: value,
      confidence: 0.1,
      alternatives: []
    };
  }
}

// 메인 Invalid 클래스
export class Invalid {
  constructor(
    public readonly info: InvalidInfo,
    public readonly originalError?: Error
  ) {}
  
  /**
   * 자동 교정 시도
   */
  async autoCorrect(): Promise<any> {
    const result = await AICorrector.correct(
      this.info.value,
      this.info.field
    );
    
    if (result.confidence > 0.8) {
      return result.corrected;
    }
    
    return null;
  }
  
  /**
   * 사용자 친화적 메시지 생성
   */
  getUserMessage(): string {
    if (this.info.suggestion) {
      return `${this.info.message} "${this.info.suggestion}"을(를) 사용하시겠습니까?`;
    }
    return this.info.message;
  }
  
  /**
   * 입력 필드에 에러 표시
   */
  showFieldError(element: HTMLElement): void {
    element.classList.add('aits-invalid');
    element.setAttribute('aria-invalid', 'true');
    element.setAttribute('aria-describedby', `${this.info.field}-error`);
    
    // 에러 메시지 요소 생성
    const errorEl = document.createElement('div');
    errorEl.id = `${this.info.field}-error`;
    errorEl.className = 'aits-field-error';
    errorEl.textContent = this.getUserMessage();
    
    element.parentNode?.appendChild(errorEl);
    
    // 자동 교정 제안이 있으면 버튼 추가
    if (this.info.suggestion) {
      const btn = document.createElement('button');
      btn.className = 'aits-auto-correct-btn';
      btn.textContent = '자동 교정';
      btn.onclick = () => {
        (element as HTMLInputElement).value = this.info.suggestion;
        this.clearFieldError(element);
      };
      errorEl.appendChild(btn);
    }
  }
  
  /**
   * 필드 에러 제거
   */
  clearFieldError(element: HTMLElement): void {
    element.classList.remove('aits-invalid');
    element.removeAttribute('aria-invalid');
    
    const errorEl = document.getElementById(`${this.info.field}-error`);
    errorEl?.remove();
  }
  
  /**
   * 검증 헬퍼
   */
  static async validate<T>(
    data: unknown,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        
        // AI 교정 시도
        const corrector = new AICorrector();
        const result = await AICorrector.correct(
          firstError.path.join('.'),
          firstError.code
        );
        
        throw new Invalid({
          field: firstError.path.join('.'),
          value: data,
          expected: firstError.message,
          message: firstError.message,
          suggestion: result.corrected,
          alternatives: result.alternatives,
          confidence: result.confidence
        }, error);
      }
      throw error;
    }
  }
}

// 전역 Invalid 핸들러
export class InvalidHandler {
  private static invalids = new Map<string, Invalid>();
  
  static handle(invalid: Invalid): void {
    this.invalids.set(invalid.info.field, invalid);
    
    // DOM 요소 찾아서 에러 표시
    const element = document.querySelector(
      `[name="${invalid.info.field}"], #${invalid.info.field}`
    ) as HTMLElement;
    
    if (element) {
      invalid.showFieldError(element);
    }
    
    // 자동 교정 가능하면 토스트 표시
    if (invalid.info.confidence && invalid.info.confidence > 0.8) {
      this.showAutoCorrectToast(invalid);
    }
  }
  
  private static showAutoCorrectToast(invalid: Invalid): void {
    const toast = document.createElement('div');
    toast.className = 'aits-auto-correct-toast';
    toast.innerHTML = `
      <div class="message">
        "${invalid.info.value}"를 "${invalid.info.suggestion}"(으)로 자동 교정할까요?
      </div>
      <button class="accept">예</button>
      <button class="reject">아니오</button>
    `;
    
    document.body.appendChild(toast);
    
    toast.querySelector('.accept')?.addEventListener('click', () => {
      const el = document.querySelector(`[name="${invalid.info.field}"]`) as HTMLInputElement;
      if (el) el.value = invalid.info.suggestion;
      toast.remove();
    });
    
    toast.querySelector('.reject')?.addEventListener('click', () => {
      toast.remove();
    });
    
    // 5초 후 자동 제거
    setTimeout(() => toast.remove(), 5000);
  }
  
  static clear(field?: string): void {
    if (field) {
      this.invalids.delete(field);
    } else {
      this.invalids.clear();
    }
  }
  
  static getAll(): Invalid[] {
    return Array.from(this.invalids.values());
  }
}