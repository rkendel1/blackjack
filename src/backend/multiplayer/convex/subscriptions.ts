/**
 * Convex Subscriptions
 * Real-time data subscriptions using Convex's reactive queries
 */

import type {
	SessionDocument,
	ParticipantDocument,
	SignalingMessageDocument,
	UserPresenceDocument
} from './schema';

/**
 * Subscribe to session updates
 * Watches a specific session for changes
 */
export interface SubscribeToSessionArgs {
	sessionId: string;
}

export type SessionUpdateCallback = (session: SessionDocument | null) => void;

export function subscribeToSession(
	args: SubscribeToSessionArgs,
	callback: SessionUpdateCallback
): () => void {
	// In actual Convex (using React hooks):
	// const session = useQuery(api.queries.getSession, { sessionId });
	// useEffect(() => callback(session), [session]);

	// In actual Convex (using subscribe):
	// const unsubscribe = convex.onUpdate(
	//   api.queries.getSession,
	//   { sessionId: args.sessionId },
	//   (session) => callback(session)
	// );

	console.log('[Convex Subscribe] Session updates:', args.sessionId);

	// Return unsubscribe function
	return () => {
		console.log('[Convex Unsubscribe] Session updates:', args.sessionId);
	};
}

/**
 * Subscribe to session participants
 * Watches for player joins/leaves
 */
export interface SubscribeToParticipantsArgs {
	sessionId: string;
}

export type ParticipantsUpdateCallback = (participants: ParticipantDocument[]) => void;

export function subscribeToParticipants(
	args: SubscribeToParticipantsArgs,
	callback: ParticipantsUpdateCallback
): () => void {
	// In actual Convex:
	// const participants = useQuery(api.queries.getSessionParticipants, { sessionId });

	console.log('[Convex Subscribe] Participants updates:', args.sessionId);

	return () => {
		console.log('[Convex Unsubscribe] Participants updates:', args.sessionId);
	};
}

/**
 * Subscribe to signaling messages
 * Watches for WebRTC signaling messages for a specific user
 */
export interface SubscribeToSignalingArgs {
	sessionId: string;
	userId: string;
}

export type SignalingMessageCallback = (messages: SignalingMessageDocument[]) => void;

export function subscribeToSignaling(
	args: SubscribeToSignalingArgs,
	callback: SignalingMessageCallback
): () => void {
	// In actual Convex:
	// const messages = useQuery(api.queries.getSignalingMessages, { 
	//   sessionId: args.sessionId,
	//   userId: args.userId 
	// });
	// Process and deliver new messages

	console.log('[Convex Subscribe] Signaling messages:', args.sessionId, args.userId);

	return () => {
		console.log('[Convex Unsubscribe] Signaling messages:', args.sessionId, args.userId);
	};
}

/**
 * Subscribe to matchmaking queue
 * Watches queue for the user's game
 */
export interface SubscribeToMatchmakingArgs {
	gameId: string;
	userId: string;
	region?: string;
}

export interface MatchmakingUpdate {
	queuePosition: number;
	queueSize: number;
	estimatedWaitTime: number;
	matchFound?: {
		sessionId: string;
		playerIds: string[];
	};
}

export type MatchmakingUpdateCallback = (update: MatchmakingUpdate) => void;

export function subscribeToMatchmaking(
	args: SubscribeToMatchmakingArgs,
	callback: MatchmakingUpdateCallback
): () => void {
	// In actual Convex:
	// 1. Watch queue for changes
	// 2. Calculate position and wait time
	// 3. Watch for match creation
	// 4. Notify when match is found

	console.log('[Convex Subscribe] Matchmaking updates:', args.gameId, args.userId);

	return () => {
		console.log('[Convex Unsubscribe] Matchmaking updates:', args.gameId, args.userId);
	};
}

/**
 * Subscribe to user presence
 * Watches for user online/offline status
 */
export interface SubscribeToPresenceArgs {
	userIds: string[];
}

export type PresenceUpdateCallback = (presence: UserPresenceDocument[]) => void;

