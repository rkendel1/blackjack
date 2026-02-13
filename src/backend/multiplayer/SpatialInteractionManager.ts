/**
 * SpatialInteractionManager - Manages spatial interactions in AR/VR
 * Handles object placement, movement, rotation, and collaborative interactions
 */

import type { SpatialMessage } from './types';

export class SpatialInteractionManager {
	private interactions = new Map<string, SpatialMessage>();
	private objects = new Map<string, SpatialMessage>();
	private eventListeners = new Map<string, Set<(data: unknown) => void>>();
	private userId: string;
	private sessionId?: string;

	constructor(userId: string, sessionId?: string) {
		this.userId = userId;
		this.sessionId = sessionId;
	}

	/**
	 * Place an object in space
	 */
	placeObject(
		objectId: string,
		position: [number, number, number],
		rotation?: [number, number, number, number],
		scale?: [number, number, number]
	): SpatialMessage {
		const interaction: SpatialMessage = {
			id: this.generateId(),
			userId: this.userId,
			sessionId: this.sessionId,
			interactionType: 'place',
			objectId,
			position,
			rotation: rotation || [0, 0, 0, 1],
			scale: scale || [1, 1, 1],
			timestamp: Date.now()
		};

		this.objects.set(objectId, interaction);
		this.interactions.set(interaction.id, interaction);
		this.emit('objectPlaced', interaction);

		return interaction;
	}

	/**
	 * Move an object
	 */
	moveObject(objectId: string, position: [number, number, number]): SpatialMessage {
		const interaction: SpatialMessage = {
			id: this.generateId(),
			userId: this.userId,
			sessionId: this.sessionId,
			interactionType: 'move',
			objectId,
			position,
			timestamp: Date.now()
		};

		// Update object position
		const obj = this.objects.get(objectId);
		if (obj) {
			obj.position = position;
			obj.timestamp = interaction.timestamp;
		}

		this.interactions.set(interaction.id, interaction);
		this.emit('objectMoved', interaction);

		return interaction;
	}

	/**
	 * Rotate an object
	 */
	rotateObject(objectId: string, rotation: [number, number, number, number]): SpatialMessage {
		const interaction: SpatialMessage = {
			id: this.generateId(),
			userId: this.userId,
			sessionId: this.sessionId,
			interactionType: 'rotate',
			objectId,
			rotation,
			timestamp: Date.now()
		};

		// Update object rotation
		const obj = this.objects.get(objectId);
		if (obj) {
			obj.rotation = rotation;
			obj.timestamp = interaction.timestamp;
		}

		this.interactions.set(interaction.id, interaction);
		this.emit('objectRotated', interaction);

		return interaction;
	}

	/**
	 * Scale an object
	 */
	scaleObject(objectId: string, scale: [number, number, number]): SpatialMessage {
		const interaction: SpatialMessage = {
			id: this.generateId(),
			userId: this.userId,
			sessionId: this.sessionId,
			interactionType: 'scale',
			objectId,
			scale,
			timestamp: Date.now()
		};

		// Update object scale
		const obj = this.objects.get(objectId);
		if (obj) {
			obj.scale = scale;
			obj.timestamp = interaction.timestamp;
		}

		this.interactions.set(interaction.id, interaction);
		this.emit('objectScaled', interaction);

		return interaction;
	}

	/**
	 * Grab an object
	 */
	grabObject(objectId: string): SpatialMessage {
		const interaction: SpatialMessage = {
			id: this.generateId(),
			userId: this.userId,
			sessionId: this.sessionId,
			interactionType: 'grab',
			objectId,
			timestamp: Date.now()
		};

		this.interactions.set(interaction.id, interaction);
		this.emit('objectGrabbed', interaction);

		return interaction;
	}

	/**
	 * Point at a location
	 */
	point(
		rayOrigin: [number, number, number],
		rayDirection: [number, number, number]
	): SpatialMessage {
		const interaction: SpatialMessage = {
			id: this.generateId(),
			userId: this.userId,
			sessionId: this.sessionId,
			interactionType: 'point',
			rayOrigin,
			rayDirection,
			timestamp: Date.now()
		};

		this.interactions.set(interaction.id, interaction);
		this.emit('userPointed', interaction);

		return interaction;
	}

	/**
	 * Draw in space
	 */
	draw(path: Array<[number, number, number]>): SpatialMessage {
		const interaction: SpatialMessage = {
			id: this.generateId(),
			userId: this.userId,
			sessionId: this.sessionId,
			interactionType: 'draw',
			drawPath: path,
			timestamp: Date.now()
		};

		this.interactions.set(interaction.id, interaction);
		this.emit('userDrew', interaction);

		return interaction;
	}

	/**
	 * Process incoming spatial interaction from another user
	 */
	processRemoteInteraction(interaction: SpatialMessage): void {
		this.interactions.set(interaction.id, interaction);

		// Update object state if applicable
		if (interaction.objectId) {
			const obj = this.objects.get(interaction.objectId);
			if (obj) {
				if (interaction.position) obj.position = interaction.position;
				if (interaction.rotation) obj.rotation = interaction.rotation;
				if (interaction.scale) obj.scale = interaction.scale;
				obj.timestamp = interaction.timestamp;
			} else {
				// Object doesn't exist locally, create it
				this.objects.set(interaction.objectId, interaction);
			}
		}

		this.emit('remoteInteraction', interaction);
	}

	/**
	 * Get object state
	 */
	getObject(objectId: string): SpatialMessage | undefined {
		return this.objects.get(objectId);
	}

	/**
	 * Get all objects
	 */
	getAllObjects(): Map<string, SpatialMessage> {
		return new Map(this.objects);
	}

	/**
	 * Remove object
	 */
	removeObject(objectId: string): void {
		this.objects.delete(objectId);
		this.emit('objectRemoved', { objectId });
	}

	/**
	 * Get interaction history
	 */
	getInteractions(limit?: number): SpatialMessage[] {
		const interactions = Array.from(this.interactions.values());
		interactions.sort((a, b) => b.timestamp - a.timestamp);
		return limit ? interactions.slice(0, limit) : interactions;
	}

	/**
	 * Clear interaction history
	 */
	clearHistory(): void {
		this.interactions.clear();
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `spatial-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
		this.interactions.clear();
		this.objects.clear();
		this.eventListeners.clear();
	}
}
