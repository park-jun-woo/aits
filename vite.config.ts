// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { aitsStyle } from './plugin/vite-plugin-styler';
import { defect } from './plugin/vite-plugin-defect';

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
		aitsStyle(),
		defect({
			enabled: true,
			enableBuildTime: true,
			enableRuntime: true,
			autoFix: true,
			showOverlay: true,
			reportLevel: 'warning',
			outputFile: 'defect-report.json'
		})
	],
	css: {
		postcss: './postcss.config.js'
	}
});