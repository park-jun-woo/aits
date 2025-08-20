// vite-plugin-aits-style.ts
import type { Plugin } from 'vite';
import { StyleSystem } from './src/styles/StyleSystem';

export interface AitsStyleOptions {
  viewPaths?: string[];
  outputPath?: string;
  customTokens?: any;
  watch?: boolean;
}

export function aitsStyle(options: AitsStyleOptions = {}): Plugin {
  let styleSystem: StyleSystem;
  
  return {
    name: 'vite-plugin-aits-style',
    
    async buildStart() {
      styleSystem = StyleSystem.getInstance(options);
      
      // 초기 빌드
      await styleSystem.build();
    },
    
    configureServer(server) {
      if (options.watch !== false) {
        // View 파일 변경 감지
        server.watcher.add(['src/views/**/*.html', 'views/**/*.html']);
        
        server.watcher.on('change', async (file) => {
          if (file.includes('view') && file.endsWith('.html')) {
            console.log(`View changed: ${file}`);
            await styleSystem.build();
            
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
      await styleSystem.build();
    }
  };
}