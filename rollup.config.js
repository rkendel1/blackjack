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

export default {
	input: 'src/main.ts',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	plugins: [
		alias({
			entries: [
				{ find: '$lib', replacement: path.resolve(__dirname, 'src/lib') }
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
				// enable custom element support for web components
				customElement: false
			}
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
