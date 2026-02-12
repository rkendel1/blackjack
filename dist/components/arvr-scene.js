import { c as create_custom_element, S as SvelteComponent, i as init, s as safe_not_equal, f as flush, a as append_styles, n as noop, d as detach, b as set_style, e as insert, g as append, h as element, j as space, k as attr, o as onMount, l as onDestroy, t as toggle_class, m as set_data, p as text, q as subscribe, r as binding_callbacks } from './chunks/index-DR_90iw3.js';
import { w as writable } from './chunks/index-DrPl72qu.js';

/**
 * ARVRManager - Manages AR/VR sessions and state
 * Handles WebXR session initialization, avatar management, filter application,
 * and spatial interaction tracking
 */
class ARVRManager {
    sessionState = {
        active: false,
        avatarEnabled: false,
        filtersEnabled: false,
        spatialEnabled: false,
        gestureDetectionEnabled: false
    };
    xrSession = null;
    activeAvatars = new Map();
    activeFilters = new Map();
    eventListeners = new Map();
    /**
     * Check if WebXR is supported on this device
     */
    async isWebXRSupported() {
        if (!('xr' in navigator)) {
            return false;
        }
        try {
            const isSupported = await navigator.xr?.isSessionSupported('immersive-vr');
            return isSupported || false;
        }
        catch {
            return false;
        }
    }
    /**
     * Initialize an AR/VR session
     */
    async startSession(config) {
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
        }
        catch (error) {
            console.error('Failed to start XR session:', error);
            return false;
        }
    }
    /**
     * End the current AR/VR session
     */
    async endSession() {
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
    getSessionState() {
        return { ...this.sessionState };
    }
    /**
     * Enable/disable avatar rendering
     */
    setAvatarEnabled(enabled) {
        this.sessionState.avatarEnabled = enabled;
        this.emit('avatarStateChanged', { enabled });
    }
    /**
     * Enable/disable filter effects
     */
    setFiltersEnabled(enabled) {
        this.sessionState.filtersEnabled = enabled;
        this.emit('filterStateChanged', { enabled });
    }
    /**
     * Enable/disable spatial interactions
     */
    setSpatialEnabled(enabled) {
        this.sessionState.spatialEnabled = enabled;
        this.emit('spatialStateChanged', { enabled });
    }
    /**
     * Enable/disable gesture detection
     */
    setGestureDetectionEnabled(enabled) {
        this.sessionState.gestureDetectionEnabled = enabled;
        this.emit('gestureDetectionChanged', { enabled });
    }
    /**
     * Update or add an avatar
     */
    updateAvatar(userId, avatar) {
        this.activeAvatars.set(userId, avatar);
        this.emit('avatarUpdated', { userId, avatar });
    }
    /**
     * Remove an avatar
     */
    removeAvatar(userId) {
        this.activeAvatars.delete(userId);
        this.emit('avatarRemoved', { userId });
    }
    /**
     * Get all active avatars
     */
    getActiveAvatars() {
        return new Map(this.activeAvatars);
    }
    /**
     * Get a specific avatar
     */
    getAvatar(userId) {
        return this.activeAvatars.get(userId);
    }
    /**
     * Apply a filter
     */
    applyFilter(userId, filter) {
        this.activeFilters.set(userId, filter);
        this.emit('filterApplied', { userId, filter });
    }
    /**
     * Remove a filter
     */
    removeFilter(userId) {
        this.activeFilters.delete(userId);
        this.emit('filterRemoved', { userId });
    }
    /**
     * Get active filters
     */
    getActiveFilters() {
        return new Map(this.activeFilters);
    }
    /**
     * Process gesture data
     */
    processGesture(gesture) {
        this.emit('gestureDetected', gesture);
    }
    /**
     * Process spatial interaction
     */
    processSpatialInteraction(interaction) {
        this.emit('spatialInteraction', interaction);
    }
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)?.add(callback);
    }
    /**
     * Remove event listener
     */
    off(event, callback) {
        this.eventListeners.get(event)?.delete(callback);
    }
    /**
     * Emit event to listeners
     */
    emit(event, data) {
        this.eventListeners.get(event)?.forEach((callback) => {
            try {
                callback(data);
            }
            catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }
    /**
     * Cleanup all resources
     */
    async cleanup() {
        await this.endSession();
        this.activeAvatars.clear();
        this.activeFilters.clear();
        this.eventListeners.clear();
    }
}

/**
 * AvatarManager - Manages 3D avatar loading and state
 * Handles avatar model loading, customization, and transformation
 */
class AvatarManager {
    avatars = new Map();
    loadedModels = new Map(); // Store loaded 3D models
    eventListeners = new Map();
    /**
     * Load an avatar model
     * @param userId - User ID for the avatar
     * @param modelUrl - URL to glTF or USDZ model file
     * @param customizations - Avatar customization options
     */
    async loadAvatar(userId, modelUrl, customizations) {
        const avatar = {
            id: this.generateId(),
            userId,
            avatarModel: modelUrl,
            customizations: {
                hair: customizations?.hair?.style,
                clothing: customizations?.clothing?.outfit || customizations?.clothing?.top,
                accessories: customizations?.accessories?.map((a) => a.id),
                expressions: customizations?.expressions,
                skinTone: customizations?.skinTone,
                bodyType: customizations?.bodyType
            },
            timestamp: Date.now()
        };
        this.avatars.set(userId, avatar);
        this.emit('avatarLoaded', { userId, avatar });
        return avatar;
    }
    /**
     * Update avatar customization
     */
    updateCustomization(userId, customizations) {
        const avatar = this.avatars.get(userId);
        if (!avatar) {
            console.warn(`Avatar not found for user ${userId}`);
            return;
        }
        // Merge customizations
        if (customizations.hair) {
            avatar.customizations.hair = customizations.hair.style;
        }
        if (customizations.clothing) {
            avatar.customizations.clothing =
                customizations.clothing.outfit || customizations.clothing.top;
        }
        if (customizations.accessories) {
            avatar.customizations.accessories = customizations.accessories.map((a) => a.id);
        }
        if (customizations.expressions) {
            avatar.customizations.expressions = {
                ...avatar.customizations.expressions,
                ...customizations.expressions
            };
        }
        if (customizations.skinTone) {
            avatar.customizations.skinTone = customizations.skinTone;
        }
        if (customizations.bodyType) {
            avatar.customizations.bodyType = customizations.bodyType;
        }
        avatar.timestamp = Date.now();
        this.emit('avatarCustomized', { userId, avatar });
    }
    /**
     * Update avatar transform (position, rotation, scale)
     */
    updateTransform(userId, transform) {
        const avatar = this.avatars.get(userId);
        if (!avatar) {
            console.warn(`Avatar not found for user ${userId}`);
            return;
        }
        avatar.transform = {
            position: transform.position || avatar.transform?.position || [0, 0, 0],
            rotation: transform.rotation || avatar.transform?.rotation || [0, 0, 0, 1],
            scale: transform.scale || avatar.transform?.scale || [1, 1, 1]
        };
        avatar.timestamp = Date.now();
        this.emit('avatarTransformed', { userId, avatar });
    }
    /**
     * Set avatar expression
     */
    setExpression(userId, expression, intensity) {
        const avatar = this.avatars.get(userId);
        if (!avatar) {
            console.warn(`Avatar not found for user ${userId}`);
            return;
        }
        if (!avatar.customizations.expressions) {
            avatar.customizations.expressions = {};
        }
        avatar.customizations.expressions[expression] = Math.max(0, Math.min(1, intensity));
        avatar.timestamp = Date.now();
        this.emit('avatarExpression', { userId, expression, intensity });
    }
    /**
     * Get avatar for a user
     */
    getAvatar(userId) {
        return this.avatars.get(userId);
    }
    /**
     * Get all avatars
     */
    getAllAvatars() {
        return new Map(this.avatars);
    }
    /**
     * Remove avatar
     */
    removeAvatar(userId) {
        this.avatars.delete(userId);
        this.loadedModels.delete(userId);
        this.emit('avatarRemoved', { userId });
    }
    /**
     * Store loaded 3D model reference
     */
    setLoadedModel(userId, model) {
        this.loadedModels.set(userId, model);
    }
    /**
     * Get loaded 3D model reference
     */
    getLoadedModel(userId) {
        return this.loadedModels.get(userId);
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)?.add(callback);
    }
    /**
     * Remove event listener
     */
    off(event, callback) {
        this.eventListeners.get(event)?.delete(callback);
    }
    /**
     * Emit event to listeners
     */
    emit(event, data) {
        this.eventListeners.get(event)?.forEach((callback) => {
            try {
                callback(data);
            }
            catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }
    /**
     * Cleanup
     */
    cleanup() {
        this.avatars.clear();
        this.loadedModels.clear();
        this.eventListeners.clear();
    }
}

/**
 * FilterManager - Manages AR filters and effects
 * Handles filter loading, application, and parameter management
 */
class FilterManager {
    activeFilters = new Map();
    filterPresets = new Map();
    eventListeners = new Map();
    /**
     * Initialize with default filter presets
     */
    constructor() {
        this.loadDefaultPresets();
    }
    /**
     * Load default filter presets
     */
    loadDefaultPresets() {
        const defaultFilters = [
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
    applyFilter(userId, filterId, sessionId, customParameters) {
        const preset = this.filterPresets.get(filterId);
        if (!preset) {
            console.warn(`Filter preset not found: ${filterId}`);
            return null;
        }
        const filter = {
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
    updateFilterParameters(userId, parameters) {
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
    updateFilterIntensity(userId, intensity) {
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
    setFilterEnabled(userId, enabled) {
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
    removeFilter(userId) {
        this.activeFilters.delete(userId);
        this.emit('filterRemoved', { userId });
    }
    /**
     * Get active filter for user
     */
    getActiveFilter(userId) {
        return this.activeFilters.get(userId);
    }
    /**
     * Get all active filters
     */
    getActiveFilters() {
        return new Map(this.activeFilters);
    }
    /**
     * Get available filter presets
     */
    getFilterPresets(type, category) {
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
    addFilterPreset(preset) {
        this.filterPresets.set(preset.id, preset);
        this.emit('presetAdded', { preset });
    }
    /**
     * Remove filter preset
     */
    removeFilterPreset(presetId) {
        this.filterPresets.delete(presetId);
        this.emit('presetRemoved', { presetId });
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `filter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)?.add(callback);
    }
    /**
     * Remove event listener
     */
    off(event, callback) {
        this.eventListeners.get(event)?.delete(callback);
    }
    /**
     * Emit event to listeners
     */
    emit(event, data) {
        this.eventListeners.get(event)?.forEach((callback) => {
            try {
                callback(data);
            }
            catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }
    /**
     * Cleanup
     */
    cleanup() {
        this.activeFilters.clear();
        this.eventListeners.clear();
    }
}

/**
 * GestureDetector - Detects gestures and poses from video streams
 * Provides pose detection, gesture recognition, and landmark tracking
 * Designed to work with MediaPipe or similar ML libraries (stub implementation)
 */
class GestureDetector {
    enabled = false;
    detectionInterval = null;
    eventListeners = new Map();
    videoElement = null;
    userId;
    sessionId;
    constructor(userId, sessionId) {
        this.userId = userId;
        this.sessionId = sessionId;
    }
    /**
     * Start gesture detection on a video stream
     */
    async startDetection(videoElement, options = {}) {
        this.videoElement = videoElement;
        this.enabled = true;
        const fps = options.fps || 10; // Default to 10 FPS for gesture detection
        const intervalMs = 1000 / fps;
        // Start detection loop
        this.detectionInterval = window.setInterval(() => {
            if (!this.enabled || !this.videoElement) {
                return;
            }
            // Perform detection based on enabled options
            if (options.detectHands) {
                this.detectHandGestures();
            }
            if (options.detectFace) {
                this.detectFaceExpressions();
            }
            if (options.detectBody || options.detectPose) {
                this.detectBodyPose();
            }
        }, intervalMs);
        this.emit('detectionStarted', { userId: this.userId });
    }
    /**
     * Stop gesture detection
     */
    stopDetection() {
        this.enabled = false;
        if (this.detectionInterval !== null) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        this.emit('detectionStopped', { userId: this.userId });
    }
    /**
     * Detect hand gestures (stub implementation)
     * In production, this would use MediaPipe Hands or similar
     */
    detectHandGestures() {
        // Stub: Generate sample hand gesture data
        // In production, integrate with MediaPipe Hands or TensorFlow.js
        const sampleGestures = ['wave', 'thumbsUp', 'peace', 'point', 'fist'];
        const randomGesture = sampleGestures[Math.floor(Math.random() * sampleGestures.length)];
        // Only emit occasionally to simulate actual detection
        if (Math.random() < 0.1) {
            const gesture = {
                id: this.generateId(),
                userId: this.userId,
                sessionId: this.sessionId,
                gestureType: 'hand',
                gesture: randomGesture,
                confidence: 0.85 + Math.random() * 0.15,
                landmarks: this.generateSampleLandmarks(21), // 21 hand landmarks
                timestamp: Date.now()
            };
            this.emit('gestureDetected', gesture);
        }
    }
    /**
     * Detect face expressions (stub implementation)
     * In production, this would use MediaPipe Face Mesh or similar
     */
    detectFaceExpressions() {
        // Stub: Generate sample face expression data
        const expressions = ['smile', 'surprised', 'neutral', 'wink'];
        const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
        if (Math.random() < 0.1) {
            const gesture = {
                id: this.generateId(),
                userId: this.userId,
                sessionId: this.sessionId,
                gestureType: 'face',
                gesture: randomExpression,
                confidence: 0.8 + Math.random() * 0.2,
                landmarks: this.generateSampleLandmarks(468), // 468 face landmarks
                timestamp: Date.now()
            };
            this.emit('gestureDetected', gesture);
        }
    }
    /**
     * Detect body pose (stub implementation)
     * In production, this would use MediaPipe Pose or similar
     */
    detectBodyPose() {
        // Stub: Generate sample pose data
        const poses = ['standing', 'sitting', 'waving', 'reaching'];
        const randomPose = poses[Math.floor(Math.random() * poses.length)];
        if (Math.random() < 0.1) {
            const gesture = {
                id: this.generateId(),
                userId: this.userId,
                sessionId: this.sessionId,
                gestureType: 'body',
                gesture: randomPose,
                confidence: 0.75 + Math.random() * 0.25,
                landmarks: this.generateSampleLandmarks(33), // 33 pose landmarks
                timestamp: Date.now()
            };
            this.emit('gestureDetected', gesture);
        }
    }
    /**
     * Generate sample landmarks for testing
     */
    generateSampleLandmarks(count) {
        return Array.from({ length: count }, () => ({
            x: Math.random(),
            y: Math.random(),
            z: Math.random() * 0.5,
            visibility: 0.8 + Math.random() * 0.2
        }));
    }
    /**
     * Check if detection is currently active
     */
    isEnabled() {
        return this.enabled;
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `gesture-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)?.add(callback);
    }
    /**
     * Remove event listener
     */
    off(event, callback) {
        this.eventListeners.get(event)?.delete(callback);
    }
    /**
     * Emit event to listeners
     */
    emit(event, data) {
        this.eventListeners.get(event)?.forEach((callback) => {
            try {
                callback(data);
            }
            catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }
    /**
     * Cleanup
     */
    cleanup() {
        this.stopDetection();
        this.videoElement = null;
        this.eventListeners.clear();
    }
}

/**
 * SpatialInteractionManager - Manages spatial interactions in AR/VR
 * Handles object placement, movement, rotation, and collaborative interactions
 */
class SpatialInteractionManager {
    interactions = new Map();
    objects = new Map();
    eventListeners = new Map();
    userId;
    sessionId;
    constructor(userId, sessionId) {
        this.userId = userId;
        this.sessionId = sessionId;
    }
    /**
     * Place an object in space
     */
    placeObject(objectId, position, rotation, scale) {
        const interaction = {
            id: this.generateId(),
            userId: this.userId,
            sessionId: this.sessionId,
            interactionType: 'place',
            objectId,
            position,
            rotation: rotation || [0, 0, 0, 1],
            scale: scale || [1, 1, 1],
            timestamp: Date.now()
        };
        this.objects.set(objectId, interaction);
        this.interactions.set(interaction.id, interaction);
        this.emit('objectPlaced', interaction);
        return interaction;
    }
    /**
     * Move an object
     */
    moveObject(objectId, position) {
        const interaction = {
            id: this.generateId(),
            userId: this.userId,
            sessionId: this.sessionId,
            interactionType: 'move',
            objectId,
            position,
            timestamp: Date.now()
        };
        // Update object position
        const obj = this.objects.get(objectId);
        if (obj) {
            obj.position = position;
            obj.timestamp = interaction.timestamp;
        }
        this.interactions.set(interaction.id, interaction);
        this.emit('objectMoved', interaction);
        return interaction;
    }
    /**
     * Rotate an object
     */
    rotateObject(objectId, rotation) {
        const interaction = {
            id: this.generateId(),
            userId: this.userId,
            sessionId: this.sessionId,
            interactionType: 'rotate',
            objectId,
            rotation,
            timestamp: Date.now()
        };
        // Update object rotation
        const obj = this.objects.get(objectId);
        if (obj) {
            obj.rotation = rotation;
            obj.timestamp = interaction.timestamp;
        }
        this.interactions.set(interaction.id, interaction);
        this.emit('objectRotated', interaction);
        return interaction;
    }
    /**
     * Scale an object
     */
    scaleObject(objectId, scale) {
        const interaction = {
            id: this.generateId(),
            userId: this.userId,
            sessionId: this.sessionId,
            interactionType: 'scale',
            objectId,
            scale,
            timestamp: Date.now()
        };
        // Update object scale
        const obj = this.objects.get(objectId);
        if (obj) {
            obj.scale = scale;
            obj.timestamp = interaction.timestamp;
        }
        this.interactions.set(interaction.id, interaction);
        this.emit('objectScaled', interaction);
        return interaction;
    }
    /**
     * Grab an object
     */
    grabObject(objectId) {
        const interaction = {
            id: this.generateId(),
            userId: this.userId,
            sessionId: this.sessionId,
            interactionType: 'grab',
            objectId,
            timestamp: Date.now()
        };
        this.interactions.set(interaction.id, interaction);
        this.emit('objectGrabbed', interaction);
        return interaction;
    }
    /**
     * Point at a location
     */
    point(rayOrigin, rayDirection) {
        const interaction = {
            id: this.generateId(),
            userId: this.userId,
            sessionId: this.sessionId,
            interactionType: 'point',
            rayOrigin,
            rayDirection,
            timestamp: Date.now()
        };
        this.interactions.set(interaction.id, interaction);
        this.emit('userPointed', interaction);
        return interaction;
    }
    /**
     * Draw in space
     */
    draw(path) {
        const interaction = {
            id: this.generateId(),
            userId: this.userId,
            sessionId: this.sessionId,
            interactionType: 'draw',
            drawPath: path,
            timestamp: Date.now()
        };
        this.interactions.set(interaction.id, interaction);
        this.emit('userDrew', interaction);
        return interaction;
    }
    /**
     * Process incoming spatial interaction from another user
     */
    processRemoteInteraction(interaction) {
        this.interactions.set(interaction.id, interaction);
        // Update object state if applicable
        if (interaction.objectId) {
            const obj = this.objects.get(interaction.objectId);
            if (obj) {
                if (interaction.position)
                    obj.position = interaction.position;
                if (interaction.rotation)
                    obj.rotation = interaction.rotation;
                if (interaction.scale)
                    obj.scale = interaction.scale;
                obj.timestamp = interaction.timestamp;
            }
            else {
                // Object doesn't exist locally, create it
                this.objects.set(interaction.objectId, interaction);
            }
        }
        this.emit('remoteInteraction', interaction);
    }
    /**
     * Get object state
     */
    getObject(objectId) {
        return this.objects.get(objectId);
    }
    /**
     * Get all objects
     */
    getAllObjects() {
        return new Map(this.objects);
    }
    /**
     * Remove object
     */
    removeObject(objectId) {
        this.objects.delete(objectId);
        this.emit('objectRemoved', { objectId });
    }
    /**
     * Get interaction history
     */
    getInteractions(limit) {
        const interactions = Array.from(this.interactions.values());
        interactions.sort((a, b) => b.timestamp - a.timestamp);
        return limit ? interactions.slice(0, limit) : interactions;
    }
    /**
     * Clear interaction history
     */
    clearHistory() {
        this.interactions.clear();
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `spatial-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)?.add(callback);
    }
    /**
     * Remove event listener
     */
    off(event, callback) {
        this.eventListeners.get(event)?.delete(callback);
    }
    /**
     * Emit event to listeners
     */
    emit(event, data) {
        this.eventListeners.get(event)?.forEach((callback) => {
            try {
                callback(data);
            }
            catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }
    /**
     * Cleanup
     */
    cleanup() {
        this.interactions.clear();
        this.objects.clear();
        this.eventListeners.clear();
    }
}

/**
 * useStackLiveARVR - Svelte hook for AR/VR capabilities in StackLive
 * Integrates AR/VR features with existing StackLive multiplayer infrastructure
 */
function useStackLiveARVR(userId, sessionId) {
    // Initialize managers
    const arvrManager = new ARVRManager();
    const avatarManager = new AvatarManager();
    const filterManager = new FilterManager();
    let gestureDetector = null;
    const spatialManager = new SpatialInteractionManager(userId, sessionId);
    // Create stores
    const sessionState = writable(arvrManager.getSessionState());
    const avatars = writable(new Map());
    const filters = writable(new Map());
    const filterPresets = writable(filterManager.getFilterPresets());
    const lastGesture = writable(null);
    const spatialObjects = writable(new Map());
    // Set up event listeners
    arvrManager.on('sessionStarted', () => {
        sessionState.set(arvrManager.getSessionState());
    });
    arvrManager.on('sessionEnded', () => {
        sessionState.set(arvrManager.getSessionState());
    });
    arvrManager.on('avatarUpdated', (data) => {
        const { userId: uid, avatar } = data;
        const current = avatarManager.getAllAvatars();
        avatars.set(new Map(current));
    });
    arvrManager.on('filterApplied', (data) => {
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
    const actions = {
        startARSession: async (config) => {
            const fullConfig = {
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
        startVRSession: async (config) => {
            const fullConfig = {
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
        loadAvatar: async (modelUrl, customizations) => {
            const avatar = await avatarManager.loadAvatar(userId, modelUrl, customizations);
            arvrManager.updateAvatar(userId, avatar);
            return avatar;
        },
        updateAvatarCustomization: (customizations) => {
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
        setAvatarExpression: (expression, intensity) => {
            avatarManager.setExpression(userId, expression, intensity);
            const avatar = avatarManager.getAvatar(userId);
            if (avatar) {
                arvrManager.updateAvatar(userId, avatar);
            }
        },
        removeAvatar: (uid) => {
            avatarManager.removeAvatar(uid);
            arvrManager.removeAvatar(uid);
        },
        applyFilter: (filterId, customParameters) => {
            const filter = filterManager.applyFilter(userId, filterId, sessionId, customParameters);
            if (filter) {
                arvrManager.applyFilter(userId, filter);
            }
            return filter;
        },
        updateFilterParameters: (parameters) => {
            filterManager.updateFilterParameters(userId, parameters);
        },
        updateFilterIntensity: (intensity) => {
            filterManager.updateFilterIntensity(userId, intensity);
        },
        setFilterEnabled: (enabled) => {
            filterManager.setFilterEnabled(userId, enabled);
        },
        removeFilter: () => {
            filterManager.removeFilter(userId);
            arvrManager.removeFilter(userId);
        },
        startGestureDetection: async (videoElement, options = {}) => {
            if (!gestureDetector) {
                gestureDetector = new GestureDetector(userId, sessionId);
                gestureDetector.on('gestureDetected', (data) => {
                    const gesture = data;
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
        setAvatarEnabled: (enabled) => {
            arvrManager.setAvatarEnabled(enabled);
            sessionState.set(arvrManager.getSessionState());
        },
        setFiltersEnabled: (enabled) => {
            arvrManager.setFiltersEnabled(enabled);
            sessionState.set(arvrManager.getSessionState());
        },
        setSpatialEnabled: (enabled) => {
            arvrManager.setSpatialEnabled(enabled);
            sessionState.set(arvrManager.getSessionState());
        },
        setGestureDetectionEnabled: (enabled) => {
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

/* src/lib/Components/webcomponents/ARVRScene.wc.svelte generated by Svelte v4.2.20 */

function add_css(target) {
	append_styles(target, "svelte-16bljfu", ".arvr-scene.svelte-16bljfu{position:relative;background:#000;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center}canvas.svelte-16bljfu{max-width:100%;max-height:100%;display:block}.overlay-info.svelte-16bljfu{position:absolute;top:16px;right:16px;display:flex;flex-direction:column;gap:8px;align-items:flex-end}.status.svelte-16bljfu{background:rgba(0, 0, 0, 0.8);color:white;padding:8px 12px;border-radius:20px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:8px}.indicator.svelte-16bljfu{width:8px;height:8px;border-radius:50%;background:#ef4444}.indicator.active.svelte-16bljfu{background:#10b981;animation:svelte-16bljfu-pulse 2s infinite}@keyframes svelte-16bljfu-pulse{0%,100%{opacity:1}50%{opacity:0.5}}.feature-badge.svelte-16bljfu{background:rgba(255, 255, 255, 0.95);color:#1f2937;padding:6px 10px;border-radius:16px;font-size:11px;font-weight:600;box-shadow:0 2px 4px rgba(0, 0, 0, 0.1)}");
}

// (126:1) {#if initialized && arvr}
function create_if_block(ctx) {
	let div1;
	let div0;
	let span;
	let t0;

	let t1_value = (/*$arvr*/ ctx[6].sessionState.active
	? /*$arvr*/ ctx[6].sessionState.mode?.toUpperCase()
	: 'INACTIVE') + "";

	let t1;
	let t2;
	let t3;
	let t4;
	let if_block0 = /*$arvr*/ ctx[6].sessionState.avatarEnabled && create_if_block_3(ctx);
	let if_block1 = /*$arvr*/ ctx[6].sessionState.spatialEnabled && create_if_block_2(ctx);
	let if_block2 = /*$arvr*/ ctx[6].lastGesture && create_if_block_1(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			span = element("span");
			t0 = space();
			t1 = text(t1_value);
			t2 = space();
			if (if_block0) if_block0.c();
			t3 = space();
			if (if_block1) if_block1.c();
			t4 = space();
			if (if_block2) if_block2.c();
			attr(span, "class", "indicator svelte-16bljfu");
			toggle_class(span, "active", /*$arvr*/ ctx[6].sessionState.active);
			attr(div0, "class", "status svelte-16bljfu");
			attr(div1, "class", "overlay-info svelte-16bljfu");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div0, span);
			append(div0, t0);
			append(div0, t1);
			append(div1, t2);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t3);
			if (if_block1) if_block1.m(div1, null);
			append(div1, t4);
			if (if_block2) if_block2.m(div1, null);
		},
		p(ctx, dirty) {
			if (dirty & /*$arvr*/ 64) {
				toggle_class(span, "active", /*$arvr*/ ctx[6].sessionState.active);
			}

			if (dirty & /*$arvr*/ 64 && t1_value !== (t1_value = (/*$arvr*/ ctx[6].sessionState.active
			? /*$arvr*/ ctx[6].sessionState.mode?.toUpperCase()
			: 'INACTIVE') + "")) set_data(t1, t1_value);

			if (/*$arvr*/ ctx[6].sessionState.avatarEnabled) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_3(ctx);
					if_block0.c();
					if_block0.m(div1, t3);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*$arvr*/ ctx[6].sessionState.spatialEnabled) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_2(ctx);
					if_block1.c();
					if_block1.m(div1, t4);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*$arvr*/ ctx[6].lastGesture) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_1(ctx);
					if_block2.c();
					if_block2.m(div1, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
		}
	};
}

// (132:3) {#if $arvr.sessionState.avatarEnabled}
function create_if_block_3(ctx) {
	let div;
	let t0;
	let t1_value = /*$arvr*/ ctx[6].avatars.size + "";
	let t1;
	let t2;

	return {
		c() {
			div = element("div");
			t0 = text("👤 ");
			t1 = text(t1_value);
			t2 = text(" avatars");
			attr(div, "class", "feature-badge svelte-16bljfu");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
			append(div, t2);
		},
		p(ctx, dirty) {
			if (dirty & /*$arvr*/ 64 && t1_value !== (t1_value = /*$arvr*/ ctx[6].avatars.size + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (135:3) {#if $arvr.sessionState.spatialEnabled}
function create_if_block_2(ctx) {
	let div;
	let t0;
	let t1_value = /*$arvr*/ ctx[6].spatialObjects.size + "";
	let t1;
	let t2;

	return {
		c() {
			div = element("div");
			t0 = text("🎯 ");
			t1 = text(t1_value);
			t2 = text(" objects");
			attr(div, "class", "feature-badge svelte-16bljfu");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
			append(div, t2);
		},
		p(ctx, dirty) {
			if (dirty & /*$arvr*/ 64 && t1_value !== (t1_value = /*$arvr*/ ctx[6].spatialObjects.size + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (138:3) {#if $arvr.lastGesture}
function create_if_block_1(ctx) {
	let div;
	let t0;
	let t1_value = /*$arvr*/ ctx[6].lastGesture.gesture + "";
	let t1;

	return {
		c() {
			div = element("div");
			t0 = text("👋 ");
			t1 = text(t1_value);
			attr(div, "class", "feature-badge svelte-16bljfu");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*$arvr*/ 64 && t1_value !== (t1_value = /*$arvr*/ ctx[6].lastGesture.gesture + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function create_fragment(ctx) {
	let div;
	let canvas;
	let t0;
	let video;
	let t1;
	let if_block = /*initialized*/ ctx[5] && /*arvr*/ ctx[4] && create_if_block(ctx);

	return {
		c() {
			div = element("div");
			canvas = element("canvas");
			t0 = space();
			video = element("video");
			t1 = space();
			if (if_block) if_block.c();
			attr(canvas, "width", "800");
			attr(canvas, "height", "600");
			attr(canvas, "class", "svelte-16bljfu");
			video.autoplay = true;
			video.playsInline = true;
			video.muted = true;
			set_style(video, "display", "none");
			attr(div, "class", "arvr-scene svelte-16bljfu");
			set_style(div, "width", /*width*/ ctx[0]);
			set_style(div, "height", /*height*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, canvas);
			/*canvas_binding*/ ctx[20](canvas);
			append(div, t0);
			append(div, video);
			/*video_binding*/ ctx[21](video);
			append(div, t1);
			if (if_block) if_block.m(div, null);
		},
		p(ctx, [dirty]) {
			if (/*initialized*/ ctx[5] && /*arvr*/ ctx[4]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*width*/ 1) {
				set_style(div, "width", /*width*/ ctx[0]);
			}

			if (dirty & /*height*/ 2) {
				set_style(div, "height", /*height*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			/*canvas_binding*/ ctx[20](null);
			/*video_binding*/ ctx[21](null);
			if (if_block) if_block.d();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let avatarEnabledBool;
	let filtersEnabledBool;
	let spatialEnabledBool;
	let gestureEnabledBool;

	let $arvr,
		$$unsubscribe_arvr = noop,
		$$subscribe_arvr = () => ($$unsubscribe_arvr(), $$unsubscribe_arvr = subscribe(arvr, $$value => $$invalidate(6, $arvr = $$value)), arvr);

	$$self.$$.on_destroy.push(() => $$unsubscribe_arvr());
	let { userId = '' } = $$props;
	let { sessionId = '' } = $$props;
	let { mode = 'inline' } = $$props;
	let { avatarEnabled = 'true' } = $$props;
	let { filtersEnabled = 'true' } = $$props;
	let { spatialEnabled = 'true' } = $$props;
	let { gestureEnabled = 'true' } = $$props;
	let { width = '100%' } = $$props;
	let { height = '600px' } = $$props;
	let canvasElement;
	let videoElement;
	let cameraStream = null;
	let arvr = null;
	$$subscribe_arvr();
	let initialized = false;

	onMount(async () => {
		if (!userId) {
			$$invalidate(7, userId = `user-${Math.random().toString(36).substring(2, 9)}`);
		}

		if (!sessionId) {
			$$invalidate(8, sessionId = `session-${Date.now()}`);
		}

		// Initialize AR/VR hook
		$$subscribe_arvr($$invalidate(4, arvr = useStackLiveARVR(userId, sessionId)));

		// Request camera access
		try {
			cameraStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user' },
				audio: false
			});

			if (videoElement && cameraStream) {
				$$invalidate(3, videoElement.srcObject = cameraStream, videoElement);
			}
		} catch(error) {
			console.error('Failed to access camera:', error);
		}

		// Setup canvas for rendering
		const ctx = canvasElement.getContext('2d');

		if (ctx && videoElement) {
			// Simple render loop - draw video to canvas
			const render = () => {
				if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
					ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
				}

				requestAnimationFrame(render);
			};

			render();
		}

		// Configure features
		if (arvr && avatarEnabledBool) arvr.setAvatarEnabled(true);

		if (arvr && filtersEnabledBool) arvr.setFiltersEnabled(true);
		if (arvr && spatialEnabledBool) arvr.setSpatialEnabled(true);
		if (arvr && gestureEnabledBool) arvr.setGestureDetectionEnabled(true);

		// Auto-start session if mode is specified
		if (mode === 'ar' && arvr) {
			await arvr.startARSession();
		} else if (mode === 'vr' && arvr) {
			await arvr.startVRSession();
		}

		$$invalidate(5, initialized = true);

		// Dispatch ready event
		dispatchEvent(new CustomEvent('ready', { detail: { userId, sessionId } }));
	});

	onDestroy(async () => {
		// Cleanup camera stream
		if (cameraStream) {
			cameraStream.getTracks().forEach(track => track.stop());
		}

		// Cleanup AR/VR
		if (arvr) {
			await arvr.cleanup();
		}
	});

	function startAR() {
		if (!arvr) return Promise.resolve(false);
		return arvr.startARSession();
	}

	function startVR() {
		if (!arvr) return Promise.resolve(false);
		return arvr.startVRSession();
	}

	function endSession() {
		if (!arvr) return Promise.resolve();
		return arvr.endSession();
	}

	function loadAvatar(modelUrl, customizations) {
		if (!arvr) return Promise.resolve(null);
		return arvr.loadAvatar(modelUrl, customizations);
	}

	function applyFilter(filterId) {
		if (!arvr) return;
		return arvr.applyFilter(filterId);
	}

	function placeObject(objectId, position) {
		if (!arvr) return;
		return arvr.placeObject(objectId, position);
	}

	function canvas_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			canvasElement = $$value;
			$$invalidate(2, canvasElement);
		});
	}

	function video_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			videoElement = $$value;
			$$invalidate(3, videoElement);
		});
	}

	$$self.$$set = $$props => {
		if ('userId' in $$props) $$invalidate(7, userId = $$props.userId);
		if ('sessionId' in $$props) $$invalidate(8, sessionId = $$props.sessionId);
		if ('mode' in $$props) $$invalidate(9, mode = $$props.mode);
		if ('avatarEnabled' in $$props) $$invalidate(10, avatarEnabled = $$props.avatarEnabled);
		if ('filtersEnabled' in $$props) $$invalidate(11, filtersEnabled = $$props.filtersEnabled);
		if ('spatialEnabled' in $$props) $$invalidate(12, spatialEnabled = $$props.spatialEnabled);
		if ('gestureEnabled' in $$props) $$invalidate(13, gestureEnabled = $$props.gestureEnabled);
		if ('width' in $$props) $$invalidate(0, width = $$props.width);
		if ('height' in $$props) $$invalidate(1, height = $$props.height);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*avatarEnabled*/ 1024) {
			// Convert string attributes to boolean
			avatarEnabledBool = avatarEnabled === 'true';
		}

		if ($$self.$$.dirty & /*filtersEnabled*/ 2048) {
			filtersEnabledBool = filtersEnabled === 'true';
		}

		if ($$self.$$.dirty & /*spatialEnabled*/ 4096) {
			spatialEnabledBool = spatialEnabled === 'true';
		}

		if ($$self.$$.dirty & /*gestureEnabled*/ 8192) {
			gestureEnabledBool = gestureEnabled === 'true';
		}
	};

	return [
		width,
		height,
		canvasElement,
		videoElement,
		arvr,
		initialized,
		$arvr,
		userId,
		sessionId,
		mode,
		avatarEnabled,
		filtersEnabled,
		spatialEnabled,
		gestureEnabled,
		startAR,
		startVR,
		endSession,
		loadAvatar,
		applyFilter,
		placeObject,
		canvas_binding,
		video_binding
	];
}

class ARVRScene_wc extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				userId: 7,
				sessionId: 8,
				mode: 9,
				avatarEnabled: 10,
				filtersEnabled: 11,
				spatialEnabled: 12,
				gestureEnabled: 13,
				width: 0,
				height: 1,
				startAR: 14,
				startVR: 15,
				endSession: 16,
				loadAvatar: 17,
				applyFilter: 18,
				placeObject: 19
			},
			add_css
		);
	}

	get userId() {
		return this.$$.ctx[7];
	}

	set userId(userId) {
		this.$$set({ userId });
		flush();
	}

	get sessionId() {
		return this.$$.ctx[8];
	}

	set sessionId(sessionId) {
		this.$$set({ sessionId });
		flush();
	}

	get mode() {
		return this.$$.ctx[9];
	}

	set mode(mode) {
		this.$$set({ mode });
		flush();
	}

	get avatarEnabled() {
		return this.$$.ctx[10];
	}

	set avatarEnabled(avatarEnabled) {
		this.$$set({ avatarEnabled });
		flush();
	}

	get filtersEnabled() {
		return this.$$.ctx[11];
	}

	set filtersEnabled(filtersEnabled) {
		this.$$set({ filtersEnabled });
		flush();
	}

	get spatialEnabled() {
		return this.$$.ctx[12];
	}

	set spatialEnabled(spatialEnabled) {
		this.$$set({ spatialEnabled });
		flush();
	}

	get gestureEnabled() {
		return this.$$.ctx[13];
	}

	set gestureEnabled(gestureEnabled) {
		this.$$set({ gestureEnabled });
		flush();
	}

	get width() {
		return this.$$.ctx[0];
	}

	set width(width) {
		this.$$set({ width });
		flush();
	}

	get height() {
		return this.$$.ctx[1];
	}

	set height(height) {
		this.$$set({ height });
		flush();
	}

	get startAR() {
		return this.$$.ctx[14];
	}

	get startVR() {
		return this.$$.ctx[15];
	}

	get endSession() {
		return this.$$.ctx[16];
	}

	get loadAvatar() {
		return this.$$.ctx[17];
	}

	get applyFilter() {
		return this.$$.ctx[18];
	}

	get placeObject() {
		return this.$$.ctx[19];
	}
}

customElements.get("sl-arvr-scene")||customElements.define("sl-arvr-scene", create_custom_element(ARVRScene_wc, {"userId":{},"sessionId":{},"mode":{},"avatarEnabled":{},"filtersEnabled":{},"spatialEnabled":{},"gestureEnabled":{},"width":{},"height":{}}, [], ["startAR","startVR","endSession","loadAvatar","applyFilter","placeObject"], true));

export { ARVRScene_wc as default };
//# sourceMappingURL=arvr-scene.js.map
