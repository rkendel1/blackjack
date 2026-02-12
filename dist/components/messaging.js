import { S as SvelteComponent, i as init, s as safe_not_equal, n as noop, d as detach, e as insert, g as append, h as element, j as space, k as attr, m as set_data, p as text, x as destroy_each, y as empty, u as listen, v as src_url_equal, w as run_all, z as set_input_value, b as set_style, r as binding_callbacks, A as destroy_component, B as transition_out, C as transition_in, D as group_outros, E as check_outros, F as mount_component, G as is_function, H as create_component, o as onMount, I as action_destroyer, c as create_custom_element, f as flush, a as append_styles, l as onDestroy, q as subscribe } from './chunks/index-DR_90iw3.js';
import { w as writable } from './chunks/index-DrPl72qu.js';
import { S as StackLiveMultiplayerRuntime, e as ensure_array_like } from './chunks/StackLiveMultiplayerRuntime-S5LYZDT9.js';

/**
 * InteractionManager
 * Manages interactive messages (polls, quizzes, reactions, snaps, chat, media)
 */
class InteractionManager {
    interactionCallbacks = new Map();
    pollResponses = new Map();
    quizResponses = new Map();
    snapMessages = new Map();
    chatMessages = new Map();
    mediaMessages = new Map();
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
        // Store responses based on type with validation
        if (type === 'poll' && this.isPollResponse(payload)) {
            this.handlePollResponse(payload);
        }
        else if (type === 'quiz' && this.isQuizResponse(payload)) {
            this.handleQuizResponse(payload);
        }
        else if (type === 'snap' && this.isSnapMessage(payload)) {
            this.handleSnapMessage(payload);
        }
        else if (type === 'chat' && this.isChatMessage(payload)) {
            this.handleChatMessage(payload);
        }
        else if (type === 'media' && this.isMediaMessage(payload)) {
            this.handleMediaMessage(payload);
        }
        // Notify registered callbacks
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
        this.log('Poll created', poll);
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
        this.log('Quiz created', quiz);
        return quiz;
    }
    /**
     * Handle poll response
     */
    handlePollResponse(response) {
        const responses = this.pollResponses.get(response.pollId);
        if (responses) {
            // Remove existing response from same user
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
            // Only allow one response per user per quiz
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
        // Combine and sort messages by timestamp
        const allMessages = [...chats, ...media].sort((a, b) => a.timestamp - b.timestamp);
        // Apply limit if specified (return last N messages)
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
        return (typeof payload === 'object' &&
            payload !== null &&
            'pollId' in payload &&
            'userId' in payload &&
            'answers' in payload);
    }
    isQuizResponse(payload) {
        return (typeof payload === 'object' &&
            payload !== null &&
            'quizId' in payload &&
            'userId' in payload &&
            'answer' in payload);
    }
    isSnapMessage(payload) {
        return (typeof payload === 'object' &&
            payload !== null &&
            'id' in payload &&
            'type' in payload &&
            'data' in payload);
    }
    isChatMessage(payload) {
        return (typeof payload === 'object' &&
            payload !== null &&
            'sessionId' in payload &&
            'fromUserId' in payload &&
            'payload' in payload &&
            typeof payload.payload === 'string');
    }
    isMediaMessage(payload) {
        return (typeof payload === 'object' &&
            payload !== null &&
            'sessionId' in payload &&
            'fromUserId' in payload &&
            'mediaUrl' in payload &&
            'mediaType' in payload);
    }
}

/**
 * MediaStreamManager
 * Manages video and audio streams for realtime interactions
 */
