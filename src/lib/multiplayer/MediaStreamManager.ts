/**
 * MediaStreamManager
 * Manages video and audio streams for realtime interactions
 */

export interface MediaStreamConfig {
	video?: boolean | MediaTrackConstraints;
	audio?: boolean | MediaTrackConstraints;
}

export class MediaStreamManager {
	private localStream: MediaStream | null = null;
	private remoteStreams: Map<string, MediaStream> = new Map();
	private debugMode: boolean;
	private streamCallbacks: ((userId: string, stream: MediaStream) => void)[] = [];

	constructor(debug = false) {
		this.debugMode = debug;
	}

	/**
	 * Initialize local media stream (camera/microphone)
	 */
	async initializeLocalStream(config: MediaStreamConfig): Promise<MediaStream | null> {
		try {
			this.log('Requesting media permissions...', config);

			const constraints: MediaStreamConstraints = {
				video: config.video ?? false,
				audio: config.audio ?? false
			};

			this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
			this.log('Local stream initialized', {
				videoTracks: this.localStream.getVideoTracks().length,
				audioTracks: this.localStream.getAudioTracks().length
			});

			return this.localStream;
		} catch (error) {
			console.error('Failed to initialize local stream:', error);
			return null;
		}
	}

	/**
	 * Get local media stream
	 */
	getLocalStream(): MediaStream | null {
		return this.localStream;
	}

	/**
	 * Add remote stream from participant
	 */
	addRemoteStream(userId: string, stream: MediaStream): void {
		this.log(`Adding remote stream from user ${userId}`);
		this.remoteStreams.set(userId, stream);

		// Notify listeners
		this.streamCallbacks.forEach((cb) => cb(userId, stream));
	}

	/**
	 * Remove remote stream
	 */
	removeRemoteStream(userId: string): void {
		this.log(`Removing remote stream from user ${userId}`);
		this.remoteStreams.delete(userId);
	}

	/**
	 * Get remote stream for a user
	 */
	getRemoteStream(userId: string): MediaStream | null {
		return this.remoteStreams.get(userId) || null;
	}

	/**
	 * Get all remote streams
	 */
	getAllRemoteStreams(): Map<string, MediaStream> {
		return this.remoteStreams;
	}

	/**
	 * Register callback for new remote streams
	 */
	onRemoteStream(callback: (userId: string, stream: MediaStream) => void): void {
		this.streamCallbacks.push(callback);
	}

	/**
	 * Toggle video track
	 */
	toggleVideo(enabled: boolean): void {
		if (this.localStream) {
			this.localStream.getVideoTracks().forEach((track) => {
				track.enabled = enabled;
			});
			this.log(`Video ${enabled ? 'enabled' : 'disabled'}`);
		}
	}

	/**
	 * Toggle audio track
	 */
	toggleAudio(enabled: boolean): void {
		if (this.localStream) {
			this.localStream.getAudioTracks().forEach((track) => {
				track.enabled = enabled;
			});
			this.log(`Audio ${enabled ? 'enabled' : 'disabled'}`);
		}
	}

	/**
	 * Stop local stream
	 */
	stopLocalStream(): void {
		if (this.localStream) {
			this.localStream.getTracks().forEach((track) => track.stop());
			this.localStream = null;
			this.log('Local stream stopped');
		}
	}

	/**
	 * Cleanup all streams
	 */
	destroy(): void {
		this.stopLocalStream();
		this.remoteStreams.clear();
		this.streamCallbacks = [];
		this.log('MediaStreamManager destroyed');
	}

	/**
	 * Debug logging
	 */
	private log(message: string, data?: unknown): void {
		if (this.debugMode) {
			console.log(`[MediaStreamManager] ${message}`, data);
		}
	}
}
