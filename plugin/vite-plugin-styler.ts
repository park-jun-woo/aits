// vite-plugin-styler.ts
import type { Plugin } from 'vite';
import { Styler } from './styler/Styler';

export interface AitsStyleOptions {
  viewPaths?: string[];
  outputPath?: string;
  customTokens?: any;
  watch?: boolean;
}

export function aitsStyle(options: AitsStyleOptions = {}): Plugin {
  let stylerInstance: Styler;  // 변수명 변경
  
  return {
    name: 'vite-plugin-aits-style',
    
    async buildStart() {
      stylerInstance = Styler.getInstance(options);  // 수정됨
      
      // 초기 빌드
      await stylerInstance.build();  // 수정됨
    },
    
    configureServer(server) {
      if (options.watch !== false) {
        // View 파일 변경 감지
        server.watcher.add(['src/views/**/*.html', 'views/**/*.html']);
        
        server.watcher.on('change', async (file) => {
          if (file.includes('view') && file.endsWith('.html')) {
            console.log(`View changed: ${file}`);
            await stylerInstance.build();  // 수정됨
            
            // HMR 트리거
            server.ws.send({
              type: 'full-reload'
            });
          }
        });
      }
    },
    
    async buildEnd() {
      // 최종 빌드
      await stylerInstance.build();  // 수정됨
    }
  };
}