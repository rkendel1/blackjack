/**
 * WebRTC Peer Connection Manager
 * Handles peer-to-peer connections for the multiplayer runtime
 */

import type { RTCConfig, StackLiveMessage } from './types';

export class PeerConnectionManager {
	private peerConnection: RTCPeerConnection | null = null;
	private dataChannel: RTCDataChannel | null = null;
	private config: RTCConfig;
	private onMessageCallback?: (message: StackLiveMessage) => void;
	private onConnectionStateChangeCallback?: (state: RTCPeerConnectionState) => void;
	private onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;

	constructor(config: RTCConfig) {
		this.config = config;
	}

	/**
	 * Initialize a new peer connection
	 */
	async createPeerConnection(): Promise<RTCPeerConnection> {
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
	createDataChannel(label: string): RTCDataChannel {
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
	private setupDataChannel(channel: RTCDataChannel): void {
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
				const message = JSON.parse(event.data) as StackLiveMessage;
				if (this.onMessageCallback) {
					this.onMessageCallback(message);
				}
			} catch (error) {
				console.error('Failed to parse message:', error);
			}
		};
	}

	/**
	 * Handle incoming data channel from peer
	 */
	handleDataChannel(channel: RTCDataChannel): void {
		this.dataChannel = channel;
		this.setupDataChannel(channel);
	}

	/**
	 * Send a message through the data channel
	 */
	sendMessage(message: StackLiveMessage): void {
		if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
			console.warn('Data channel not ready, message not sent');
			return;
		}

		try {
			this.dataChannel.send(JSON.stringify(message));
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	}

	/**
	 * Create an offer for connection
	 */
	async createOffer(): Promise<RTCSessionDescriptionInit> {
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
	async createAnswer(): Promise<RTCSessionDescriptionInit> {
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
	async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
		if (!this.peerConnection) {
			throw new Error('Peer connection not initialized');
		}

		await this.peerConnection.setRemoteDescription(description);
	}

	/**
	 * Add ICE candidate
	 */
	async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
		if (!this.peerConnection) {
			throw new Error('Peer connection not initialized');
		}

		await this.peerConnection.addIceCandidate(candidate);
	}

	/**
	 * Handle disconnection and attempt reconnection
	 */
	private async handleDisconnection(): Promise<void> {
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
	closePeerConnection(): void {
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
	onMessage(callback: (message: StackLiveMessage) => void): void {
		this.onMessageCallback = callback;
	}

	/**
	 * Set callback for connection state changes
	 */
	onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void {
		this.onConnectionStateChangeCallback = callback;
	}

	/**
	 * Set callback for ICE candidates
	 */
	onIceCandidate(callback: (candidate: RTCIceCandidate) => void): void {
		this.onIceCandidateCallback = callback;
	}

	/**
	 * Get connection state
	 */
	getConnectionState(): RTCPeerConnectionState | null {
		return this.peerConnection?.connectionState ?? null;
	}

	/**
	 * Check if data channel is ready
	 */
	isDataChannelReady(): boolean {
		return this.dataChannel?.readyState === 'open';
	}
}
