/**
 * Convex Schema Definitions
 * These define the database schema for Convex backend
 */

import type {
	AuthorityMode,
	SessionState,
	SessionType,
	ParticipantRole,
	ConnectionStatus,
	InteractionType
} from '../types';

/**
 * Sessions Table Schema
 * Stores all multiplayer game sessions
 */
export interface SessionSchema {
	_id: string;
	_creationTime: number;
	sessionId: string;
	gameId?: string; // Optional for non-game embeds
	embedId?: string; // Unique identifier for the embed
	type?: SessionType; // Type of session (game, class, quiz, poll, etc.)
	hostId: string;
	mode: AuthorityMode;
	status: SessionState;
	maxPlayers: number;
	allowSpectators: boolean;
	visibility: 'public' | 'private';
	matchmaking: boolean;
	video?: boolean; // Video streaming enabled
	audio?: boolean; // Audio streaming enabled
	createdAt: number;
	expiresAt: number;
	lastActivity: number;
}

/**
 * Participants Table Schema
 * Stores participants in each session
 */
export interface ParticipantSchema {
	_id: string;
	_creationTime: number;
	sessionId: string;
	userId: string;
	userName: string;
	userAvatar?: string;
	role: ParticipantRole;
	connectionStatus: ConnectionStatus;
	latency?: number;
	joinedAt: number;
	lastSeen: number;
}

/**
 * Signaling Messages Table Schema
 * Stores WebRTC signaling messages for peer connection setup
 */
export interface SignalingMessageSchema {
	_id: string;
	_creationTime: number;
	sessionId: string;
	from: string;
	to: string;
	type: 'offer' | 'answer' | 'candidate';
	payload: string; // JSON stringified RTCSessionDescriptionInit or RTCIceCandidateInit
	delivered: boolean;
	expiresAt: number;
}

/**
 * Interactions Table Schema
 * Stores interactive messages (polls, quizzes, reactions, snaps)
 */
export interface InteractionSchema {
	_id: string;
	_creationTime: number;
	sessionId: string;
	fromUserId: string;
	type: InteractionType;
	payload: string; // JSON stringified interaction data
	timestamp: number;
	expiresAt?: number;
}

/**
 * Matchmaking Queue Table Schema
 * Stores players waiting for matchmaking
 */
export interface MatchmakingQueueSchema {
	_id: string;
	_creationTime: number;
	userId: string;
	userName: string;
	userAvatar?: string;
	gameId: string;
	region?: string;
	skillRating?: number;
	timestamp: number;
	expiresAt: number;
}

/**
 * Session Events Table Schema
 * Stores events for session history and debugging
 */
export interface SessionEventSchema {
	_id: string;
	_creationTime: number;
	sessionId: string;
	eventType: string;
	data: string; // JSON stringified event data
	timestamp: number;
}

/**
 * User Presence Table Schema
 * Tracks online users and their current sessions
 */
export interface UserPresenceSchema {
	_id: string;
	_creationTime: number;
	userId: string;
	userName: string;
	sessionId?: string;
	status: 'online' | 'in-game' | 'offline';
	lastSeen: number;
}

/**
 * Rate Limit Table Schema
 * Tracks user actions for abuse prevention
 */
export interface RateLimitSchema {
	_id: string;
	_creationTime: number;
	userId: string;
	action: 'session_create' | 'queue_join' | 'message_send';
	count: number;
	windowStart: number;
	blocked: boolean;
	blockedUntil?: number;
}

/**
 * Convex Schema Definition
 * This would be used in convex/schema.ts when Convex is integrated
 */
export const convexSchema = {
	sessions: {
		indexes: {
			by_session_id: ['sessionId'],
			by_game_id: ['gameId'],
			by_embed_id: ['embedId'],
			by_host_id: ['hostId'],
			by_status: ['status'],
			by_type: ['type'],
			by_visibility: ['visibility'],
			by_expiration: ['expiresAt']
		}
	},
	participants: {
		indexes: {
			by_session_id: ['sessionId'],
			by_user_id: ['userId'],
			by_session_and_user: ['sessionId', 'userId']
		}
	},
	signaling_messages: {
		indexes: {
			by_session_id: ['sessionId'],
			by_recipient: ['to'],
			by_session_and_recipient: ['sessionId', 'to'],
			by_expiration: ['expiresAt']
		}
	},
	interactions: {
		indexes: {
			by_session_id: ['sessionId'],
			by_type: ['type'],
			by_user_id: ['fromUserId'],
			by_session_and_type: ['sessionId', 'type'],
			by_timestamp: ['timestamp'],
			by_expiration: ['expiresAt']
		}
	},
	matchmaking_queue: {
		indexes: {
			by_game_id: ['gameId'],
			by_user_id: ['userId'],
			by_game_and_region: ['gameId', 'region'],
			by_expiration: ['expiresAt']
		}
	},
	session_events: {
		indexes: {
			by_session_id: ['sessionId'],
			by_timestamp: ['timestamp']
		}
	},
	user_presence: {
		indexes: {
			by_user_id: ['userId'],
			by_session_id: ['sessionId'],
			by_status: ['status']
		}
	},
	rate_limits: {
		indexes: {
			by_user_id: ['userId'],
			by_user_and_action: ['userId', 'action']
		}
	}
};

/**
 * Helper types for Convex operations
 */
export type ConvexId = string;

export type ConvexDocument<T> = T & {
	_id: ConvexId;
	_creationTime: number;
};

export type SessionDocument = ConvexDocument<SessionSchema>;
export type ParticipantDocument = ConvexDocument<ParticipantSchema>;
export type SignalingMessageDocument = ConvexDocument<SignalingMessageSchema>;
export type InteractionDocument = ConvexDocument<InteractionSchema>;
export type MatchmakingQueueDocument = ConvexDocument<MatchmakingQueueSchema>;
export type SessionEventDocument = ConvexDocument<SessionEventSchema>;
export type UserPresenceDocument = ConvexDocument<UserPresenceSchema>;
export type RateLimitDocument = ConvexDocument<RateLimitSchema>;
