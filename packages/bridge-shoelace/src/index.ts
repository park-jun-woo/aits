import { registerBridge, BridgeUtils } from '@aits/core';
import { shoelacePreset } from './preset';
import { 
  toast, 
  createDialog, 
  createDrawer, 
  confirm, 
  setTheme,
  prompt,
  waitForComponent,
  waitForAllComponents
} from './helpers';

// 타입 export
export * from './types';

// 프리셋 export
export { shoelacePreset };
export default shoelacePreset;

// 헬퍼 함수들 export
export {
  toast,
  createDialog,
  createDrawer,
  confirm,
  setTheme,
  prompt,
  waitForComponent,
  waitForAllComponents
};

// 설정 옵션
export interface ShoelaceConfig {
  theme?: 'light' | 'dark' | 'auto';
  basePath?: string;
  autoRegister?: boolean;
  autoTransform?: boolean;
}

/**
 * Shoelace 브리지 초기화
 */
export async function initShoelace(config: ShoelaceConfig = {}): Promise<void> {
  // 테마 설정
  if (config.theme) {
    setTheme(config.theme);
  }
  
  // basePath 설정
  if (config.basePath && (window as any).setBasePath) {
    (window as any).setBasePath(config.basePath);
  }
  
  // 브리지 등록
  if (config.autoRegister !== false) {
    registerBridge(shoelacePreset);
  }
  
  // 자동 변환 시작
  if (config.autoTransform) {
    BridgeUtils.startAutoTransform();
  }
  
  console.log('[Shoelace] Bridge initialized');
}

// DOM 준비 시 자동 초기화
if (typeof window !== 'undefined') {
  // 전역 네임스페이스 등록
  (window as any).ShoelaceBridge = {
    init: initShoelace,
    preset: shoelacePreset,
    toast,
    createDialog,
    createDrawer,
    confirm,
    prompt,
    setTheme,
    waitForComponent,
    waitForAllComponents
  };
  
  // data-auto-init 속성이 있으면 자동 초기화
  document.addEventListener('DOMContentLoaded', () => {
    const script = document.querySelector('script[data-shoelace-auto-init]');
    if (script) {
      const config: ShoelaceConfig = {
        autoRegister: true,
        autoTransform: true,
        theme: script.getAttribute('data-theme') as any || 'auto'
      };
      initShoelace(config);
    }
  });
}