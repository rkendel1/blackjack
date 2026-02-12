/**
 * URL Join System
 * Handles session joining via URL with secure tokens
 */

import type { ParticipantRole } from './types';

export interface JoinToken {
	sessionId: string;
	role: ParticipantRole;
	expiresAt: number;
	signature: string;
}

export class URLJoinManager {
	private readonly SECRET_KEY = 'stacklive-multiplayer-secret'; // In production, use env variable

	/**
	 * Generate a join link for a session
	 */
	generateJoinLink(
		baseUrl: string,
		sessionId: string,
		role: ParticipantRole = 'player',
		expiresInMinutes = 60
	): string {
		const token = this.createToken(sessionId, role, expiresInMinutes);
		const encodedToken = this.encodeToken(token);

		return `${baseUrl}?session=${sessionId}&token=${encodedToken}`;
	}

	/**
	 * Parse and validate a join link
	 */
	parseJoinLink(url: string): { sessionId: string; token: JoinToken } | null {
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
		} catch (error) {
			console.error('[URLJoin] Failed to parse join link:', error);
			return null;
		}
	}

	/**
	 * Extract session ID from URL search params
	 */
	getSessionIdFromURL(searchParams: URLSearchParams): string | null {
		return searchParams.get('session');
	}

	/**
	 * Extract and validate token from URL
	 */
	getTokenFromURL(searchParams: URLSearchParams): JoinToken | null {
		const tokenParam = searchParams.get('token');
		if (!tokenParam) {
			return null;
		}

		return this.decodeToken(tokenParam);
	}

	/**
	 * Create a join token
	 */
	private createToken(sessionId: string, role: ParticipantRole, expiresInMinutes: number): JoinToken {
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
	private validateToken(token: JoinToken, sessionId: string): boolean {
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
	private sign(data: string): string {
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
	private encodeToken(token: JoinToken): string {
		try {
			const json = JSON.stringify(token);
			return btoa(json)
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');
		} catch (error) {
			console.error('[URLJoin] Failed to encode token:', error);
			return '';
		}
	}

	/**
	 * Decode token from URL-safe string
	 */
	private decodeToken(encoded: string): JoinToken | null {
		try {
			const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
			const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
			const json = atob(padded);
			return JSON.parse(json);
		} catch (error) {
			console.error('[URLJoin] Failed to decode token:', error);
			return null;
		}
	}
}
