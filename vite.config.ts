// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { aitsCSS } from './vite-plugin-aits-css';

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
		aitsCSS()
	],
	css: {
		postcss: './postcss.config.js'
	}
});