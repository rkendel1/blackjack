/**
 * sl-messaging-backend.js
 * Simplified JavaScript backend integration for sl-messaging component
 * No TypeScript dependencies - works standalone
 */

/**
 * Simple message store for demo/local use
 * In production, replace with your backend API
 */
class MessageStore {
	constructor() {
		this.messages = [];
		this.listeners = [];
	}

	addMessage(message) {
		this.messages.push({
			...message,
			id: Date.now().toString() + Math.random(),
			timestamp: Date.now()
		});
		this.notifyListeners();
	}

	getMessages(limit = 100) {
		return this.messages.slice(-limit);
	}

	onMessage(callback) {
		this.listeners.push(callback);
	}

	notifyListeners() {
		this.listeners.forEach(cb => cb(this.messages));
	}
}

/**
 * Simple session manager for demo/local use
 * In production, replace with your signaling server
 */
class SessionManager {
	constructor() {
		this.sessionId = null;
		this.participants = [];
		this.isHost = false;
		this.listeners = {};
	}

	createSession() {
		this.sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(7);
		this.isHost = true;
		this.participants = [{
			id: 'p-' + Date.now(),
			userId: 'user-1',
			role: 'host',
			connectionStatus: 'connected',
			user: { id: 'user-1', name: 'You', avatar: '' }
		}];
		this.emit('sessionCreated', { sessionId: this.sessionId });
		return {
			id: this.sessionId,
			hostId: 'user-1',
			status: 'WAITING_FOR_PLAYERS',
			participants: this.participants,
			createdAt: Date.now()
		};
	}

	joinSession(sessionId) {
		this.sessionId = sessionId;
		this.isHost = false;
		// In production, this would connect to the actual session
		this.participants = [{
			id: 'p-' + Date.now(),
			userId: 'user-' + Math.random().toString(36).substring(7),
			role: 'player',
			connectionStatus: 'connected',
			user: { id: 'user-2', name: 'Guest', avatar: '' }
		}];
		this.emit('sessionJoined', { sessionId });
		return this.participants[0];
	}

	getSession() {
		return {
			id: this.sessionId,
			hostId: this.isHost ? 'user-1' : null,
			status: 'IN_GAME',
			participants: this.participants,
			createdAt: Date.now()
		};
	}

	on(event, callback) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(callback);
	}

	emit(event, data) {
		if (this.listeners[event]) {
			this.listeners[event].forEach(cb => cb(data));
		}
	}
}

/**
 * Main backend integration class
 * Provides simplified backend connectivity for messaging
 */
export class MessagingBackend {
	constructor(config = {}) {
		this.config = {
			embedId: config.embedId || 'messaging-app',
			sessionId: config.sessionId || null,
			enableVideo: config.enableVideo !== false,
			enableAudio: config.enableAudio !== false,
			debug: config.debug || false,
			...config
		};

		this.messageStore = new MessageStore();
		this.sessionManager = new SessionManager();
		this.localUserId = 'user-' + Math.random().toString(36).substring(7);
		this.isConnected = false;
		this.session = null;

		if (this.config.debug) {
			console.log('[MessagingBackend] Initialized with config:', this.config);
		}
	}

	/**
	 * Initialize a new session as host
	 */
	async createSession() {
		try {
			this.session = this.sessionManager.createSession();
			this.isConnected = true;
			
			if (this.config.debug) {
				console.log('[MessagingBackend] Session created:', this.session.id);
			}

			return this.session;
		} catch (error) {
			console.error('[MessagingBackend] Failed to create session:', error);
			return null;
		}
	}

	/**
	 * Join an existing session
	 */
	async joinSession(sessionId) {
		try {
			const participant = this.sessionManager.joinSession(sessionId || this.config.sessionId);
			this.session = this.sessionManager.getSession();
			this.isConnected = true;

			if (this.config.debug) {
				console.log('[MessagingBackend] Joined session:', sessionId);
			}

			return participant;
		} catch (error) {
			console.error('[MessagingBackend] Failed to join session:', error);
			return null;
		}
	}

	/**
	 * Send a message
	 */
	sendMessage(text) {
		if (!this.isConnected) {
			console.warn('[MessagingBackend] Not connected');
			return;
		}

		const message = {
			fromUserId: this.localUserId,
			payload: text,
			sessionId: this.session?.id
		};

		this.messageStore.addMessage(message);

		if (this.config.debug) {
			console.log('[MessagingBackend] Message sent:', message);
		}
	}

	/**
	 * Send media message
	 */
	sendMedia(mediaUrl, mediaType, caption) {
		if (!this.isConnected) {
			console.warn('[MessagingBackend] Not connected');
			return;
		}

		const message = {
			fromUserId: this.localUserId,
			payload: { caption },
			mediaUrl,
			mediaType,
			sessionId: this.session?.id
		};

		this.messageStore.addMessage(message);

		if (this.config.debug) {
			console.log('[MessagingBackend] Media sent:', message);
		}
	}

	/**
	 * Get messages
	 */
	getMessages(limit = 100) {
		return this.messageStore.getMessages(limit);
	}

	/**
	 * Subscribe to new messages
	 */
	onMessage(callback) {
		this.messageStore.onMessage(callback);
	}

	/**
	 * Get current session
	 */
	getSession() {
		return this.session;
	}

	/**
	 * Get participants
	 */
	getParticipants() {
		return this.session?.participants || [];
	}

	/**
	 * Get local user ID
	 */
	getLocalUserId() {
		return this.localUserId;
	}

	/**
	 * Check if connected
	 */
	isSessionConnected() {
		return this.isConnected;
	}

	/**
	 * Cleanup
	 */
	destroy() {
		this.isConnected = false;
		this.session = null;
		if (this.config.debug) {
			console.log('[MessagingBackend] Destroyed');
		}
	}
}

/**
 * Svelte store-compatible wrapper
 * Use this if integrating with Svelte
 */
export function createMessagingStore(config) {
	const backend = new MessagingBackend(config);
	
	// Svelte writable stores
	const session = { subscribe: null, set: null, update: null };
	const participants = { subscribe: null, set: null, update: null };
	const messages = { subscribe: null, set: null, update: null };
	const isConnected = { subscribe: null, set: null, update: null };

	// Initialize stores if Svelte is available
	if (typeof window !== 'undefined' && window.Svelte) {
		const { writable } = window.Svelte.store || {};
		if (writable) {
			Object.assign(session, writable(null));
			Object.assign(participants, writable([]));
			Object.assign(messages, writable([]));
			Object.assign(isConnected, writable(false));
		}
	}

	return {
		backend,
		session,
		participants,
		messages,
		isConnected,
		
		// Helper methods
		async start() {
			const sess = await backend.createSession();
			if (session.set) session.set(sess);
			if (participants.set) participants.set(backend.getParticipants());
			if (isConnected.set) isConnected.set(true);
			return sess;
		},

		async join(sessionId) {
			const participant = await backend.joinSession(sessionId);
			if (session.set) session.set(backend.getSession());
			if (participants.set) participants.set(backend.getParticipants());
			if (isConnected.set) isConnected.set(true);
			return participant;
		},

		sendMessage(text) {
			backend.sendMessage(text);
			if (messages.set) messages.set(backend.getMessages());
		},

		sendMedia(url, type, caption) {
			backend.sendMedia(url, type, caption);
			if (messages.set) messages.set(backend.getMessages());
		},

		getMessages() {
			return backend.getMessages();
		},

		destroy() {
			backend.destroy();
			if (isConnected.set) isConnected.set(false);
		}
	};
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { MessagingBackend, createMessagingStore };
}
