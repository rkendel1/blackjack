import { c as create_ssr_component, a as subscribe, o as onDestroy, e as escape, v as validate_component } from "../../../chunks/ssr.js";
import { w as writable } from "../../../chunks/index.js";
import { S as StackLiveMultiplayerRuntime } from "../../../chunks/StackLiveMultiplayerRuntime.js";
/* empty css                                                           */
/* empty css                     */
class InteractionManager {
  interactionCallbacks = /* @__PURE__ */ new Map();
  pollResponses = /* @__PURE__ */ new Map();
  quizResponses = /* @__PURE__ */ new Map();
  snapMessages = /* @__PURE__ */ new Map();
  chatMessages = /* @__PURE__ */ new Map();
  mediaMessages = /* @__PURE__ */ new Map();
  debugMode;
  constructor(debug = false) {
    this.debugMode = debug;
  }
  /**
   * Register callback for interaction events
   */
  on(type, callback) {
    if (!this.interactionCallbacks.has(type)) {
      this.interactionCallbacks.set(type, []);
    }
    this.interactionCallbacks.get(type).push(callback);
  }
  /**
   * Remove callback for interaction events
   */
  off(type, callback) {
    const callbacks = this.interactionCallbacks.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  /**
   * Handle incoming interaction message
   */
  handleInteraction(type, payload, fromUserId) {
    this.log(`Handling ${type} interaction from user ${fromUserId}`, payload);
    if (type === "poll" && this.isPollResponse(payload)) {
      this.handlePollResponse(payload);
    } else if (type === "quiz" && this.isQuizResponse(payload)) {
      this.handleQuizResponse(payload);
    } else if (type === "snap" && this.isSnapMessage(payload)) {
      this.handleSnapMessage(payload);
    } else if (type === "chat" && this.isChatMessage(payload)) {
      this.handleChatMessage(payload);
    } else if (type === "media" && this.isMediaMessage(payload)) {
      this.handleMediaMessage(payload);
    }
    const callbacks = this.interactionCallbacks.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  }
  /**
   * Create and broadcast a poll
   */
  createPoll(question, options, allowMultiple = false, expiresAt) {
    const poll = {
      id: this.generateId(),
      question,
      options,
      allowMultiple,
      expiresAt
    };
    this.pollResponses.set(poll.id, []);
    this.log("Poll created", poll);
    return poll;
  }
  /**
   * Create and broadcast a quiz
   */
  createQuiz(question, options, correctAnswer, timeLimit, points) {
    const quiz = {
      id: this.generateId(),
      question,
      options,
      correctAnswer,
      timeLimit,
      points
    };
    this.quizResponses.set(quiz.id, []);
    this.log("Quiz created", quiz);
    return quiz;
  }
  /**
   * Handle poll response
   */
  handlePollResponse(response) {
    const responses = this.pollResponses.get(response.pollId);
    if (responses) {
      const existingIndex = responses.findIndex((r) => r.userId === response.userId);
      if (existingIndex > -1) {
        responses.splice(existingIndex, 1);
      }
      responses.push(response);
    }
  }
  /**
   * Handle quiz response
   */
  handleQuizResponse(response) {
    const responses = this.quizResponses.get(response.quizId);
    if (responses) {
      const existingIndex = responses.findIndex((r) => r.userId === response.userId);
      if (existingIndex === -1) {
        responses.push(response);
      }
    }
  }
  /**
   * Handle snap message
   */
  handleSnapMessage(snap) {
    const sessionSnaps = this.snapMessages.get(snap.id) || [];
    sessionSnaps.push(snap);
    this.snapMessages.set(snap.id, sessionSnaps);
  }
  /**
   * Handle chat message
   */
  handleChatMessage(chat) {
    const sessionChats = this.chatMessages.get(chat.sessionId) || [];
    sessionChats.push(chat);
    this.chatMessages.set(chat.sessionId, sessionChats);
  }
  /**
   * Handle media message
   */
  handleMediaMessage(media) {
    const sessionMedia = this.mediaMessages.get(media.sessionId) || [];
    sessionMedia.push(media);
    this.mediaMessages.set(media.sessionId, sessionMedia);
  }
  /**
   * Get poll results
   */
  getPollResults(pollId) {
    return this.pollResponses.get(pollId) || [];
  }
  /**
   * Get quiz results
   */
  getQuizResults(quizId) {
    return this.quizResponses.get(quizId) || [];
  }
  /**
   * Get snap messages
   */
  getSnapMessages(sessionId) {
    return this.snapMessages.get(sessionId) || [];
  }
  /**
   * Get chat messages
   */
  getChatMessages(sessionId) {
    return this.chatMessages.get(sessionId) || [];
  }
  /**
   * Get media messages
   */
  getMediaMessages(sessionId) {
    return this.mediaMessages.get(sessionId) || [];
  }
  /**
   * Get all messages (chat + media) for a session
   */
  getMessages(sessionId, options) {
    const chats = this.getChatMessages(sessionId);
    const media = this.getMediaMessages(sessionId);
    const allMessages = [...chats, ...media].sort((a, b) => a.timestamp - b.timestamp);
    if (options?.limit && options.limit > 0) {
      return allMessages.slice(-options.limit);
    }
    return allMessages;
  }
  /**
   * Clear interaction data for a session
   */
  clearSession(sessionId) {
    this.pollResponses.clear();
    this.quizResponses.clear();
    this.snapMessages.delete(sessionId);
    this.chatMessages.delete(sessionId);
    this.mediaMessages.delete(sessionId);
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  /**
   * Debug logging
   */
  log(message, data) {
    if (this.debugMode) {
      console.log(`[InteractionManager] ${message}`, data);
    }
  }
  /**
   * Type guards for runtime validation
   */
  isPollResponse(payload) {
    return typeof payload === "object" && payload !== null && "pollId" in payload && "userId" in payload && "answers" in payload;
  }
  isQuizResponse(payload) {
    return typeof payload === "object" && payload !== null && "quizId" in payload && "userId" in payload && "answer" in payload;
  }
  isSnapMessage(payload) {
    return typeof payload === "object" && payload !== null && "id" in payload && "type" in payload && "data" in payload;
  }
  isChatMessage(payload) {
    return typeof payload === "object" && payload !== null && "sessionId" in payload && "fromUserId" in payload && "payload" in payload && typeof payload.payload === "string";
  }
  isMediaMessage(payload) {
    return typeof payload === "object" && payload !== null && "sessionId" in payload && "fromUserId" in payload && "mediaUrl" in payload && "mediaType" in payload;
  }
}
class MediaStreamManager {
  localStream = null;
  remoteStreams = /* @__PURE__ */ new Map();
  debugMode;
  streamCallbacks = [];
  constructor(debug = false) {
    this.debugMode = debug;
  }
  /**
   * Initialize local media stream (camera/microphone)
   */
  async initializeLocalStream(config) {
    try {
      this.log("Requesting media permissions...", config);
      const constraints = {
        video: config.video ?? false,
        audio: config.audio ?? false
      };
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.log("Local stream initialized", {
        videoTracks: this.localStream.getVideoTracks().length,
        audioTracks: this.localStream.getAudioTracks().length
      });
      return this.localStream;
    } catch (error) {
      console.error("Failed to initialize local stream:", error);
      return null;
    }
  }
  /**
   * Get local media stream
   */
  getLocalStream() {
    return this.localStream;
  }
  /**
   * Add remote stream from participant
   */
  addRemoteStream(userId, stream) {
    this.log(`Adding remote stream from user ${userId}`);
    this.remoteStreams.set(userId, stream);
    this.streamCallbacks.forEach((cb) => cb(userId, stream));
  }
  /**
   * Remove remote stream
   */
  removeRemoteStream(userId) {
    this.log(`Removing remote stream from user ${userId}`);
    this.remoteStreams.delete(userId);
  }
  /**
   * Get remote stream for a user
   */
  getRemoteStream(userId) {
    return this.remoteStreams.get(userId) || null;
  }
  /**
   * Get all remote streams
   */
  getAllRemoteStreams() {
    return this.remoteStreams;
  }
  /**
   * Register callback for new remote streams
   */
  onRemoteStream(callback) {
    this.streamCallbacks.push(callback);
  }
  /**
   * Toggle video track
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      this.log(`Video ${enabled ? "enabled" : "disabled"}`);
    }
  }
  /**
   * Toggle audio track
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      this.log(`Audio ${enabled ? "enabled" : "disabled"}`);
    }
  }
  /**
   * Stop local stream
   */
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
      this.log("Local stream stopped");
    }
  }
  /**
   * Cleanup all streams
   */
  destroy() {
    this.stopLocalStream();
    this.remoteStreams.clear();
    this.streamCallbacks = [];
    this.log("MediaStreamManager destroyed");
  }
  /**
   * Debug logging
   */
  log(message, data) {
    if (this.debugMode) {
      console.log(`[MediaStreamManager] ${message}`, data);
    }
  }
}
function useStackLiveInteraction(config) {
  let runtime = null;
  let interactionManager = null;
  let mediaManager = null;
  let qualityCheckInterval = null;
  const session = writable(null);
  const participants = writable([]);
  const connectionQuality = writable({
    latency: 0,
    jitter: 0,
    packetLoss: 0,
    quality: "excellent"
  });
  const sessionState = writable("IDLE");
  const isHost = writable(false);
  const isConnected = writable(false);
  const localStream = writable(null);
  const remoteStreams = writable(/* @__PURE__ */ new Map());
  function initialize() {
    if (interactionManager || mediaManager) {
      return;
    }
    interactionManager = new InteractionManager(config.debug);
    mediaManager = new MediaStreamManager(config.debug);
    mediaManager.onRemoteStream((userId, stream) => {
      remoteStreams.update((streams) => {
        const newStreams = new Map(streams);
        newStreams.set(userId, stream);
        return newStreams;
      });
    });
  }
  async function start() {
    initialize();
    runtime = new StackLiveMultiplayerRuntime(
      {
        embedId: config.embedId,
        type: config.type,
        maxPlayers: config.maxParticipants ?? 10,
        video: !!config.video,
        audio: !!config.audio,
        debug: config.debug
      }
    );
    setupEventListeners();
    if (config.video || config.audio) {
      if (mediaManager) {
        const stream = await mediaManager.initializeLocalStream({
          video: config.video,
          audio: config.audio
        });
        localStream.set(stream);
      }
    }
    try {
      const newSession = await runtime.createSession();
      session.set(newSession);
      isHost.set(true);
      sessionState.set(newSession.status);
      participants.set(newSession.participants);
      isConnected.set(true);
      return newSession;
    } catch (error) {
      console.error("Failed to start session:", error);
      return null;
    }
  }
  async function connect(options) {
    if (!config.sessionId) {
      console.error("Session ID required to connect");
      return false;
    }
    initialize();
    runtime = new StackLiveMultiplayerRuntime(
      {
        embedId: config.embedId,
        type: config.type,
        maxPlayers: config.maxParticipants ?? 10,
        video: !!config.video,
        audio: !!config.audio,
        debug: config.debug
      }
    );
    setupEventListeners();
    if (config.video || config.audio) {
      if (mediaManager) {
        const stream = await mediaManager.initializeLocalStream({
          video: config.video,
          audio: config.audio
        });
        localStream.set(stream);
      }
    }
    try {
      const participant = await runtime.joinSession(config.sessionId);
      if (participant) {
        updateSession();
        isHost.set(false);
        isConnected.set(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to connect to session:", error);
      return false;
    }
  }
  function setupEventListeners() {
    if (!runtime) return;
    runtime.on("playerJoined", () => updateSession());
    runtime.on("playerLeft", () => updateSession());
    runtime.on("connectionLost", () => isConnected.set(false));
    runtime.on("reconnected", () => isConnected.set(true));
    runtime.on("gameStart", () => updateSession());
    runtime.on("gameEnd", () => {
      session.set(null);
      participants.set([]);
      sessionState.set("ENDED");
    });
    runtime.onStateSync((state) => {
    });
    if (qualityCheckInterval) {
      clearInterval(qualityCheckInterval);
    }
    qualityCheckInterval = setInterval(() => {
      if (runtime) {
        connectionQuality.set(runtime.getConnectionQuality());
      }
    }, 2e3);
  }
  function stop() {
    if (runtime) {
      runtime.leaveSession();
    }
    if (mediaManager) {
      mediaManager.destroy();
    }
    session.set(null);
    participants.set([]);
    sessionState.set("ENDED");
    isHost.set(false);
    isConnected.set(false);
    localStream.set(null);
    remoteStreams.set(/* @__PURE__ */ new Map());
  }
  function send(message) {
    if (!runtime) return;
    if (message.type === "state") {
      runtime.sendState(message.payload);
    } else if (message.type === "chat") {
      const currentSession = runtime.getSession();
      const chatMessage = {
        id: generateId(),
        sessionId: currentSession?.id || "",
        fromUserId: runtime.getLocalUserId(),
        payload: message.payload,
        timestamp: Date.now()
      };
      interactionManager?.handleInteraction("chat", chatMessage, chatMessage.fromUserId);
      runtime.sendInput({
        type: "interaction",
        interactionType: "chat",
        payload: chatMessage
      });
    } else if (message.type === "media") {
      if (!message.mediaUrl || !isValidUrl(message.mediaUrl)) {
        console.error("Invalid media URL provided");
        return;
      }
      const currentSession = runtime.getSession();
      const mediaMessage = {
        id: generateId(),
        sessionId: currentSession?.id || "",
        fromUserId: runtime.getLocalUserId(),
        payload: message.payload,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType || "",
        timestamp: Date.now()
      };
      interactionManager?.handleInteraction("media", mediaMessage, mediaMessage.fromUserId);
      runtime.sendInput({
        type: "interaction",
        interactionType: "media",
        payload: mediaMessage
      });
    } else {
      runtime.sendInput({
        type: "interaction",
        interactionType: message.type,
        payload: message.payload
      });
    }
  }
  function on(event, callback) {
    if (event === "state") {
      runtime?.onStateSync(callback);
    } else if (event === "interaction") {
      interactionManager?.on("poll", callback);
      interactionManager?.on("quiz", callback);
      interactionManager?.on("reaction", callback);
      interactionManager?.on("snap", callback);
      interactionManager?.on("chat", callback);
      interactionManager?.on("media", callback);
    } else if (event === "join") {
      runtime?.on("playerJoined", callback);
    } else if (event === "leave") {
      runtime?.on("playerLeft", callback);
    } else if (event === "reconnect") {
      runtime?.on("reconnected", callback);
    }
  }
  function createPoll(question, options, allowMultiple = false, expiresAt) {
    if (!interactionManager) {
      throw new Error("Interaction manager not initialized. Call start() or connect() first.");
    }
    const poll = interactionManager.createPoll(question, options, allowMultiple, expiresAt);
    send({ type: "poll", payload: poll });
    return poll;
  }
  function createQuiz(question, options, correctAnswer, timeLimit, points) {
    if (!interactionManager) {
      throw new Error("Interaction manager not initialized. Call start() or connect() first.");
    }
    const quiz = interactionManager.createQuiz(question, options, correctAnswer, timeLimit, points);
    send({ type: "quiz", payload: quiz });
    return quiz;
  }
  function getPollResults(pollId) {
    return interactionManager?.getPollResults(pollId) || [];
  }
  function getQuizResults(quizId) {
    return interactionManager?.getQuizResults(quizId) || [];
  }
  function getMessages(options) {
    const currentSession = runtime?.getSession();
    if (!currentSession || !interactionManager) {
      return [];
    }
    let validatedOptions = options;
    if (options?.limit !== void 0) {
      const limit = Math.floor(options.limit);
      if (limit < 0 || limit > 1e3) {
        console.warn("Message limit must be between 0 and 1000, using default");
        validatedOptions = void 0;
      } else {
        validatedOptions = { limit };
      }
    }
    return interactionManager.getMessages(currentSession.id, validatedOptions);
  }
  function toggleVideo(enabled) {
    mediaManager?.toggleVideo(enabled);
  }
  function toggleAudio(enabled) {
    mediaManager?.toggleAudio(enabled);
  }
  function updateSession() {
    if (runtime) {
      const currentSession = runtime.getSession();
      if (currentSession) {
        session.set(currentSession);
        participants.set(currentSession.participants);
        sessionState.set(currentSession.status);
        isHost.set(runtime.isHost());
      }
    }
  }
  function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2, 11);
    const random2 = Math.random().toString(36).substring(2, 11);
    const random3 = Math.random().toString(36).substring(2, 11);
    return `${timestamp}-${random1}-${random2}-${random3}`;
  }
  function isValidUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  }
  function getLocalUserId() {
    return runtime?.getLocalUserId() || "";
  }
  function destroy() {
    if (qualityCheckInterval) {
      clearInterval(qualityCheckInterval);
      qualityCheckInterval = null;
    }
    if (runtime) {
      runtime.destroy();
      runtime = null;
    }
    if (interactionManager) {
      interactionManager = null;
    }
    if (mediaManager) {
      mediaManager.destroy();
      mediaManager = null;
    }
  }
  return {
    // Stores
    session,
    participants,
    connectionQuality,
    sessionState,
    isHost,
    isConnected,
    localStream,
    remoteStreams,
    // Actions
    start,
    connect,
    stop,
    send,
    on,
    // Interaction helpers
    createPoll,
    createQuiz,
    getPollResults,
    getQuizResults,
    getMessages,
    // Media controls
    toggleVideo,
    toggleAudio,
    // User info
    getLocalUserId,
    // Cleanup
    destroy
  };
}
const css$1 = {
  code: ".messaging-embed.svelte-1nwfap2{width:100%;max-width:500px;height:600px;background:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0, 0, 0, 0.15);overflow:hidden;display:flex;flex-direction:column;position:relative}.loading.svelte-1nwfap2{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#666}.spinner.svelte-1nwfap2{width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #007aff;border-radius:50%;animation:svelte-1nwfap2-spin 1s linear infinite;margin-bottom:1rem}@keyframes svelte-1nwfap2-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.connection-banner.svelte-1nwfap2{position:absolute;top:0;left:0;right:0;background:#ff9800;color:white;padding:0.5rem;text-align:center;font-size:0.875rem;z-index:1000}@media(max-width: 768px){.messaging-embed.svelte-1nwfap2{max-width:100%;height:100vh;border-radius:0}}",
  map: `{"version":3,"file":"MessagingEmbed.svelte","sources":["MessagingEmbed.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { onMount, onDestroy } from \\"svelte\\";\\nimport { useStackLiveInteraction } from \\"$lib/multiplayer/useStackLiveInteraction\\";\\nimport ConversationList from \\"./ConversationList.svelte\\";\\nimport ChatView from \\"./ChatView.svelte\\";\\nimport VideoCallPanel from \\"./VideoCallPanel.svelte\\";\\nexport let embedId = \\"messaging-app\\";\\nexport let sessionId = void 0;\\nexport let enableVideo = true;\\nexport let enableAudio = true;\\nlet currentView = \\"inbox\\";\\nlet selectedConversationId = null;\\nlet isInitialized = false;\\nconst config = {\\n  embedId,\\n  type: \\"collaborative\\",\\n  sessionId,\\n  maxParticipants: 10,\\n  video: enableVideo,\\n  audio: enableAudio,\\n  debug: true\\n};\\nconst interaction = useStackLiveInteraction(config);\\nconst {\\n  session,\\n  participants,\\n  isHost,\\n  isConnected,\\n  localStream,\\n  remoteStreams,\\n  start,\\n  connect,\\n  send,\\n  getMessages,\\n  getLocalUserId\\n} = interaction;\\nlet messages = [];\\nonMount(async () => {\\n  if (sessionId) {\\n    const success = await connect({ role: \\"player\\" });\\n    isInitialized = success;\\n  } else {\\n    const newSession = await start();\\n    isInitialized = !!newSession;\\n  }\\n  const interval = setInterval(() => {\\n    if ($session && selectedConversationId) {\\n      messages = getMessages({ limit: 100 });\\n    }\\n  }, 1e3);\\n  return () => {\\n    clearInterval(interval);\\n  };\\n});\\nonDestroy(() => {\\n  interaction.destroy();\\n});\\nfunction handleSelectConversation(conversationId) {\\n  selectedConversationId = conversationId;\\n  currentView = \\"chat\\";\\n  if ($session) {\\n    messages = getMessages({ limit: 100 });\\n  }\\n}\\nfunction handleBackToInbox() {\\n  currentView = \\"inbox\\";\\n  selectedConversationId = null;\\n}\\nfunction handleStartVideoCall() {\\n  currentView = \\"video\\";\\n}\\nfunction handleEndVideoCall() {\\n  currentView = \\"chat\\";\\n}\\nfunction handleSendMessage(text) {\\n  if (!text.trim()) return;\\n  send({\\n    type: \\"chat\\",\\n    payload: text.trim()\\n  });\\n}\\nfunction handleSendMedia(mediaUrl, mediaType, caption) {\\n  send({\\n    type: \\"media\\",\\n    payload: { caption },\\n    mediaUrl,\\n    mediaType\\n  });\\n}\\n$: conversationName = selectedConversationId ? $participants.find((p) => p.userId === selectedConversationId)?.user?.name || selectedConversationId : \\"\\";\\n<\/script>\\n\\n<div class=\\"messaging-embed\\">\\n\\t{#if !isInitialized}\\n\\t\\t<div class=\\"loading\\">\\n\\t\\t\\t<div class=\\"spinner\\"></div>\\n\\t\\t\\t<p>Connecting...</p>\\n\\t\\t</div>\\n\\t{:else if currentView === 'inbox'}\\n\\t\\t<ConversationList\\n\\t\\t\\tparticipants={$participants}\\n\\t\\t\\tsessionInfo={$session}\\n\\t\\t\\tonSelectConversation={handleSelectConversation}\\n\\t\\t/>\\n\\t{:else if currentView === 'chat'}\\n\\t\\t<ChatView\\n\\t\\t\\t{messages}\\n\\t\\t\\tconversationName={conversationName}\\n\\t\\t\\tcurrentUserId={getLocalUserId()}\\n\\t\\t\\tlocalStream={$localStream}\\n\\t\\t\\tremoteStreams={$remoteStreams}\\n\\t\\t\\tonBack={handleBackToInbox}\\n\\t\\t\\tonSendMessage={handleSendMessage}\\n\\t\\t\\tonSendMedia={handleSendMedia}\\n\\t\\t\\tonStartVideoCall={handleStartVideoCall}\\n\\t\\t/>\\n\\t{:else if currentView === 'video'}\\n\\t\\t<VideoCallPanel\\n\\t\\t\\tconversationName={conversationName}\\n\\t\\t\\tlocalStream={$localStream}\\n\\t\\t\\tremoteStreams={$remoteStreams}\\n\\t\\t\\tonEndCall={handleEndVideoCall}\\n\\t\\t/>\\n\\t{/if}\\n\\n\\t{#if !$isConnected}\\n\\t\\t<div class=\\"connection-banner\\">\\n\\t\\t\\t<span>⚠️ Reconnecting...</span>\\n\\t\\t</div>\\n\\t{/if}\\n</div>\\n\\n<style>\\n\\t.messaging-embed {\\n\\t\\twidth: 100%;\\n\\t\\tmax-width: 500px;\\n\\t\\theight: 600px;\\n\\t\\tbackground: #ffffff;\\n\\t\\tborder-radius: 12px;\\n\\t\\tbox-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);\\n\\t\\toverflow: hidden;\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tposition: relative;\\n\\t}\\n\\n\\t.loading {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\theight: 100%;\\n\\t\\tcolor: #666;\\n\\t}\\n\\n\\t.spinner {\\n\\t\\twidth: 40px;\\n\\t\\theight: 40px;\\n\\t\\tborder: 4px solid #f3f3f3;\\n\\t\\tborder-top: 4px solid #007aff;\\n\\t\\tborder-radius: 50%;\\n\\t\\tanimation: spin 1s linear infinite;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t@keyframes spin {\\n\\t\\t0% {\\n\\t\\t\\ttransform: rotate(0deg);\\n\\t\\t}\\n\\t\\t100% {\\n\\t\\t\\ttransform: rotate(360deg);\\n\\t\\t}\\n\\t}\\n\\n\\t.connection-banner {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 0;\\n\\t\\tleft: 0;\\n\\t\\tright: 0;\\n\\t\\tbackground: #ff9800;\\n\\t\\tcolor: white;\\n\\t\\tpadding: 0.5rem;\\n\\t\\ttext-align: center;\\n\\t\\tfont-size: 0.875rem;\\n\\t\\tz-index: 1000;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.messaging-embed {\\n\\t\\t\\tmax-width: 100%;\\n\\t\\t\\theight: 100vh;\\n\\t\\t\\tborder-radius: 0;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAoIC,+BAAiB,CAChB,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,KAAK,CACb,UAAU,CAAE,OAAO,CACnB,aAAa,CAAE,IAAI,CACnB,UAAU,CAAE,CAAC,CAAC,GAAG,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAC1C,QAAQ,CAAE,MAAM,CAChB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,QAAQ,CAAE,QACX,CAEA,uBAAS,CACR,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IACR,CAEA,uBAAS,CACR,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CACzB,UAAU,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CAC7B,aAAa,CAAE,GAAG,CAClB,SAAS,CAAE,mBAAI,CAAC,EAAE,CAAC,MAAM,CAAC,QAAQ,CAClC,aAAa,CAAE,IAChB,CAEA,WAAW,mBAAK,CACf,EAAG,CACF,SAAS,CAAE,OAAO,IAAI,CACvB,CACA,IAAK,CACJ,SAAS,CAAE,OAAO,MAAM,CACzB,CACD,CAEA,iCAAmB,CAClB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,UAAU,CAAE,OAAO,CACnB,KAAK,CAAE,KAAK,CACZ,OAAO,CAAE,MAAM,CACf,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,QAAQ,CACnB,OAAO,CAAE,IACV,CAEA,MAAO,YAAY,KAAK,CAAE,CACzB,+BAAiB,CAChB,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,KAAK,CACb,aAAa,CAAE,CAChB,CACD"}`
};
const MessagingEmbed = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_participants;
  let $$unsubscribe_session;
  let $$unsubscribe_localStream;
  let $$unsubscribe_remoteStreams;
  let $isConnected, $$unsubscribe_isConnected;
  let { embedId = "messaging-app" } = $$props;
  let { sessionId = void 0 } = $$props;
  let { enableVideo = true } = $$props;
  let { enableAudio = true } = $$props;
  const config = {
    embedId,
    type: "collaborative",
    sessionId,
    maxParticipants: 10,
    video: enableVideo,
    audio: enableAudio,
    debug: true
  };
  const interaction = useStackLiveInteraction(config);
  const { session, participants, isConnected, localStream, remoteStreams } = interaction;
  $$unsubscribe_session = subscribe(session, (value) => value);
  $$unsubscribe_participants = subscribe(participants, (value) => value);
  $$unsubscribe_isConnected = subscribe(isConnected, (value) => $isConnected = value);
  $$unsubscribe_localStream = subscribe(localStream, (value) => value);
  $$unsubscribe_remoteStreams = subscribe(remoteStreams, (value) => value);
  onDestroy(() => {
    interaction.destroy();
  });
  if ($$props.embedId === void 0 && $$bindings.embedId && embedId !== void 0) $$bindings.embedId(embedId);
  if ($$props.sessionId === void 0 && $$bindings.sessionId && sessionId !== void 0) $$bindings.sessionId(sessionId);
  if ($$props.enableVideo === void 0 && $$bindings.enableVideo && enableVideo !== void 0) $$bindings.enableVideo(enableVideo);
  if ($$props.enableAudio === void 0 && $$bindings.enableAudio && enableAudio !== void 0) $$bindings.enableAudio(enableAudio);
  $$result.css.add(css$1);
  $$unsubscribe_participants();
  $$unsubscribe_session();
  $$unsubscribe_localStream();
  $$unsubscribe_remoteStreams();
  $$unsubscribe_isConnected();
  return `<div class="messaging-embed svelte-1nwfap2">${`<div class="loading svelte-1nwfap2" data-svelte-h="svelte-14sorl"><div class="spinner svelte-1nwfap2"></div> <p>Connecting...</p></div>`} ${!$isConnected ? `<div class="connection-banner svelte-1nwfap2" data-svelte-h="svelte-hnkpna"><span>⚠️ Reconnecting...</span></div>` : ``} </div>`;
});
const css = {
  code: ".container.svelte-1n66lf6.svelte-1n66lf6{min-height:100vh;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:2rem}header.svelte-1n66lf6.svelte-1n66lf6{text-align:center;color:white;margin-bottom:2rem}header.svelte-1n66lf6 h1.svelte-1n66lf6{font-size:2.5rem;margin-bottom:0.5rem}header.svelte-1n66lf6 p.svelte-1n66lf6{font-size:1.25rem;opacity:0.9}main.svelte-1n66lf6.svelte-1n66lf6{max-width:1400px;margin:0 auto;display:grid;grid-template-columns:300px 1fr 300px;gap:2rem}.info-panel.svelte-1n66lf6.svelte-1n66lf6,.instructions.svelte-1n66lf6.svelte-1n66lf6{background:white;padding:1.5rem;border-radius:12px;box-shadow:0 4px 6px rgba(0, 0, 0, 0.1);height:fit-content}.info-panel.svelte-1n66lf6 h2.svelte-1n66lf6,.instructions.svelte-1n66lf6 h3.svelte-1n66lf6{margin-top:0;color:#667eea}.info-panel.svelte-1n66lf6 ul.svelte-1n66lf6{list-style:none;padding:0}.info-panel.svelte-1n66lf6 li.svelte-1n66lf6{padding:0.5rem 0;font-size:0.9375rem}.session-info.svelte-1n66lf6.svelte-1n66lf6{margin-top:1.5rem;padding:1rem;background:#f5f5f5;border-radius:8px}.session-info.svelte-1n66lf6 p.svelte-1n66lf6{margin:0.5rem 0;font-size:0.875rem}.session-info.svelte-1n66lf6 .hint.svelte-1n66lf6{color:#666;font-size:0.75rem}.session-info.svelte-1n66lf6 button.svelte-1n66lf6{width:100%;margin-top:0.75rem;padding:0.5rem;background:#007aff;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.875rem;transition:background 0.2s}.session-info.svelte-1n66lf6 button.svelte-1n66lf6:hover{background:#0051d5}.embed-container.svelte-1n66lf6.svelte-1n66lf6{display:flex;justify-content:center;align-items:flex-start}.instructions.svelte-1n66lf6 ol.svelte-1n66lf6{padding-left:1.25rem}.instructions.svelte-1n66lf6 li.svelte-1n66lf6{margin:0.75rem 0;font-size:0.9375rem;line-height:1.5}.tech-stack.svelte-1n66lf6.svelte-1n66lf6{display:flex;flex-direction:column;gap:1rem;margin-top:1rem}.tech-item.svelte-1n66lf6.svelte-1n66lf6{padding:1rem;background:#f5f5f5;border-radius:8px;border-left:4px solid #667eea}.tech-item.svelte-1n66lf6 strong.svelte-1n66lf6{display:block;color:#667eea;margin-bottom:0.25rem}.tech-item.svelte-1n66lf6 p.svelte-1n66lf6{margin:0;font-size:0.875rem;color:#666}@media(max-width: 1200px){main.svelte-1n66lf6.svelte-1n66lf6{grid-template-columns:1fr}.info-panel.svelte-1n66lf6.svelte-1n66lf6,.instructions.svelte-1n66lf6.svelte-1n66lf6{order:1}.embed-container.svelte-1n66lf6.svelte-1n66lf6{order:0}}@media(max-width: 768px){.container.svelte-1n66lf6.svelte-1n66lf6{padding:1rem}header.svelte-1n66lf6 h1.svelte-1n66lf6{font-size:1.75rem}header.svelte-1n66lf6 p.svelte-1n66lf6{font-size:1rem}}",
  map: '{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import MessagingEmbed from \\"$lib/Components/messaging/MessagingEmbed.svelte\\";\\nimport \\"../global.css\\";\\nlet sessionId;\\nif (typeof window !== \\"undefined\\") {\\n  const urlParams = new URLSearchParams(window.location.search);\\n  sessionId = urlParams.get(\\"session\\") || void 0;\\n}\\nfunction copySessionLink() {\\n  const currentSession = sessionId || \\"new-session\\";\\n  const link = `${window.location.origin}${window.location.pathname}?session=${currentSession}`;\\n  navigator.clipboard.writeText(link);\\n  alert(\\"Session link copied to clipboard!\\");\\n}\\n<\/script>\\n\\n<svelte:head>\\n\\t<title>StackLive Messaging</title>\\n\\t<meta name=\\"description\\" content=\\"iMessage-style messaging embed for StackLive\\" />\\n</svelte:head>\\n\\n<div class=\\"container\\">\\n\\t<header>\\n\\t\\t<h1>💬 StackLive Messaging</h1>\\n\\t\\t<p>iMessage-style messaging with video calls, media sharing, and reactions</p>\\n\\t</header>\\n\\n\\t<main>\\n\\t\\t<div class=\\"info-panel\\">\\n\\t\\t\\t<h2>Features</h2>\\n\\t\\t\\t<ul>\\n\\t\\t\\t\\t<li>📥 Inbox with all conversations</li>\\n\\t\\t\\t\\t<li>💬 Real-time text messaging</li>\\n\\t\\t\\t\\t<li>📷 Photo and video sharing</li>\\n\\t\\t\\t\\t<li>❤️ Message reactions</li>\\n\\t\\t\\t\\t<li>📹 FaceTime-style video calls</li>\\n\\t\\t\\t\\t<li>🔄 Cross-device sync</li>\\n\\t\\t\\t</ul>\\n\\n\\t\\t\\t{#if sessionId}\\n\\t\\t\\t\\t<div class=\\"session-info\\">\\n\\t\\t\\t\\t\\t<p><strong>Joined Session:</strong> {sessionId.substring(0, 12)}...</p>\\n\\t\\t\\t\\t\\t<button on:click={copySessionLink}>Copy Invite Link</button>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{:else}\\n\\t\\t\\t\\t<div class=\\"session-info\\">\\n\\t\\t\\t\\t\\t<p>Starting new session...</p>\\n\\t\\t\\t\\t\\t<p class=\\"hint\\">Share the session ID with others to connect</p>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"embed-container\\">\\n\\t\\t\\t<MessagingEmbed {sessionId} enableVideo={true} enableAudio={true} />\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"instructions\\">\\n\\t\\t\\t<h3>How to Use</h3>\\n\\t\\t\\t<ol>\\n\\t\\t\\t\\t<li>Open this page in multiple browser windows or devices</li>\\n\\t\\t\\t\\t<li>Copy the session ID from the inbox view</li>\\n\\t\\t\\t\\t<li>Share it with others or paste it in another window</li>\\n\\t\\t\\t\\t<li>Select a conversation to start messaging</li>\\n\\t\\t\\t\\t<li>Click the video button to start a FaceTime-style call</li>\\n\\t\\t\\t</ol>\\n\\n\\t\\t\\t<h3>Technology</h3>\\n\\t\\t\\t<div class=\\"tech-stack\\">\\n\\t\\t\\t\\t<div class=\\"tech-item\\">\\n\\t\\t\\t\\t\\t<strong>WebRTC</strong>\\n\\t\\t\\t\\t\\t<p>Peer-to-peer video/audio streaming</p>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t<div class=\\"tech-item\\">\\n\\t\\t\\t\\t\\t<strong>StackLive Runtime</strong>\\n\\t\\t\\t\\t\\t<p>Real-time message synchronization</p>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t<div class=\\"tech-item\\">\\n\\t\\t\\t\\t\\t<strong>Svelte</strong>\\n\\t\\t\\t\\t\\t<p>Reactive UI components</p>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t</main>\\n</div>\\n\\n<style>\\n\\t.container {\\n\\t\\tmin-height: 100vh;\\n\\t\\tbackground: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\\n\\t\\tpadding: 2rem;\\n\\t}\\n\\n\\theader {\\n\\t\\ttext-align: center;\\n\\t\\tcolor: white;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\theader h1 {\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tmargin-bottom: 0.5rem;\\n\\t}\\n\\n\\theader p {\\n\\t\\tfont-size: 1.25rem;\\n\\t\\topacity: 0.9;\\n\\t}\\n\\n\\tmain {\\n\\t\\tmax-width: 1400px;\\n\\t\\tmargin: 0 auto;\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: 300px 1fr 300px;\\n\\t\\tgap: 2rem;\\n\\t}\\n\\n\\t.info-panel,\\n\\t.instructions {\\n\\t\\tbackground: white;\\n\\t\\tpadding: 1.5rem;\\n\\t\\tborder-radius: 12px;\\n\\t\\tbox-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\\n\\t\\theight: fit-content;\\n\\t}\\n\\n\\t.info-panel h2,\\n\\t.instructions h3 {\\n\\t\\tmargin-top: 0;\\n\\t\\tcolor: #667eea;\\n\\t}\\n\\n\\t.info-panel ul {\\n\\t\\tlist-style: none;\\n\\t\\tpadding: 0;\\n\\t}\\n\\n\\t.info-panel li {\\n\\t\\tpadding: 0.5rem 0;\\n\\t\\tfont-size: 0.9375rem;\\n\\t}\\n\\n\\t.session-info {\\n\\t\\tmargin-top: 1.5rem;\\n\\t\\tpadding: 1rem;\\n\\t\\tbackground: #f5f5f5;\\n\\t\\tborder-radius: 8px;\\n\\t}\\n\\n\\t.session-info p {\\n\\t\\tmargin: 0.5rem 0;\\n\\t\\tfont-size: 0.875rem;\\n\\t}\\n\\n\\t.session-info .hint {\\n\\t\\tcolor: #666;\\n\\t\\tfont-size: 0.75rem;\\n\\t}\\n\\n\\t.session-info button {\\n\\t\\twidth: 100%;\\n\\t\\tmargin-top: 0.75rem;\\n\\t\\tpadding: 0.5rem;\\n\\t\\tbackground: #007aff;\\n\\t\\tcolor: white;\\n\\t\\tborder: none;\\n\\t\\tborder-radius: 8px;\\n\\t\\tcursor: pointer;\\n\\t\\tfont-size: 0.875rem;\\n\\t\\ttransition: background 0.2s;\\n\\t}\\n\\n\\t.session-info button:hover {\\n\\t\\tbackground: #0051d5;\\n\\t}\\n\\n\\t.embed-container {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: flex-start;\\n\\t}\\n\\n\\t.instructions ol {\\n\\t\\tpadding-left: 1.25rem;\\n\\t}\\n\\n\\t.instructions li {\\n\\t\\tmargin: 0.75rem 0;\\n\\t\\tfont-size: 0.9375rem;\\n\\t\\tline-height: 1.5;\\n\\t}\\n\\n\\t.tech-stack {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tgap: 1rem;\\n\\t\\tmargin-top: 1rem;\\n\\t}\\n\\n\\t.tech-item {\\n\\t\\tpadding: 1rem;\\n\\t\\tbackground: #f5f5f5;\\n\\t\\tborder-radius: 8px;\\n\\t\\tborder-left: 4px solid #667eea;\\n\\t}\\n\\n\\t.tech-item strong {\\n\\t\\tdisplay: block;\\n\\t\\tcolor: #667eea;\\n\\t\\tmargin-bottom: 0.25rem;\\n\\t}\\n\\n\\t.tech-item p {\\n\\t\\tmargin: 0;\\n\\t\\tfont-size: 0.875rem;\\n\\t\\tcolor: #666;\\n\\t}\\n\\n\\t@media (max-width: 1200px) {\\n\\t\\tmain {\\n\\t\\t\\tgrid-template-columns: 1fr;\\n\\t\\t}\\n\\n\\t\\t.info-panel,\\n\\t\\t.instructions {\\n\\t\\t\\torder: 1;\\n\\t\\t}\\n\\n\\t\\t.embed-container {\\n\\t\\t\\torder: 0;\\n\\t\\t}\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.container {\\n\\t\\t\\tpadding: 1rem;\\n\\t\\t}\\n\\n\\t\\theader h1 {\\n\\t\\t\\tfont-size: 1.75rem;\\n\\t\\t}\\n\\n\\t\\theader p {\\n\\t\\t\\tfont-size: 1rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}'
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let sessionId;
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    sessionId = urlParams.get("session") || void 0;
  }
  $$result.css.add(css);
  return `${$$result.head += `<!-- HEAD_svelte-2awqt1_START -->${$$result.title = `<title>StackLive Messaging</title>`, ""}<meta name="description" content="iMessage-style messaging embed for StackLive"><!-- HEAD_svelte-2awqt1_END -->`, ""} <div class="container svelte-1n66lf6"><header class="svelte-1n66lf6" data-svelte-h="svelte-g9xyc9"><h1 class="svelte-1n66lf6">💬 StackLive Messaging</h1> <p class="svelte-1n66lf6">iMessage-style messaging with video calls, media sharing, and reactions</p></header> <main class="svelte-1n66lf6"><div class="info-panel svelte-1n66lf6"><h2 class="svelte-1n66lf6" data-svelte-h="svelte-mhy7zl">Features</h2> <ul class="svelte-1n66lf6" data-svelte-h="svelte-syqx2x"><li class="svelte-1n66lf6">📥 Inbox with all conversations</li> <li class="svelte-1n66lf6">💬 Real-time text messaging</li> <li class="svelte-1n66lf6">📷 Photo and video sharing</li> <li class="svelte-1n66lf6">❤️ Message reactions</li> <li class="svelte-1n66lf6">📹 FaceTime-style video calls</li> <li class="svelte-1n66lf6">🔄 Cross-device sync</li></ul> ${sessionId ? `<div class="session-info svelte-1n66lf6"><p class="svelte-1n66lf6"><strong data-svelte-h="svelte-dmcr1p">Joined Session:</strong> ${escape(sessionId.substring(0, 12))}...</p> <button class="svelte-1n66lf6" data-svelte-h="svelte-wg3vu5">Copy Invite Link</button></div>` : `<div class="session-info svelte-1n66lf6" data-svelte-h="svelte-13epcaj"><p class="svelte-1n66lf6">Starting new session...</p> <p class="hint svelte-1n66lf6">Share the session ID with others to connect</p></div>`}</div> <div class="embed-container svelte-1n66lf6">${validate_component(MessagingEmbed, "MessagingEmbed").$$render(
    $$result,
    {
      sessionId,
      enableVideo: true,
      enableAudio: true
    },
    {},
    {}
  )}</div> <div class="instructions svelte-1n66lf6" data-svelte-h="svelte-1sns1n7"><h3 class="svelte-1n66lf6">How to Use</h3> <ol class="svelte-1n66lf6"><li class="svelte-1n66lf6">Open this page in multiple browser windows or devices</li> <li class="svelte-1n66lf6">Copy the session ID from the inbox view</li> <li class="svelte-1n66lf6">Share it with others or paste it in another window</li> <li class="svelte-1n66lf6">Select a conversation to start messaging</li> <li class="svelte-1n66lf6">Click the video button to start a FaceTime-style call</li></ol> <h3 class="svelte-1n66lf6">Technology</h3> <div class="tech-stack svelte-1n66lf6"><div class="tech-item svelte-1n66lf6"><strong class="svelte-1n66lf6">WebRTC</strong> <p class="svelte-1n66lf6">Peer-to-peer video/audio streaming</p></div> <div class="tech-item svelte-1n66lf6"><strong class="svelte-1n66lf6">StackLive Runtime</strong> <p class="svelte-1n66lf6">Real-time message synchronization</p></div> <div class="tech-item svelte-1n66lf6"><strong class="svelte-1n66lf6">Svelte</strong> <p class="svelte-1n66lf6">Reactive UI components</p></div></div></div></main> </div>`;
});
export {
  Page as default
};
