/**
 * Latency Manager
 * Measures and tracks connection quality metrics
 */

import type { ConnectionQuality } from './types';

export class LatencyManager {
	private latencyMeasurements: number[] = [];
	private maxMeasurements = 20;
	private pingInterval: number | null = null;
	private onPingCallback?: () => void;
	private lastPingTimestamp: number | null = null;

	/**
	 * Start periodic latency measurement
	 */
	startMeasurement(intervalMs = 5000): void {
		this.stopMeasurement();

		this.pingInterval = window.setInterval(() => {
			this.sendPing();
		}, intervalMs);
	}

	/**
	 * Stop latency measurement
	 */
	stopMeasurement(): void {
		if (this.pingInterval !== null) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	}

	/**
	 * Send a ping request
	 */
	sendPing(): void {
		this.lastPingTimestamp = Date.now();
		if (this.onPingCallback) {
			this.onPingCallback();
		}
	}

	/**
	 * Handle pong response
	 */
	handlePong(timestamp: number): void {
		if (this.lastPingTimestamp === null) {
			return;
		}

		const latency = Date.now() - timestamp;
		this.recordLatency(latency);
		this.lastPingTimestamp = null;
	}

	/**
	 * Record a latency measurement
	 */
	recordLatency(latency: number): void {
		this.latencyMeasurements.push(latency);

		// Keep only recent measurements
		if (this.latencyMeasurements.length > this.maxMeasurements) {
			this.latencyMeasurements.shift();
		}
	}

	/**
	 * Get average latency
	 */
	getLatency(): number {
		if (this.latencyMeasurements.length === 0) {
			return 0;
		}

		const sum = this.latencyMeasurements.reduce((a, b) => a + b, 0);
		return Math.round(sum / this.latencyMeasurements.length);
	}

	/**
	 * Calculate jitter (variation in latency)
	 */
	private getJitter(): number {
		if (this.latencyMeasurements.length < 2) {
			return 0;
		}

		const avg = this.getLatency();
		const variance =
			this.latencyMeasurements.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
			this.latencyMeasurements.length;

		return Math.round(Math.sqrt(variance));
	}

	/**
	 * Estimate packet loss (simplified)
	 */
	private getPacketLoss(): number {
		// In a real implementation, this would track actual packet loss
		// For now, we estimate based on latency consistency
		const jitter = this.getJitter();
		const latency = this.getLatency();

		if (jitter > latency * 0.5) {
			return 5; // High jitter suggests some packet loss
		}

		return 0;
	}

	/**
	 * Get connection quality metrics
	 */
	getConnectionQuality(): ConnectionQuality {
		const latency = this.getLatency();
		const jitter = this.getJitter();
		const packetLoss = this.getPacketLoss();

		let quality: ConnectionQuality['quality'] = 'excellent';

		if (latency > 200 || jitter > 50 || packetLoss > 3) {
			quality = 'poor';
		} else if (latency > 150 || jitter > 30 || packetLoss > 1) {
			quality = 'fair';
		} else if (latency > 100 || jitter > 20) {
			quality = 'good';
		}

		return {
			latency,
			jitter,
			packetLoss,
			quality
		};
	}

	/**
	 * Set callback for ping requests
	 */
	onPing(callback: () => void): void {
		this.onPingCallback = callback;
	}

	/**
	 * Reset all measurements
	 */
	reset(): void {
		this.latencyMeasurements = [];
		this.lastPingTimestamp = null;
	}
}
