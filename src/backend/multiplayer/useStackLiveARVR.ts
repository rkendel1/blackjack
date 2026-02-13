/**
 * useStackLiveARVR - Svelte hook for AR/VR capabilities in StackLive
 * Integrates AR/VR features with existing StackLive multiplayer infrastructure
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { ARVRManager } from './ARVRManager';
import { AvatarManager } from './AvatarManager';
import { FilterManager } from './FilterManager';
import { GestureDetector } from './GestureDetector';
import { SpatialInteractionManager } from './SpatialInteractionManager';
import type {
	ARVRSessionState,
	XRSessionConfig,
	AvatarMessage,
	FilterMessage,
	GestureMessage,
	SpatialMessage,
	FilterPreset,
	AvatarCustomization
} from './types';

export interface ARVRStores {
	sessionState: Readable<ARVRSessionState>;
	avatars: Readable<Map<string, AvatarMessage>>;
	filters: Readable<Map<string, FilterMessage>>;
	filterPresets: Readable<FilterPreset[]>;
	lastGesture: Readable<GestureMessage | null>;
	spatialObjects: Readable<Map<string, SpatialMessage>>;
}

export interface ARVRActions {
	// Session management
	startARSession: (config?: Partial<XRSessionConfig>) => Promise<boolean>;
	startVRSession: (config?: Partial<XRSessionConfig>) => Promise<boolean>;
	endSession: () => Promise<void>;
	isWebXRSupported: () => Promise<boolean>;

	// Avatar management
	loadAvatar: (modelUrl: string, customizations?: AvatarCustomization) => Promise<AvatarMessage>;
	updateAvatarCustomization: (customizations: Partial<AvatarCustomization>) => void;
	updateAvatarTransform: (transform: {
		position?: [number, number, number];
		rotation?: [number, number, number, number];
		scale?: [number, number, number];
	}) => void;
	setAvatarExpression: (expression: string, intensity: number) => void;
	removeAvatar: (userId: string) => void;

	// Filter management
	applyFilter: (filterId: string, customParameters?: Record<string, unknown>) => FilterMessage | null;
	updateFilterParameters: (parameters: Record<string, unknown>) => void;
	updateFilterIntensity: (intensity: number) => void;
	setFilterEnabled: (enabled: boolean) => void;
	removeFilter: () => void;

	// Gesture detection
	startGestureDetection: (
		videoElement: HTMLVideoElement,
		options?: {
			detectHands?: boolean;
			detectFace?: boolean;
			detectBody?: boolean;
			detectPose?: boolean;
			fps?: number;
		}
	) => Promise<void>;
	stopGestureDetection: () => void;

	// Spatial interactions
	placeObject: (
		objectId: string,
		position: [number, number, number],
		rotation?: [number, number, number, number],
		scale?: [number, number, number]
	) => SpatialMessage;
	moveObject: (objectId: string, position: [number, number, number]) => SpatialMessage;
	rotateObject: (objectId: string, rotation: [number, number, number, number]) => SpatialMessage;
	scaleObject: (objectId: string, scale: [number, number, number]) => SpatialMessage;
	grabObject: (objectId: string) => SpatialMessage;
	point: (rayOrigin: [number, number, number], rayDirection: [number, number, number]) => SpatialMessage;
	draw: (path: Array<[number, number, number]>) => SpatialMessage;

	// Feature toggles
	setAvatarEnabled: (enabled: boolean) => void;
	setFiltersEnabled: (enabled: boolean) => void;
	setSpatialEnabled: (enabled: boolean) => void;
	setGestureDetectionEnabled: (enabled: boolean) => void;

	// Event handling
	onGestureDetected: (callback: (gesture: GestureMessage) => void) => void;
	onSpatialInteraction: (callback: (interaction: SpatialMessage) => void) => void;
	onAvatarUpdated: (callback: (data: { userId: string; avatar: AvatarMessage }) => void) => void;
	onFilterApplied: (callback: (data: { userId: string; filter: FilterMessage }) => void) => void;

	// Cleanup
	cleanup: () => Promise<void>;
}

export function useStackLiveARVR(userId: string, sessionId?: string): ARVRStores & ARVRActions {
	// Initialize managers
	const arvrManager = new ARVRManager();
	const avatarManager = new AvatarManager();
	const filterManager = new FilterManager();
	let gestureDetector: GestureDetector | null = null;
	const spatialManager = new SpatialInteractionManager(userId, sessionId);

	// Create stores
	const sessionState = writable<ARVRSessionState>(arvrManager.getSessionState());
	const avatars = writable<Map<string, AvatarMessage>>(new Map());
	const filters = writable<Map<string, FilterMessage>>(new Map());
	const filterPresets = writable<FilterPreset[]>(filterManager.getFilterPresets());
	const lastGesture = writable<GestureMessage | null>(null);
	const spatialObjects = writable<Map<string, SpatialMessage>>(new Map());

	// Set up event listeners
	arvrManager.on('sessionStarted', () => {
		sessionState.set(arvrManager.getSessionState());
	});

	arvrManager.on('sessionEnded', () => {
		sessionState.set(arvrManager.getSessionState());
	});

	arvrManager.on('avatarUpdated', (data: unknown) => {
		const { userId: uid, avatar } = data as { userId: string; avatar: AvatarMessage };
		const current = avatarManager.getAllAvatars();
		avatars.set(new Map(current));
	});

	arvrManager.on('filterApplied', (data: unknown) => {
		const current = filterManager.getActiveFilters();
		filters.set(new Map(current));
	});

	avatarManager.on('avatarLoaded', () => {
		avatars.set(new Map(avatarManager.getAllAvatars()));
	});

	avatarManager.on('avatarCustomized', () => {
		avatars.set(new Map(avatarManager.getAllAvatars()));
	});

	avatarManager.on('avatarTransformed', () => {
		avatars.set(new Map(avatarManager.getAllAvatars()));
	});

	filterManager.on('filterApplied', () => {
		filters.set(new Map(filterManager.getActiveFilters()));
	});

	filterManager.on('filterRemoved', () => {
		filters.set(new Map(filterManager.getActiveFilters()));
	});

	spatialManager.on('objectPlaced', () => {
		spatialObjects.set(new Map(spatialManager.getAllObjects()));
	});

	spatialManager.on('objectMoved', () => {
		spatialObjects.set(new Map(spatialManager.getAllObjects()));
	});

	spatialManager.on('objectRotated', () => {
		spatialObjects.set(new Map(spatialManager.getAllObjects()));
	});

	// Actions
	const actions: ARVRActions = {
		startARSession: async (config?: Partial<XRSessionConfig>) => {
			const fullConfig: XRSessionConfig = {
				mode: 'immersive-ar',
				requiredFeatures: config?.requiredFeatures || ['local-floor'],
				optionalFeatures: config?.optionalFeatures || ['hand-tracking', 'dom-overlay'],
				...config
			};
			const started = await arvrManager.startSession(fullConfig);
			if (started) {
				sessionState.set(arvrManager.getSessionState());
			}
			return started;
		},

		startVRSession: async (config?: Partial<XRSessionConfig>) => {
			const fullConfig: XRSessionConfig = {
				mode: 'immersive-vr',
				requiredFeatures: config?.requiredFeatures || ['local-floor'],
				optionalFeatures: config?.optionalFeatures || ['hand-tracking'],
				...config
			};
			const started = await arvrManager.startSession(fullConfig);
			if (started) {
				sessionState.set(arvrManager.getSessionState());
			}
			return started;
		},

		endSession: async () => {
			await arvrManager.endSession();
			sessionState.set(arvrManager.getSessionState());
		},

		isWebXRSupported: () => arvrManager.isWebXRSupported(),

		loadAvatar: async (modelUrl: string, customizations?: AvatarCustomization) => {
			const avatar = await avatarManager.loadAvatar(userId, modelUrl, customizations);
			arvrManager.updateAvatar(userId, avatar);
			return avatar;
		},

		updateAvatarCustomization: (customizations: Partial<AvatarCustomization>) => {
			avatarManager.updateCustomization(userId, customizations);
			const avatar = avatarManager.getAvatar(userId);
			if (avatar) {
				arvrManager.updateAvatar(userId, avatar);
			}
		},

		updateAvatarTransform: (transform) => {
			avatarManager.updateTransform(userId, transform);
			const avatar = avatarManager.getAvatar(userId);
			if (avatar) {
				arvrManager.updateAvatar(userId, avatar);
			}
		},

		setAvatarExpression: (expression: string, intensity: number) => {
			avatarManager.setExpression(userId, expression, intensity);
			const avatar = avatarManager.getAvatar(userId);
			if (avatar) {
				arvrManager.updateAvatar(userId, avatar);
			}
		},

		removeAvatar: (uid: string) => {
			avatarManager.removeAvatar(uid);
			arvrManager.removeAvatar(uid);
		},

		applyFilter: (filterId: string, customParameters?: Record<string, unknown>) => {
			const filter = filterManager.applyFilter(userId, filterId, sessionId, customParameters);
			if (filter) {
				arvrManager.applyFilter(userId, filter);
			}
			return filter;
		},

		updateFilterParameters: (parameters: Record<string, unknown>) => {
			filterManager.updateFilterParameters(userId, parameters);
		},

		updateFilterIntensity: (intensity: number) => {
			filterManager.updateFilterIntensity(userId, intensity);
		},

		setFilterEnabled: (enabled: boolean) => {
			filterManager.setFilterEnabled(userId, enabled);
		},

		removeFilter: () => {
			filterManager.removeFilter(userId);
			arvrManager.removeFilter(userId);
		},

		startGestureDetection: async (videoElement: HTMLVideoElement, options = {}) => {
			if (!gestureDetector) {
				gestureDetector = new GestureDetector(userId, sessionId);
				gestureDetector.on('gestureDetected', (data: unknown) => {
					const gesture = data as GestureMessage;
					lastGesture.set(gesture);
					arvrManager.processGesture(gesture);
				});
			}
			await gestureDetector.startDetection(videoElement, options);
		},

		stopGestureDetection: () => {
			gestureDetector?.stopDetection();
		},

		placeObject: (objectId, position, rotation, scale) => {
			const interaction = spatialManager.placeObject(objectId, position, rotation, scale);
			arvrManager.processSpatialInteraction(interaction);
			return interaction;
		},

		moveObject: (objectId, position) => {
			const interaction = spatialManager.moveObject(objectId, position);
			arvrManager.processSpatialInteraction(interaction);
			return interaction;
		},

		rotateObject: (objectId, rotation) => {
			const interaction = spatialManager.rotateObject(objectId, rotation);
			arvrManager.processSpatialInteraction(interaction);
			return interaction;
		},

		scaleObject: (objectId, scale) => {
			const interaction = spatialManager.scaleObject(objectId, scale);
			arvrManager.processSpatialInteraction(interaction);
			return interaction;
		},

		grabObject: (objectId) => {
			const interaction = spatialManager.grabObject(objectId);
			arvrManager.processSpatialInteraction(interaction);
			return interaction;
		},

		point: (rayOrigin, rayDirection) => {
			const interaction = spatialManager.point(rayOrigin, rayDirection);
			arvrManager.processSpatialInteraction(interaction);
			return interaction;
		},

		draw: (path) => {
			const interaction = spatialManager.draw(path);
			arvrManager.processSpatialInteraction(interaction);
			return interaction;
		},

		setAvatarEnabled: (enabled: boolean) => {
			arvrManager.setAvatarEnabled(enabled);
			sessionState.set(arvrManager.getSessionState());
		},

		setFiltersEnabled: (enabled: boolean) => {
			arvrManager.setFiltersEnabled(enabled);
			sessionState.set(arvrManager.getSessionState());
		},

		setSpatialEnabled: (enabled: boolean) => {
			arvrManager.setSpatialEnabled(enabled);
			sessionState.set(arvrManager.getSessionState());
		},

		setGestureDetectionEnabled: (enabled: boolean) => {
			arvrManager.setGestureDetectionEnabled(enabled);
			sessionState.set(arvrManager.getSessionState());
		},

		onGestureDetected: (callback) => {
			arvrManager.on('gestureDetected', callback);
		},

		onSpatialInteraction: (callback) => {
			arvrManager.on('spatialInteraction', callback);
		},

		onAvatarUpdated: (callback) => {
			arvrManager.on('avatarUpdated', callback);
		},

		onFilterApplied: (callback) => {
			arvrManager.on('filterApplied', callback);
		},

		cleanup: async () => {
			await arvrManager.cleanup();
			avatarManager.cleanup();
			filterManager.cleanup();
			gestureDetector?.cleanup();
			spatialManager.cleanup();
		}
	};

	return {
		// Stores
		sessionState: { subscribe: sessionState.subscribe },
		avatars: { subscribe: avatars.subscribe },
		filters: { subscribe: filters.subscribe },
		filterPresets: { subscribe: filterPresets.subscribe },
		lastGesture: { subscribe: lastGesture.subscribe },
		spatialObjects: { subscribe: spatialObjects.subscribe },
		// Actions
		...actions
	};
}
