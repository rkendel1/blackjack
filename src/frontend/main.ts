import App from './App.svelte';
// Import web components to register them globally
import './webcomponents';

const app = new App({
	target: document.body
});

export default app;
