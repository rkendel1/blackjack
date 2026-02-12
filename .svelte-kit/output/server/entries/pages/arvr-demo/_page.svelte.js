import { c as create_ssr_component, a as subscribe, o as onDestroy, e as escape, d as add_attribute, v as validate_component } from "../../../chunks/ssr.js";
import { w as writable } from "../../../chunks/index.js";
class ARVRManager {
  sessionState = {
    active: false,
    avatarEnabled: false,
    filtersEnabled: false,
    spatialEnabled: false,
    gestureDetectionEnabled: false
  };
  xrSession = null;
  activeAvatars = /* @__PURE__ */ new Map();
  activeFilters = /* @__PURE__ */ new Map();
  eventListeners = /* @__PURE__ */ new Map();
  /**
   * Check if WebXR is supported on this device
   */
  async isWebXRSupported() {
    if (!("xr" in navigator)) {
      return false;
    }
    try {
      const isSupported = await navigator.xr?.isSessionSupported("immersive-vr");
      return isSupported || false;
    } catch {
      return false;
    }
  }
  /**
   * Initialize an AR/VR session
   */
  async startSession(config) {
    if (!navigator.xr) {
      console.warn("WebXR not available on this device");
      return false;
    }
    try {
      const session = await navigator.xr.requestSession(config.mode, {
        requiredFeatures: config.requiredFeatures || [],
        optionalFeatures: config.optionalFeatures || ["local-floor", "bounded-floor", "hand-tracking"],
        domOverlay: config.domOverlay ? { root: config.domOverlay } : void 0
      });
      this.xrSession = session;
      this.sessionState.active = true;
      this.sessionState.mode = config.mode.includes("ar") ? "ar" : "vr";
      this.sessionState.xrSession = session;
      session.addEventListener("end", () => {
        this.endSession();
      });
      this.emit("sessionStarted", { mode: this.sessionState.mode });
      return true;
    } catch (error) {
      console.error("Failed to start XR session:", error);
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
    this.sessionState.xrSession = void 0;
    this.emit("sessionEnded", {});
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
    this.emit("avatarStateChanged", { enabled });
  }
  /**
   * Enable/disable filter effects
   */
  setFiltersEnabled(enabled) {
    this.sessionState.filtersEnabled = enabled;
    this.emit("filterStateChanged", { enabled });
  }
  /**
   * Enable/disable spatial interactions
   */
  setSpatialEnabled(enabled) {
    this.sessionState.spatialEnabled = enabled;
    this.emit("spatialStateChanged", { enabled });
  }
  /**
   * Enable/disable gesture detection
   */
  setGestureDetectionEnabled(enabled) {
    this.sessionState.gestureDetectionEnabled = enabled;
    this.emit("gestureDetectionChanged", { enabled });
  }
  /**
   * Update or add an avatar
   */
  updateAvatar(userId, avatar) {
    this.activeAvatars.set(userId, avatar);
    this.emit("avatarUpdated", { userId, avatar });
  }
  /**
   * Remove an avatar
   */
  removeAvatar(userId) {
    this.activeAvatars.delete(userId);
    this.emit("avatarRemoved", { userId });
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
    this.emit("filterApplied", { userId, filter });
  }
  /**
   * Remove a filter
   */
  removeFilter(userId) {
    this.activeFilters.delete(userId);
    this.emit("filterRemoved", { userId });
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
    this.emit("gestureDetected", gesture);
  }
  /**
   * Process spatial interaction
   */
  processSpatialInteraction(interaction) {
    this.emit("spatialInteraction", interaction);
  }
  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
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
      } catch (error) {
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
class AvatarManager {
  avatars = /* @__PURE__ */ new Map();
  loadedModels = /* @__PURE__ */ new Map();
  // Store loaded 3D models
  eventListeners = /* @__PURE__ */ new Map();
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
    this.emit("avatarLoaded", { userId, avatar });
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
    if (customizations.hair) {
      avatar.customizations.hair = customizations.hair.style;
    }
    if (customizations.clothing) {
      avatar.customizations.clothing = customizations.clothing.outfit || customizations.clothing.top;
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
    this.emit("avatarCustomized", { userId, avatar });
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
    this.emit("avatarTransformed", { userId, avatar });
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
    this.emit("avatarExpression", { userId, expression, intensity });
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
    this.emit("avatarRemoved", { userId });
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
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
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
      } catch (error) {
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
class FilterManager {
  activeFilters = /* @__PURE__ */ new Map();
  filterPresets = /* @__PURE__ */ new Map();
  eventListeners = /* @__PURE__ */ new Map();
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
        id: "beauty-smooth",
        name: "Beauty Smooth",
        type: "face",
        category: "beauty",
        parameters: { smoothness: 0.7, brightness: 0.1 }
      },
      {
        id: "fun-bunny-ears",
        name: "Bunny Ears",
        type: "face",
        category: "fun",
        parameters: { scale: 1 }
      },
      {
        id: "artistic-sketch",
        name: "Sketch Effect",
        type: "environment",
        category: "artistic",
        parameters: { lineIntensity: 0.8, threshold: 0.5 }
      },
      {
        id: "seasonal-snow",
        name: "Snow Effect",
        type: "environment",
        category: "seasonal",
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
      intensity: 1,
      enabled: true,
      timestamp: Date.now()
    };
    this.activeFilters.set(userId, filter);
    this.emit("filterApplied", { userId, filter });
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
    this.emit("filterUpdated", { userId, filter });
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
    this.emit("filterIntensityChanged", { userId, intensity: filter.intensity });
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
    this.emit("filterToggled", { userId, enabled });
  }
  /**
   * Remove filter
   */
  removeFilter(userId) {
    this.activeFilters.delete(userId);
    this.emit("filterRemoved", { userId });
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
    this.emit("presetAdded", { preset });
  }
  /**
   * Remove filter preset
   */
  removeFilterPreset(presetId) {
    this.filterPresets.delete(presetId);
    this.emit("presetRemoved", { presetId });
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
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
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
      } catch (error) {
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
class GestureDetector {
  enabled = false;
  detectionInterval = null;
  eventListeners = /* @__PURE__ */ new Map();
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
    const fps = options.fps || 10;
    const intervalMs = 1e3 / fps;
    this.detectionInterval = window.setInterval(() => {
      if (!this.enabled || !this.videoElement) {
        return;
      }
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
    this.emit("detectionStarted", { userId: this.userId });
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
    this.emit("detectionStopped", { userId: this.userId });
  }
  /**
   * Detect hand gestures (stub implementation)
   * In production, this would use MediaPipe Hands or similar
   */
  detectHandGestures() {
    const sampleGestures = ["wave", "thumbsUp", "peace", "point", "fist"];
    const randomGesture = sampleGestures[Math.floor(Math.random() * sampleGestures.length)];
    if (Math.random() < 0.1) {
      const gesture = {
        id: this.generateId(),
        userId: this.userId,
        sessionId: this.sessionId,
        gestureType: "hand",
        gesture: randomGesture,
        confidence: 0.85 + Math.random() * 0.15,
        landmarks: this.generateSampleLandmarks(21),
        // 21 hand landmarks
        timestamp: Date.now()
      };
      this.emit("gestureDetected", gesture);
    }
  }
  /**
   * Detect face expressions (stub implementation)
   * In production, this would use MediaPipe Face Mesh or similar
   */
  detectFaceExpressions() {
    const expressions = ["smile", "surprised", "neutral", "wink"];
    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
    if (Math.random() < 0.1) {
      const gesture = {
        id: this.generateId(),
        userId: this.userId,
        sessionId: this.sessionId,
        gestureType: "face",
        gesture: randomExpression,
        confidence: 0.8 + Math.random() * 0.2,
        landmarks: this.generateSampleLandmarks(468),
        // 468 face landmarks
        timestamp: Date.now()
      };
      this.emit("gestureDetected", gesture);
    }
  }
  /**
   * Detect body pose (stub implementation)
   * In production, this would use MediaPipe Pose or similar
   */
  detectBodyPose() {
    const poses = ["standing", "sitting", "waving", "reaching"];
    const randomPose = poses[Math.floor(Math.random() * poses.length)];
    if (Math.random() < 0.1) {
      const gesture = {
        id: this.generateId(),
        userId: this.userId,
        sessionId: this.sessionId,
        gestureType: "body",
        gesture: randomPose,
        confidence: 0.75 + Math.random() * 0.25,
        landmarks: this.generateSampleLandmarks(33),
        // 33 pose landmarks
        timestamp: Date.now()
      };
      this.emit("gestureDetected", gesture);
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
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
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
      } catch (error) {
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
class SpatialInteractionManager {
  interactions = /* @__PURE__ */ new Map();
  objects = /* @__PURE__ */ new Map();
  eventListeners = /* @__PURE__ */ new Map();
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
      interactionType: "place",
      objectId,
      position,
      rotation: rotation || [0, 0, 0, 1],
      scale: scale || [1, 1, 1],
      timestamp: Date.now()
    };
    this.objects.set(objectId, interaction);
    this.interactions.set(interaction.id, interaction);
    this.emit("objectPlaced", interaction);
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
      interactionType: "move",
      objectId,
      position,
      timestamp: Date.now()
    };
    const obj = this.objects.get(objectId);
    if (obj) {
      obj.position = position;
      obj.timestamp = interaction.timestamp;
    }
    this.interactions.set(interaction.id, interaction);
    this.emit("objectMoved", interaction);
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
      interactionType: "rotate",
      objectId,
      rotation,
      timestamp: Date.now()
    };
    const obj = this.objects.get(objectId);
    if (obj) {
      obj.rotation = rotation;
      obj.timestamp = interaction.timestamp;
    }
    this.interactions.set(interaction.id, interaction);
    this.emit("objectRotated", interaction);
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
      interactionType: "scale",
      objectId,
      scale,
      timestamp: Date.now()
    };
    const obj = this.objects.get(objectId);
    if (obj) {
      obj.scale = scale;
      obj.timestamp = interaction.timestamp;
    }
    this.interactions.set(interaction.id, interaction);
    this.emit("objectScaled", interaction);
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
      interactionType: "grab",
      objectId,
      timestamp: Date.now()
    };
    this.interactions.set(interaction.id, interaction);
    this.emit("objectGrabbed", interaction);
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
      interactionType: "point",
      rayOrigin,
      rayDirection,
      timestamp: Date.now()
    };
    this.interactions.set(interaction.id, interaction);
    this.emit("userPointed", interaction);
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
      interactionType: "draw",
      drawPath: path,
      timestamp: Date.now()
    };
    this.interactions.set(interaction.id, interaction);
    this.emit("userDrew", interaction);
    return interaction;
  }
  /**
   * Process incoming spatial interaction from another user
   */
  processRemoteInteraction(interaction) {
    this.interactions.set(interaction.id, interaction);
    if (interaction.objectId) {
      const obj = this.objects.get(interaction.objectId);
      if (obj) {
        if (interaction.position) obj.position = interaction.position;
        if (interaction.rotation) obj.rotation = interaction.rotation;
        if (interaction.scale) obj.scale = interaction.scale;
        obj.timestamp = interaction.timestamp;
      } else {
        this.objects.set(interaction.objectId, interaction);
      }
    }
    this.emit("remoteInteraction", interaction);
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
    this.emit("objectRemoved", { objectId });
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
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
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
      } catch (error) {
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
function useStackLiveARVR(userId, sessionId) {
  const arvrManager = new ARVRManager();
  const avatarManager = new AvatarManager();
  const filterManager = new FilterManager();
  let gestureDetector = null;
  const spatialManager = new SpatialInteractionManager(userId, sessionId);
  const sessionState = writable(arvrManager.getSessionState());
  const avatars = writable(/* @__PURE__ */ new Map());
  const filters = writable(/* @__PURE__ */ new Map());
  const filterPresets = writable(filterManager.getFilterPresets());
  const lastGesture = writable(null);
  const spatialObjects = writable(/* @__PURE__ */ new Map());
  arvrManager.on("sessionStarted", () => {
    sessionState.set(arvrManager.getSessionState());
  });
  arvrManager.on("sessionEnded", () => {
    sessionState.set(arvrManager.getSessionState());
  });
  arvrManager.on("avatarUpdated", (data) => {
    const { userId: uid, avatar } = data;
    const current = avatarManager.getAllAvatars();
    avatars.set(new Map(current));
  });
  arvrManager.on("filterApplied", (data) => {
    const current = filterManager.getActiveFilters();
    filters.set(new Map(current));
  });
  avatarManager.on("avatarLoaded", () => {
    avatars.set(new Map(avatarManager.getAllAvatars()));
  });
  avatarManager.on("avatarCustomized", () => {
    avatars.set(new Map(avatarManager.getAllAvatars()));
  });
  avatarManager.on("avatarTransformed", () => {
    avatars.set(new Map(avatarManager.getAllAvatars()));
  });
  filterManager.on("filterApplied", () => {
    filters.set(new Map(filterManager.getActiveFilters()));
  });
  filterManager.on("filterRemoved", () => {
    filters.set(new Map(filterManager.getActiveFilters()));
  });
  spatialManager.on("objectPlaced", () => {
    spatialObjects.set(new Map(spatialManager.getAllObjects()));
  });
  spatialManager.on("objectMoved", () => {
    spatialObjects.set(new Map(spatialManager.getAllObjects()));
  });
  spatialManager.on("objectRotated", () => {
    spatialObjects.set(new Map(spatialManager.getAllObjects()));
  });
  const actions = {
    startARSession: async (config) => {
      const fullConfig = {
        mode: "immersive-ar",
        requiredFeatures: config?.requiredFeatures || ["local-floor"],
        optionalFeatures: config?.optionalFeatures || ["hand-tracking", "dom-overlay"],
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
        mode: "immersive-vr",
        requiredFeatures: config?.requiredFeatures || ["local-floor"],
        optionalFeatures: config?.optionalFeatures || ["hand-tracking"],
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
        gestureDetector.on("gestureDetected", (data) => {
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
      arvrManager.on("gestureDetected", callback);
    },
    onSpatialInteraction: (callback) => {
      arvrManager.on("spatialInteraction", callback);
    },
    onAvatarUpdated: (callback) => {
      arvrManager.on("avatarUpdated", callback);
    },
    onFilterApplied: (callback) => {
      arvrManager.on("filterApplied", callback);
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
const css$1 = {
  code: '.arvr-control-panel.svelte-14opp22.svelte-14opp22{padding:20px;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0, 0, 0, 0.1);max-width:600px;margin:0 auto}h2.svelte-14opp22.svelte-14opp22{margin:0 0 20px 0;font-size:24px;font-weight:700;color:#2d3748}h3.svelte-14opp22.svelte-14opp22{margin:0 0 12px 0;font-size:16px;font-weight:600;color:#4a5568}.status-section.svelte-14opp22.svelte-14opp22{background:#f7fafc;padding:12px;border-radius:6px;margin-bottom:20px}.status-item.svelte-14opp22.svelte-14opp22{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #e2e8f0}.status-item.svelte-14opp22.svelte-14opp22:last-child{border-bottom:none}.status-label.svelte-14opp22.svelte-14opp22{font-weight:600;color:#4a5568}.status-value.svelte-14opp22.svelte-14opp22{color:#718096}.status-value.enabled.svelte-14opp22.svelte-14opp22{color:#48bb78;font-weight:600}.control-section.svelte-14opp22.svelte-14opp22{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #e2e8f0}.control-section.svelte-14opp22.svelte-14opp22:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}.button-group.svelte-14opp22.svelte-14opp22{display:flex;gap:8px;flex-wrap:wrap}button.svelte-14opp22.svelte-14opp22{padding:10px 16px;background:#4299e1;color:white;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s}button.svelte-14opp22.svelte-14opp22:hover:not(:disabled){background:#3182ce}button.svelte-14opp22.svelte-14opp22:disabled{background:#cbd5e0;cursor:not-allowed}.toggle-group.svelte-14opp22.svelte-14opp22{display:flex;flex-direction:column;gap:8px}.toggle-item.svelte-14opp22.svelte-14opp22{display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;border-radius:4px;transition:background 0.2s}.toggle-item.svelte-14opp22.svelte-14opp22:hover{background:#f7fafc}.toggle-item.svelte-14opp22 input[type="checkbox"].svelte-14opp22{width:18px;height:18px;cursor:pointer}.toggle-item.svelte-14opp22 span.svelte-14opp22{font-size:14px;color:#2d3748}.panel-content.svelte-14opp22.svelte-14opp22{margin-top:16px;padding:16px;background:#f7fafc;border-radius:6px}.gesture-info.svelte-14opp22.svelte-14opp22{margin-top:12px;padding:12px;background:#f7fafc;border-radius:6px;font-size:14px;line-height:1.6}.spatial-info.svelte-14opp22.svelte-14opp22{padding:12px;background:#f7fafc;border-radius:6px;font-size:14px}@media(max-width: 768px){.arvr-control-panel.svelte-14opp22.svelte-14opp22{padding:16px}h2.svelte-14opp22.svelte-14opp22{font-size:20px}.button-group.svelte-14opp22 button.svelte-14opp22{flex:1;min-width:120px}}',
  map: `{"version":3,"file":"ARVRControlPanel.svelte","sources":["ARVRControlPanel.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount, onDestroy } from \\"svelte\\";\\nimport { useStackLiveARVR } from \\"$lib/multiplayer/useStackLiveARVR\\";\\nimport AvatarEmbed from \\"./AvatarEmbed.svelte\\";\\nimport FilterSelector from \\"./FilterSelector.svelte\\";\\nexport let userId;\\nexport let sessionId = void 0;\\nexport let videoElement = null;\\nconst arvr = useStackLiveARVR(userId, sessionId);\\nlet webXRSupported = false;\\nlet showAvatarPanel = false;\\nlet showFilterPanel = false;\\nlet currentAvatar = null;\\nlet selectedFilterId = null;\\nonMount(async () => {\\n  webXRSupported = await arvr.isWebXRSupported();\\n  arvr.onAvatarUpdated(({ userId: uid, avatar }) => {\\n    if (uid === userId) {\\n      currentAvatar = avatar;\\n    }\\n  });\\n  arvr.onGestureDetected((gesture) => {\\n    console.log(\\"Gesture detected:\\", gesture);\\n  });\\n});\\nasync function handleStartAR() {\\n  const success = await arvr.startARSession();\\n  if (success) {\\n    console.log(\\"AR session started\\");\\n  } else {\\n    alert(\\"Failed to start AR session. WebXR may not be supported on this device.\\");\\n  }\\n}\\nasync function handleStartVR() {\\n  const success = await arvr.startVRSession();\\n  if (success) {\\n    console.log(\\"VR session started\\");\\n  } else {\\n    alert(\\"Failed to start VR session. WebXR may not be supported on this device.\\");\\n  }\\n}\\nasync function handleEndSession() {\\n  await arvr.endSession();\\n}\\nasync function handleLoadAvatar() {\\n  const avatar = await arvr.loadAvatar(\\"/models/default-avatar.glb\\", {\\n    bodyType: \\"average\\",\\n    skinTone: \\"#f0d5a8\\"\\n  });\\n  currentAvatar = avatar;\\n}\\nfunction handleFilterSelect(filterId) {\\n  selectedFilterId = filterId;\\n  arvr.applyFilter(filterId);\\n}\\nfunction handleRemoveFilter() {\\n  selectedFilterId = null;\\n  arvr.removeFilter();\\n}\\nasync function handleStartGestureDetection() {\\n  if (!videoElement) {\\n    alert(\\"No video element available for gesture detection\\");\\n    return;\\n  }\\n  await arvr.startGestureDetection(videoElement, {\\n    detectHands: true,\\n    detectFace: true,\\n    detectBody: true,\\n    fps: 10\\n  });\\n}\\nfunction handleStopGestureDetection() {\\n  arvr.stopGestureDetection();\\n}\\nfunction handleToggleAvatars() {\\n  const enabled = !$arvr.sessionState.avatarEnabled;\\n  arvr.setAvatarEnabled(enabled);\\n}\\nfunction handleToggleFilters() {\\n  const enabled = !$arvr.sessionState.filtersEnabled;\\n  arvr.setFiltersEnabled(enabled);\\n}\\nfunction handleToggleSpatial() {\\n  const enabled = !$arvr.sessionState.spatialEnabled;\\n  arvr.setSpatialEnabled(enabled);\\n}\\nfunction handleToggleGesture() {\\n  const enabled = !$arvr.sessionState.gestureDetectionEnabled;\\n  arvr.setGestureDetectionEnabled(enabled);\\n}\\nonDestroy(async () => {\\n  await arvr.cleanup();\\n});\\n<\/script>\\n\\n<div class=\\"arvr-control-panel\\">\\n\\t<h2>AR/VR Controls</h2>\\n\\n\\t<div class=\\"status-section\\">\\n\\t\\t<div class=\\"status-item\\">\\n\\t\\t\\t<span class=\\"status-label\\">WebXR Support:</span>\\n\\t\\t\\t<span class=\\"status-value\\" class:enabled={webXRSupported}>\\n\\t\\t\\t\\t{webXRSupported ? '✓ Supported' : '✗ Not Supported'}\\n\\t\\t\\t</span>\\n\\t\\t</div>\\n\\t\\t<div class=\\"status-item\\">\\n\\t\\t\\t<span class=\\"status-label\\">Session Active:</span>\\n\\t\\t\\t<span class=\\"status-value\\" class:enabled={$arvr.sessionState.active}>\\n\\t\\t\\t\\t{$arvr.sessionState.active ? '✓ Active' : '✗ Inactive'}\\n\\t\\t\\t</span>\\n\\t\\t</div>\\n\\t\\t{#if $arvr.sessionState.active}\\n\\t\\t\\t<div class=\\"status-item\\">\\n\\t\\t\\t\\t<span class=\\"status-label\\">Mode:</span>\\n\\t\\t\\t\\t<span class=\\"status-value\\">{$arvr.sessionState.mode?.toUpperCase()}</span>\\n\\t\\t\\t</div>\\n\\t\\t{/if}\\n\\t</div>\\n\\n\\t<div class=\\"control-section\\">\\n\\t\\t<h3>Session Control</h3>\\n\\t\\t<div class=\\"button-group\\">\\n\\t\\t\\t<button on:click={handleStartAR} disabled={$arvr.sessionState.active || !webXRSupported}>\\n\\t\\t\\t\\tStart AR\\n\\t\\t\\t</button>\\n\\t\\t\\t<button on:click={handleStartVR} disabled={$arvr.sessionState.active || !webXRSupported}>\\n\\t\\t\\t\\tStart VR\\n\\t\\t\\t</button>\\n\\t\\t\\t<button on:click={handleEndSession} disabled={!$arvr.sessionState.active}>\\n\\t\\t\\t\\tEnd Session\\n\\t\\t\\t</button>\\n\\t\\t</div>\\n\\t</div>\\n\\n\\t<div class=\\"control-section\\">\\n\\t\\t<h3>Feature Toggles</h3>\\n\\t\\t<div class=\\"toggle-group\\">\\n\\t\\t\\t<label class=\\"toggle-item\\">\\n\\t\\t\\t\\t<input type=\\"checkbox\\" checked={$arvr.sessionState.avatarEnabled} on:change={handleToggleAvatars} />\\n\\t\\t\\t\\t<span>Avatars</span>\\n\\t\\t\\t</label>\\n\\t\\t\\t<label class=\\"toggle-item\\">\\n\\t\\t\\t\\t<input type=\\"checkbox\\" checked={$arvr.sessionState.filtersEnabled} on:change={handleToggleFilters} />\\n\\t\\t\\t\\t<span>Filters</span>\\n\\t\\t\\t</label>\\n\\t\\t\\t<label class=\\"toggle-item\\">\\n\\t\\t\\t\\t<input type=\\"checkbox\\" checked={$arvr.sessionState.spatialEnabled} on:change={handleToggleSpatial} />\\n\\t\\t\\t\\t<span>Spatial Interactions</span>\\n\\t\\t\\t</label>\\n\\t\\t\\t<label class=\\"toggle-item\\">\\n\\t\\t\\t\\t<input type=\\"checkbox\\" checked={$arvr.sessionState.gestureDetectionEnabled} on:change={handleToggleGesture} />\\n\\t\\t\\t\\t<span>Gesture Detection</span>\\n\\t\\t\\t</label>\\n\\t\\t</div>\\n\\t</div>\\n\\n\\t{#if $arvr.sessionState.avatarEnabled}\\n\\t\\t<div class=\\"control-section\\">\\n\\t\\t\\t<h3>Avatar Control</h3>\\n\\t\\t\\t<div class=\\"button-group\\">\\n\\t\\t\\t\\t<button on:click={handleLoadAvatar}>Load Avatar</button>\\n\\t\\t\\t\\t<button on:click={() => showAvatarPanel = !showAvatarPanel}>\\n\\t\\t\\t\\t\\t{showAvatarPanel ? 'Hide' : 'Show'} Avatar Panel\\n\\t\\t\\t\\t</button>\\n\\t\\t\\t</div>\\n\\t\\t\\t{#if showAvatarPanel && currentAvatar}\\n\\t\\t\\t\\t<div class=\\"panel-content\\">\\n\\t\\t\\t\\t\\t<AvatarEmbed avatar={currentAvatar} />\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\t{/if}\\n\\n\\t{#if $arvr.sessionState.filtersEnabled}\\n\\t\\t<div class=\\"control-section\\">\\n\\t\\t\\t<h3>Filter Control</h3>\\n\\t\\t\\t<div class=\\"button-group\\">\\n\\t\\t\\t\\t<button on:click={() => showFilterPanel = !showFilterPanel}>\\n\\t\\t\\t\\t\\t{showFilterPanel ? 'Hide' : 'Show'} Filters\\n\\t\\t\\t\\t</button>\\n\\t\\t\\t\\t{#if selectedFilterId}\\n\\t\\t\\t\\t\\t<button on:click={handleRemoveFilter}>Remove Filter</button>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t</div>\\n\\t\\t\\t{#if showFilterPanel}\\n\\t\\t\\t\\t<div class=\\"panel-content\\">\\n\\t\\t\\t\\t\\t<FilterSelector \\n\\t\\t\\t\\t\\t\\tpresets={$arvr.filterPresets} \\n\\t\\t\\t\\t\\t\\t{selectedFilterId}\\n\\t\\t\\t\\t\\t\\tonFilterSelect={handleFilterSelect}\\n\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\t{/if}\\n\\n\\t{#if $arvr.sessionState.gestureDetectionEnabled && videoElement}\\n\\t\\t<div class=\\"control-section\\">\\n\\t\\t\\t<h3>Gesture Detection</h3>\\n\\t\\t\\t<div class=\\"button-group\\">\\n\\t\\t\\t\\t<button on:click={handleStartGestureDetection}>Start Detection</button>\\n\\t\\t\\t\\t<button on:click={handleStopGestureDetection}>Stop Detection</button>\\n\\t\\t\\t</div>\\n\\t\\t\\t{#if $arvr.lastGesture}\\n\\t\\t\\t\\t<div class=\\"gesture-info\\">\\n\\t\\t\\t\\t\\t<strong>Last Gesture:</strong> {$arvr.lastGesture.gesture || 'Unknown'}\\n\\t\\t\\t\\t\\t<br />\\n\\t\\t\\t\\t\\t<strong>Type:</strong> {$arvr.lastGesture.gestureType}\\n\\t\\t\\t\\t\\t<br />\\n\\t\\t\\t\\t\\t<strong>Confidence:</strong> {($arvr.lastGesture.confidence || 0).toFixed(2)}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\t{/if}\\n\\n\\t{#if $arvr.sessionState.spatialEnabled}\\n\\t\\t<div class=\\"control-section\\">\\n\\t\\t\\t<h3>Spatial Objects</h3>\\n\\t\\t\\t<div class=\\"spatial-info\\">\\n\\t\\t\\t\\t<strong>Active Objects:</strong> {$arvr.spatialObjects.size}\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t{/if}\\n</div>\\n\\n<style>\\n\\t.arvr-control-panel {\\n\\t\\tpadding: 20px;\\n\\t\\tbackground: #fff;\\n\\t\\tborder-radius: 8px;\\n\\t\\tbox-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\\n\\t\\tmax-width: 600px;\\n\\t\\tmargin: 0 auto;\\n\\t}\\n\\n\\th2 {\\n\\t\\tmargin: 0 0 20px 0;\\n\\t\\tfont-size: 24px;\\n\\t\\tfont-weight: 700;\\n\\t\\tcolor: #2d3748;\\n\\t}\\n\\n\\th3 {\\n\\t\\tmargin: 0 0 12px 0;\\n\\t\\tfont-size: 16px;\\n\\t\\tfont-weight: 600;\\n\\t\\tcolor: #4a5568;\\n\\t}\\n\\n\\t.status-section {\\n\\t\\tbackground: #f7fafc;\\n\\t\\tpadding: 12px;\\n\\t\\tborder-radius: 6px;\\n\\t\\tmargin-bottom: 20px;\\n\\t}\\n\\n\\t.status-item {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\talign-items: center;\\n\\t\\tpadding: 6px 0;\\n\\t\\tborder-bottom: 1px solid #e2e8f0;\\n\\t}\\n\\n\\t.status-item:last-child {\\n\\t\\tborder-bottom: none;\\n\\t}\\n\\n\\t.status-label {\\n\\t\\tfont-weight: 600;\\n\\t\\tcolor: #4a5568;\\n\\t}\\n\\n\\t.status-value {\\n\\t\\tcolor: #718096;\\n\\t}\\n\\n\\t.status-value.enabled {\\n\\t\\tcolor: #48bb78;\\n\\t\\tfont-weight: 600;\\n\\t}\\n\\n\\t.control-section {\\n\\t\\tmargin-bottom: 20px;\\n\\t\\tpadding-bottom: 20px;\\n\\t\\tborder-bottom: 1px solid #e2e8f0;\\n\\t}\\n\\n\\t.control-section:last-child {\\n\\t\\tborder-bottom: none;\\n\\t\\tmargin-bottom: 0;\\n\\t\\tpadding-bottom: 0;\\n\\t}\\n\\n\\t.button-group {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 8px;\\n\\t\\tflex-wrap: wrap;\\n\\t}\\n\\n\\tbutton {\\n\\t\\tpadding: 10px 16px;\\n\\t\\tbackground: #4299e1;\\n\\t\\tcolor: white;\\n\\t\\tborder: none;\\n\\t\\tborder-radius: 6px;\\n\\t\\tfont-size: 14px;\\n\\t\\tfont-weight: 600;\\n\\t\\tcursor: pointer;\\n\\t\\ttransition: background 0.2s;\\n\\t}\\n\\n\\tbutton:hover:not(:disabled) {\\n\\t\\tbackground: #3182ce;\\n\\t}\\n\\n\\tbutton:disabled {\\n\\t\\tbackground: #cbd5e0;\\n\\t\\tcursor: not-allowed;\\n\\t}\\n\\n\\t.toggle-group {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tgap: 8px;\\n\\t}\\n\\n\\t.toggle-item {\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tgap: 8px;\\n\\t\\tcursor: pointer;\\n\\t\\tpadding: 8px;\\n\\t\\tborder-radius: 4px;\\n\\t\\ttransition: background 0.2s;\\n\\t}\\n\\n\\t.toggle-item:hover {\\n\\t\\tbackground: #f7fafc;\\n\\t}\\n\\n\\t.toggle-item input[type=\\"checkbox\\"] {\\n\\t\\twidth: 18px;\\n\\t\\theight: 18px;\\n\\t\\tcursor: pointer;\\n\\t}\\n\\n\\t.toggle-item span {\\n\\t\\tfont-size: 14px;\\n\\t\\tcolor: #2d3748;\\n\\t}\\n\\n\\t.panel-content {\\n\\t\\tmargin-top: 16px;\\n\\t\\tpadding: 16px;\\n\\t\\tbackground: #f7fafc;\\n\\t\\tborder-radius: 6px;\\n\\t}\\n\\n\\t.gesture-info {\\n\\t\\tmargin-top: 12px;\\n\\t\\tpadding: 12px;\\n\\t\\tbackground: #f7fafc;\\n\\t\\tborder-radius: 6px;\\n\\t\\tfont-size: 14px;\\n\\t\\tline-height: 1.6;\\n\\t}\\n\\n\\t.spatial-info {\\n\\t\\tpadding: 12px;\\n\\t\\tbackground: #f7fafc;\\n\\t\\tborder-radius: 6px;\\n\\t\\tfont-size: 14px;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.arvr-control-panel {\\n\\t\\t\\tpadding: 16px;\\n\\t\\t}\\n\\n\\t\\th2 {\\n\\t\\t\\tfont-size: 20px;\\n\\t\\t}\\n\\n\\t\\t.button-group button {\\n\\t\\t\\tflex: 1;\\n\\t\\t\\tmin-width: 120px;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const ARVRControlPanel = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $arvr, $$unsubscribe_arvr;
  let { userId } = $$props;
  let { sessionId = void 0 } = $$props;
  let { videoElement = null } = $$props;
  const arvr = useStackLiveARVR(userId, sessionId);
  $$unsubscribe_arvr = subscribe(arvr, (value) => $arvr = value);
  onDestroy(async () => {
    await arvr.cleanup();
  });
  if ($$props.userId === void 0 && $$bindings.userId && userId !== void 0) $$bindings.userId(userId);
  if ($$props.sessionId === void 0 && $$bindings.sessionId && sessionId !== void 0) $$bindings.sessionId(sessionId);
  if ($$props.videoElement === void 0 && $$bindings.videoElement && videoElement !== void 0) $$bindings.videoElement(videoElement);
  $$result.css.add(css$1);
  $$unsubscribe_arvr();
  return `<div class="arvr-control-panel svelte-14opp22"><h2 class="svelte-14opp22" data-svelte-h="svelte-19dn1k8">AR/VR Controls</h2> <div class="status-section svelte-14opp22"><div class="status-item svelte-14opp22"><span class="status-label svelte-14opp22" data-svelte-h="svelte-1w2mx67">WebXR Support:</span> <span class="${["status-value svelte-14opp22", ""].join(" ").trim()}">${escape("✗ Not Supported")}</span></div> <div class="status-item svelte-14opp22"><span class="status-label svelte-14opp22" data-svelte-h="svelte-gy6uyy">Session Active:</span> <span class="${["status-value svelte-14opp22", $arvr.sessionState.active ? "enabled" : ""].join(" ").trim()}">${escape($arvr.sessionState.active ? "✓ Active" : "✗ Inactive")}</span></div> ${$arvr.sessionState.active ? `<div class="status-item svelte-14opp22"><span class="status-label svelte-14opp22" data-svelte-h="svelte-1tvatn1">Mode:</span> <span class="status-value svelte-14opp22">${escape($arvr.sessionState.mode?.toUpperCase())}</span></div>` : ``}</div> <div class="control-section svelte-14opp22"><h3 class="svelte-14opp22" data-svelte-h="svelte-1uk2int">Session Control</h3> <div class="button-group svelte-14opp22"><button ${$arvr.sessionState.active || true ? "disabled" : ""} class="svelte-14opp22">Start AR</button> <button ${$arvr.sessionState.active || true ? "disabled" : ""} class="svelte-14opp22">Start VR</button> <button ${!$arvr.sessionState.active ? "disabled" : ""} class="svelte-14opp22">End Session</button></div></div> <div class="control-section svelte-14opp22"><h3 class="svelte-14opp22" data-svelte-h="svelte-14h6n6n">Feature Toggles</h3> <div class="toggle-group svelte-14opp22"><label class="toggle-item svelte-14opp22"><input type="checkbox" ${$arvr.sessionState.avatarEnabled ? "checked" : ""} class="svelte-14opp22"> <span class="svelte-14opp22" data-svelte-h="svelte-j77kwo">Avatars</span></label> <label class="toggle-item svelte-14opp22"><input type="checkbox" ${$arvr.sessionState.filtersEnabled ? "checked" : ""} class="svelte-14opp22"> <span class="svelte-14opp22" data-svelte-h="svelte-dc7ftj">Filters</span></label> <label class="toggle-item svelte-14opp22"><input type="checkbox" ${$arvr.sessionState.spatialEnabled ? "checked" : ""} class="svelte-14opp22"> <span class="svelte-14opp22" data-svelte-h="svelte-jbs3e7">Spatial Interactions</span></label> <label class="toggle-item svelte-14opp22"><input type="checkbox" ${$arvr.sessionState.gestureDetectionEnabled ? "checked" : ""} class="svelte-14opp22"> <span class="svelte-14opp22" data-svelte-h="svelte-1lbj60q">Gesture Detection</span></label></div></div> ${$arvr.sessionState.avatarEnabled ? `<div class="control-section svelte-14opp22"><h3 class="svelte-14opp22" data-svelte-h="svelte-ejidto">Avatar Control</h3> <div class="button-group svelte-14opp22"><button class="svelte-14opp22" data-svelte-h="svelte-1t8xwig">Load Avatar</button> <button class="svelte-14opp22">${escape("Show")} Avatar Panel</button></div> ${``}</div>` : ``} ${$arvr.sessionState.filtersEnabled ? `<div class="control-section svelte-14opp22"><h3 class="svelte-14opp22" data-svelte-h="svelte-byb9gz">Filter Control</h3> <div class="button-group svelte-14opp22"><button class="svelte-14opp22">${escape("Show")} Filters</button> ${``}</div> ${``}</div>` : ``} ${$arvr.sessionState.gestureDetectionEnabled && videoElement ? `<div class="control-section svelte-14opp22"><h3 class="svelte-14opp22" data-svelte-h="svelte-x8cxay">Gesture Detection</h3> <div class="button-group svelte-14opp22"><button class="svelte-14opp22" data-svelte-h="svelte-14xzqp">Start Detection</button> <button class="svelte-14opp22" data-svelte-h="svelte-162jyiz">Stop Detection</button></div> ${$arvr.lastGesture ? `<div class="gesture-info svelte-14opp22"><strong data-svelte-h="svelte-1nsznur">Last Gesture:</strong> ${escape($arvr.lastGesture.gesture || "Unknown")} <br> <strong data-svelte-h="svelte-1y9dw9w">Type:</strong> ${escape($arvr.lastGesture.gestureType)} <br> <strong data-svelte-h="svelte-1bu9ufs">Confidence:</strong> ${escape(($arvr.lastGesture.confidence || 0).toFixed(2))}</div>` : ``}</div>` : ``} ${$arvr.sessionState.spatialEnabled ? `<div class="control-section svelte-14opp22"><h3 class="svelte-14opp22" data-svelte-h="svelte-191mu4a">Spatial Objects</h3> <div class="spatial-info svelte-14opp22"><strong data-svelte-h="svelte-604nue">Active Objects:</strong> ${escape($arvr.spatialObjects.size)}</div></div>` : ``} </div>`;
});
const css = {
  code: ".demo-container.svelte-rcq1p2.svelte-rcq1p2{max-width:1200px;margin:0 auto;padding:20px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,\n			Cantarell, sans-serif}header.svelte-rcq1p2.svelte-rcq1p2{text-align:center;margin-bottom:40px}h1.svelte-rcq1p2.svelte-rcq1p2{font-size:36px;font-weight:700;color:#2d3748;margin:0 0 10px 0}.subtitle.svelte-rcq1p2.svelte-rcq1p2{font-size:18px;color:#718096;margin:0}.demo-content.svelte-rcq1p2.svelte-rcq1p2{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:40px}.video-section.svelte-rcq1p2 h2.svelte-rcq1p2,.features-section.svelte-rcq1p2 h2.svelte-rcq1p2,.info-section.svelte-rcq1p2 h2.svelte-rcq1p2{font-size:24px;font-weight:600;color:#2d3748;margin:0 0 20px 0}.video-container.svelte-rcq1p2.svelte-rcq1p2{position:relative;width:100%;aspect-ratio:4/3;background:#000;border-radius:12px;overflow:hidden;margin-bottom:20px}video.svelte-rcq1p2.svelte-rcq1p2{width:100%;height:100%;object-fit:cover}.no-camera.svelte-rcq1p2.svelte-rcq1p2{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a202c;color:#fff;text-align:center}.no-camera.svelte-rcq1p2 p.svelte-rcq1p2{margin:8px 0;font-size:18px}.help-text.svelte-rcq1p2.svelte-rcq1p2{font-size:14px !important;color:#cbd5e0}.session-info.svelte-rcq1p2.svelte-rcq1p2{background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px}.session-info.svelte-rcq1p2 p.svelte-rcq1p2{margin:8px 0;font-size:14px;color:#4a5568}.session-info.svelte-rcq1p2 strong.svelte-rcq1p2{color:#2d3748}.session-info.svelte-rcq1p2 code.svelte-rcq1p2{background:#edf2f7;padding:2px 6px;border-radius:3px;font-size:12px;font-family:'Courier New', monospace}.session-info.svelte-rcq1p2 .active.svelte-rcq1p2{color:#48bb78;font-weight:600}.features-section.svelte-rcq1p2.svelte-rcq1p2{margin-bottom:40px}.features-grid.svelte-rcq1p2.svelte-rcq1p2{display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:20px}.feature-card.svelte-rcq1p2.svelte-rcq1p2{background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;transition:all 0.3s}.feature-card.svelte-rcq1p2.svelte-rcq1p2:hover{border-color:#4299e1;transform:translateY(-4px);box-shadow:0 8px 16px rgba(0, 0, 0, 0.1)}.feature-icon.svelte-rcq1p2.svelte-rcq1p2{font-size:48px;margin-bottom:12px}.feature-card.svelte-rcq1p2 h3.svelte-rcq1p2{font-size:18px;font-weight:600;color:#2d3748;margin:0 0 8px 0}.feature-card.svelte-rcq1p2 p.svelte-rcq1p2{font-size:14px;color:#718096;margin:0;line-height:1.5}.info-section.svelte-rcq1p2.svelte-rcq1p2{background:#f7fafc;border-radius:12px;padding:24px;margin-bottom:40px}.info-section.svelte-rcq1p2 h3.svelte-rcq1p2{font-size:18px;font-weight:600;color:#2d3748;margin:20px 0 12px 0}.info-section.svelte-rcq1p2 p.svelte-rcq1p2{font-size:14px;color:#4a5568;line-height:1.6}.info-section.svelte-rcq1p2 a.svelte-rcq1p2{color:#4299e1;text-decoration:none;font-weight:600}.info-section.svelte-rcq1p2 a.svelte-rcq1p2:hover{text-decoration:underline}pre.svelte-rcq1p2.svelte-rcq1p2{background:#2d3748;color:#e2e8f0;padding:16px;border-radius:8px;overflow-x:auto;margin:12px 0}code.svelte-rcq1p2.svelte-rcq1p2{font-family:'Courier New', monospace;font-size:13px;line-height:1.5}footer.svelte-rcq1p2.svelte-rcq1p2{text-align:center;padding:20px 0;border-top:2px solid #e2e8f0;margin-top:40px}footer.svelte-rcq1p2 p.svelte-rcq1p2{margin:8px 0;color:#718096;font-size:14px}.note.svelte-rcq1p2.svelte-rcq1p2{font-size:12px !important;font-style:italic}@media(max-width: 768px){.demo-content.svelte-rcq1p2.svelte-rcq1p2{grid-template-columns:1fr}h1.svelte-rcq1p2.svelte-rcq1p2{font-size:28px}.subtitle.svelte-rcq1p2.svelte-rcq1p2{font-size:16px}.features-grid.svelte-rcq1p2.svelte-rcq1p2{grid-template-columns:1fr}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount } from \\"svelte\\";\\nimport ARVRControlPanel from \\"$lib/Components/ARVRControlPanel.svelte\\";\\nimport { useStackLiveARVR } from \\"$lib/multiplayer\\";\\nlet videoElement;\\nlet cameraStream = null;\\nlet userId = \`user-\${Math.random().toString(36).substring(2, 9)}\`;\\nlet sessionId = \`demo-session-\${Date.now()}\`;\\nconst arvr = useStackLiveARVR(userId, sessionId);\\nonMount(async () => {\\n  try {\\n    cameraStream = await navigator.mediaDevices.getUserMedia({\\n      video: { facingMode: \\"user\\" },\\n      audio: false\\n    });\\n    if (videoElement && cameraStream) {\\n      videoElement.srcObject = cameraStream;\\n    }\\n  } catch (error) {\\n    console.error(\\"Failed to access camera:\\", error);\\n  }\\n  return () => {\\n    if (cameraStream) {\\n      cameraStream.getTracks().forEach((track) => track.stop());\\n    }\\n  };\\n});\\n<\/script>\\n\\n<svelte:head>\\n\\t<title>AR/VR Demo - StackLive</title>\\n</svelte:head>\\n\\n<div class=\\"demo-container\\">\\n\\t<header>\\n\\t\\t<h1>🎭 StackLive AR/VR Demo</h1>\\n\\t\\t<p class=\\"subtitle\\">\\n\\t\\t\\tExperience immersive AR/VR capabilities with avatars, filters, and spatial interactions\\n\\t\\t</p>\\n\\t</header>\\n\\n\\t<div class=\\"demo-content\\">\\n\\t\\t<div class=\\"video-section\\">\\n\\t\\t\\t<h2>Camera Preview</h2>\\n\\t\\t\\t<div class=\\"video-container\\">\\n\\t\\t\\t\\t<video bind:this={videoElement} autoplay playsinline muted></video>\\n\\t\\t\\t\\t{#if !cameraStream}\\n\\t\\t\\t\\t\\t<div class=\\"no-camera\\">\\n\\t\\t\\t\\t\\t\\t<p>📷 Camera access required</p>\\n\\t\\t\\t\\t\\t\\t<p class=\\"help-text\\">Please allow camera access to use AR/VR features</p>\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<div class=\\"session-info\\">\\n\\t\\t\\t\\t<p><strong>User ID:</strong> <code>{userId}</code></p>\\n\\t\\t\\t\\t<p><strong>Session ID:</strong> <code>{sessionId}</code></p>\\n\\t\\t\\t\\t<p>\\n\\t\\t\\t\\t\\t<strong>Session Active:</strong>\\n\\t\\t\\t\\t\\t<span class:active={$arvr.sessionState.active}>\\n\\t\\t\\t\\t\\t\\t{$arvr.sessionState.active ? '✓ Yes' : '✗ No'}\\n\\t\\t\\t\\t\\t</span>\\n\\t\\t\\t\\t</p>\\n\\t\\t\\t\\t{#if $arvr.sessionState.active}\\n\\t\\t\\t\\t\\t<p><strong>Mode:</strong> {$arvr.sessionState.mode?.toUpperCase()}</p>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"control-section\\">\\n\\t\\t\\t<ARVRControlPanel {userId} {sessionId} {videoElement} />\\n\\t\\t</div>\\n\\t</div>\\n\\n\\t<div class=\\"features-section\\">\\n\\t\\t<h2>✨ Available Features</h2>\\n\\t\\t<div class=\\"features-grid\\">\\n\\t\\t\\t<div class=\\"feature-card\\">\\n\\t\\t\\t\\t<div class=\\"feature-icon\\">🧑‍🎤</div>\\n\\t\\t\\t\\t<h3>3D Avatars</h3>\\n\\t\\t\\t\\t<p>Load and customize 3D avatars with expressions, clothing, and accessories</p>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"feature-card\\">\\n\\t\\t\\t\\t<div class=\\"feature-icon\\">🎨</div>\\n\\t\\t\\t\\t<h3>AR Filters</h3>\\n\\t\\t\\t\\t<p>Apply real-time face, body, and environment filters</p>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"feature-card\\">\\n\\t\\t\\t\\t<div class=\\"feature-icon\\">👋</div>\\n\\t\\t\\t\\t<h3>Gesture Detection</h3>\\n\\t\\t\\t\\t<p>Detect hand gestures, face expressions, and body poses</p>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"feature-card\\">\\n\\t\\t\\t\\t<div class=\\"feature-icon\\">🎯</div>\\n\\t\\t\\t\\t<h3>Spatial Interactions</h3>\\n\\t\\t\\t\\t<p>Place, move, and interact with objects in 3D space</p>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t</div>\\n\\n\\t<div class=\\"info-section\\">\\n\\t\\t<h2>📚 Documentation</h2>\\n\\t\\t<p>\\n\\t\\t\\tFor complete documentation, usage examples, and integration guides, see\\n\\t\\t\\t<a href=\\"/ARVR_DOCUMENTATION.md\\" target=\\"_blank\\">ARVR_DOCUMENTATION.md</a>\\n\\t\\t</p>\\n\\n\\t\\t<h3>Quick Start</h3>\\n\\t\\t<pre><code>{\`import { useStackLiveARVR } from '$lib/multiplayer';\\n\\nconst arvr = useStackLiveARVR(userId, sessionId);\\n\\n// Start AR session\\nawait arvr.startARSession();\\n\\n// Load avatar\\nawait arvr.loadAvatar('/models/avatar.glb');\\n\\n// Apply filter\\narvr.applyFilter('beauty-smooth');\\n\\n// Enable gesture detection\\nawait arvr.startGestureDetection(videoElement);\`}</code></pre>\\n\\t</div>\\n\\n\\t<footer>\\n\\t\\t<p>\\n\\t\\t\\tBuilt with ❤️ using StackLive Realtime Multiplayer Platform\\n\\t\\t</p>\\n\\t\\t<p class=\\"note\\">\\n\\t\\t\\tNote: WebXR support required for full AR/VR experience. Fallback rendering available on\\n\\t\\t\\tunsupported devices.\\n\\t\\t</p>\\n\\t</footer>\\n</div>\\n\\n<style>\\n\\t.demo-container {\\n\\t\\tmax-width: 1200px;\\n\\t\\tmargin: 0 auto;\\n\\t\\tpadding: 20px;\\n\\t\\tfont-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,\\n\\t\\t\\tCantarell, sans-serif;\\n\\t}\\n\\n\\theader {\\n\\t\\ttext-align: center;\\n\\t\\tmargin-bottom: 40px;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 36px;\\n\\t\\tfont-weight: 700;\\n\\t\\tcolor: #2d3748;\\n\\t\\tmargin: 0 0 10px 0;\\n\\t}\\n\\n\\t.subtitle {\\n\\t\\tfont-size: 18px;\\n\\t\\tcolor: #718096;\\n\\t\\tmargin: 0;\\n\\t}\\n\\n\\t.demo-content {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: 1fr 1fr;\\n\\t\\tgap: 30px;\\n\\t\\tmargin-bottom: 40px;\\n\\t}\\n\\n\\t.video-section h2,\\n\\t.features-section h2,\\n\\t.info-section h2 {\\n\\t\\tfont-size: 24px;\\n\\t\\tfont-weight: 600;\\n\\t\\tcolor: #2d3748;\\n\\t\\tmargin: 0 0 20px 0;\\n\\t}\\n\\n\\t.video-container {\\n\\t\\tposition: relative;\\n\\t\\twidth: 100%;\\n\\t\\taspect-ratio: 4/3;\\n\\t\\tbackground: #000;\\n\\t\\tborder-radius: 12px;\\n\\t\\toverflow: hidden;\\n\\t\\tmargin-bottom: 20px;\\n\\t}\\n\\n\\tvideo {\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tobject-fit: cover;\\n\\t}\\n\\n\\t.no-camera {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 0;\\n\\t\\tleft: 0;\\n\\t\\tright: 0;\\n\\t\\tbottom: 0;\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tbackground: #1a202c;\\n\\t\\tcolor: #fff;\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.no-camera p {\\n\\t\\tmargin: 8px 0;\\n\\t\\tfont-size: 18px;\\n\\t}\\n\\n\\t.help-text {\\n\\t\\tfont-size: 14px !important;\\n\\t\\tcolor: #cbd5e0;\\n\\t}\\n\\n\\t.session-info {\\n\\t\\tbackground: #f7fafc;\\n\\t\\tborder: 1px solid #e2e8f0;\\n\\t\\tborder-radius: 8px;\\n\\t\\tpadding: 16px;\\n\\t}\\n\\n\\t.session-info p {\\n\\t\\tmargin: 8px 0;\\n\\t\\tfont-size: 14px;\\n\\t\\tcolor: #4a5568;\\n\\t}\\n\\n\\t.session-info strong {\\n\\t\\tcolor: #2d3748;\\n\\t}\\n\\n\\t.session-info code {\\n\\t\\tbackground: #edf2f7;\\n\\t\\tpadding: 2px 6px;\\n\\t\\tborder-radius: 3px;\\n\\t\\tfont-size: 12px;\\n\\t\\tfont-family: 'Courier New', monospace;\\n\\t}\\n\\n\\t.session-info .active {\\n\\t\\tcolor: #48bb78;\\n\\t\\tfont-weight: 600;\\n\\t}\\n\\n\\t.features-section {\\n\\t\\tmargin-bottom: 40px;\\n\\t}\\n\\n\\t.features-grid {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\\n\\t\\tgap: 20px;\\n\\t}\\n\\n\\t.feature-card {\\n\\t\\tbackground: #fff;\\n\\t\\tborder: 2px solid #e2e8f0;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 24px;\\n\\t\\ttext-align: center;\\n\\t\\ttransition: all 0.3s;\\n\\t}\\n\\n\\t.feature-card:hover {\\n\\t\\tborder-color: #4299e1;\\n\\t\\ttransform: translateY(-4px);\\n\\t\\tbox-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);\\n\\t}\\n\\n\\t.feature-icon {\\n\\t\\tfont-size: 48px;\\n\\t\\tmargin-bottom: 12px;\\n\\t}\\n\\n\\t.feature-card h3 {\\n\\t\\tfont-size: 18px;\\n\\t\\tfont-weight: 600;\\n\\t\\tcolor: #2d3748;\\n\\t\\tmargin: 0 0 8px 0;\\n\\t}\\n\\n\\t.feature-card p {\\n\\t\\tfont-size: 14px;\\n\\t\\tcolor: #718096;\\n\\t\\tmargin: 0;\\n\\t\\tline-height: 1.5;\\n\\t}\\n\\n\\t.info-section {\\n\\t\\tbackground: #f7fafc;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 24px;\\n\\t\\tmargin-bottom: 40px;\\n\\t}\\n\\n\\t.info-section h3 {\\n\\t\\tfont-size: 18px;\\n\\t\\tfont-weight: 600;\\n\\t\\tcolor: #2d3748;\\n\\t\\tmargin: 20px 0 12px 0;\\n\\t}\\n\\n\\t.info-section p {\\n\\t\\tfont-size: 14px;\\n\\t\\tcolor: #4a5568;\\n\\t\\tline-height: 1.6;\\n\\t}\\n\\n\\t.info-section a {\\n\\t\\tcolor: #4299e1;\\n\\t\\ttext-decoration: none;\\n\\t\\tfont-weight: 600;\\n\\t}\\n\\n\\t.info-section a:hover {\\n\\t\\ttext-decoration: underline;\\n\\t}\\n\\n\\tpre {\\n\\t\\tbackground: #2d3748;\\n\\t\\tcolor: #e2e8f0;\\n\\t\\tpadding: 16px;\\n\\t\\tborder-radius: 8px;\\n\\t\\toverflow-x: auto;\\n\\t\\tmargin: 12px 0;\\n\\t}\\n\\n\\tcode {\\n\\t\\tfont-family: 'Courier New', monospace;\\n\\t\\tfont-size: 13px;\\n\\t\\tline-height: 1.5;\\n\\t}\\n\\n\\tfooter {\\n\\t\\ttext-align: center;\\n\\t\\tpadding: 20px 0;\\n\\t\\tborder-top: 2px solid #e2e8f0;\\n\\t\\tmargin-top: 40px;\\n\\t}\\n\\n\\tfooter p {\\n\\t\\tmargin: 8px 0;\\n\\t\\tcolor: #718096;\\n\\t\\tfont-size: 14px;\\n\\t}\\n\\n\\t.note {\\n\\t\\tfont-size: 12px !important;\\n\\t\\tfont-style: italic;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.demo-content {\\n\\t\\t\\tgrid-template-columns: 1fr;\\n\\t\\t}\\n\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 28px;\\n\\t\\t}\\n\\n\\t\\t.subtitle {\\n\\t\\t\\tfont-size: 16px;\\n\\t\\t}\\n\\n\\t\\t.features-grid {\\n\\t\\t\\tgrid-template-columns: 1fr;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $arvr, $$unsubscribe_arvr;
  let videoElement;
  let userId = `user-${Math.random().toString(36).substring(2, 9)}`;
  let sessionId = `demo-session-${Date.now()}`;
  const arvr = useStackLiveARVR(userId, sessionId);
  $$unsubscribe_arvr = subscribe(arvr, (value) => $arvr = value);
  $$result.css.add(css);
  $$unsubscribe_arvr();
  return `${$$result.head += `<!-- HEAD_svelte-5v5q42_START -->${$$result.title = `<title>AR/VR Demo - StackLive</title>`, ""}<!-- HEAD_svelte-5v5q42_END -->`, ""} <div class="demo-container svelte-rcq1p2"><header class="svelte-rcq1p2" data-svelte-h="svelte-1g21xgr"><h1 class="svelte-rcq1p2">🎭 StackLive AR/VR Demo</h1> <p class="subtitle svelte-rcq1p2">Experience immersive AR/VR capabilities with avatars, filters, and spatial interactions</p></header> <div class="demo-content svelte-rcq1p2"><div class="video-section svelte-rcq1p2"><h2 class="svelte-rcq1p2" data-svelte-h="svelte-5bw3ud">Camera Preview</h2> <div class="video-container svelte-rcq1p2"><video autoplay playsinline muted class="svelte-rcq1p2"${add_attribute("this", videoElement, 0)}></video> ${`<div class="no-camera svelte-rcq1p2" data-svelte-h="svelte-1o00ira"><p class="svelte-rcq1p2">📷 Camera access required</p> <p class="help-text svelte-rcq1p2">Please allow camera access to use AR/VR features</p></div>`}</div> <div class="session-info svelte-rcq1p2"><p class="svelte-rcq1p2"><strong class="svelte-rcq1p2" data-svelte-h="svelte-jofrz6">User ID:</strong> <code class="svelte-rcq1p2">${escape(userId)}</code></p> <p class="svelte-rcq1p2"><strong class="svelte-rcq1p2" data-svelte-h="svelte-1uf6n61">Session ID:</strong> <code class="svelte-rcq1p2">${escape(sessionId)}</code></p> <p class="svelte-rcq1p2"><strong class="svelte-rcq1p2" data-svelte-h="svelte-1qfzkt6">Session Active:</strong> <span class="${["svelte-rcq1p2", $arvr.sessionState.active ? "active" : ""].join(" ").trim()}">${escape($arvr.sessionState.active ? "✓ Yes" : "✗ No")}</span></p> ${$arvr.sessionState.active ? `<p class="svelte-rcq1p2"><strong class="svelte-rcq1p2" data-svelte-h="svelte-fx9tfb">Mode:</strong> ${escape($arvr.sessionState.mode?.toUpperCase())}</p>` : ``}</div></div> <div class="control-section">${validate_component(ARVRControlPanel, "ARVRControlPanel").$$render($$result, { userId, sessionId, videoElement }, {}, {})}</div></div> <div class="features-section svelte-rcq1p2" data-svelte-h="svelte-1dp59xq"><h2 class="svelte-rcq1p2">✨ Available Features</h2> <div class="features-grid svelte-rcq1p2"><div class="feature-card svelte-rcq1p2"><div class="feature-icon svelte-rcq1p2">🧑‍🎤</div> <h3 class="svelte-rcq1p2">3D Avatars</h3> <p class="svelte-rcq1p2">Load and customize 3D avatars with expressions, clothing, and accessories</p></div> <div class="feature-card svelte-rcq1p2"><div class="feature-icon svelte-rcq1p2">🎨</div> <h3 class="svelte-rcq1p2">AR Filters</h3> <p class="svelte-rcq1p2">Apply real-time face, body, and environment filters</p></div> <div class="feature-card svelte-rcq1p2"><div class="feature-icon svelte-rcq1p2">👋</div> <h3 class="svelte-rcq1p2">Gesture Detection</h3> <p class="svelte-rcq1p2">Detect hand gestures, face expressions, and body poses</p></div> <div class="feature-card svelte-rcq1p2"><div class="feature-icon svelte-rcq1p2">🎯</div> <h3 class="svelte-rcq1p2">Spatial Interactions</h3> <p class="svelte-rcq1p2">Place, move, and interact with objects in 3D space</p></div></div></div> <div class="info-section svelte-rcq1p2"><h2 class="svelte-rcq1p2" data-svelte-h="svelte-1eavx73">📚 Documentation</h2> <p class="svelte-rcq1p2" data-svelte-h="svelte-pjmu7k">For complete documentation, usage examples, and integration guides, see
			<a href="/ARVR_DOCUMENTATION.md" target="_blank" class="svelte-rcq1p2">ARVR_DOCUMENTATION.md</a></p> <h3 class="svelte-rcq1p2" data-svelte-h="svelte-17p47sb">Quick Start</h3> <pre class="svelte-rcq1p2"><code class="svelte-rcq1p2">${escape(`import { useStackLiveARVR } from '$lib/multiplayer';

const arvr = useStackLiveARVR(userId, sessionId);

// Start AR session
await arvr.startARSession();

// Load avatar
await arvr.loadAvatar('/models/avatar.glb');

// Apply filter
arvr.applyFilter('beauty-smooth');

// Enable gesture detection
await arvr.startGestureDetection(videoElement);`)}</code></pre></div> <footer class="svelte-rcq1p2" data-svelte-h="svelte-yl6uxk"><p class="svelte-rcq1p2">Built with ❤️ using StackLive Realtime Multiplayer Platform</p> <p class="note svelte-rcq1p2">Note: WebXR support required for full AR/VR experience. Fallback rendering available on
			unsupported devices.</p></footer> </div>`;
});
export {
  Page as default
};
