// general each functions:

function ensure_array_like(array_like_or_iterator) {
	return array_like_or_iterator?.length !== undefined
		? array_like_or_iterator
		: Array.from(array_like_or_iterator);
}

/**
 * WebRTC Peer Connection Manager
 * Handles peer-to-peer connections for the multiplayer runtime
 */
class PeerConnectionManager {
    peerConnection = null;
    dataChannel = null;
    config;
    onMessageCallback;
    onConnectionStateChangeCallback;
    onIceCandidateCallback;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    constructor(config) {
        this.config = config;
    }
    /**
     * Initialize a new peer connection
     */
    async createPeerConnection() {
        if (this.peerConnection) {
            this.closePeerConnection();
        }
        this.peerConnection = new RTCPeerConnection(this.config);
        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            if (state && this.onConnectionStateChangeCallback) {
                this.onConnectionStateChangeCallback(state);
            }
            // Handle reconnection
            if (state === 'disconnected' || state === 'failed') {
                this.handleDisconnection();
            }
        };
        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.onIceCandidateCallback) {
                this.onIceCandidateCallback(event.candidate);
            }
        };
        return this.peerConnection;
    }
    /**
     * Create a data channel for game communication
     */
    createDataChannel(label) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        this.dataChannel = this.peerConnection.createDataChannel(label, {
            ordered: true,
            maxRetransmits: 3
        });
        this.setupDataChannel(this.dataChannel);
        return this.dataChannel;
    }
    /**
     * Set up data channel event handlers
     */
    setupDataChannel(channel) {
        channel.onopen = () => {
            console.log('Data channel opened');
            this.reconnectAttempts = 0;
        };
        channel.onclose = () => {
            console.log('Data channel closed');
        };
        channel.onerror = (error) => {
            console.error('Data channel error:', error);
        };
        channel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (this.onMessageCallback) {
                    this.onMessageCallback(message);
                }
            }
            catch (error) {
                console.error('Failed to parse message:', error);
            }
        };
    }
    /**
     * Handle incoming data channel from peer
     */
    handleDataChannel(channel) {
        this.dataChannel = channel;
        this.setupDataChannel(channel);
    }
    /**
     * Send a message through the data channel
     */
    sendMessage(message) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            console.warn('Data channel not ready, message not sent');
            return;
        }
        try {
            this.dataChannel.send(JSON.stringify(message));
        }
        catch (error) {
            console.error('Failed to send message:', error);
        }
    }
    /**
     * Create an offer for connection
     */
    async createOffer() {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }
    /**
     * Create an answer for connection
     */
    async createAnswer() {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }
    /**
     * Set remote description
     */
    async setRemoteDescription(description) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        await this.peerConnection.setRemoteDescription(description);
    }
    /**
     * Add ICE candidate
     */
    async addIceCandidate(candidate) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        await this.peerConnection.addIceCandidate(candidate);
    }
    /**
     * Handle disconnection and attempt reconnection
     */
    async handleDisconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }
        this.reconnectAttempts++;
        console.log(`Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        // Trigger reconnection event
        if (this.onConnectionStateChangeCallback) {
            this.onConnectionStateChangeCallback('failed');
        }
    }
    /**
     * Close peer connection
     */
    closePeerConnection() {
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.reconnectAttempts = 0;
    }
    /**
     * Set callback for incoming messages
     */
    onMessage(callback) {
        this.onMessageCallback = callback;
    }
    /**
     * Set callback for connection state changes
     */
    onConnectionStateChange(callback) {
        this.onConnectionStateChangeCallback = callback;
    }
    /**
     * Set callback for ICE candidates
     */
    onIceCandidate(callback) {
        this.onIceCandidateCallback = callback;
    }
    /**
     * Get connection state
     */
    getConnectionState() {
        return this.peerConnection?.connectionState ?? null;
    }
    /**
     * Check if data channel is ready
     */
    isDataChannelReady() {
        return this.dataChannel?.readyState === 'open';
    }
}

/**
 * Session Manager
 * Manages session lifecycle and state transitions
 */
class SessionManager {
    session = null;
    stateChangeCallbacks = [];
    /**
     * Create a new session
     */
    createSession(config, hostId) {
        const now = Date.now();
        const sessionId = this.generateSessionId();
        this.session = {
            id: sessionId,
            gameId: config.gameId,
            embedId: config.embedId,
            type: config.type,
            hostId,
            mode: config.mode,
            status: 'CREATING',
            config,
            participants: [
                {
                    id: this.generateParticipantId(),
                    userId: hostId,
                    role: 'host',
                    connectionStatus: 'disconnected'
                }
            ],
            createdAt: now,
            expiresAt: now + 3600000 // 1 hour from now
        };
        this.updateState('WAITING_FOR_PLAYERS');
        return this.session;
    }
    /**
     * Join an existing session
     */
    joinSession(sessionId, userId, role = 'player') {
        if (!this.session || this.session.id !== sessionId) {
            return null;
        }
        // Check if already in session
        const existing = this.session.participants.find((p) => p.userId === userId);
        if (existing) {
            return existing;
        }
        // Check max players
        const playerCount = this.session.participants.filter((p) => p.role === 'player').length;
        if (role === 'player' && playerCount >= this.session.config.maxPlayers) {
            return null;
        }
        // Check spectators allowed
        if (role === 'spectator' && !this.session.config.allowSpectators) {
            return null;
        }
        const participant = {
            id: this.generateParticipantId(),
            userId,
            role,
            connectionStatus: 'connecting'
        };
        this.session.participants.push(participant);
        return participant;
    }
    /**
     * Remove a participant from the session
     */
    leaveSession(userId) {
        if (!this.session) {
            return false;
        }
        const index = this.session.participants.findIndex((p) => p.userId === userId);
        if (index === -1) {
            return false;
        }
        const participant = this.session.participants[index];
        this.session.participants.splice(index, 1);
        // If host left, end session
        if (participant.role === 'host') {
            this.updateState('ENDED');
            return true;
        }
        // If no players left, end session
        const hasPlayers = this.session.participants.some((p) => p.role !== 'spectator');
        if (!hasPlayers) {
            this.updateState('ENDED');
        }
        return true;
    }
    /**
     * Update participant connection status
     */
    updateParticipantStatus(userId, status) {
        if (!this.session) {
            return;
        }
        const participant = this.session.participants.find((p) => p.userId === userId);
        if (participant) {
            participant.connectionStatus = status;
        }
    }
    /**
     * Update session state
     */
    updateState(newState) {
        if (!this.session) {
            return;
        }
        const oldState = this.session.status;
        this.session.status = newState;
        // Validate state transition
        if (!this.isValidTransition(oldState, newState)) {
            console.warn(`Invalid state transition: ${oldState} -> ${newState}`);
        }
        // Notify listeners
        this.stateChangeCallbacks.forEach((callback) => callback(newState));
    }
    /**
     * Validate state transitions
     */
    isValidTransition(from, to) {
        const validTransitions = {
            IDLE: ['CREATING'],
            CREATING: ['WAITING_FOR_PLAYERS', 'ENDED'],
            WAITING_FOR_PLAYERS: ['CONNECTING', 'ENDED'],
            CONNECTING: ['SYNCING', 'RECONNECTING', 'ENDED'],
            SYNCING: ['IN_GAME', 'ENDED'],
            IN_GAME: ['PAUSED', 'RECONNECTING', 'ENDED'],
            PAUSED: ['IN_GAME', 'ENDED'],
            RECONNECTING: ['SYNCING', 'IN_GAME', 'ENDED'],
            ENDED: ['IDLE']
        };
        return validTransitions[from]?.includes(to) ?? false;
    }
    /**
     * Get current session
     */
    getSession() {
        return this.session;
    }
    /**
     * Get session state
     */
    getState() {
        return this.session?.status ?? 'IDLE';
    }
    /**
     * Check if session is active
     */
    isActive() {
        return this.session !== null && this.session.status !== 'ENDED';
    }
    /**
     * Check if session is expired
     */
    isExpired() {
        if (!this.session || !this.session.expiresAt) {
            return false;
        }
        return Date.now() > this.session.expiresAt;
    }
    /**
     * End the session
     */
    endSession() {
        this.updateState('ENDED');
        this.session = null;
    }
    /**
     * Register callback for state changes
     */
    onStateChange(callback) {
        this.stateChangeCallbacks.push(callback);
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Generate a unique participant ID
     */
    generateParticipantId() {
        return `participant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Latency Manager
 * Measures and tracks connection quality metrics
 */
class LatencyManager {
    latencyMeasurements = [];
    maxMeasurements = 20;
    pingInterval = null;
    onPingCallback;
    lastPingTimestamp = null;
    /**
     * Start periodic latency measurement
     */
    startMeasurement(intervalMs = 5000) {
        this.stopMeasurement();
        this.pingInterval = window.setInterval(() => {
            this.sendPing();
        }, intervalMs);
    }
    /**
     * Stop latency measurement
     */
    stopMeasurement() {
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    /**
     * Send a ping request
     */
    sendPing() {
        this.lastPingTimestamp = Date.now();
        if (this.onPingCallback) {
            this.onPingCallback();
        }
    }
    /**
     * Handle pong response
     */
    handlePong(timestamp) {
        if (this.lastPingTimestamp === null) {
            return;
        }
        const latency = Date.now() - timestamp;
        this.recordLatency(latency);
        this.lastPingTimestamp = null;
    }
    /**
     * Record a latency measurement
     */
    recordLatency(latency) {
        this.latencyMeasurements.push(latency);
        // Keep only recent measurements
        if (this.latencyMeasurements.length > this.maxMeasurements) {
            this.latencyMeasurements.shift();
        }
    }
    /**
     * Get average latency
     */
    getLatency() {
        if (this.latencyMeasurements.length === 0) {
            return 0;
        }
        const sum = this.latencyMeasurements.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.latencyMeasurements.length);
    }
    /**
     * Calculate jitter (variation in latency)
     */
    getJitter() {
        if (this.latencyMeasurements.length < 2) {
            return 0;
        }
        const avg = this.getLatency();
        const variance = this.latencyMeasurements.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
            this.latencyMeasurements.length;
        return Math.round(Math.sqrt(variance));
    }
    /**
     * Estimate packet loss (simplified)
     */
    getPacketLoss() {
        // In a real implementation, this would track actual packet loss
        // For now, we estimate based on latency consistency
        const jitter = this.getJitter();
        const latency = this.getLatency();
        if (jitter > latency * 0.5) {
            return 5; // High jitter suggests some packet loss
        }
        return 0;
    }
    /**
     * Get connection quality metrics
     */
    getConnectionQuality() {
        const latency = this.getLatency();
        const jitter = this.getJitter();
        const packetLoss = this.getPacketLoss();
        let quality = 'excellent';
        if (latency > 200 || jitter > 50 || packetLoss > 3) {
            quality = 'poor';
        }
        else if (latency > 150 || jitter > 30 || packetLoss > 1) {
            quality = 'fair';
        }
        else if (latency > 100 || jitter > 20) {
            quality = 'good';
        }
        return {
            latency,
            jitter,
            packetLoss,
            quality
        };
    }
    /**
     * Set callback for ping requests
     */
    onPing(callback) {
        this.onPingCallback = callback;
    }
    /**
     * Reset all measurements
     */
    reset() {
        this.latencyMeasurements = [];
        this.lastPingTimestamp = null;
    }
}

/**
 * Matchmaking Manager
 * Handles player queues and automatic session creation
 */
class MatchmakingManager {
    queue = new Map();
    matchFoundCallbacks = new Map();
    /**
     * Join matchmaking queue
     */
    joinQueue(entry) {
        const queueKey = this.getQueueKey(entry.gameId, entry.region);
        const queue = this.queue.get(queueKey) || [];
        // Check if already in queue
        if (queue.some((e) => e.userId === entry.userId)) {
            console.log('[Matchmaking] User already in queue:', entry.userId);
            return;
        }
        queue.push(entry);
        this.queue.set(queueKey, queue);
        console.log('[Matchmaking] User joined queue:', entry.userId, 'Queue size:', queue.length);
        // Try to find a match
        this.tryMatchmaking(queueKey);
    }
    /**
     * Leave matchmaking queue
     */
    leaveQueue(userId, gameId, region) {
        const queueKey = this.getQueueKey(gameId, region);
        const queue = this.queue.get(queueKey) || [];
        const filtered = queue.filter((e) => e.userId !== userId);
        this.queue.set(queueKey, filtered);
        console.log('[Matchmaking] User left queue:', userId);
    }
    /**
     * Register callback for when a match is found
     */
    onMatchFound(userId, callback) {
        this.matchFoundCallbacks.set(userId, callback);
    }
    /**
     * Try to create matches from the queue
     */
    tryMatchmaking(queueKey) {
        const queue = this.queue.get(queueKey) || [];
        // Simple 2-player matchmaking for now
        const minPlayers = 2;
        const maxPlayers = 4;
        if (queue.length >= minPlayers) {
            // Sort by skill rating if available
            queue.sort((a, b) => {
                if (a.skillRating && b.skillRating) {
                    return Math.abs(a.skillRating - b.skillRating);
                }
                return 0;
            });
            // Take the first batch of players
            const playersToMatch = queue.slice(0, maxPlayers);
            const remainingQueue = queue.slice(maxPlayers);
            this.queue.set(queueKey, remainingQueue);
            // Create a session for matched players
            this.createMatchedSession(playersToMatch);
        }
    }
    /**
     * Create a session for matched players
     */
    createMatchedSession(players) {
        if (players.length === 0)
            return;
        const gameId = players[0].gameId;
        const sessionId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const sessionConfig = {
            gameId,
            mode: 'host-authoritative',
            maxPlayers: 4,
            allowSpectators: true,
            visibility: 'public',
            matchmaking: true
        };
        const session = {
            id: sessionId,
            gameId,
            hostId: players[0].userId,
            mode: sessionConfig.mode,
            status: 'WAITING_FOR_PLAYERS',
            config: sessionConfig,
            participants: players.map((p, index) => ({
                id: `participant-${Date.now()}-${index}`,
                userId: p.userId,
                role: index === 0 ? 'host' : 'player',
                connectionStatus: 'connecting',
                user: p.user
            })),
            createdAt: Date.now()
        };
        console.log('[Matchmaking] Match created:', sessionId, 'Players:', players.length);
        // Notify all matched players
        const participantIds = players.map((p) => p.userId);
        players.forEach((player) => {
            const callback = this.matchFoundCallbacks.get(player.userId);
            if (callback) {
                callback(session, participantIds);
            }
        });
    }
    /**
     * Get queue key for grouping
     */
    getQueueKey(gameId, region) {
        return region ? `${gameId}-${region}` : gameId;
    }
    /**
     * Get current queue size
     */
    getQueueSize(gameId, region) {
        const queueKey = this.getQueueKey(gameId, region);
        return this.queue.get(queueKey)?.length || 0;
    }
    /**
     * Get queue position for a user
     */
    getQueuePosition(userId, gameId, region) {
        const queueKey = this.getQueueKey(gameId, region);
        const queue = this.queue.get(queueKey) || [];
        return queue.findIndex((e) => e.userId === userId) + 1; // 1-indexed
    }
}

/**
 * Abuse Prevention Manager
 * Implements rate limiting and spam protection
 */
class AbusePreventionManager {
    sessionCreationLimits = new Map();
    queueJoinLimits = new Map();
    activeSessions = new Map();
    // Configuration
    MAX_SESSION_CREATIONS_PER_HOUR = 10;
    MAX_QUEUE_JOINS_PER_MINUTE = 5;
    MAX_CONCURRENT_SESSIONS = 3;
    RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
    QUEUE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
    BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
    /**
     * Check if user can create a session
     */
    canCreateSession(userId) {
        // Check concurrent sessions
        const userSessions = this.activeSessions.get(userId);
        if (userSessions && userSessions.size >= this.MAX_CONCURRENT_SESSIONS) {
            return {
                allowed: false,
                reason: `Maximum ${this.MAX_CONCURRENT_SESSIONS} concurrent sessions reached`
            };
        }
        // Check rate limit
        const limit = this.sessionCreationLimits.get(userId);
        if (limit) {
            // Check if blocked
            if (limit.blocked && Date.now() - limit.firstAttempt < this.BLOCK_DURATION_MS) {
                return {
                    allowed: false,
                    reason: 'Temporarily blocked due to excessive session creation'
                };
            }
            // Check if within window
            if (Date.now() - limit.firstAttempt < this.RATE_LIMIT_WINDOW_MS) {
                if (limit.count >= this.MAX_SESSION_CREATIONS_PER_HOUR) {
                    // Block user
                    limit.blocked = true;
                    return {
                        allowed: false,
                        reason: `Rate limit exceeded: ${this.MAX_SESSION_CREATIONS_PER_HOUR} sessions per hour`
                    };
                }
            }
            else {
                // Reset window
                this.sessionCreationLimits.delete(userId);
            }
        }
        return { allowed: true };
    }
    /**
     * Record session creation
     */
    recordSessionCreation(userId, sessionId) {
        const limit = this.sessionCreationLimits.get(userId) || {
            count: 0,
            firstAttempt: Date.now(),
            blocked: false
        };
        limit.count++;
        this.sessionCreationLimits.set(userId, limit);
        // Track active session
        const sessions = this.activeSessions.get(userId) || new Set();
        sessions.add(sessionId);
        this.activeSessions.set(userId, sessions);
        console.log('[AbusePrevention] Session created by', userId, '- Count:', limit.count);
    }
    /**
     * Record session end
     */
    recordSessionEnd(userId, sessionId) {
        const sessions = this.activeSessions.get(userId);
        if (sessions) {
            sessions.delete(sessionId);
            if (sessions.size === 0) {
                this.activeSessions.delete(userId);
            }
        }
    }
    /**
     * Check if user can join matchmaking queue
     */
    canJoinQueue(userId) {
        const limit = this.queueJoinLimits.get(userId);
        if (limit) {
            // Check if blocked
            if (limit.blocked && Date.now() - limit.firstAttempt < this.BLOCK_DURATION_MS) {
                return {
                    allowed: false,
                    reason: 'Temporarily blocked due to queue spam'
                };
            }
            // Check if within window
            if (Date.now() - limit.firstAttempt < this.QUEUE_LIMIT_WINDOW_MS) {
                if (limit.count >= this.MAX_QUEUE_JOINS_PER_MINUTE) {
                    // Block user
                    limit.blocked = true;
                    return {
                        allowed: false,
                        reason: `Rate limit exceeded: ${this.MAX_QUEUE_JOINS_PER_MINUTE} queue joins per minute`
                    };
                }
            }
            else {
                // Reset window
                this.queueJoinLimits.delete(userId);
            }
        }
        return { allowed: true };
    }
    /**
     * Record queue join
     */
    recordQueueJoin(userId) {
        const limit = this.queueJoinLimits.get(userId) || {
            count: 0,
            firstAttempt: Date.now(),
            blocked: false
        };
        limit.count++;
        this.queueJoinLimits.set(userId, limit);
        console.log('[AbusePrevention] Queue join by', userId, '- Count:', limit.count);
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        // Clean session limits
        for (const [userId, limit] of this.sessionCreationLimits.entries()) {
            if (now - limit.firstAttempt > this.RATE_LIMIT_WINDOW_MS + this.BLOCK_DURATION_MS) {
                this.sessionCreationLimits.delete(userId);
            }
        }
        // Clean queue limits
        for (const [userId, limit] of this.queueJoinLimits.entries()) {
            if (now - limit.firstAttempt > this.QUEUE_LIMIT_WINDOW_MS + this.BLOCK_DURATION_MS) {
                this.queueJoinLimits.delete(userId);
            }
        }
        console.log('[AbusePrevention] Cleanup completed');
    }
    /**
     * Get user stats
     */
    getUserStats(userId) {
        return {
            sessionCreations: this.sessionCreationLimits.get(userId),
            queueJoins: this.queueJoinLimits.get(userId),
            activeSessions: this.activeSessions.get(userId)?.size || 0
        };
    }
}

/**
 * URL Join System
 * Handles session joining via URL with secure tokens
 */
class URLJoinManager {
    SECRET_KEY = 'stacklive-multiplayer-secret'; // In production, use env variable
    /**
     * Generate a join link for a session
     */
    generateJoinLink(baseUrl, sessionId, role = 'player', expiresInMinutes = 60) {
        const token = this.createToken(sessionId, role, expiresInMinutes);
        const encodedToken = this.encodeToken(token);
        return `${baseUrl}?session=${sessionId}&token=${encodedToken}`;
    }
    /**
     * Parse and validate a join link
     */
    parseJoinLink(url) {
        try {
            const urlObj = new URL(url);
            const sessionId = urlObj.searchParams.get('session');
            const tokenParam = urlObj.searchParams.get('token');
            if (!sessionId || !tokenParam) {
                return null;
            }
            const token = this.decodeToken(tokenParam);
            if (!token) {
                return null;
            }
            // Validate token
            if (!this.validateToken(token, sessionId)) {
                return null;
            }
            return { sessionId, token };
        }
        catch (error) {
            console.error('[URLJoin] Failed to parse join link:', error);
            return null;
        }
    }
    /**
     * Extract session ID from URL search params
     */
    getSessionIdFromURL(searchParams) {
        return searchParams.get('session');
    }
    /**
     * Extract and validate token from URL
     */
    getTokenFromURL(searchParams) {
        const tokenParam = searchParams.get('token');
        if (!tokenParam) {
            return null;
        }
        return this.decodeToken(tokenParam);
    }
    /**
     * Create a join token
     */
    createToken(sessionId, role, expiresInMinutes) {
        const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
        const data = `${sessionId}:${role}:${expiresAt}`;
        const signature = this.sign(data);
        return {
            sessionId,
            role,
            expiresAt,
            signature
        };
    }
    /**
     * Validate a token
     */
    validateToken(token, sessionId) {
        // Check expiration
        if (Date.now() > token.expiresAt) {
            console.log('[URLJoin] Token expired');
            return false;
        }
        // Check session ID match
        if (token.sessionId !== sessionId) {
            console.log('[URLJoin] Session ID mismatch');
            return false;
        }
        // Verify signature
        const data = `${token.sessionId}:${token.role}:${token.expiresAt}`;
        const expectedSignature = this.sign(data);
        if (token.signature !== expectedSignature) {
            console.log('[URLJoin] Invalid signature');
            return false;
        }
        return true;
    }
    /**
     * Sign data with secret key
     */
    sign(data) {
        // Simple signing - in production, use proper HMAC
        // This is just for demonstration
        let hash = 0;
        const str = data + this.SECRET_KEY;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }
    /**
     * Encode token to URL-safe string
     */
    encodeToken(token) {
        try {
            const json = JSON.stringify(token);
            return btoa(json)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        }
        catch (error) {
            console.error('[URLJoin] Failed to encode token:', error);
            return '';
        }
    }
    /**
     * Decode token from URL-safe string
     */
    decodeToken(encoded) {
        try {
            const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
            const json = atob(padded);
            return JSON.parse(json);
        }
        catch (error) {
            console.error('[URLJoin] Failed to decode token:', error);
            return null;
        }
    }
}

/**
 * Signaling Adapter for StackLive Multiplayer
 * Provides abstraction for signaling server communication
 * Currently mock implementation - ready for Convex integration
 */
/**
 * Mock Signaling Adapter
 * In-memory implementation for development/testing
 * Replace with ConvexSignalingAdapter for production
 */
class MockSignalingAdapter {
    sessions = new Map();
    signals = new Map();
    subscribers = new Map();
    async createSession(session) {
        this.sessions.set(session.id, session);
        this.signals.set(session.id, []);
        console.log('[MockSignaling] Session created:', session.id);
    }
    async getSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }
    async updateSession(session) {
        this.sessions.set(session.id, session);
        console.log('[MockSignaling] Session updated:', session.id);
    }
    async deleteSession(sessionId) {
        this.sessions.delete(sessionId);
        this.signals.delete(sessionId);
        this.subscribers.delete(sessionId);
        console.log('[MockSignaling] Session deleted:', sessionId);
    }
    async sendSignal(message) {
        const signals = this.signals.get(message.sessionId) || [];
        signals.push(message);
        this.signals.set(message.sessionId, signals);
        // Notify subscribers
        const callbacks = this.subscribers.get(message.sessionId) || [];
        callbacks.forEach((callback) => {
            // Only send to the intended recipient
            if (callback) {
                callback(message);
            }
        });
        console.log('[MockSignaling] Signal sent:', message.type, 'from', message.from, 'to', message.to);
    }
    subscribeToSignals(sessionId, userId, callback) {
        const callbacks = this.subscribers.get(sessionId) || [];
        const wrappedCallback = (message) => {
            // Only deliver messages intended for this user
            if (message.to === userId) {
                callback(message);
            }
        };
        callbacks.push(wrappedCallback);
        this.subscribers.set(sessionId, callbacks);
        console.log('[MockSignaling] Subscribed to signals:', sessionId, userId);
        // Return unsubscribe function
        return () => {
            const idx = callbacks.indexOf(wrappedCallback);
            if (idx > -1) {
                callbacks.splice(idx, 1);
            }
            console.log('[MockSignaling] Unsubscribed from signals:', sessionId, userId);
        };
    }
    async addParticipant(sessionId, participant) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.participants.push(participant);
            await this.updateSession(session);
        }
    }
    async removeParticipant(sessionId, userId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.participants = session.participants.filter((p) => p.userId !== userId);
            await this.updateSession(session);
        }
    }
    // Helper methods for development
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    getPublicSessions() {
        return this.getAllSessions().filter((s) => s.config.visibility === 'public');
    }
}