export function subscribeToPresence(
	args: SubscribeToPresenceArgs,
	callback: PresenceUpdateCallback
): () => void {
	// In actual Convex:
	// Watch presence records for specified users

	console.log('[Convex Subscribe] Presence updates:', args.userIds.length, 'users');

	return () => {
		console.log('[Convex Unsubscribe] Presence updates');
	};
}

/**
 * Subscribe to session events
 * Watches session event log in real-time
 */
export interface SubscribeToSessionEventsArgs {
	sessionId: string;
}

export type SessionEventsCallback = (events: any[]) => void;

export function subscribeToSessionEvents(
	args: SubscribeToSessionEventsArgs,
	callback: SessionEventsCallback
): () => void {
	// In actual Convex:
	// Watch event log for new entries

	console.log('[Convex Subscribe] Session events:', args.sessionId);

	return () => {
		console.log('[Convex Unsubscribe] Session events:', args.sessionId);
	};
}

/**
 * Subscribe to public sessions list
 * Watches for new public sessions being created
 */
export interface SubscribeToPublicSessionsArgs {
	gameId?: string;
}

export type PublicSessionsCallback = (sessions: SessionDocument[]) => void;

export function subscribeToPublicSessions(
	args: SubscribeToPublicSessionsArgs,
	callback: PublicSessionsCallback
): () => void {
	// In actual Convex:
	// Watch public sessions query

	console.log('[Convex Subscribe] Public sessions:', args.gameId);

	return () => {
		console.log('[Convex Unsubscribe] Public sessions');
	};
}

/**
 * Subscribe to player stats
 * Watches user's game statistics
 */
export interface SubscribeToPlayerStatsArgs {
	userId: string;
	gameId?: string;
}

export interface PlayerStats {
	userId: string;
	gamesPlayed: number;
	gamesWon: number;
	winRate: number;
	currentRating: number;
	peakRating: number;
	rank: number;
}

export type PlayerStatsCallback = (stats: PlayerStats) => void;

export function subscribeToPlayerStats(
	args: SubscribeToPlayerStatsArgs,
	callback: PlayerStatsCallback
): () => void {
	// In actual Convex:
	// Watch aggregated stats query

	console.log('[Convex Subscribe] Player stats:', args.userId, args.gameId);

	return () => {
		console.log('[Convex Unsubscribe] Player stats');
	};
}

/**
 * Subscribe to friend activity
 * Watches friends' online status and current games
 */
export interface SubscribeToFriendsArgs {
	userId: string;
}

export interface FriendActivity {
	userId: string;
	userName: string;
	status: 'online' | 'in-game' | 'offline';
	currentSessionId?: string;
	currentGame?: string;
}

export type FriendsActivityCallback = (friends: FriendActivity[]) => void;

export function subscribeToFriends(
	args: SubscribeToFriendsArgs,
	callback: FriendsActivityCallback
): () => void {
	// In actual Convex:
	// 1. Get user's friend list
	// 2. Watch presence for all friends
	// 3. Combine with session data

	console.log('[Convex Subscribe] Friends activity:', args.userId);

	return () => {
		console.log('[Convex Unsubscribe] Friends activity');
	};
}

/**
 * Subscribe to leaderboard
 * Watches leaderboard rankings
 */
export interface SubscribeToLeaderboardArgs {
	gameId: string;
	limit?: number;
}

export interface LeaderboardEntry {
	rank: number;
	userId: string;
	userName: string;
	rating: number;
	gamesPlayed: number;
	winRate: number;
}

export type LeaderboardCallback = (entries: LeaderboardEntry[]) => void;

export function subscribeToLeaderboard(
	args: SubscribeToLeaderboardArgs,
	callback: LeaderboardCallback
): () => void {
	// In actual Convex:
	// Watch sorted leaderboard query

	console.log('[Convex Subscribe] Leaderboard:', args.gameId);

	return () => {
		console.log('[Convex Unsubscribe] Leaderboard');
	};
}
