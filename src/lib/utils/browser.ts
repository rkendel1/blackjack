// Utility to get URL search parameters
export function getSearchParam(key: string): string | null {
	if (typeof window === 'undefined') return null;
	const params = new URLSearchParams(window.location.search);
	return params.get(key);
}

// Get current path
export function getCurrentPath(): string {
	if (typeof window === 'undefined') return '/';
	return window.location.pathname;
}

// Development mode detection (set at build time)
export const dev = true; // Will be replaced by Rollup in production
