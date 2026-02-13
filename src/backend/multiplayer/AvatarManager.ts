/**
 * AvatarManager - Manages 3D avatar loading and state
 * Handles avatar model loading, customization, and transformation
 */

import type { AvatarMessage, AvatarCustomization } from './types';

export class AvatarManager {
	private avatars = new Map<string, AvatarMessage>();
	private loadedModels = new Map<string, unknown>(); // Store loaded 3D models
	private eventListeners = new Map<string, Set<(data: unknown) => void>>();

	/**
	 * Load an avatar model
	 * @param userId - User ID for the avatar
	 * @param modelUrl - URL to glTF or USDZ model file
	 * @param customizations - Avatar customization options
	 */
	async loadAvatar(
		userId: string,
		modelUrl: string,
		customizations?: AvatarCustomization
	): Promise<AvatarMessage> {
		const avatar: AvatarMessage = {
			id: this.generateId(),
			userId,
			avatarModel: modelUrl,
			customizations: {
				hair: customizations?.hair?.style,
				clothing: customizations?.clothing?.outfit || customizations?.clothing?.top,
				accessories: customizations?.accessories?.map((a) => a.id),
				expressions: customizations?.expressions,
				skinTone: customizations?.skinTone,
				bodyType: customizations?.bodyType
			},
			timestamp: Date.now()
		};

		this.avatars.set(userId, avatar);
		this.emit('avatarLoaded', { userId, avatar });

		return avatar;
	}

	/**
	 * Update avatar customization
	 */
	updateCustomization(userId: string, customizations: Partial<AvatarCustomization>): void {
		const avatar = this.avatars.get(userId);
		if (!avatar) {
			console.warn(`Avatar not found for user ${userId}`);
			return;
		}

		// Merge customizations
		if (customizations.hair) {
			avatar.customizations.hair = customizations.hair.style;
		}
		if (customizations.clothing) {
			avatar.customizations.clothing =
				customizations.clothing.outfit || customizations.clothing.top;
		}
		if (customizations.accessories) {
			avatar.customizations.accessories = customizations.accessories.map((a) => a.id);
		}
		if (customizations.expressions) {
			avatar.customizations.expressions = {
				...avatar.customizations.expressions,
				...customizations.expressions
			};
		}
		if (customizations.skinTone) {
			avatar.customizations.skinTone = customizations.skinTone;
		}
		if (customizations.bodyType) {
			avatar.customizations.bodyType = customizations.bodyType;
		}

		avatar.timestamp = Date.now();
		this.emit('avatarCustomized', { userId, avatar });
	}

	/**
	 * Update avatar transform (position, rotation, scale)
	 */
	updateTransform(
		userId: string,
		transform: {
			position?: [number, number, number];
			rotation?: [number, number, number, number];
			scale?: [number, number, number];
		}
	): void {
		const avatar = this.avatars.get(userId);
		if (!avatar) {
			console.warn(`Avatar not found for user ${userId}`);
			return;
		}

		avatar.transform = {
			position: transform.position || avatar.transform?.position || [0, 0, 0],
			rotation: transform.rotation || avatar.transform?.rotation || [0, 0, 0, 1],
			scale: transform.scale || avatar.transform?.scale || [1, 1, 1]
		};

		avatar.timestamp = Date.now();
		this.emit('avatarTransformed', { userId, avatar });
	}

	/**
	 * Set avatar expression
	 */
	setExpression(userId: string, expression: string, intensity: number): void {
		const avatar = this.avatars.get(userId);
		if (!avatar) {
			console.warn(`Avatar not found for user ${userId}`);
			return;
		}

		if (!avatar.customizations.expressions) {
			avatar.customizations.expressions = {};
		}

		avatar.customizations.expressions[expression] = Math.max(0, Math.min(1, intensity));
		avatar.timestamp = Date.now();

		this.emit('avatarExpression', { userId, expression, intensity });
	}

	/**
	 * Get avatar for a user
	 */
	getAvatar(userId: string): AvatarMessage | undefined {
		return this.avatars.get(userId);
	}

	/**
	 * Get all avatars
	 */
	getAllAvatars(): Map<string, AvatarMessage> {
		return new Map(this.avatars);
	}

	/**
	 * Remove avatar
	 */
	removeAvatar(userId: string): void {
		this.avatars.delete(userId);
		this.loadedModels.delete(userId);
		this.emit('avatarRemoved', { userId });
	}

	/**
	 * Store loaded 3D model reference
	 */
	setLoadedModel(userId: string, model: unknown): void {
		this.loadedModels.set(userId, model);
	}

	/**
	 * Get loaded 3D model reference
	 */
	getLoadedModel(userId: string): unknown | undefined {
		return this.loadedModels.get(userId);
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Add event listener
	 */
	on(event: string, callback: (data: unknown) => void): void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		this.eventListeners.get(event)?.add(callback);
	}

	/**
	 * Remove event listener
	 */
	off(event: string, callback: (data: unknown) => void): void {
		this.eventListeners.get(event)?.delete(callback);
	}

	/**
	 * Emit event to listeners
	 */
	private emit(event: string, data: unknown): void {
		this.eventListeners.get(event)?.forEach((callback) => {
			try {
				callback(data);
			} catch (error) {
				console.error(`Error in ${event} listener:`, error);
			}
		});
	}

	/**
	 * Cleanup
	 */
	cleanup(): void {
		this.avatars.clear();
		this.loadedModels.clear();
		this.eventListeners.clear();
	}
}
