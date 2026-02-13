/**
 * ARVRManager - Manages AR/VR sessions and state
 * Handles WebXR session initialization, avatar management, filter application,
 * and spatial interaction tracking
 */

import type {
	ARVRSessionState,
	XRSessionConfig,
	AvatarMessage,
	FilterMessage,
	GestureMessage,
	SpatialMessage
} from './types';

export class ARVRManager {
	private sessionState: ARVRSessionState = {
		active: false,
		avatarEnabled: false,
		filtersEnabled: false,
		spatialEnabled: false,
		gestureDetectionEnabled: false
	};

	private xrSession: XRSession | null = null;
	private activeAvatars = new Map<string, AvatarMessage>();
	private activeFilters = new Map<string, FilterMessage>();
	private eventListeners = new Map<string, Set<(data: unknown) => void>>();

	/**
	 * Check if WebXR is supported on this device
	 */
	async isWebXRSupported(): Promise<boolean> {
		if (!('xr' in navigator)) {
			return false;
		}
		try {
			const isSupported = await navigator.xr?.isSessionSupported('immersive-vr');
			return isSupported || false;
		} catch {
			return false;
		}
	}

	/**
	 * Initialize an AR/VR session
	 */
	async startSession(config: XRSessionConfig): Promise<boolean> {
		if (!navigator.xr) {
			console.warn('WebXR not available on this device');
			return false;
		}

		try {
			const session = await navigator.xr.requestSession(config.mode, {
				requiredFeatures: config.requiredFeatures || [],
				optionalFeatures: config.optionalFeatures || ['local-floor', 'bounded-floor', 'hand-tracking'],
				domOverlay: config.domOverlay ? { root: config.domOverlay } : undefined
			});

			this.xrSession = session;
			this.sessionState.active = true;
			this.sessionState.mode = config.mode.includes('ar') ? 'ar' : 'vr';
			this.sessionState.xrSession = session;

			// Handle session end
			session.addEventListener('end', () => {
				this.endSession();
			});

			this.emit('sessionStarted', { mode: this.sessionState.mode });
			return true;
		} catch (error) {
			console.error('Failed to start XR session:', error);
			return false;
		}
	}

	/**
	 * End the current AR/VR session
	 */
	async endSession(): Promise<void> {
		if (this.xrSession) {
			await this.xrSession.end();
			this.xrSession = null;
		}

		this.sessionState.active = false;
		this.sessionState.xrSession = undefined;
		this.emit('sessionEnded', {});
	}

	/**
	 * Get current session state
	 */
	getSessionState(): ARVRSessionState {
		return { ...this.sessionState };
	}

	/**
	 * Enable/disable avatar rendering
	 */
	setAvatarEnabled(enabled: boolean): void {
		this.sessionState.avatarEnabled = enabled;
		this.emit('avatarStateChanged', { enabled });
	}

	/**
	 * Enable/disable filter effects
	 */
	setFiltersEnabled(enabled: boolean): void {
		this.sessionState.filtersEnabled = enabled;
		this.emit('filterStateChanged', { enabled });
	}

	/**
	 * Enable/disable spatial interactions
	 */
	setSpatialEnabled(enabled: boolean): void {
		this.sessionState.spatialEnabled = enabled;
		this.emit('spatialStateChanged', { enabled });
	}

	/**
	 * Enable/disable gesture detection
	 */
	setGestureDetectionEnabled(enabled: boolean): void {
		this.sessionState.gestureDetectionEnabled = enabled;
		this.emit('gestureDetectionChanged', { enabled });
	}

	/**
	 * Update or add an avatar
	 */
	updateAvatar(userId: string, avatar: AvatarMessage): void {
		this.activeAvatars.set(userId, avatar);
		this.emit('avatarUpdated', { userId, avatar });
	}

	/**
	 * Remove an avatar
	 */
	removeAvatar(userId: string): void {
		this.activeAvatars.delete(userId);
		this.emit('avatarRemoved', { userId });
	}

	/**
	 * Get all active avatars
	 */
	getActiveAvatars(): Map<string, AvatarMessage> {
		return new Map(this.activeAvatars);
	}

	/**
	 * Get a specific avatar
	 */
	getAvatar(userId: string): AvatarMessage | undefined {
		return this.activeAvatars.get(userId);
	}

	/**
	 * Apply a filter
	 */
	applyFilter(userId: string, filter: FilterMessage): void {
		this.activeFilters.set(userId, filter);
		this.emit('filterApplied', { userId, filter });
	}

	/**
	 * Remove a filter
	 */
	removeFilter(userId: string): void {
		this.activeFilters.delete(userId);
		this.emit('filterRemoved', { userId });
	}

	/**
	 * Get active filters
	 */
	getActiveFilters(): Map<string, FilterMessage> {
		return new Map(this.activeFilters);
	}

	/**
	 * Process gesture data
	 */
	processGesture(gesture: GestureMessage): void {
		this.emit('gestureDetected', gesture);
	}

	/**
	 * Process spatial interaction
	 */
	processSpatialInteraction(interaction: SpatialMessage): void {
		this.emit('spatialInteraction', interaction);
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
	 * Cleanup all resources
	 */
	async cleanup(): Promise<void> {
		await this.endSession();
		this.activeAvatars.clear();
		this.activeFilters.clear();
		this.eventListeners.clear();
	}
}
