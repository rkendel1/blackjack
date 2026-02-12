import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import url from '@rollup/plugin-url';
import css from 'rollup-plugin-css-only';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom Rollup plugin to wrap customElements.define() with a guard
 * This prevents "already registered" errors during hot reload or multiple script loads
 */
function guardCustomElementsDefine() {
	return {
		name: 'guard-custom-elements-define',
		renderChunk(code, chunk, options) {
			// This regex matches the pattern: customElements.define("element-name",
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
				// Currently no components in blackjack repo need the polyfill
				// Example: 'TicTacToe.js',  // Uses React which checks process.env.NODE_ENV
			];

			for (const fileName in bundle) {
				const chunk = bundle[fileName];
				
				// Check if this file needs the polyfill
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

/**
 * AUTO-MANAGED COMPONENT LIST
 * 
 * This array contains all web components from the blackjack repository.
 * These components are ready to be integrated into the StackLive platform.
 * 
 * NAMING CONVENTION:
 * - These names are in kebab-case to match the Svelte FILE NAMES
 * - Component identifiers in code/DB use snake_case (e.g., 'arvr_scene')
 * - HTML tags/attributes use kebab-case (e.g., <sl-arvr-scene>)
 * - All components use the 'sl-' prefix for StackLive
 */
const BLACKJACK_COMPONENTS = [
	// AR/VR Components
	{
		name: 'arvr-scene',
		file: 'ARVRScene.wc.svelte',
		tag: 'sl-arvr-scene',
		description: 'AR/VR scene container with WebXR support',
		category: 'arvr'
	},
	{
		name: 'arvr-avatar',
		file: 'ARVRAvatar.wc.svelte',
		tag: 'sl-arvr-avatar',
		description: '3D avatar component for AR/VR experiences',
		category: 'arvr'
	},
	{
		name: 'arvr-filter',
		file: 'ARVRFilter.wc.svelte',
		tag: 'sl-arvr-filter',
		description: 'Visual filter/effect component for AR/VR',
		category: 'arvr'
	},
	{
		name: 'arvr-spatial',
		file: 'ARVRSpatial.wc.svelte',
		tag: 'sl-arvr-spatial',
		description: 'Spatial object placement component',
		category: 'arvr'
	},
	
	// Communication Components
	{
		name: 'messaging',
		file: 'MessagingEmbed.wc.svelte',
		tag: 'sl-messaging',
		description: 'iMessage-style messaging with video calls and media sharing',
		category: 'communication'
	},
	
	// Game Components
	{
		name: 'tictactoe',
		file: 'TicTacToeEmbed.wc.svelte',
		tag: 'sl-tictactoe',
		description: 'Interactive Tic-Tac-Toe game with bot AI and multiplayer support',
		category: 'games'
	}
];

/**
 * Generate component input entries for Rollup
 * Each component gets its own entry point for individual bundling
 */
function generateComponentInputs() {
	const inputs = {};
	BLACKJACK_COMPONENTS.forEach(component => {
		// Use kebab-case for file names (e.g., 'ARVRScene' -> 'arvr-scene.js')
		inputs[component.name] = `src/lib/Components/webcomponents/${component.file}`;
	});
	return inputs;
}

/**
 * StackLive Platform Rollup Configuration
 * 
 * This configuration builds all blackjack web components for the StackLive platform.
 * Each component is bundled separately to allow selective loading.
 */
export default {
	// Multiple entry points - one per component
	input: generateComponentInputs(),
	
	output: {
		// Output to dist directory with format suitable for StackLive
		dir: 'dist/components',
		format: 'es', // ES modules for modern browsers
		sourcemap: true,
		// Preserve the component name structure
		entryFileNames: '[name].js',
		chunkFileNames: 'chunks/[name]-[hash].js'
	},
	
	plugins: [
		// Path alias resolution
		alias({
			entries: [
				{ find: '$lib', replacement: path.resolve(__dirname, 'src/lib') }
			]
		}),
		
		// Asset handling
		url({
			include: ['**/*.mp3', '**/*.png', '**/*.jpg', '**/*.gif', '**/*.svg', '**/*.woff', '**/*.woff2'],
			limit: 0, // Don't inline, always copy
			publicPath: '/assets/',
			destDir: 'dist/assets'
		}),
		
		// Svelte plugin for web components (.wc.svelte files)
		svelte({
			preprocess: sveltePreprocess({
				typescript: {
					tsconfigFile: './tsconfig.json'
				}
			}),
			compilerOptions: {
				// All these files are web components
				customElement: true
			},
			// Include only .wc.svelte files
			include: /\.wc\.svelte$/
		}),
		
		// Svelte plugin for regular components (.svelte files, not .wc.svelte)
		svelte({
			preprocess: sveltePreprocess({
				typescript: {
					tsconfigFile: './tsconfig.json'
				}
			}),
			compilerOptions: {
				// Regular components don't use custom elements
				customElement: false
			},
			// Exclude .wc.svelte files
			exclude: /\.wc\.svelte$/,
			emitCss: true
		}),
		
		// Extract CSS into separate file
		css({ output: 'components.css' }),
		
		// Resolve dependencies from node_modules
		resolve({
			browser: true,
			dedupe: ['svelte'],
			exportConditions: ['svelte']
		}),
		
		// Convert CommonJS to ES modules
		commonjs(),
		
		// TypeScript support
		typescript({
			sourceMap: true,
			inlineSources: true
		}),
		
		// Guard custom elements to prevent "already registered" errors
		guardCustomElementsDefine(),
		
		// Inject process.env polyfill where needed
		injectProcessEnvPolyfill()
	],
	
	// External dependencies that StackLive platform should provide
	external: [
		// Add any shared dependencies here that shouldn't be bundled
		// Example: 'svelte/store', 'svelte/internal'
	],
	
	watch: {
		clearScreen: false
	}
};

// Export component metadata for StackLive platform integration
export { BLACKJACK_COMPONENTS };
