import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only';
import typescript from '@rollup/plugin-typescript';
import sveltePreprocess from 'svelte-preprocess';
import alias from '@rollup/plugin-alias';
import url from '@rollup/plugin-url';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

// Plugin to handle ?raw imports (like Vite)
function rawPlugin() {
	return {
		name: 'raw',
		load(id) {
			if (id.endsWith('?raw')) {
				const realPath = path.resolve(__dirname, id.slice(0, -4));
				const content = readFileSync(realPath, 'utf-8');
				return `export default ${JSON.stringify(content)};`;
			}
		}
	};
}

/**
 * Custom Rollup plugin to wrap customElements.define() with a guard
 * This prevents "already registered" errors during hot reload or multiple script loads
 * Uses renderChunk to run after minification
 */
function guardCustomElementsDefine() {
	return {
		name: 'guard-custom-elements-define',
		renderChunk(code, chunk, options) {
			// This regex matches the minified pattern: customElements.define("element-name",
			// We need to handle both minified and non-minified code
			let modifiedCode = code.replace(
				/customElements\.define\(["']([^"']+)["']/g,
				(match, elementName) => {
					return `customElements.get("${elementName}")||customElements.define("${elementName}"`;
				}
			);
			return { code: modifiedCode, map: null };
		}
	};
}

/**
 * Custom Rollup plugin to inject process.env polyfill for browser compatibility
 * This fixes "ReferenceError: Can't find variable: process" errors
 * that occur when bundled code contains Node.js-specific process.env references
 */
function injectProcessEnvPolyfill() {
	return {
		name: 'inject-process-env-polyfill',
		generateBundle(options, bundle) {
			// List of components that need the process.env polyfill
			// Add component names here if they encounter process.env errors
			const componentsNeedingPolyfill = [
				// Currently no components in this repo need the polyfill
				// Add component file names here if needed (e.g., 'TicTacToe.js')
			];

			for (const fileName in bundle) {
				const chunk = bundle[fileName];
				
				// Check if this file needs the polyfill (use precise matching)
				const needsPolyfill = componentsNeedingPolyfill.some(name => 
					fileName.endsWith('/' + name) || fileName === name
				);

				if (chunk.type === 'chunk' && chunk.code && needsPolyfill) {
					// Inject the polyfill at the very beginning of the file
					const polyfill = `// Browser polyfill for process.env
if (typeof process === 'undefined') {
  window.process = { env: { NODE_ENV: 'production' } };
}

`;
					chunk.code = polyfill + chunk.code;
					console.log(`✓ Injected process.env polyfill into ${fileName}`);
				}
			}
		}
	};
}

export default {
	input: 'src/frontend/main.ts',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	plugins: [
		alias({
			entries: [
				{ find: '$frontend', replacement: path.resolve(__dirname, 'src/frontend') }
			]
		}),
		rawPlugin(),
		url({
			include: ['**/*.mp3', '**/*.png', '**/*.jpg', '**/*.gif', '**/*.svg', '**/*.woff', '**/*.woff2'],
			exclude: ['**/*?raw'],
			limit: 0, // Don't inline, always copy
			publicPath: '/build/',
			destDir: 'public/build'
		}),
		guardCustomElementsDefine(),
		injectProcessEnvPolyfill(),
		svelte({
			preprocess: sveltePreprocess({
				sourceMap: !production,
				typescript: {
					tsconfigFile: './tsconfig.json'
				}
			}),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production,
				// enable custom element support for .wc.svelte files
				customElement: true
			},
			// Only apply customElement to .wc.svelte files
			include: /\.wc\.svelte$/
		}),
		svelte({
			preprocess: sveltePreprocess({
				sourceMap: !production,
				typescript: {
					tsconfigFile: './tsconfig.json'
				}
			}),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production,
				// regular components don't use custom elements
				customElement: false
			},
			// Apply to all non-.wc.svelte files
			exclude: /\.wc\.svelte$/
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: 'bundle.css' }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte'],
			exportConditions: ['svelte']
		}),
		commonjs(),
		typescript({
			sourceMap: !production,
			inlineSources: !production,
			compilerOptions: {
				sourceMap: !production
			}
		}),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
