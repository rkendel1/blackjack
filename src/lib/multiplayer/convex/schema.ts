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
 * Messages Table Schema
 * Stores text and media messages for sessions
 */
export interface MessageSchema {
	_id: string;
	_creationTime: number;
	sessionId: string;
	fromUserId: string;
	type: 'chat' | 'reaction' | 'pollResponse' | 'snap' | 'media';
	payload: string; // JSON stringified message data or text content
	mediaUrl?: string;
	mediaType?: string; // MIME type, e.g., "image/jpeg", "video/mp4"
	timestamp: number;
}

/**
 * Contacts Table Schema
 * Stores user contact information
 */
export interface ContactSchema {
	_id: string;
	_creationTime: number;
	userId: string;
	name: string;
	avatarUrl?: string;
	online: boolean;
	lastActive: number;
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
 * Avatar Table Schema
 * Stores user avatars for AR/VR sessions
 */
export interface AvatarSchema {
	_id: string;
	_creationTime: number;
	userId: string;
	sessionId?: string;
	avatarModel: string; // URL to glTF or USDZ file
	customizations: string; // JSON stringified customization data
	transform?: string; // JSON stringified transform (position, rotation, scale)
	lastUsed: number;
	createdAt: number;
}

/**
 * Filter Table Schema
 * Stores AR filter configurations and state
 */
export interface FilterSchema {
	_id: string;
	_creationTime: number;
	filterId: string;
	name: string;
	type: 'face' | 'body' | 'environment' | 'object';
	category?: 'beauty' | 'fun' | 'artistic' | 'seasonal' | 'brand';
	assetUrl?: string;
	thumbnailUrl?: string;
	parameters?: string; // JSON stringified parameters
	deviceCompatibility?: string; // JSON stringified array
	createdAt: number;
}

/**
 * Spatial Interaction Table Schema
 * Stores spatial interactions in AR/VR sessions
 */
export interface SpatialInteractionSchema {
	_id: string;
	_creationTime: number;
	sessionId: string;
	userId: string;
	interactionType: 'place' | 'move' | 'rotate' | 'scale' | 'grab' | 'point' | 'draw';
	objectId?: string;
	spatialData: string; // JSON stringified spatial data (position, rotation, etc.)
	timestamp: number;
	expiresAt?: number;
}

/**
 * Gesture Data Table Schema
 * Stores gesture detection data for sessions
 */
export interface GestureDataSchema {
	_id: string;
	_creationTime: number;
	sessionId: string;
	userId: string;
	gestureType: 'hand' | 'face' | 'body' | 'pose';
	gesture?: string; // recognized gesture name
	landmarks?: string; // JSON stringified landmark data
	confidence?: number;
	timestamp: number;
}

/**
 * ARVR Session Table Schema
 * Tracks AR/VR session state and capabilities
 */
export interface ARVRSessionSchema {
	_id: string;
	_creationTime: number;
	sessionId: string;
	mode: 'ar' | 'vr';
	active: boolean;
	avatarEnabled: boolean;
	filtersEnabled: boolean;
	spatialEnabled: boolean;
	gestureDetectionEnabled: boolean;
	participants: string; // JSON stringified participant IDs
	startedAt: number;
	endedAt?: number;
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
	messages: {
		indexes: {
			by_session_id: ['sessionId'],
			by_type: ['type'],
			by_user_id: ['fromUserId'],
			by_session_and_type: ['sessionId', 'type'],
			by_timestamp: ['timestamp']
		}
	},
	contacts: {
		indexes: {
			by_user_id: ['userId'],
			by_online: ['online'],
			by_last_active: ['lastActive']
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
	},
	avatars: {
		indexes: {
			by_user_id: ['userId'],
			by_session_id: ['sessionId'],
			by_last_used: ['lastUsed']
		}
	},
	filters: {
		indexes: {
			by_filter_id: ['filterId'],
			by_type: ['type'],
			by_category: ['category']
		}
	},
	spatial_interactions: {
		indexes: {
			by_session_id: ['sessionId'],
			by_user_id: ['userId'],
			by_interaction_type: ['interactionType'],
			by_timestamp: ['timestamp'],
			by_expiration: ['expiresAt']
		}
	},
	gesture_data: {
		indexes: {
			by_session_id: ['sessionId'],
			by_user_id: ['userId'],
			by_gesture_type: ['gestureType'],
			by_timestamp: ['timestamp']
		}
	},
	arvr_sessions: {
		indexes: {
			by_session_id: ['sessionId'],
			by_mode: ['mode'],
			by_active: ['active'],
			by_started_at: ['startedAt']
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
export type MessageDocument = ConvexDocument<MessageSchema>;
export type ContactDocument = ConvexDocument<ContactSchema>;
export type MatchmakingQueueDocument = ConvexDocument<MatchmakingQueueSchema>;
export type SessionEventDocument = ConvexDocument<SessionEventSchema>;
export type UserPresenceDocument = ConvexDocument<UserPresenceSchema>;
export type RateLimitDocument = ConvexDocument<RateLimitSchema>;
export type AvatarDocument = ConvexDocument<AvatarSchema>;
export type FilterDocument = ConvexDocument<FilterSchema>;
export type SpatialInteractionDocument = ConvexDocument<SpatialInteractionSchema>;
export type GestureDataDocument = ConvexDocument<GestureDataSchema>;
export type ARVRSessionDocument = ConvexDocument<ARVRSessionSchema>;
