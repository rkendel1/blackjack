/**
 * Convex Mutations
 * Write operations for the multiplayer backend
 */

import type {
	SessionSchema,
	ParticipantSchema,
	SignalingMessageSchema,
	MatchmakingQueueSchema,
	SessionEventSchema,
	UserPresenceSchema,
	RateLimitSchema
} from './schema';
import type { AuthorityMode, SessionState, ParticipantRole } from '../types';

/**
 * Mutation: Create a new session
 */
export interface CreateSessionArgs {
	sessionId: string;
	gameId: string;
	hostId: string;
	hostName: string;
	mode: AuthorityMode;
	maxPlayers: number;
	allowSpectators: boolean;
	visibility: 'public' | 'private';
	matchmaking: boolean;
}

export async function createSession(args: CreateSessionArgs): Promise<string> {
	// In actual Convex: ctx.db.insert("sessions", {...})
	const now = Date.now();

	const session: Omit<SessionSchema, '_id' | '_creationTime'> = {
		sessionId: args.sessionId,
		gameId: args.gameId,
		hostId: args.hostId,
		mode: args.mode,
		status: 'CREATING',
		maxPlayers: args.maxPlayers,
		allowSpectators: args.allowSpectators,
		visibility: args.visibility,
		matchmaking: args.matchmaking,
		createdAt: now,
		expiresAt: now + 3600000, // 1 hour
		lastActivity: now
	};

	// Create host participant
	const hostParticipant: Omit<ParticipantSchema, '_id' | '_creationTime'> = {
		sessionId: args.sessionId,
		userId: args.hostId,
		userName: args.hostName,
		role: 'host',
		connectionStatus: 'disconnected',
		joinedAt: now,
		lastSeen: now
	};

	// Log session creation event
	const event: Omit<SessionEventSchema, '_id' | '_creationTime'> = {
		sessionId: args.sessionId,
		eventType: 'session_created',
		data: JSON.stringify({ hostId: args.hostId, gameId: args.gameId }),
		timestamp: now
	};

	console.log('[Convex] Creating session:', args.sessionId);

	return args.sessionId;
}

/**
 * Mutation: Update session status
 */
export interface UpdateSessionStatusArgs {
	sessionId: string;
	status: SessionState;
}

export async function updateSessionStatus(args: UpdateSessionStatusArgs): Promise<void> {
	// In actual Convex: ctx.db.patch(sessionDocId, { status: args.status })
	console.log('[Convex] Updating session status:', args.sessionId, args.status);
}

/**
 * Mutation: Join a session
 */
export interface JoinSessionArgs {
	sessionId: string;
	userId: string;
	userName: string;
	userAvatar?: string;
	role: ParticipantRole;
}

export async function joinSession(args: JoinSessionArgs): Promise<string> {
	// In actual Convex:
	// 1. Check session exists and has space
	// 2. Check user not already in session
	// 3. Insert participant

	const now = Date.now();

	const participant: Omit<ParticipantSchema, '_id' | '_creationTime'> = {
		sessionId: args.sessionId,
		userId: args.userId,
		userName: args.userName,
		userAvatar: args.userAvatar,
		role: args.role,
		connectionStatus: 'connecting',
		joinedAt: now,
		lastSeen: now
	};

	// Log join event
	const event: Omit<SessionEventSchema, '_id' | '_creationTime'> = {
		sessionId: args.sessionId,
		eventType: 'player_joined',
		data: JSON.stringify({ userId: args.userId, role: args.role }),
		timestamp: now
	};

	console.log('[Convex] User joined session:', args.userId, args.sessionId);

	return 'participant-id';
}

/**
 * Mutation: Leave a session
 */
export interface LeaveSessionArgs {
	sessionId: string;
	userId: string;
}

export async function leaveSession(args: LeaveSessionArgs): Promise<void> {
	// In actual Convex:
	// 1. Remove participant
	// 2. If host left, promote new host or end session
	// 3. Log event

	const event: Omit<SessionEventSchema, '_id' | '_creationTime'> = {
		sessionId: args.sessionId,
		eventType: 'player_left',
		data: JSON.stringify({ userId: args.userId }),
		timestamp: Date.now()
	};

	console.log('[Convex] User left session:', args.userId, args.sessionId);
}

/**
 * Mutation: Update participant connection status
 */
export interface UpdateParticipantStatusArgs {
	sessionId: string;
	userId: string;
	connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
	latency?: number;
}

export async function updateParticipantStatus(args: UpdateParticipantStatusArgs): Promise<void> {
	// In actual Convex: ctx.db.patch(participantDocId, { ... })
	console.log('[Convex] Updating participant status:', args.userId, args.connectionStatus);
}

