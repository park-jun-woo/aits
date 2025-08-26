// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { aitsStyle } from './plugin/vite-plugin-styler';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'AITS',
			fileName: 'aits'
		},
		rollupOptions: {
			external: ['navigo'],
			output: {
				globals: {
					navigo: 'Navigo'
				}
			}
		}
	},
	plugins: [
		aitsStyle()
	],
	css: {
		postcss: './postcss.config.js'
	}
});