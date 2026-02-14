/**
 * Permission Manager
 * Handles capability permissions with persistence and expiration
 */

import type { CapabilityName, PermissionGrant, PermissionRequest, PermissionScope, PermissionStatus } from './types';

export class PermissionManager {
	private grants: Map<CapabilityName, PermissionGrant>;
	private storageKey: string;
	private debug: boolean;

	constructor(embedId: string = 'stacklive-device', debug: boolean = false) {
		this.grants = new Map();
		this.storageKey = `${embedId}-permissions`;
		this.debug = debug;
		this.loadGrants();
	}

	/**
	 * Request permission for a capability
	 */
	async request(request: PermissionRequest): Promise<PermissionStatus> {
		const { capability, scope, reason } = request;

		// Check if already granted and not expired
		const existing = this.grants.get(capability);
		if (existing && existing.status === 'granted' && !this.isExpired(existing)) {
			this.log(`Permission already granted for ${capability}`);
			return 'granted';
		}

		// Request permission based on capability
		const status = await this.requestPermission(capability, reason);
		
		if (status === 'granted') {
			const grant: PermissionGrant = {
				capability,
				status,
				scope,
				grantedAt: Date.now(),
				expiresAt: this.calculateExpiration(scope)
			};
			this.grants.set(capability, grant);
			this.saveGrants();
		}

		return status;
	}

	/**
	 * Ensure permission is granted
	 */
	async ensure(capability: CapabilityName): Promise<void> {
		const status = await this.request({
			capability,
			scope: 'session'
		});

		if (status !== 'granted') {
			throw new Error(`Permission denied for ${capability}`);
		}
	}

	/**
	 * Check if permission is granted
	 */
	isGranted(capability: CapabilityName): boolean {
		const grant = this.grants.get(capability);
		if (!grant) return false;
		if (grant.status !== 'granted') return false;
		if (this.isExpired(grant)) {
			this.grants.delete(capability);
			this.saveGrants();
			return false;
		}
		return true;
	}

	/**
	 * Revoke permission
	 */
	revoke(capability: CapabilityName): void {
		this.grants.delete(capability);
		this.saveGrants();
		this.log(`Permission revoked for ${capability}`);
	}

	/**
	 * Revoke all permissions
	 */
	revokeAll(): void {
		this.grants.clear();
		this.saveGrants();
		this.log('All permissions revoked');
	}

	/**
	 * Get grant for capability
	 */
	getGrant(capability: CapabilityName): PermissionGrant | undefined {
		const grant = this.grants.get(capability);
		if (grant && this.isExpired(grant)) {
			this.grants.delete(capability);
			this.saveGrants();
			return undefined;
		}
		return grant;
	}

	/**
	 * Get all active grants
	 */
	getAllGrants(): PermissionGrant[] {
		const active: PermissionGrant[] = [];
		for (const [capability, grant] of this.grants.entries()) {
			if (!this.isExpired(grant)) {
				active.push(grant);
			} else {
				this.grants.delete(capability);
			}
		}
		this.saveGrants();
		return active;
	}

	/**
	 * Request permission from browser/native
	 */
	private async requestPermission(capability: CapabilityName, reason?: string): Promise<PermissionStatus> {
		if (typeof navigator === 'undefined') {
			return 'unavailable';
		}

		try {
			// Map capability to permission name
			const permissionName = this.getPermissionName(capability);
			
			if (!permissionName) {
				this.log(`No permission mapping for ${capability}`);
				return 'granted'; // Some capabilities don't require explicit permission
			}

			// Try to check permission status first
			if (navigator.permissions && navigator.permissions.query) {
				try {
					const result = await navigator.permissions.query({ name: permissionName as PermissionName });
					this.log(`Permission status for ${capability}: ${result.state}`);
					
					if (result.state === 'granted') return 'granted';
					if (result.state === 'denied') return 'denied';
				} catch (e) {
					// Permission query not supported for this permission, will need to request directly
					this.log(`Permission query not supported for ${capability}`);
				}
			}

			// For some permissions, we can't check status without requesting
			// They will be checked when actually used
			return 'prompt';

		} catch (error) {
			this.log(`Error requesting permission for ${capability}:`, error);
			return 'denied';
		}
	}

	/**
	 * Map capability to browser permission name
	 */
	private getPermissionName(capability: CapabilityName): string | null {
		const mapping: Partial<Record<CapabilityName, string>> = {
			camera: 'camera',
			microphone: 'microphone',
			location: 'geolocation',
			push_notifications: 'notifications'
		};
		return mapping[capability] || null;
	}

	/**
	 * Check if grant is expired
	 */
	private isExpired(grant: PermissionGrant): boolean {
		if (!grant.expiresAt) return false;
		return Date.now() > grant.expiresAt;
	}

	/**
	 * Calculate expiration timestamp based on scope
	 */
	private calculateExpiration(scope: PermissionScope): number | undefined {
		const now = Date.now();
		switch (scope) {
			case 'one-time':
				return now + 60 * 1000; // 1 minute
			case 'session':
				return now + 24 * 60 * 60 * 1000; // 24 hours
			case 'always':
				return undefined; // Never expires
			case 'embed-level':
				return now + 7 * 24 * 60 * 60 * 1000; // 7 days
			case 'host-level':
				return undefined; // Never expires
			default:
				return now + 24 * 60 * 60 * 1000; // Default to 24 hours
		}
	}

	/**
	 * Load grants from storage
	 */
	private loadGrants(): void {
		if (typeof localStorage === 'undefined') return;

		try {
			const stored = localStorage.getItem(this.storageKey);
			if (stored) {
				const grants = JSON.parse(stored) as PermissionGrant[];
				grants.forEach(grant => {
					if (!this.isExpired(grant)) {
						this.grants.set(grant.capability, grant);
					}
				});
				this.log(`Loaded ${this.grants.size} permission grants`);
			}
		} catch (error) {
			this.log('Failed to load permission grants:', error);
		}
	}

	/**
	 * Save grants to storage
	 */
	private saveGrants(): void {
		if (typeof localStorage === 'undefined') return;

		try {
			const grants = Array.from(this.grants.values());
			localStorage.setItem(this.storageKey, JSON.stringify(grants));
			this.log(`Saved ${grants.length} permission grants`);
		} catch (error) {
			this.log('Failed to save permission grants:', error);
		}
	}

	/**
	 * Log debug messages
	 */
	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log('[PermissionManager]', ...args);
		}
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		this.saveGrants();
		this.grants.clear();
	}
}
