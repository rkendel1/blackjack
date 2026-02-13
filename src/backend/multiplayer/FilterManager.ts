/**
 * FilterManager - Manages AR filters and effects
 * Handles filter loading, application, and parameter management
 */

import type { FilterMessage, FilterPreset, FilterType, FilterCategory } from './types';

export class FilterManager {
	private activeFilters = new Map<string, FilterMessage>();
	private filterPresets = new Map<string, FilterPreset>();
	private eventListeners = new Map<string, Set<(data: unknown) => void>>();

	/**
	 * Initialize with default filter presets
	 */
	constructor() {
		this.loadDefaultPresets();
	}

	/**
	 * Load default filter presets
	 */
	private loadDefaultPresets(): void {
		const defaultFilters: FilterPreset[] = [
			{
				id: 'beauty-smooth',
				name: 'Beauty Smooth',
				type: 'face',
				category: 'beauty',
				parameters: { smoothness: 0.7, brightness: 0.1 }
			},
			{
				id: 'fun-bunny-ears',
				name: 'Bunny Ears',
				type: 'face',
				category: 'fun',
				parameters: { scale: 1.0 }
			},
			{
				id: 'artistic-sketch',
				name: 'Sketch Effect',
				type: 'environment',
				category: 'artistic',
				parameters: { lineIntensity: 0.8, threshold: 0.5 }
			},
			{
				id: 'seasonal-snow',
				name: 'Snow Effect',
				type: 'environment',
				category: 'seasonal',
				parameters: { density: 0.6, speed: 0.5 }
			}
		];

		defaultFilters.forEach((filter) => {
			this.filterPresets.set(filter.id, filter);
		});
	}

	/**
	 * Apply a filter to a user
	 */
	applyFilter(
		userId: string,
		filterId: string,
		sessionId?: string,
		customParameters?: Record<string, unknown>
	): FilterMessage | null {
		const preset = this.filterPresets.get(filterId);
		if (!preset) {
			console.warn(`Filter preset not found: ${filterId}`);
			return null;
		}

		const filter: FilterMessage = {
			id: this.generateId(),
			userId,
			sessionId,
			filterType: preset.type,
			filterCategory: preset.category,
			filterName: preset.name,
			filterUrl: preset.assetUrl,
			parameters: customParameters || preset.parameters,
			intensity: 1.0,
			enabled: true,
			timestamp: Date.now()
		};

		this.activeFilters.set(userId, filter);
		this.emit('filterApplied', { userId, filter });

		return filter;
	}

	/**
	 * Update filter parameters
	 */
	updateFilterParameters(userId: string, parameters: Record<string, unknown>): void {
		const filter = this.activeFilters.get(userId);
		if (!filter) {
			console.warn(`No active filter for user ${userId}`);
			return;
		}

		filter.parameters = { ...filter.parameters, ...parameters };
		filter.timestamp = Date.now();

		this.emit('filterUpdated', { userId, filter });
	}

	/**
	 * Update filter intensity
	 */
	updateFilterIntensity(userId: string, intensity: number): void {
		const filter = this.activeFilters.get(userId);
		if (!filter) {
			console.warn(`No active filter for user ${userId}`);
			return;
		}

		filter.intensity = Math.max(0, Math.min(1, intensity));
		filter.timestamp = Date.now();

		this.emit('filterIntensityChanged', { userId, intensity: filter.intensity });
	}

	/**
	 * Enable/disable filter
	 */
	setFilterEnabled(userId: string, enabled: boolean): void {
		const filter = this.activeFilters.get(userId);
		if (!filter) {
			console.warn(`No active filter for user ${userId}`);
			return;
		}

		filter.enabled = enabled;
		filter.timestamp = Date.now();

		this.emit('filterToggled', { userId, enabled });
	}

	/**
	 * Remove filter
	 */
	removeFilter(userId: string): void {
		this.activeFilters.delete(userId);
		this.emit('filterRemoved', { userId });
	}

	/**
	 * Get active filter for user
	 */
	getActiveFilter(userId: string): FilterMessage | undefined {
		return this.activeFilters.get(userId);
	}

	/**
	 * Get all active filters
	 */
	getActiveFilters(): Map<string, FilterMessage> {
		return new Map(this.activeFilters);
	}

	/**
	 * Get available filter presets
	 */
	getFilterPresets(type?: FilterType, category?: FilterCategory): FilterPreset[] {
		let presets = Array.from(this.filterPresets.values());

		if (type) {
			presets = presets.filter((p) => p.type === type);
		}

		if (category) {
			presets = presets.filter((p) => p.category === category);
		}

		return presets;
	}

	/**
	 * Add custom filter preset
	 */
	addFilterPreset(preset: FilterPreset): void {
		this.filterPresets.set(preset.id, preset);
		this.emit('presetAdded', { preset });
	}

	/**
	 * Remove filter preset
	 */
	removeFilterPreset(presetId: string): void {
		this.filterPresets.delete(presetId);
		this.emit('presetRemoved', { presetId });
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `filter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Add event listener
	 */
	on(event: string, callback: (data: unknown) => void): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)?.add(callback);
	}

	/**
	 * Remove event listener
	 */
	off(event: string, callback: (data: unknown) => void): void {
		this.eventListeners.get(event)?.delete(callback);
	}

	/**
	 * Emit event to listeners
	 */
	private emit(event: string, data: unknown): void {
		this.eventListeners.get(event)?.forEach((callback) => {
			try {
				callback(data);
			} catch (error) {
				console.error(`Error in ${event} listener:`, error);
			}
		});
	}

	/**
	 * Cleanup
	 */
	cleanup(): void {
		this.activeFilters.clear();
		this.eventListeners.clear();
	}
}
