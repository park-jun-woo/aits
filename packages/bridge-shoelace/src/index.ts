//import type { BridgePreset } from '@aits/core';
import { shoelacePreset } from './preset';
import { toast, createDialog, createDrawer, confirm, setTheme } from './helpers';

// 메인 프리셋 export
export default shoelacePreset;

// 헬퍼 함수들 export
export {
  toast,
  createDialog,
  createDrawer,
  confirm,
  setTheme
};

// 타입들 export
export * from './types';

// 편의 함수: 자동 등록
export function registerShoelace(): void {
  if (typeof window !== 'undefined') {
    // 동적 import로 순환 참조 방지
    import('@aits/core').then(({ registerBridge }) => {
      registerBridge(shoelacePreset);
      
      // 자동 setup 실행
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          shoelacePreset.setup?.('client');
        });
      } else {
        shoelacePreset.setup?.('client');
      }
    });
  }
}

// 전역 설정 옵션
export interface ShoelaceConfig {
  theme?: 'light' | 'dark' | 'auto';
  basePath?: string;
  autoRegister?: boolean;
}

// 초기화 함수
export async function initShoelace(config: ShoelaceConfig = {}): Promise<void> {
  // 테마 설정
  if (config.theme) {
    setTheme(config.theme);
  }
  
  // 자동 등록
  if (config.autoRegister !== false) {
    registerShoelace();
  }
}