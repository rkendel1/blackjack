// Simple client-side router for Svelte
import { writable, derived } from 'svelte/store';

export interface Route {
	path: string;
	component: any;
}

function createRouter(routes: Route[]) {
	const path = writable(window.location.pathname);

	// Listen for popstate events (back/forward buttons)
	window.addEventListener('popstate', () => {
		path.set(window.location.pathname);
	});

	// Navigate to a new path
	function navigate(newPath: string) {
		window.history.pushState({}, '', newPath);
		path.set(newPath);
	}

	// Find the matching route for the current path
	const currentRoute = derived(path, ($path) => {
		// Exact match first
		let route = routes.find((r) => r.path === $path);
		
		// If no exact match, try to find a route that matches the beginning
		if (!route) {
			route = routes.find((r) => r.path !== '/' && $path.startsWith(r.path));
		}
		
		// Default to home route
		if (!route) {
			route = routes.find((r) => r.path === '/');
		}
		
		return route;
	});

	return {
		path,
		currentRoute,
		navigate
	};
}

export { createRouter };