/**
 * Mutation: Send WebRTC signaling message
 */
export interface SendSignalingMessageArgs {
	sessionId: string;
	from: string;
	to: string;
	type: 'offer' | 'answer' | 'candidate';
	payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export async function sendSignalingMessage(args: SendSignalingMessageArgs): Promise<string> {
	// In actual Convex: ctx.db.insert("signaling_messages", {...})

	const message: Omit<SignalingMessageSchema, '_id' | '_creationTime'> = {
		sessionId: args.sessionId,
		from: args.from,
		to: args.to,
		type: args.type,
		payload: JSON.stringify(args.payload),
		delivered: false,
		expiresAt: Date.now() + 300000 // 5 minutes
	};

	console.log('[Convex] Sending signaling message:', args.type, 'from', args.from, 'to', args.to);

	return 'message-id';
}

/**
 * Mutation: Mark signaling message as delivered
 */
export interface MarkMessageDeliveredArgs {
	messageId: string;
}

export async function markMessageDelivered(args: MarkMessageDeliveredArgs): Promise<void> {
	// In actual Convex: ctx.db.patch(messageId, { delivered: true })
	console.log('[Convex] Message delivered:', args.messageId);
}

/**
 * Mutation: Join matchmaking queue
 */
export interface JoinMatchmakingArgs {
	userId: string;
	userName: string;
	userAvatar?: string;
	gameId: string;
	region?: string;
	skillRating?: number;
}

export async function joinMatchmaking(args: JoinMatchmakingArgs): Promise<string> {
	// In actual Convex: ctx.db.insert("matchmaking_queue", {...})

	const queueEntry: Omit<MatchmakingQueueSchema, '_id' | '_creationTime'> = {
		userId: args.userId,
		userName: args.userName,
		userAvatar: args.userAvatar,
		gameId: args.gameId,
		region: args.region,
		skillRating: args.skillRating,
		timestamp: Date.now(),
		expiresAt: Date.now() + 600000 // 10 minutes
	};

	console.log('[Convex] User joined matchmaking:', args.userId, args.gameId);

	return 'queue-entry-id';
}

/**
 * Mutation: Leave matchmaking queue
 */
export interface LeaveMatchmakingArgs {
	userId: string;
	gameId: string;
}

export async function leaveMatchmaking(args: LeaveMatchmakingArgs): Promise<void> {
	// In actual Convex: ctx.db.delete(queueEntryId)
	console.log('[Convex] User left matchmaking:', args.userId, args.gameId);
}

/**
 * Mutation: Update user presence
 */
export interface UpdatePresenceArgs {
	userId: string;
	userName: string;
	sessionId?: string;
	status: 'online' | 'in-game' | 'offline';
}

export async function updatePresence(args: UpdatePresenceArgs): Promise<void> {
	// In actual Convex: upsert user presence

	const presence: Omit<UserPresenceSchema, '_id' | '_creationTime'> = {
		userId: args.userId,
		userName: args.userName,
		sessionId: args.sessionId,
		status: args.status,
		lastSeen: Date.now()
	};

	console.log('[Convex] Updated presence:', args.userId, args.status);
}

/**
 * Mutation: Record rate limit action
 */
export interface RecordRateLimitArgs {
	userId: string;
	action: 'session_create' | 'queue_join' | 'message_send';
}

export async function recordRateLimit(args: RecordRateLimitArgs): Promise<void> {
	// In actual Convex: increment count or create new entry
	console.log('[Convex] Recorded rate limit:', args.userId, args.action);
}

/**
 * Mutation: End session
 */
export interface EndSessionArgs {
	sessionId: string;
	reason?: string;
}

export async function endSession(args: EndSessionArgs): Promise<void> {
	// In actual Convex:
	// 1. Update session status to ENDED
	// 2. Remove all participants
	// 3. Log event

	const event: Omit<SessionEventSchema, '_id' | '_creationTime'> = {
		sessionId: args.sessionId,
		eventType: 'session_ended',
		data: JSON.stringify({ reason: args.reason }),
		timestamp: Date.now()
	};

	console.log('[Convex] Session ended:', args.sessionId, args.reason);
}

/**
 * Mutation: Cleanup expired data
 * This would be a scheduled function in Convex
 */
export async function cleanupExpiredData(): Promise<void> {
	// In actual Convex:
	// 1. Delete expired sessions
	// 2. Delete expired signaling messages
	// 3. Delete expired matchmaking entries
	// 4. Delete old session events

	const now = Date.now();
	console.log('[Convex] Cleanup job executed at', now);
}
