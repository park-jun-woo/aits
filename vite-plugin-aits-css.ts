// vite-plugin-aits-style.ts
import type { Plugin } from 'vite';
import { Styler } from './src/Styler';

export interface AitsStyleOptions {
  viewPaths?: string[];
  outputPath?: string;
  customTokens?: any;
  watch?: boolean;
}

export function aitsStyle(options: AitsStyleOptions = {}): Plugin {
  let Styler: Styler;
  
  return {
    name: 'vite-plugin-aits-style',
    
    async buildStart() {
      Styler = Styler.getInstance(options);
      
      // 초기 빌드
      await Styler.build();
    },
    
    configureServer(server) {
      if (options.watch !== false) {
        // View 파일 변경 감지
        server.watcher.add(['src/views/**/*.html', 'views/**/*.html']);
        
        server.watcher.on('change', async (file) => {
          if (file.includes('view') && file.endsWith('.html')) {
            console.log(`View changed: ${file}`);
            await Styler.build();
            
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
      await Styler.build();
    }
  };
}