/**
 * StackLive Multiplayer Runtime (SMR)
 * Core runtime engine for multiplayer functionality
 */
class StackLiveMultiplayerRuntime {
    config;
    peerManager;
    sessionManager;
    latencyManager;
    matchmakingManager;
    abusePreventionManager;
    urlJoinManager;
    signalingAdapter;
    userId;
    user;
    eventCallbacks = new Map();
    inputCallback;
    stateSyncCallback;
    debugMode;
    cleanupInterval;
    constructor(config, userId, user) {
        this.config = {
            mode: 'host-authoritative',
            matchmaking: false,
            spectators: false,
            screenShare: false,
            maxPlayers: 4,
            debug: false,
            ...config
        };
        this.debugMode = this.config.debug ?? false;
        this.userId = userId ?? this.generateUserId();
        this.user = user ?? {
            id: this.userId,
            name: `Player-${this.userId.substring(0, 8)}`
        };
        // Initialize managers
        const rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        this.peerManager = new PeerConnectionManager(rtcConfig);
        this.sessionManager = new SessionManager();
        this.latencyManager = new LatencyManager();
        this.matchmakingManager = new MatchmakingManager();
        this.abusePreventionManager = new AbusePreventionManager();
        this.urlJoinManager = new URLJoinManager();
        this.signalingAdapter = new MockSignalingAdapter();
        this.setupEventHandlers();
        this.log('Multiplayer runtime initialized', this.config);
    }
    /**
     * Create a new multiplayer session as host
     */
    async createSession() {
        this.log('Creating session...');
        const sessionConfig = {
            gameId: this.config.gameId,
            embedId: this.config.embedId,
            type: this.config.type,
            mode: this.config.mode ?? 'host-authoritative',
            maxPlayers: this.config.maxPlayers ?? 4,
            allowSpectators: this.config.spectators ?? false,
            visibility: 'public',
            matchmaking: this.config.matchmaking,
            screenShare: this.config.screenShare,
            video: this.config.video,
            audio: this.config.audio
        };
        const session = this.sessionManager.createSession(sessionConfig, this.userId);
        // Initialize peer connection
        await this.peerManager.createPeerConnection();
        this.peerManager.createDataChannel('game-data');
        this.emitEvent('gameStart', { session });
        return session;
    }
    /**
     * Join an existing session
     */
    async joinSession(sessionId) {
        this.log('Joining session:', sessionId);
        const participant = this.sessionManager.joinSession(sessionId, this.userId);
        if (!participant) {
            this.log('Failed to join session');
            return null;
        }
        // Initialize peer connection
        await this.peerManager.createPeerConnection();
        this.emitEvent('playerJoined', { participant });
        return participant;
    }
    /**
     * Send input to other players
     */
    sendInput(payload) {
        const message = {
            type: 'input',
            frame: Date.now(),
            payload
        };
        this.peerManager.sendMessage(message);
        this.log('Sent input:', payload);
    }
    /**
     * Send state synchronization
     */
    sendState(payload) {
        const message = {
            type: 'state',
            payload
        };
        this.peerManager.sendMessage(message);
        this.log('Sent state:', payload);
    }
    /**
     * Request state sync from host
     */
    requestStateSync() {
        const message = {
            type: 'sync-request'
        };
        this.peerManager.sendMessage(message);
        this.log('Requested state sync');
    }
    /**
     * Leave the current session
     */
    leaveSession() {
        this.log('Leaving session...');
        this.sessionManager.leaveSession(this.userId);
        this.peerManager.closePeerConnection();
        this.latencyManager.stopMeasurement();
        this.emitEvent('gameEnd');
    }
    /**
     * Get current latency
     */
    getLatency() {
        return this.latencyManager.getLatency();
    }
    /**
     * Get connection quality metrics
     */
    getConnectionQuality() {
        return this.latencyManager.getConnectionQuality();
    }
    /**
     * Register callback for lifecycle events
     */
    on(eventType, callback) {
        if (!this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.set(eventType, []);
        }
        this.eventCallbacks.get(eventType).push(callback);
    }
    /**
     * Register callback for input events
     */
    onInput(callback) {
        this.inputCallback = callback;
    }
    /**
     * Register callback for state sync events
     */
    onStateSync(callback) {
        this.stateSyncCallback = callback;
    }
    /**
     * Get current session
     */
    getSession() {
        return this.sessionManager.getSession();
    }
    /**
     * Check if user is host
     */
    isHost() {
        const session = this.sessionManager.getSession();
        return session?.hostId === this.userId;
    }
    /**
     * Get local user ID
     */
    getLocalUserId() {
        return this.userId;
    }
    /**
     * Get local user information
     */
    getLocalUser() {
        return this.user;
    }
    /**
     * Setup event handlers for internal managers
     */
    setupEventHandlers() {
        // Handle incoming messages
        this.peerManager.onMessage((message) => {
            this.handleMessage(message);
        });
        // Handle connection state changes
        this.peerManager.onConnectionStateChange((state) => {
            this.log('Connection state:', state);
            if (state === 'connected') {
                this.sessionManager.updateParticipantStatus(this.userId, 'connected');
                this.latencyManager.startMeasurement();
            }
            else if (state === 'disconnected' || state === 'failed') {
                this.sessionManager.updateParticipantStatus(this.userId, 'disconnected');
                this.emitEvent('connectionLost');
            }
        });
        // Handle session state changes
        this.sessionManager.onStateChange((state) => {
            this.log('Session state:', state);
            this.emitEvent('stateChanged', { state });
        });
        // Handle ping requests
        this.latencyManager.onPing(() => {
            const message = {
                type: 'ping',
                ts: Date.now()
            };
            this.peerManager.sendMessage(message);
        });
    }
    /**
     * Handle incoming messages
     */
    handleMessage(message) {
        this.log('Received message:', message);
        switch (message.type) {
            case 'input':
                if (this.inputCallback) {
                    this.inputCallback(message.payload);
                }
                break;
            case 'state':
            case 'sync-response':
                if (this.stateSyncCallback) {
                    this.stateSyncCallback(message.payload);
                }
                break;
            case 'sync-request':
                // Host should respond with current state
                if (this.isHost() && this.stateSyncCallback) {
                    // State will be sent by the game implementation
                    this.emitEvent('stateChanged', { syncRequested: true });
                }
                break;
            case 'ping':
                // Respond with pong
                const pongMessage = {
                    type: 'pong',
                    ts: message.ts
                };
                this.peerManager.sendMessage(pongMessage);
                break;
            case 'pong':
                this.latencyManager.handlePong(message.ts);
                break;
            case 'lobby-update':
                this.emitEvent('playerJoined', { players: message.players });
                break;
            case 'presence':
                this.emitEvent('playerJoined', { user: message.user });
                break;
        }
    }
    /**
     * Emit a lifecycle event
     */
    emitEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: Date.now()
        };
        const callbacks = this.eventCallbacks.get(type);
        if (callbacks) {
            callbacks.forEach((callback) => callback(data));
        }
        this.log('Event emitted:', event);
    }
    /**
     * Log debug messages
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[SMR]', ...args);
        }
    }
    /**
     * Generate a unique user ID
     */
    generateUserId() {
        return `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Cleanup and destroy the runtime
     */
    destroy() {
        this.log('Destroying runtime...');
        this.leaveSession();
        this.eventCallbacks.clear();
        this.inputCallback = undefined;
        this.stateSyncCallback = undefined;
    }
}

export { StackLiveMultiplayerRuntime as S, ensure_array_like as e };
//# sourceMappingURL=StackLiveMultiplayerRuntime-S5LYZDT9.js.map