class MediaStreamManager {
    localStream = null;
    remoteStreams = new Map();
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
            this.log('Requesting media permissions...', config);
            const constraints = {
                video: config.video ?? false,
                audio: config.audio ?? false
            };
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.log('Local stream initialized', {
                videoTracks: this.localStream.getVideoTracks().length,
                audioTracks: this.localStream.getAudioTracks().length
            });
            return this.localStream;
        }
        catch (error) {
            console.error('Failed to initialize local stream:', error);
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
        // Notify listeners
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
            this.log(`Video ${enabled ? 'enabled' : 'disabled'}`);
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
            this.log(`Audio ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    /**
     * Stop local stream
     */
    stopLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
            this.localStream = null;
            this.log('Local stream stopped');
        }
    }
    /**
     * Cleanup all streams
     */
    destroy() {
        this.stopLocalStream();
        this.remoteStreams.clear();
        this.streamCallbacks = [];
        this.log('MediaStreamManager destroyed');
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

/**
 * useStackLiveInteraction
 * Universal realtime embed interaction hook
 * Provides bi-directional communication for embeds (games, classrooms, polls, etc.)
 */
function useStackLiveInteraction(config) {
    let runtime = null;
    let interactionManager = null;
    let mediaManager = null;
    let qualityCheckInterval = null;
    // Reactive stores
    const session = writable(null);
    const participants = writable([]);
    const connectionQuality = writable({
        latency: 0,
        jitter: 0,
        packetLoss: 0,
        quality: 'excellent'
    });
    const sessionState = writable('IDLE');
    const isHost = writable(false);
    const isConnected = writable(false);
    const localStream = writable(null);
    const remoteStreams = writable(new Map());
    /**
     * Initialize managers
     */
    function initialize() {
        if (interactionManager || mediaManager) {
            return;
        }
        interactionManager = new InteractionManager(config.debug);
        mediaManager = new MediaStreamManager(config.debug);
        // Setup media stream callbacks
        mediaManager.onRemoteStream((userId, stream) => {
            remoteStreams.update((streams) => {
                const newStreams = new Map(streams);
                newStreams.set(userId, stream);
                return newStreams;
            });
        });
    }
    /**
     * Start a new session as host/publisher
     */
    async function start() {
        initialize();
        // Initialize runtime
        runtime = new StackLiveMultiplayerRuntime({
            embedId: config.embedId,
            type: config.type,
            maxPlayers: config.maxParticipants ?? 10,
            video: !!config.video,
            audio: !!config.audio,
            debug: config.debug
        });
        // Setup event listeners
        setupEventListeners();
        // Initialize media if needed
        if (config.video || config.audio) {
            if (mediaManager) {
                const stream = await mediaManager.initializeLocalStream({
                    video: config.video,
                    audio: config.audio
                });
                localStream.set(stream);
            }
        }
        // Create session
        try {
            const newSession = await runtime.createSession();
            session.set(newSession);
            isHost.set(true);
            sessionState.set(newSession.status);
            participants.set(newSession.participants);
            isConnected.set(true);
            return newSession;
        }
        catch (error) {
            console.error('Failed to start session:', error);
            return null;
        }
    }
    /**
     * Connect to existing session as participant/viewer
     */
    async function connect(options) {
        if (!config.sessionId) {
            console.error('Session ID required to connect');
            return false;
        }
        initialize();
        // Initialize runtime
        runtime = new StackLiveMultiplayerRuntime({
            embedId: config.embedId,
            type: config.type,
            maxPlayers: config.maxParticipants ?? 10,
            video: !!config.video,
            audio: !!config.audio,
            debug: config.debug
        });
        // Setup event listeners
        setupEventListeners();
        // Initialize media if needed
        if (config.video || config.audio) {
            if (mediaManager) {
                const stream = await mediaManager.initializeLocalStream({
                    video: config.video,
                    audio: config.audio
                });
                localStream.set(stream);
            }
        }
        // Join session
        try {
            const participant = await runtime.joinSession(config.sessionId);
            if (participant) {
                updateSession();
                isHost.set(false);
                isConnected.set(true);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Failed to connect to session:', error);
            return false;
        }
    }
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        if (!runtime)
            return;
        runtime.on('playerJoined', () => updateSession());
        runtime.on('playerLeft', () => updateSession());
        runtime.on('connectionLost', () => isConnected.set(false));
        runtime.on('reconnected', () => isConnected.set(true));
        runtime.on('gameStart', () => updateSession());
        runtime.on('gameEnd', () => {
            session.set(null);
            participants.set([]);
            sessionState.set('ENDED');
        });
        // Handle state sync messages
        runtime.onStateSync((state) => {
            // Notify state listeners
        });
        // Update connection quality periodically
        if (qualityCheckInterval) {
            clearInterval(qualityCheckInterval);
        }
        qualityCheckInterval = setInterval(() => {
            if (runtime) {
                connectionQuality.set(runtime.getConnectionQuality());
            }
        }, 2000);
    }
    /**
     * Stop session
     */
    function stop() {
        if (runtime) {
            runtime.leaveSession();
        }
        if (mediaManager) {
            mediaManager.destroy();
        }
        session.set(null);
        participants.set([]);
        sessionState.set('ENDED');
        isHost.set(false);
        isConnected.set(false);
        localStream.set(null);
        remoteStreams.set(new Map());
    }
    /**
     * Send message
     */
    function send(message) {
        if (!runtime)
            return;
        if (message.type === 'state') {
            runtime.sendState(message.payload);
        }
        else if (message.type === 'chat') {
            // Handle chat message
            const currentSession = runtime.getSession();
            const chatMessage = {
                id: generateId(),
                sessionId: currentSession?.id || '',
                fromUserId: runtime.getLocalUserId(),
                payload: message.payload,
                timestamp: Date.now()
            };
            interactionManager?.handleInteraction('chat', chatMessage, chatMessage.fromUserId);
            runtime.sendInput({
                type: 'interaction',
                interactionType: 'chat',
                payload: chatMessage
            });
        }
        else if (message.type === 'media') {
            // Validate media URL
            if (!message.mediaUrl || !isValidUrl(message.mediaUrl)) {
                console.error('Invalid media URL provided');
                return;
            }
            // Handle media message
            const currentSession = runtime.getSession();
            const mediaMessage = {
                id: generateId(),
                sessionId: currentSession?.id || '',
                fromUserId: runtime.getLocalUserId(),
                payload: message.payload,
                mediaUrl: message.mediaUrl,
                mediaType: message.mediaType || '',
                timestamp: Date.now()
            };
            interactionManager?.handleInteraction('media', mediaMessage, mediaMessage.fromUserId);
            runtime.sendInput({
                type: 'interaction',
                interactionType: 'media',
                payload: mediaMessage
            });
        }
        else {
            runtime.sendInput({
                type: 'interaction',
                interactionType: message.type,
                payload: message.payload
            });
        }
    }
    /**
     * Register event listeners
     */
    function on(event, callback) {
        if (event === 'state') {
            runtime?.onStateSync(callback);
        }
        else if (event === 'interaction') {
            interactionManager?.on('poll', callback);
            interactionManager?.on('quiz', callback);
            interactionManager?.on('reaction', callback);
            interactionManager?.on('snap', callback);
            interactionManager?.on('chat', callback);
            interactionManager?.on('media', callback);
        }
        else if (event === 'join') {
            runtime?.on('playerJoined', callback);
        }
        else if (event === 'leave') {
            runtime?.on('playerLeft', callback);
        }
        else if (event === 'reconnect') {
            runtime?.on('reconnected', callback);
        }
    }
    /**
     * Create poll
     */
    function createPoll(question, options, allowMultiple = false, expiresAt) {
        if (!interactionManager) {
            throw new Error('Interaction manager not initialized. Call start() or connect() first.');
        }
        const poll = interactionManager.createPoll(question, options, allowMultiple, expiresAt);
        send({ type: 'poll', payload: poll });
        return poll;
    }
    /**
     * Create quiz
     */
    function createQuiz(question, options, correctAnswer, timeLimit, points) {
        if (!interactionManager) {
            throw new Error('Interaction manager not initialized. Call start() or connect() first.');
        }
        const quiz = interactionManager.createQuiz(question, options, correctAnswer, timeLimit, points);
        send({ type: 'quiz', payload: quiz });
        return quiz;
    }
    /**
     * Get poll results
     */
    function getPollResults(pollId) {
        return interactionManager?.getPollResults(pollId) || [];
    }
    /**
     * Get quiz results
     */
    function getQuizResults(quizId) {
        return interactionManager?.getQuizResults(quizId) || [];
    }
    /**
     * Get messages (chat + media)
     */
    function getMessages(options) {
        const currentSession = runtime?.getSession();
        if (!currentSession || !interactionManager) {
            return [];
        }
        // Validate limit parameter
        let validatedOptions = options;
        if (options?.limit !== undefined) {
            const limit = Math.floor(options.limit);
            if (limit < 0 || limit > 1000) {
                console.warn('Message limit must be between 0 and 1000, using default');
                validatedOptions = undefined;
            }
            else {
                validatedOptions = { limit };
            }
        }
        return interactionManager.getMessages(currentSession.id, validatedOptions);
    }
    /**
     * Toggle video
     */
    function toggleVideo(enabled) {
        mediaManager?.toggleVideo(enabled);
    }
    /**
     * Toggle audio
     */
    function toggleAudio(enabled) {
        mediaManager?.toggleAudio(enabled);
    }
    /**
     * Update session data
     */
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
    /**
     * Generate unique ID using crypto.randomUUID if available, otherwise fallback
     * Note: Fallback method uses timestamp + random for uniqueness but is not cryptographically secure
     */
    function generateId() {
        // Use crypto.randomUUID if available (browser/Node.js 15+)
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback: Use timestamp + multiple random components for better uniqueness
        // This is not cryptographically secure but provides reasonable uniqueness for non-critical contexts
        const timestamp = Date.now().toString(36);
        const random1 = Math.random().toString(36).substring(2, 11);
        const random2 = Math.random().toString(36).substring(2, 11);
        const random3 = Math.random().toString(36).substring(2, 11);
        return `${timestamp}-${random1}-${random2}-${random3}`;
    }
    /**
     * Validate URL format
     */
    function isValidUrl(url) {
        try {
            const parsedUrl = new URL(url);
            // Only allow http and https protocols
            return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
        }
        catch {
            return false;
        }
    }
    /**
     * Get local user ID
     */
    function getLocalUserId() {
        return runtime?.getLocalUserId() || '';
    }
    /**
     * Cleanup
     */
    function destroy() {
        // Clear interval
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

/* src/lib/Components/messaging/ConversationList.svelte generated by Svelte v4.2.20 */

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i];
	return child_ctx;
}

// (21:3) {#if sessionInfo}
function create_if_block_3$2(ctx) {
	let span0;
	let t1;
	let span1;
	let t2_value = /*sessionInfo*/ ctx[0].id.substring(0, 8) + "";
	let t2;
	let t3;

	return {
		c() {
			span0 = element("span");
			span0.textContent = "Session:";
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			t3 = text("...");
			attr(span0, "class", "label svelte-1iikghj");
			attr(span1, "class", "id svelte-1iikghj");
		},
		m(target, anchor) {
			insert(target, span0, anchor);
			insert(target, t1, anchor);
			insert(target, span1, anchor);
			append(span1, t2);
			append(span1, t3);
		},
		p(ctx, dirty) {
			if (dirty & /*sessionInfo*/ 1 && t2_value !== (t2_value = /*sessionInfo*/ ctx[0].id.substring(0, 8) + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) {
				detach(span0);
				detach(t1);
				detach(span1);
			}
		}
	};
}

// (39:2) {:else}
function create_else_block$3(ctx) {
	let each_1_anchor;
	let each_value = ensure_array_like(/*conversations*/ ctx[2]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(target, anchor);
				}
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*onSelectConversation, conversations*/ 6) {
				each_value = ensure_array_like(/*conversations*/ ctx[2]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(each_1_anchor);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

// (33:2) {#if conversations.length === 0}
function create_if_block$4(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			div.innerHTML = `<p class="svelte-1iikghj">📭</p> <p class="svelte-1iikghj">No conversations yet</p> <p class="hint svelte-1iikghj">Share your session ID to connect with others</p>`;
			attr(div, "class", "empty-state svelte-1iikghj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (48:6) {:else}
function create_else_block_1$1(ctx) {
	let div;
	let t_value = /*conversation*/ ctx[5].name.charAt(0).toUpperCase() + "";
	let t;

	return {
		c() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", "avatar-placeholder svelte-1iikghj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*conversations*/ 4 && t_value !== (t_value = /*conversation*/ ctx[5].name.charAt(0).toUpperCase() + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (46:6) {#if conversation.avatar}
function create_if_block_2$2(ctx) {
	let img;
	let img_src_value;
	let img_alt_value;

	return {
		c() {
			img = element("img");
			if (!src_url_equal(img.src, img_src_value = /*conversation*/ ctx[5].avatar)) attr(img, "src", img_src_value);
			attr(img, "alt", img_alt_value = /*conversation*/ ctx[5].name);
			attr(img, "class", "svelte-1iikghj");
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*conversations*/ 4 && !src_url_equal(img.src, img_src_value = /*conversation*/ ctx[5].avatar)) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*conversations*/ 4 && img_alt_value !== (img_alt_value = /*conversation*/ ctx[5].name)) {
				attr(img, "alt", img_alt_value);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(img);
			}
		}
	};
}

// (53:6) {#if conversation.online}
function create_if_block_1$2(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			attr(div, "class", "online-indicator svelte-1iikghj");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (40:3) {#each conversations as conversation}
function create_each_block$3(ctx) {
	let button;
	let div0;
	let t0;
	let t1;
	let div3;
	let div1;
	let span0;
	let t2_value = /*conversation*/ ctx[5].name + "";
	let t2;
	let t3;
	let span1;
	let t5;
	let div2;
	let t6_value = /*conversation*/ ctx[5].lastMessage + "";
	let t6;
	let t7;
	let mounted;
	let dispose;

	function select_block_type_1(ctx, dirty) {
		if (/*conversation*/ ctx[5].avatar) return create_if_block_2$2;
		return create_else_block_1$1;
	}

	let current_block_type = select_block_type_1(ctx);
	let if_block0 = current_block_type(ctx);
	let if_block1 = /*conversation*/ ctx[5].online && create_if_block_1$2();

	function click_handler() {
		return /*click_handler*/ ctx[4](/*conversation*/ ctx[5]);
	}

	return {
		c() {
			button = element("button");
			div0 = element("div");
			if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			div3 = element("div");
			div1 = element("div");
			span0 = element("span");
			t2 = text(t2_value);
			t3 = space();
			span1 = element("span");
			span1.textContent = "Now";
			t5 = space();
			div2 = element("div");
			t6 = text(t6_value);
			t7 = space();
			attr(div0, "class", "avatar svelte-1iikghj");
			attr(span0, "class", "name svelte-1iikghj");
			attr(span1, "class", "time svelte-1iikghj");
			attr(div1, "class", "top-row svelte-1iikghj");
			attr(div2, "class", "preview svelte-1iikghj");
			attr(div3, "class", "conversation-info svelte-1iikghj");
			attr(button, "class", "conversation-item svelte-1iikghj");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, div0);
			if_block0.m(div0, null);
			append(div0, t0);
			if (if_block1) if_block1.m(div0, null);
			append(button, t1);
			append(button, div3);
			append(div3, div1);
			append(div1, span0);
			append(span0, t2);
			append(div1, t3);
			append(div1, span1);
			append(div3, t5);
			append(div3, div2);
			append(div2, t6);
			append(button, t7);

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(div0, t0);
				}
			}

			if (/*conversation*/ ctx[5].online) {
				if (if_block1) ; else {
					if_block1 = create_if_block_1$2();
					if_block1.c();
					if_block1.m(div0, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty & /*conversations*/ 4 && t2_value !== (t2_value = /*conversation*/ ctx[5].name + "")) set_data(t2, t2_value);
			if (dirty & /*conversations*/ 4 && t6_value !== (t6_value = /*conversation*/ ctx[5].lastMessage + "")) set_data(t6, t6_value);
		},
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$5(ctx) {
	let div4;
	let div1;
	let h2;
	let t1;
	let div0;
	let t2;
	let div2;
	let t3;
	let div3;
	let if_block0 = /*sessionInfo*/ ctx[0] && create_if_block_3$2(ctx);

	function select_block_type(ctx, dirty) {
		if (/*conversations*/ ctx[2].length === 0) return create_if_block$4;
		return create_else_block$3;
	}

	let current_block_type = select_block_type(ctx);
	let if_block1 = current_block_type(ctx);

	return {
		c() {
			div4 = element("div");
			div1 = element("div");
			h2 = element("h2");
			h2.textContent = "Messages";
			t1 = space();
			div0 = element("div");
			if (if_block0) if_block0.c();
			t2 = space();
			div2 = element("div");
			div2.innerHTML = `<input type="text" placeholder="🔍 Search conversations..." class="svelte-1iikghj"/>`;
			t3 = space();
			div3 = element("div");
			if_block1.c();
			attr(h2, "class", "svelte-1iikghj");
			attr(div0, "class", "session-id svelte-1iikghj");
			attr(div1, "class", "header svelte-1iikghj");
			attr(div2, "class", "search-bar svelte-1iikghj");
			attr(div3, "class", "conversations svelte-1iikghj");
			attr(div4, "class", "conversation-list svelte-1iikghj");
		},
		m(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div1);
			append(div1, h2);
			append(div1, t1);
			append(div1, div0);
			if (if_block0) if_block0.m(div0, null);
			append(div4, t2);
			append(div4, div2);
			append(div4, t3);
			append(div4, div3);
			if_block1.m(div3, null);
		},
		p(ctx, [dirty]) {
			if (/*sessionInfo*/ ctx[0]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_3$2(ctx);
					if_block0.c();
					if_block0.m(div0, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
				if_block1.p(ctx, dirty);
			} else {
				if_block1.d(1);
				if_block1 = current_block_type(ctx);

				if (if_block1) {
					if_block1.c();
					if_block1.m(div3, null);
				}
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div4);
			}

			if (if_block0) if_block0.d();
			if_block1.d();
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let conversations;
	let { participants } = $$props;
	let { sessionInfo } = $$props;
	let { onSelectConversation } = $$props;
	const click_handler = conversation => onSelectConversation(conversation.userId);

	$$self.$$set = $$props => {
		if ('participants' in $$props) $$invalidate(3, participants = $$props.participants);
		if ('sessionInfo' in $$props) $$invalidate(0, sessionInfo = $$props.sessionInfo);
		if ('onSelectConversation' in $$props) $$invalidate(1, onSelectConversation = $$props.onSelectConversation);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*participants, sessionInfo*/ 9) {
			// Get list of conversations (other participants)
			$$invalidate(2, conversations = participants.filter(p => p.userId !== sessionInfo?.hostId).map(p => ({
				userId: p.userId,
				name: p.user?.name || p.userId,
				avatar: p.user?.avatar || '',
				online: p.connectionStatus === 'connected',
				lastMessage: 'Start a conversation',
				timestamp: Date.now()
			})));
		}
	};

	return [sessionInfo, onSelectConversation, conversations, participants, click_handler];
}

class ConversationList extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
			participants: 3,
			sessionInfo: 0,
			onSelectConversation: 1
		});
	}
}

/* src/lib/Components/messaging/MessageBubble.svelte generated by Svelte v4.2.20 */

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	return child_ctx;
}

function get_if_ctx(ctx) {
	const child_ctx = ctx.slice();
	const constants_0 = getMediaType(/*message*/ child_ctx[0].mediaType);
	child_ctx[10] = constants_0;
	return child_ctx;
}

// (50:2) {:else}
function create_else_block_1(ctx) {
	let div;
	let t_value = /*message*/ ctx[0].payload + "";
	let t;

	return {
		c() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", "text-message svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*message*/ 1 && t_value !== (t_value = /*message*/ ctx[0].payload + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (30:2) {#if isMediaMessage(message)}
function create_if_block_2$1(ctx) {
	let div;
	let t;

	function select_block_type_1(ctx, dirty) {
		if (/*type*/ ctx[10] === 'image') return create_if_block_4$1;
		if (/*type*/ ctx[10] === 'video') return create_if_block_5;
		if (/*type*/ ctx[10] === 'audio') return create_if_block_6;
		return create_else_block$2;
	}

	let current_block_type = select_block_type_1(ctx);
	let if_block0 = current_block_type(ctx);
	let if_block1 = /*message*/ ctx[0].payload?.caption && create_if_block_3$1(ctx);

	return {
		c() {
			div = element("div");
			if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			attr(div, "class", "media-message svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_block0.m(div, null);
			append(div, t);
			if (if_block1) if_block1.m(div, null);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(div, t);
				}
			}

			if (/*message*/ ctx[0].payload?.caption) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_3$1(ctx);
					if_block1.c();
					if_block1.m(div, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if_block0.d();
			if (if_block1) if_block1.d();
		}
	};
}

// (41:4) {:else}
function create_else_block$2(ctx) {
	let a;
	let t0;
	let t1_value = /*message*/ ctx[0].mediaType + "";
	let t1;
	let a_href_value;

	return {
		c() {
			a = element("a");
			t0 = text("📎 ");
			t1 = text(t1_value);
			attr(a, "href", a_href_value = /*message*/ ctx[0].mediaUrl);
			attr(a, "target", "_blank");
			attr(a, "rel", "noopener noreferrer");
			attr(a, "class", "svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, a, anchor);
			append(a, t0);
			append(a, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*message*/ 1 && t1_value !== (t1_value = /*message*/ ctx[0].mediaType + "")) set_data(t1, t1_value);

			if (dirty & /*message*/ 1 && a_href_value !== (a_href_value = /*message*/ ctx[0].mediaUrl)) {
				attr(a, "href", a_href_value);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(a);
			}
		}
	};
}

// (39:31) 
function create_if_block_6(ctx) {
	let audio;
	let audio_src_value;

	return {
		c() {
			audio = element("audio");
			if (!src_url_equal(audio.src, audio_src_value = /*message*/ ctx[0].mediaUrl)) attr(audio, "src", audio_src_value);
			audio.controls = true;
			attr(audio, "class", "svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, audio, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*message*/ 1 && !src_url_equal(audio.src, audio_src_value = /*message*/ ctx[0].mediaUrl)) {
				attr(audio, "src", audio_src_value);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(audio);
			}
		}
	};
}

// (35:31) 
function create_if_block_5(ctx) {
	let video;
	let track;
	let video_src_value;

	return {
		c() {
			video = element("video");
			track = element("track");
			attr(track, "kind", "captions");
			if (!src_url_equal(video.src, video_src_value = /*message*/ ctx[0].mediaUrl)) attr(video, "src", video_src_value);
			video.controls = true;
			attr(video, "aria-label", "Shared video message");
			attr(video, "class", "svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, video, anchor);
			append(video, track);
		},
		p(ctx, dirty) {
			if (dirty & /*message*/ 1 && !src_url_equal(video.src, video_src_value = /*message*/ ctx[0].mediaUrl)) {
				attr(video, "src", video_src_value);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(video);
			}
		}
	};
}

// (33:4) {#if type === 'image'}
function create_if_block_4$1(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			if (!src_url_equal(img.src, img_src_value = /*message*/ ctx[0].mediaUrl)) attr(img, "src", img_src_value);
			attr(img, "alt", "Shared media");
			attr(img, "class", "svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*message*/ 1 && !src_url_equal(img.src, img_src_value = /*message*/ ctx[0].mediaUrl)) {
				attr(img, "src", img_src_value);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(img);
			}
		}
	};
}

// (46:4) {#if message.payload?.caption}
function create_if_block_3$1(ctx) {
	let div;
	let t_value = /*message*/ ctx[0].payload.caption + "";
	let t;

	return {
		c() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", "caption svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*message*/ 1 && t_value !== (t_value = /*message*/ ctx[0].payload.caption + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (56:3) {#if isSent}
function create_if_block_1$1(ctx) {
	let span;

	return {
		c() {
			span = element("span");
			span.textContent = "✓";
			attr(span, "class", "status");
		},
		m(target, anchor) {
			insert(target, span, anchor);
		},
		d(detaching) {
			if (detaching) {
				detach(span);
			}
		}
	};
}

// (70:1) {#if showReactions}
function create_if_block$3(ctx) {
	let div;
	let each_value = ensure_array_like(/*reactions*/ ctx[4]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	return {
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "class", "reaction-picker svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div, null);
				}
			}
		},
		p(ctx, dirty) {
			if (dirty & /*onReact, reactions, showReactions*/ 28) {
				each_value = ensure_array_like(/*reactions*/ ctx[4]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

// (72:3) {#each reactions as reaction}
function create_each_block$2(ctx) {
	let button;
	let mounted;
	let dispose;

	function click_handler_1() {
		return /*click_handler_1*/ ctx[6](/*reaction*/ ctx[7]);
	}

	return {
		c() {
			button = element("button");
			button.textContent = `${/*reaction*/ ctx[7]} `;
			attr(button, "class", "reaction-option svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!mounted) {
				dispose = listen(button, "click", click_handler_1);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			dispose();
		}
	};
}

function create_fragment$4(ctx) {
	let div2;
	let div1;
	let show_if;
	let t0;
	let div0;
	let span;
	let t1_value = formatTime(/*message*/ ctx[0].timestamp) + "";
	let t1;
	let t2;
	let t3;
	let button;
	let t5;
	let div2_class_value;
	let mounted;
	let dispose;

	function select_block_type(ctx, dirty) {
		if (dirty & /*message*/ 1) show_if = null;
		if (show_if == null) show_if = !!isMediaMessage(/*message*/ ctx[0]);
		if (show_if) return create_if_block_2$1;
		return create_else_block_1;
	}

	function select_block_ctx(ctx, type) {
		if (type === create_if_block_2$1) return get_if_ctx(ctx);
		return ctx;
	}

	let current_block_type = select_block_type(ctx, -1);
	let if_block0 = current_block_type(select_block_ctx(ctx, current_block_type));
	let if_block1 = /*isSent*/ ctx[1] && create_if_block_1$1();
	let if_block2 = /*showReactions*/ ctx[3] && create_if_block$3(ctx);

	return {
		c() {
			div2 = element("div");
			div1 = element("div");
			if_block0.c();
			t0 = space();
			div0 = element("div");
			span = element("span");
			t1 = text(t1_value);
			t2 = space();
			if (if_block1) if_block1.c();
			t3 = space();
			button = element("button");
			button.textContent = "❤️";
			t5 = space();
			if (if_block2) if_block2.c();
			attr(span, "class", "time");
			attr(div0, "class", "metadata svelte-1ssegon");
			attr(div1, "class", "bubble svelte-1ssegon");
			attr(button, "class", "reaction-trigger svelte-1ssegon");
			attr(button, "title", "React to message");
			attr(div2, "class", div2_class_value = "message-bubble " + (/*isSent*/ ctx[1] ? 'sent' : 'received') + " svelte-1ssegon");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div1);
			if_block0.m(div1, null);
			append(div1, t0);
			append(div1, div0);
			append(div0, span);
			append(span, t1);
			append(div0, t2);
			if (if_block1) if_block1.m(div0, null);
			append(div2, t3);
			append(div2, button);
			append(div2, t5);
			if (if_block2) if_block2.m(div2, null);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[5]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block0) {
				if_block0.p(select_block_ctx(ctx, current_block_type), dirty);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(select_block_ctx(ctx, current_block_type));

				if (if_block0) {
					if_block0.c();
					if_block0.m(div1, t0);
				}
			}

			if (dirty & /*message*/ 1 && t1_value !== (t1_value = formatTime(/*message*/ ctx[0].timestamp) + "")) set_data(t1, t1_value);

			if (/*isSent*/ ctx[1]) {
				if (if_block1) ; else {
					if_block1 = create_if_block_1$1();
					if_block1.c();
					if_block1.m(div0, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*showReactions*/ ctx[3]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block$3(ctx);
					if_block2.c();
					if_block2.m(div2, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (dirty & /*isSent*/ 2 && div2_class_value !== (div2_class_value = "message-bubble " + (/*isSent*/ ctx[1] ? 'sent' : 'received') + " svelte-1ssegon")) {
				attr(div2, "class", div2_class_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			mounted = false;
			dispose();
		}
	};
}

function isMediaMessage(msg) {
	return 'mediaUrl' in msg;
}

function formatTime(timestamp) {
	const date = new Date(timestamp);

	return date.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
}

function getMediaType(mediaType) {
	if (mediaType.startsWith('image/')) return 'image';
	if (mediaType.startsWith('video/')) return 'video';
	if (mediaType.startsWith('audio/')) return 'audio';
	return 'file';
}

function instance$4($$self, $$props, $$invalidate) {
	let { message } = $$props;
	let { isSent } = $$props;
	let { onReact } = $$props;
	let showReactions = false;
	const reactions = ['👍', '❤️', '😂', '😮', '😢', '👏'];
	const click_handler = () => $$invalidate(3, showReactions = !showReactions);

	const click_handler_1 = reaction => {
		onReact(reaction);
		$$invalidate(3, showReactions = false);
	};

	$$self.$$set = $$props => {
		if ('message' in $$props) $$invalidate(0, message = $$props.message);
		if ('isSent' in $$props) $$invalidate(1, isSent = $$props.isSent);
		if ('onReact' in $$props) $$invalidate(2, onReact = $$props.onReact);
	};

	return [
		message,
		isSent,
		onReact,
		showReactions,
		reactions,
		click_handler,
		click_handler_1
	];
}

class MessageBubble extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { message: 0, isSent: 1, onReact: 2 });
	}
}

/* src/lib/Components/messaging/MessageInput.svelte generated by Svelte v4.2.20 */

function create_fragment$3(ctx) {
	let div1;
	let button0;
	let t1;
	let input0;
	let t2;
	let div0;
	let input1;
	let t3;
	let button1;
	let span1;
	let button1_disabled_value;
	let mounted;
	let dispose;

	return {
		c() {
			div1 = element("div");
			button0 = element("button");
			button0.innerHTML = `<span>📷</span>`;
			t1 = space();
			input0 = element("input");
			t2 = space();
			div0 = element("div");
			input1 = element("input");
			t3 = space();
			button1 = element("button");
			span1 = element("span");
			span1.textContent = "↑";
			attr(button0, "class", "media-button svelte-2vcjkv");
			attr(button0, "title", "Send photo or video");
			attr(input0, "type", "file");
			attr(input0, "accept", "image/*,video/*,audio/*");
			set_style(input0, "display", "none");
			attr(input1, "type", "text");
			attr(input1, "placeholder", "iMessage");
			attr(input1, "class", "text-input svelte-2vcjkv");
			attr(div0, "class", "input-wrapper svelte-2vcjkv");
			attr(button1, "class", "send-button svelte-2vcjkv");
			button1.disabled = button1_disabled_value = !/*inputText*/ ctx[0].trim();
			attr(button1, "title", "Send message");
			attr(div1, "class", "message-input svelte-2vcjkv");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, button0);
			append(div1, t1);
			append(div1, input0);
			/*input0_binding*/ ctx[8](input0);
			append(div1, t2);
			append(div1, div0);
			append(div0, input1);
			set_input_value(input1, /*inputText*/ ctx[0]);
			append(div1, t3);
			append(div1, button1);
			append(button1, span1);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*handleMediaClick*/ ctx[4]),
					listen(input0, "change", /*handleFileSelect*/ ctx[5]),
					listen(input1, "input", /*input1_input_handler*/ ctx[9]),
					listen(input1, "keypress", /*handleKeyPress*/ ctx[3]),
					listen(button1, "click", /*handleSend*/ ctx[2])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*inputText*/ 1 && input1.value !== /*inputText*/ ctx[0]) {
				set_input_value(input1, /*inputText*/ ctx[0]);
			}

			if (dirty & /*inputText*/ 1 && button1_disabled_value !== (button1_disabled_value = !/*inputText*/ ctx[0].trim())) {
				button1.disabled = button1_disabled_value;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			/*input0_binding*/ ctx[8](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { onSendMessage } = $$props;
	let { onSendMedia } = $$props;
	let inputText = '';
	let fileInput;

	function handleSend() {
		if (inputText.trim()) {
			onSendMessage(inputText);
			$$invalidate(0, inputText = '');
		}
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	function handleMediaClick() {
		fileInput.click();
	}

	async function handleFileSelect(event) {
		const target = event.target;
		const file = target.files?.[0];
		if (!file) return;

		// In a real implementation, you would upload the file to a server
		// and get back a URL. For demo purposes, we'll use a data URL
		const reader = new FileReader();

		reader.onload = e => {
			const dataUrl = e.target?.result;
			onSendMedia(dataUrl, file.type, inputText || undefined);
			$$invalidate(0, inputText = '');
			target.value = ''; // Reset file input
		};

		reader.readAsDataURL(file);
	}

	function input0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			fileInput = $$value;
			$$invalidate(1, fileInput);
		});
	}

	function input1_input_handler() {
		inputText = this.value;
		$$invalidate(0, inputText);
	}

	$$self.$$set = $$props => {
		if ('onSendMessage' in $$props) $$invalidate(6, onSendMessage = $$props.onSendMessage);
		if ('onSendMedia' in $$props) $$invalidate(7, onSendMedia = $$props.onSendMedia);
	};

	return [
		inputText,
		fileInput,
		handleSend,
		handleKeyPress,
		handleMediaClick,
		handleFileSelect,
		onSendMessage,
		onSendMedia,
		input0_binding,
		input1_input_handler
	];
}

class MessageInput extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { onSendMessage: 6, onSendMedia: 7 });
	}
}

/* src/lib/Components/messaging/ChatView.svelte generated by Svelte v4.2.20 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i];
	return child_ctx;
}

// (49:2) {:else}
function create_else_block$1(ctx) {
	let each_1_anchor;
	let current;
	let each_value = ensure_array_like(/*messages*/ ctx[0]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(target, anchor);
				}
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*messages, currentUserId, handleReaction*/ 5) {
				each_value = ensure_array_like(/*messages*/ ctx[0]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(each_1_anchor);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

// (43:2) {#if messages.length === 0}
function create_if_block$2(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			div.innerHTML = `<p class="svelte-dfmlzl">💬</p> <p class="svelte-dfmlzl">No messages yet</p> <p class="hint svelte-dfmlzl">Send a message to start the conversation</p>`;
			attr(div, "class", "empty-messages svelte-dfmlzl");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (50:3) {#each messages as message}
function create_each_block$1(ctx) {
	let messagebubble;
	let current;

	function func(...args) {
		return /*func*/ ctx[8](/*message*/ ctx[10], ...args);
	}

	messagebubble = new MessageBubble({
			props: {
				message: /*message*/ ctx[10],
				isSent: /*message*/ ctx[10].fromUserId === /*currentUserId*/ ctx[2],
				onReact: func
			}
		});

	return {
		c() {
			create_component(messagebubble.$$.fragment);
		},
		m(target, anchor) {
			mount_component(messagebubble, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const messagebubble_changes = {};
			if (dirty & /*messages*/ 1) messagebubble_changes.message = /*message*/ ctx[10];
			if (dirty & /*messages, currentUserId*/ 5) messagebubble_changes.isSent = /*message*/ ctx[10].fromUserId === /*currentUserId*/ ctx[2];
			if (dirty & /*messages*/ 1) messagebubble_changes.onReact = func;
			messagebubble.$set(messagebubble_changes);
		},
		i(local) {
			if (current) return;
			transition_in(messagebubble.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(messagebubble.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(messagebubble, detaching);
		}
	};
}

function create_fragment$2(ctx) {
	let div7;
	let div5;
	let button0;
	let t1;
	let div4;
	let div0;
	let t2_value = /*conversationName*/ ctx[1].charAt(0).toUpperCase() + "";
	let t2;
	let t3;
	let div3;
	let div1;
	let t4;
	let t5;
	let div2;
	let t7;
	let button1;
	let t9;
	let div6;
	let current_block_type_index;
	let if_block;
	let t10;
	let messageinput;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block$2, create_else_block$1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*messages*/ ctx[0].length === 0) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	messageinput = new MessageInput({
			props: {
				onSendMessage: /*onSendMessage*/ ctx[4],
				onSendMedia: /*onSendMedia*/ ctx[5]
			}
		});

	return {
		c() {
			div7 = element("div");
			div5 = element("div");
			button0 = element("button");
			button0.innerHTML = `<span>‹</span>`;
			t1 = space();
			div4 = element("div");
			div0 = element("div");
			t2 = text(t2_value);
			t3 = space();
			div3 = element("div");
			div1 = element("div");
			t4 = text(/*conversationName*/ ctx[1]);
			t5 = space();
			div2 = element("div");
			div2.textContent = "Active now";
			t7 = space();
			button1 = element("button");
			button1.innerHTML = `<span>📹</span>`;
			t9 = space();
			div6 = element("div");
			if_block.c();
			t10 = space();
			create_component(messageinput.$$.fragment);
			attr(button0, "class", "back-button svelte-dfmlzl");
			attr(div0, "class", "avatar svelte-dfmlzl");
			attr(div1, "class", "name svelte-dfmlzl");
			attr(div2, "class", "status svelte-dfmlzl");
			attr(div3, "class", "info svelte-dfmlzl");
			attr(div4, "class", "conversation-header svelte-dfmlzl");
			attr(button1, "class", "video-button svelte-dfmlzl");
			attr(button1, "title", "Start video call");
			attr(div5, "class", "header svelte-dfmlzl");
			attr(div6, "class", "messages svelte-dfmlzl");
			attr(div7, "class", "chat-view svelte-dfmlzl");
		},
		m(target, anchor) {
			insert(target, div7, anchor);
			append(div7, div5);
			append(div5, button0);
			append(div5, t1);
			append(div5, div4);
			append(div4, div0);
			append(div0, t2);
			append(div4, t3);
			append(div4, div3);
			append(div3, div1);
			append(div1, t4);
			append(div3, t5);
			append(div3, div2);
			append(div5, t7);
			append(div5, button1);
			append(div7, t9);
			append(div7, div6);
			if_blocks[current_block_type_index].m(div6, null);
			/*div6_binding*/ ctx[9](div6);
			append(div7, t10);
			mount_component(messageinput, div7, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", function () {
						if (is_function(/*onBack*/ ctx[3])) /*onBack*/ ctx[3].apply(this, arguments);
					}),
					listen(button1, "click", function () {
						if (is_function(/*onStartVideoCall*/ ctx[6])) /*onStartVideoCall*/ ctx[6].apply(this, arguments);
					})
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;
			if ((!current || dirty & /*conversationName*/ 2) && t2_value !== (t2_value = /*conversationName*/ ctx[1].charAt(0).toUpperCase() + "")) set_data(t2, t2_value);
			if (!current || dirty & /*conversationName*/ 2) set_data(t4, /*conversationName*/ ctx[1]);
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(div6, null);
			}

			const messageinput_changes = {};
			if (dirty & /*onSendMessage*/ 16) messageinput_changes.onSendMessage = /*onSendMessage*/ ctx[4];
			if (dirty & /*onSendMedia*/ 32) messageinput_changes.onSendMedia = /*onSendMedia*/ ctx[5];
			messageinput.$set(messageinput_changes);
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			transition_in(messageinput.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			transition_out(messageinput.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div7);
			}

			if_blocks[current_block_type_index].d();
			/*div6_binding*/ ctx[9](null);
			destroy_component(messageinput);
			mounted = false;
			run_all(dispose);
		}
	};
}

function handleReaction(messageId, reaction) {
	// Handle reaction (would integrate with interaction manager)
	console.log('Reaction:', messageId, reaction);
}

function instance$2($$self, $$props, $$invalidate) {
	let { messages } = $$props;
	let { conversationName } = $$props;
	let { currentUserId } = $$props;
	let { onBack } = $$props;
	let { onSendMessage } = $$props;
	let { onSendMedia } = $$props;
	let { onStartVideoCall } = $$props;
	let messageContainer;
	const func = (message, reaction) => handleReaction(message.id, reaction);

	function div6_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			messageContainer = $$value;
			($$invalidate(7, messageContainer), $$invalidate(0, messages));
		});
	}

	$$self.$$set = $$props => {
		if ('messages' in $$props) $$invalidate(0, messages = $$props.messages);
		if ('conversationName' in $$props) $$invalidate(1, conversationName = $$props.conversationName);
		if ('currentUserId' in $$props) $$invalidate(2, currentUserId = $$props.currentUserId);
		if ('onBack' in $$props) $$invalidate(3, onBack = $$props.onBack);
		if ('onSendMessage' in $$props) $$invalidate(4, onSendMessage = $$props.onSendMessage);
		if ('onSendMedia' in $$props) $$invalidate(5, onSendMedia = $$props.onSendMedia);
		if ('onStartVideoCall' in $$props) $$invalidate(6, onStartVideoCall = $$props.onStartVideoCall);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*messages, messageContainer*/ 129) {
			// Auto-scroll to bottom when new messages arrive
			if (messages && messageContainer) {
				setTimeout(
					() => {
						$$invalidate(7, messageContainer.scrollTop = messageContainer.scrollHeight, messageContainer);
					},
					100
				);
			}
		}
	};

	return [
		messages,
		conversationName,
		currentUserId,
		onBack,
		onSendMessage,
		onSendMedia,
		onStartVideoCall,
		messageContainer,
		func,
		div6_binding
	];
}

class ChatView extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
			messages: 0,
			conversationName: 1,
			currentUserId: 2,
			onBack: 3,
			onSendMessage: 4,
			onSendMedia: 5,
			onStartVideoCall: 6
		});
	}
}

/* src/lib/Components/messaging/VideoCallPanel.svelte generated by Svelte v4.2.20 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i][0];
	child_ctx[11] = list[i][1];
	return child_ctx;
}

// (73:2) {:else}
function create_else_block(ctx) {
	let div;
	let p0;
	let t1;
	let p1;
	let t2;
	let t3;
	let t4;

	return {
		c() {
			div = element("div");
			p0 = element("p");
			p0.textContent = "📞";
			t1 = space();
			p1 = element("p");
			t2 = text("Waiting for ");
			t3 = text(/*conversationName*/ ctx[0]);
			t4 = text(" to join...");
			attr(p0, "class", "svelte-abl69n");
			attr(p1, "class", "svelte-abl69n");
			attr(div, "class", "waiting-message svelte-abl69n");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, p0);
			append(div, t1);
			append(div, p1);
			append(p1, t2);
			append(p1, t3);
			append(p1, t4);
		},
		p(ctx, dirty) {
			if (dirty & /*conversationName*/ 1) set_data(t3, /*conversationName*/ ctx[0]);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (56:2) {#if remoteStreams.size > 0}
function create_if_block$1(ctx) {
	let each_1_anchor;
	let each_value = ensure_array_like([.../*remoteStreams*/ ctx[1].entries()]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(target, anchor);
				}
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*remoteStreams*/ 2) {
				each_value = ensure_array_like([.../*remoteStreams*/ ctx[1].entries()]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(each_1_anchor);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

// (57:3) {#each [...remoteStreams.entries()] as [userId, stream]}
function create_each_block(ctx) {
	let div1;
	let video;
	let track;
	let video_aria_label_value;
	let attachStream_action;
	let t0;
	let div0;
	let t1_value = /*userId*/ ctx[10].substring(0, 8) + "";
	let t1;
	let t2;
	let mounted;
	let dispose;

	return {
		c() {
			div1 = element("div");
			video = element("video");
			track = element("track");
			t0 = space();
			div0 = element("div");
			t1 = text(t1_value);
			t2 = space();
			attr(track, "kind", "captions");
			video.autoplay = true;
			video.playsInline = true;
			attr(video, "class", "video svelte-abl69n");
			attr(video, "aria-label", video_aria_label_value = "Remote video stream from " + /*userId*/ ctx[10]);
			attr(div0, "class", "video-label svelte-abl69n");
			attr(div1, "class", "video-container remote svelte-abl69n");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, video);
			append(video, track);
			append(div1, t0);
			append(div1, div0);
			append(div0, t1);
			append(div1, t2);

			if (!mounted) {
				dispose = action_destroyer(attachStream_action = attachStream.call(null, video, /*stream*/ ctx[11]));
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*remoteStreams*/ 2 && video_aria_label_value !== (video_aria_label_value = "Remote video stream from " + /*userId*/ ctx[10])) {
				attr(video, "aria-label", video_aria_label_value);
			}

			if (attachStream_action && is_function(attachStream_action.update) && dirty & /*remoteStreams*/ 2) attachStream_action.update.call(null, /*stream*/ ctx[11]);
			if (dirty & /*remoteStreams*/ 2 && t1_value !== (t1_value = /*userId*/ ctx[10].substring(0, 8) + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			mounted = false;
			dispose();
		}
	};
}

function create_fragment$1(ctx) {
	let div8;
	let div3;
	let div2;
	let div0;
	let t0;
	let t1;
	let div1;
	let t3;
	let div6;
	let t4;
	let div5;
	let video;
	let t5;
	let div4;
	let t7;
	let div7;
	let button0;
	let span0;
	let t8_value = (/*isAudioEnabled*/ ctx[4] ? '🎤' : '🔇') + "";
	let t8;
	let button0_class_value;
	let button0_title_value;
	let t9;
	let button1;
	let t11;
	let button2;
	let span2;
	let t12_value = (/*isVideoEnabled*/ ctx[5] ? '📹' : '🚫') + "";
	let t12;
	let button2_class_value;
	let button2_title_value;
	let mounted;
	let dispose;

	function select_block_type(ctx, dirty) {
		if (/*remoteStreams*/ ctx[1].size > 0) return create_if_block$1;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div8 = element("div");
			div3 = element("div");
			div2 = element("div");
			div0 = element("div");
			t0 = text(/*conversationName*/ ctx[0]);
			t1 = space();
			div1 = element("div");
			div1.textContent = "Connected";
			t3 = space();
			div6 = element("div");
			if_block.c();
			t4 = space();
			div5 = element("div");
			video = element("video");
			video.innerHTML = `<track kind="captions"/>`;
			t5 = space();
			div4 = element("div");
			div4.textContent = "You";
			t7 = space();
			div7 = element("div");
			button0 = element("button");
			span0 = element("span");
			t8 = text(t8_value);
			t9 = space();
			button1 = element("button");
			button1.innerHTML = `<span>📞</span>`;
			t11 = space();
			button2 = element("button");
			span2 = element("span");
			t12 = text(t12_value);
			attr(div0, "class", "name svelte-abl69n");
			attr(div1, "class", "status svelte-abl69n");
			attr(div2, "class", "call-info svelte-abl69n");
			attr(div3, "class", "header svelte-abl69n");
			video.autoplay = true;
			video.playsInline = true;
			video.muted = true;
			attr(video, "class", "video svelte-abl69n");
			attr(video, "aria-label", "Local video stream");
			attr(div4, "class", "video-label svelte-abl69n");
			attr(div5, "class", "video-container local svelte-abl69n");
			attr(div6, "class", "video-grid svelte-abl69n");
			attr(button0, "class", button0_class_value = "control-button " + (/*isAudioEnabled*/ ctx[4] ? '' : 'disabled') + " svelte-abl69n");
			attr(button0, "title", button0_title_value = /*isAudioEnabled*/ ctx[4] ? 'Mute' : 'Unmute');
			attr(button1, "class", "control-button end-call svelte-abl69n");
			attr(button1, "title", "End call");
			attr(button2, "class", button2_class_value = "control-button " + (/*isVideoEnabled*/ ctx[5] ? '' : 'disabled') + " svelte-abl69n");

			attr(button2, "title", button2_title_value = /*isVideoEnabled*/ ctx[5]
			? 'Turn off video'
			: 'Turn on video');

			attr(div7, "class", "controls svelte-abl69n");
			attr(div8, "class", "video-call-panel svelte-abl69n");
		},
		m(target, anchor) {
			insert(target, div8, anchor);
			append(div8, div3);
			append(div3, div2);
			append(div2, div0);
			append(div0, t0);
			append(div2, t1);
			append(div2, div1);
			append(div8, t3);
			append(div8, div6);
			if_block.m(div6, null);
			append(div6, t4);
			append(div6, div5);
			append(div5, video);
			/*video_binding*/ ctx[9](video);
			append(div5, t5);
			append(div5, div4);
			append(div8, t7);
			append(div8, div7);
			append(div7, button0);
			append(button0, span0);
			append(span0, t8);
			append(div7, t9);
			append(div7, button1);
			append(div7, t11);
			append(div7, button2);
			append(button2, span2);
			append(span2, t12);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*toggleAudio*/ ctx[6]),
					listen(button1, "click", function () {
						if (is_function(/*onEndCall*/ ctx[2])) /*onEndCall*/ ctx[2].apply(this, arguments);
					}),
					listen(button2, "click", /*toggleVideo*/ ctx[7])
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;
			if (dirty & /*conversationName*/ 1) set_data(t0, /*conversationName*/ ctx[0]);

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div6, t4);
				}
			}

			if (dirty & /*isAudioEnabled*/ 16 && t8_value !== (t8_value = (/*isAudioEnabled*/ ctx[4] ? '🎤' : '🔇') + "")) set_data(t8, t8_value);

			if (dirty & /*isAudioEnabled*/ 16 && button0_class_value !== (button0_class_value = "control-button " + (/*isAudioEnabled*/ ctx[4] ? '' : 'disabled') + " svelte-abl69n")) {
				attr(button0, "class", button0_class_value);
			}

			if (dirty & /*isAudioEnabled*/ 16 && button0_title_value !== (button0_title_value = /*isAudioEnabled*/ ctx[4] ? 'Mute' : 'Unmute')) {
				attr(button0, "title", button0_title_value);
			}

			if (dirty & /*isVideoEnabled*/ 32 && t12_value !== (t12_value = (/*isVideoEnabled*/ ctx[5] ? '📹' : '🚫') + "")) set_data(t12, t12_value);

			if (dirty & /*isVideoEnabled*/ 32 && button2_class_value !== (button2_class_value = "control-button " + (/*isVideoEnabled*/ ctx[5] ? '' : 'disabled') + " svelte-abl69n")) {
				attr(button2, "class", button2_class_value);
			}

			if (dirty & /*isVideoEnabled*/ 32 && button2_title_value !== (button2_title_value = /*isVideoEnabled*/ ctx[5]
			? 'Turn off video'
			: 'Turn on video')) {
				attr(button2, "title", button2_title_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div8);
			}

			if_block.d();
			/*video_binding*/ ctx[9](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function attachStream(element, stream) {
	element.srcObject = stream;

	return {
		update(newStream) {
			element.srcObject = newStream;
		},
		destroy() {
			element.srcObject = null;
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { conversationName } = $$props;
	let { localStream } = $$props;
	let { remoteStreams } = $$props;
	let { onEndCall } = $$props;
	let localVideoElement;
	let isAudioEnabled = true;
	let isVideoEnabled = true;

	onMount(() => {
		// Setup local video
		if (localStream && localVideoElement) {
			$$invalidate(3, localVideoElement.srcObject = localStream, localVideoElement);
		}
	});

	function toggleAudio() {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];

			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				$$invalidate(4, isAudioEnabled = audioTrack.enabled);
			}
		}
	}

	function toggleVideo() {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0];

			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				$$invalidate(5, isVideoEnabled = videoTrack.enabled);
			}
		}
	}

	function video_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			localVideoElement = $$value;
			$$invalidate(3, localVideoElement);
		});
	}

	$$self.$$set = $$props => {
		if ('conversationName' in $$props) $$invalidate(0, conversationName = $$props.conversationName);
		if ('localStream' in $$props) $$invalidate(8, localStream = $$props.localStream);
		if ('remoteStreams' in $$props) $$invalidate(1, remoteStreams = $$props.remoteStreams);
		if ('onEndCall' in $$props) $$invalidate(2, onEndCall = $$props.onEndCall);
	};

	return [
		conversationName,
		remoteStreams,
		onEndCall,
		localVideoElement,
		isAudioEnabled,
		isVideoEnabled,
		toggleAudio,
		toggleVideo,
		localStream,
		video_binding
	];
}

class VideoCallPanel extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
			conversationName: 0,
			localStream: 8,
			remoteStreams: 1,
			onEndCall: 2
		});
	}
}

/* src/lib/Components/webcomponents/MessagingEmbed.wc.svelte generated by Svelte v4.2.20 */

function add_css(target) {
	append_styles(target, "svelte-1nwfap2", ".messaging-embed.svelte-1nwfap2{width:100%;max-width:500px;height:600px;background:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0, 0, 0, 0.15);overflow:hidden;display:flex;flex-direction:column;position:relative}.loading.svelte-1nwfap2{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#666}.spinner.svelte-1nwfap2{width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #007aff;border-radius:50%;animation:svelte-1nwfap2-spin 1s linear infinite;margin-bottom:1rem}@keyframes svelte-1nwfap2-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.connection-banner.svelte-1nwfap2{position:absolute;top:0;left:0;right:0;background:#ff9800;color:white;padding:0.5rem;text-align:center;font-size:0.875rem;z-index:1000}@media(max-width: 768px){.messaging-embed.svelte-1nwfap2{max-width:100%;height:100vh;border-radius:0}}");
}

// (138:35) 
function create_if_block_4(ctx) {
	let videocallpanel;
	let current;

	videocallpanel = new VideoCallPanel({
			props: {
				conversationName: /*conversationName*/ ctx[4],
				localStream: /*$localStream*/ ctx[12],
				remoteStreams: /*$remoteStreams*/ ctx[13],
				onEndCall: /*handleEndVideoCall*/ ctx[18]
			}
		});

	return {
		c() {
			create_component(videocallpanel.$$.fragment);
		},
		m(target, anchor) {
			mount_component(videocallpanel, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const videocallpanel_changes = {};
			if (dirty[0] & /*conversationName*/ 16) videocallpanel_changes.conversationName = /*conversationName*/ ctx[4];
			if (dirty[0] & /*$localStream*/ 4096) videocallpanel_changes.localStream = /*$localStream*/ ctx[12];
			if (dirty[0] & /*$remoteStreams*/ 8192) videocallpanel_changes.remoteStreams = /*$remoteStreams*/ ctx[13];
			videocallpanel.$set(videocallpanel_changes);
		},
		i(local) {
			if (current) return;
			transition_in(videocallpanel.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(videocallpanel.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(videocallpanel, detaching);
		}
	};
}

// (128:34) 
function create_if_block_3(ctx) {
	let chatview;
	let current;

	chatview = new ChatView({
			props: {
				messages: /*messages*/ ctx[3],
				conversationName: /*conversationName*/ ctx[4],
				currentUserId: /*getLocalUserId*/ ctx[5](),
				onBack: /*handleBackToInbox*/ ctx[16],
				onSendMessage: /*handleSendMessage*/ ctx[19],
				onSendMedia: /*handleSendMedia*/ ctx[20],
				onStartVideoCall: /*handleStartVideoCall*/ ctx[17]
			}
		});

	return {
		c() {
			create_component(chatview.$$.fragment);
		},
		m(target, anchor) {
			mount_component(chatview, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const chatview_changes = {};
			if (dirty[0] & /*messages*/ 8) chatview_changes.messages = /*messages*/ ctx[3];
			if (dirty[0] & /*conversationName*/ 16) chatview_changes.conversationName = /*conversationName*/ ctx[4];
			if (dirty[0] & /*getLocalUserId*/ 32) chatview_changes.currentUserId = /*getLocalUserId*/ ctx[5]();
			chatview.$set(chatview_changes);
		},
		i(local) {
			if (current) return;
			transition_in(chatview.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(chatview.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(chatview, detaching);
		}
	};
}

// (122:35) 
function create_if_block_2(ctx) {
	let conversationlist;
	let current;

	conversationlist = new ConversationList({
			props: {
				participants: /*$participants*/ ctx[0],
				sessionInfo: /*$session*/ ctx[11],
				onSelectConversation: /*handleSelectConversation*/ ctx[15]
			}
		});

	return {
		c() {
			create_component(conversationlist.$$.fragment);
		},
		m(target, anchor) {
			mount_component(conversationlist, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const conversationlist_changes = {};
			if (dirty[0] & /*$participants*/ 1) conversationlist_changes.participants = /*$participants*/ ctx[0];
			if (dirty[0] & /*$session*/ 2048) conversationlist_changes.sessionInfo = /*$session*/ ctx[11];
			conversationlist.$set(conversationlist_changes);
		},
		i(local) {
			if (current) return;
			transition_in(conversationlist.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(conversationlist.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(conversationlist, detaching);
		}
	};
}

// (117:1) {#if !isInitialized}
function create_if_block_1(ctx) {
	let div1;

	return {
		c() {
			div1 = element("div");
			div1.innerHTML = `<div class="spinner svelte-1nwfap2"></div> <p>Connecting...</p>`;
			attr(div1, "class", "loading svelte-1nwfap2");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div1);
			}
		}
	};
}

// (147:1) {#if !$isConnected}
function create_if_block(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			div.innerHTML = `<span>⚠️ Reconnecting...</span>`;
			attr(div, "class", "connection-banner svelte-1nwfap2");
		},
		m(target, anchor) {
			insert(target, div, anchor);
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
	let current_block_type_index;
	let if_block0;
	let t;
	let current;
	const if_block_creators = [create_if_block_1, create_if_block_2, create_if_block_3, create_if_block_4];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (!/*isInitialized*/ ctx[2]) return 0;
		if (/*currentView*/ ctx[1] === 'inbox') return 1;
		if (/*currentView*/ ctx[1] === 'chat') return 2;
		if (/*currentView*/ ctx[1] === 'video') return 3;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	let if_block1 = !/*$isConnected*/ ctx[14] && create_if_block();

	return {
		c() {
			div = element("div");
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			attr(div, "class", "messaging-embed svelte-1nwfap2");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div, null);
			}

			append(div, t);
			if (if_block1) if_block1.m(div, null);
			current = true;
		},
		p(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				}
			} else {
				if (if_block0) {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
				}

				if (~current_block_type_index) {
					if_block0 = if_blocks[current_block_type_index];

					if (!if_block0) {
						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block0.c();
					} else {
						if_block0.p(ctx, dirty);
					}

					transition_in(if_block0, 1);
					if_block0.m(div, t);
				} else {
					if_block0 = null;
				}
			}

			if (!/*$isConnected*/ ctx[14]) {
				if (if_block1) ; else {
					if_block1 = create_if_block();
					if_block1.c();
					if_block1.m(div, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}

			if (if_block1) if_block1.d();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let enableVideoBool;
	let enableAudioBool;
	let sessionIdOrUndefined;
	let config;
	let interaction;
	let session;
	let participants;
	let isHost;
	let isConnected;
	let localStream;
	let remoteStreams;
	let start;
	let connect;
	let send;
	let getMessages;
	let getLocalUserId;
	let conversationName;

	let $participants,
		$$unsubscribe_participants = noop,
		$$subscribe_participants = () => ($$unsubscribe_participants(), $$unsubscribe_participants = subscribe(participants, $$value => $$invalidate(0, $participants = $$value)), participants);

	let $session,
		$$unsubscribe_session = noop,
		$$subscribe_session = () => ($$unsubscribe_session(), $$unsubscribe_session = subscribe(session, $$value => $$invalidate(11, $session = $$value)), session);

	let $localStream,
		$$unsubscribe_localStream = noop,
		$$subscribe_localStream = () => ($$unsubscribe_localStream(), $$unsubscribe_localStream = subscribe(localStream, $$value => $$invalidate(12, $localStream = $$value)), localStream);

	let $remoteStreams,
		$$unsubscribe_remoteStreams = noop,
		$$subscribe_remoteStreams = () => ($$unsubscribe_remoteStreams(), $$unsubscribe_remoteStreams = subscribe(remoteStreams, $$value => $$invalidate(13, $remoteStreams = $$value)), remoteStreams);

	let $isConnected,
		$$unsubscribe_isConnected = noop,
		$$subscribe_isConnected = () => ($$unsubscribe_isConnected(), $$unsubscribe_isConnected = subscribe(isConnected, $$value => $$invalidate(14, $isConnected = $$value)), isConnected);

	$$self.$$.on_destroy.push(() => $$unsubscribe_participants());
	$$self.$$.on_destroy.push(() => $$unsubscribe_session());
	$$self.$$.on_destroy.push(() => $$unsubscribe_localStream());
	$$self.$$.on_destroy.push(() => $$unsubscribe_remoteStreams());
	$$self.$$.on_destroy.push(() => $$unsubscribe_isConnected());
	let { embedId = 'messaging-app' } = $$props;
	let { sessionId = '' } = $$props;
	let { enableVideo = 'true' } = $$props;
	let { enableAudio = 'true' } = $$props;

	// State
	let currentView = 'inbox';

	let selectedConversationId = null;
	let isInitialized = false;

	// Messages store for current conversation
	let messages = [];

	onMount(async () => {
		if (sessionIdOrUndefined) {
			// Join existing session
			const success = await connect({ role: 'player' });

			$$invalidate(2, isInitialized = success);
		} else {
			// Create new session as host
			const newSession = await start();

			$$invalidate(2, isInitialized = !!newSession);
		}

		// Set up message refresh
		const interval = setInterval(
			() => {
				if ($session && selectedConversationId) {
					$$invalidate(3, messages = getMessages({ limit: 100 }));
				}
			},
			1000
		);

		// Dispatch ready event
		dispatchEvent(new CustomEvent('ready',
		{
				detail: { embedId, sessionId: $session?.sessionId }
			}));

		return () => {
			clearInterval(interval);
		};
	});

	onDestroy(() => {
		interaction.destroy();
	});

	function handleSelectConversation(conversationId) {
		$$invalidate(25, selectedConversationId = conversationId);
		$$invalidate(1, currentView = 'chat');

		// Load messages for this conversation
		if ($session) {
			$$invalidate(3, messages = getMessages({ limit: 100 }));
		}
	}

	function handleBackToInbox() {
		$$invalidate(1, currentView = 'inbox');
		$$invalidate(25, selectedConversationId = null);
	}

	function handleStartVideoCall() {
		$$invalidate(1, currentView = 'video');
	}

	function handleEndVideoCall() {
		$$invalidate(1, currentView = 'chat');
	}

	function handleSendMessage(text) {
		if (!text.trim()) return;
		send({ type: 'chat', payload: text.trim() });
	}

	function handleSendMedia(mediaUrl, mediaType, caption) {
		send({
			type: 'media',
			payload: { caption },
			mediaUrl,
			mediaType
		});
	}

	$$self.$$set = $$props => {
		if ('embedId' in $$props) $$invalidate(21, embedId = $$props.embedId);
		if ('sessionId' in $$props) $$invalidate(22, sessionId = $$props.sessionId);
		if ('enableVideo' in $$props) $$invalidate(23, enableVideo = $$props.enableVideo);
		if ('enableAudio' in $$props) $$invalidate(24, enableAudio = $$props.enableAudio);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*enableVideo*/ 8388608) {
			// Convert string attributes to booleans
			$$invalidate(30, enableVideoBool = enableVideo === 'true');
		}

		if ($$self.$$.dirty[0] & /*enableAudio*/ 16777216) {
			$$invalidate(29, enableAudioBool = enableAudio === 'true');
		}

		if ($$self.$$.dirty[0] & /*sessionId*/ 4194304) {
			$$invalidate(27, sessionIdOrUndefined = sessionId || undefined);
		}

		if ($$self.$$.dirty[0] & /*embedId, sessionIdOrUndefined, enableVideoBool, enableAudioBool*/ 1746927616) {
			// Configure interaction session
			$$invalidate(28, config = {
				embedId,
				type: 'collaborative',
				sessionId: sessionIdOrUndefined,
				maxParticipants: 10,
				video: enableVideoBool,
				audio: enableAudioBool,
				debug: true
			});
		}

		if ($$self.$$.dirty[0] & /*config*/ 268435456) {
			$$invalidate(26, interaction = useStackLiveInteraction(config));
		}

		if ($$self.$$.dirty[0] & /*interaction*/ 67108864) {
			$$subscribe_session($$invalidate(10, { session, participants, isHost, isConnected, localStream, remoteStreams, start, connect, send, getMessages, getLocalUserId } = interaction, session, $$subscribe_participants($$invalidate(9, participants)), $$subscribe_isConnected($$invalidate(8, isConnected)), $$subscribe_localStream($$invalidate(7, localStream)), $$subscribe_remoteStreams($$invalidate(6, remoteStreams)), ((((((((($$invalidate(5, getLocalUserId), $$invalidate(26, interaction)), $$invalidate(28, config)), $$invalidate(21, embedId)), $$invalidate(27, sessionIdOrUndefined)), $$invalidate(30, enableVideoBool)), $$invalidate(29, enableAudioBool)), $$invalidate(22, sessionId)), $$invalidate(23, enableVideo)), $$invalidate(24, enableAudio))));
		}

		if ($$self.$$.dirty[0] & /*selectedConversationId, $participants*/ 33554433) {
			// Get conversation info
			$$invalidate(4, conversationName = selectedConversationId
			? $participants.find(p => p.userId === selectedConversationId)?.user?.name || selectedConversationId
			: '');
		}
	};

	return [
		$participants,
		currentView,
		isInitialized,
		messages,
		conversationName,
		getLocalUserId,
		remoteStreams,
		localStream,
		isConnected,
		participants,
		session,
		$session,
		$localStream,
		$remoteStreams,
		$isConnected,
		handleSelectConversation,
		handleBackToInbox,
		handleStartVideoCall,
		handleEndVideoCall,
		handleSendMessage,
		handleSendMedia,
		embedId,
		sessionId,
		enableVideo,
		enableAudio,
		selectedConversationId,
		interaction,
		sessionIdOrUndefined,
		config,
		enableAudioBool,
		enableVideoBool
	];
}

class MessagingEmbed_wc extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				embedId: 21,
				sessionId: 22,
				enableVideo: 23,
				enableAudio: 24
			},
			add_css,
			[-1, -1]
		);
	}

	get embedId() {
		return this.$$.ctx[21];
	}

	set embedId(embedId) {
		this.$$set({ embedId });
		flush();
	}

	get sessionId() {
		return this.$$.ctx[22];
	}

	set sessionId(sessionId) {
		this.$$set({ sessionId });
		flush();
	}

	get enableVideo() {
		return this.$$.ctx[23];
	}

	set enableVideo(enableVideo) {
		this.$$set({ enableVideo });
		flush();
	}

	get enableAudio() {
		return this.$$.ctx[24];
	}

	set enableAudio(enableAudio) {
		this.$$set({ enableAudio });
		flush();
	}
}

customElements.get("sl-messaging")||customElements.define("sl-messaging", create_custom_element(MessagingEmbed_wc, {"embedId":{},"sessionId":{},"enableVideo":{},"enableAudio":{}}, [], [], true));

export { MessagingEmbed_wc as default };
//# sourceMappingURL=messaging.js.map
