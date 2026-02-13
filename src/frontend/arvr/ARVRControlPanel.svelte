<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useStackLiveARVR } from '../../backend/multiplayer/useStackLiveARVR';
	import AvatarEmbed from './AvatarEmbed.svelte';
	import FilterSelector from './FilterSelector.svelte';
	import type { AvatarMessage, GestureMessage } from '../../backend/multiplayer/types';

	export let userId: string;
	export let sessionId: string | undefined = undefined;
	export let videoElement: HTMLVideoElement | null = null;

	const arvr = useStackLiveARVR(userId, sessionId);

	let webXRSupported = false;
	let showAvatarPanel = false;
	let showFilterPanel = false;
	let currentAvatar: AvatarMessage | null = null;
	let selectedFilterId: string | null = null;

	onMount(async () => {
		webXRSupported = await arvr.isWebXRSupported();
		
		// Subscribe to avatar updates
		arvr.onAvatarUpdated(({ userId: uid, avatar }) => {
			if (uid === userId) {
				currentAvatar = avatar;
			}
		});

		// Subscribe to gesture detection
		arvr.onGestureDetected((gesture) => {
			console.log('Gesture detected:', gesture);
		});
	});

	async function handleStartAR() {
		const success = await arvr.startARSession();
		if (success) {
			console.log('AR session started');
		} else {
			alert('Failed to start AR session. WebXR may not be supported on this device.');
		}
	}

	async function handleStartVR() {
		const success = await arvr.startVRSession();
		if (success) {
			console.log('VR session started');
		} else {
			alert('Failed to start VR session. WebXR may not be supported on this device.');
		}
	}

	async function handleEndSession() {
		await arvr.endSession();
	}

	async function handleLoadAvatar() {
		const avatar = await arvr.loadAvatar('/models/default-avatar.glb', {
			bodyType: 'average',
			skinTone: '#f0d5a8'
		});
		currentAvatar = avatar;
	}

	function handleFilterSelect(filterId: string) {
		selectedFilterId = filterId;
		arvr.applyFilter(filterId);
	}

	function handleRemoveFilter() {
		selectedFilterId = null;
		arvr.removeFilter();
	}

	async function handleStartGestureDetection() {
		if (!videoElement) {
			alert('No video element available for gesture detection');
			return;
		}
		await arvr.startGestureDetection(videoElement, {
			detectHands: true,
			detectFace: true,
			detectBody: true,
			fps: 10
		});
	}

	function handleStopGestureDetection() {
		arvr.stopGestureDetection();
	}

	function handleToggleAvatars() {
		const enabled = !$arvr.sessionState.avatarEnabled;
		arvr.setAvatarEnabled(enabled);
	}

	function handleToggleFilters() {
		const enabled = !$arvr.sessionState.filtersEnabled;
		arvr.setFiltersEnabled(enabled);
	}

	function handleToggleSpatial() {
		const enabled = !$arvr.sessionState.spatialEnabled;
		arvr.setSpatialEnabled(enabled);
	}

	function handleToggleGesture() {
		const enabled = !$arvr.sessionState.gestureDetectionEnabled;
		arvr.setGestureDetectionEnabled(enabled);
	}

	onDestroy(async () => {
		await arvr.cleanup();
	});
</script>

<div class="arvr-control-panel">
	<h2>AR/VR Controls</h2>

	<div class="status-section">
		<div class="status-item">
			<span class="status-label">WebXR Support:</span>
			<span class="status-value" class:enabled={webXRSupported}>
				{webXRSupported ? '✓ Supported' : '✗ Not Supported'}
			</span>
		</div>
		<div class="status-item">
			<span class="status-label">Session Active:</span>
			<span class="status-value" class:enabled={$arvr.sessionState.active}>
				{$arvr.sessionState.active ? '✓ Active' : '✗ Inactive'}
			</span>
		</div>
		{#if $arvr.sessionState.active}
			<div class="status-item">
				<span class="status-label">Mode:</span>
				<span class="status-value">{$arvr.sessionState.mode?.toUpperCase()}</span>
			</div>
		{/if}
	</div>

	<div class="control-section">
		<h3>Session Control</h3>
		<div class="button-group">
			<button on:click={handleStartAR} disabled={$arvr.sessionState.active || !webXRSupported}>
				Start AR
			</button>
			<button on:click={handleStartVR} disabled={$arvr.sessionState.active || !webXRSupported}>
				Start VR
			</button>
			<button on:click={handleEndSession} disabled={!$arvr.sessionState.active}>
				End Session
			</button>
		</div>
	</div>

	<div class="control-section">
		<h3>Feature Toggles</h3>
		<div class="toggle-group">
			<label class="toggle-item">
				<input type="checkbox" checked={$arvr.sessionState.avatarEnabled} on:change={handleToggleAvatars} />
				<span>Avatars</span>
			</label>
			<label class="toggle-item">
				<input type="checkbox" checked={$arvr.sessionState.filtersEnabled} on:change={handleToggleFilters} />
				<span>Filters</span>
			</label>
			<label class="toggle-item">
				<input type="checkbox" checked={$arvr.sessionState.spatialEnabled} on:change={handleToggleSpatial} />
				<span>Spatial Interactions</span>
			</label>
			<label class="toggle-item">
				<input type="checkbox" checked={$arvr.sessionState.gestureDetectionEnabled} on:change={handleToggleGesture} />
				<span>Gesture Detection</span>
			</label>
		</div>
	</div>

	{#if $arvr.sessionState.avatarEnabled}
		<div class="control-section">
			<h3>Avatar Control</h3>
			<div class="button-group">
				<button on:click={handleLoadAvatar}>Load Avatar</button>
				<button on:click={() => showAvatarPanel = !showAvatarPanel}>
					{showAvatarPanel ? 'Hide' : 'Show'} Avatar Panel
				</button>
			</div>
			{#if showAvatarPanel && currentAvatar}
				<div class="panel-content">
					<AvatarEmbed avatar={currentAvatar} />
				</div>
			{/if}
		</div>
	{/if}

	{#if $arvr.sessionState.filtersEnabled}
		<div class="control-section">
			<h3>Filter Control</h3>
			<div class="button-group">
				<button on:click={() => showFilterPanel = !showFilterPanel}>
					{showFilterPanel ? 'Hide' : 'Show'} Filters
				</button>
				{#if selectedFilterId}
					<button on:click={handleRemoveFilter}>Remove Filter</button>
				{/if}
			</div>
			{#if showFilterPanel}
				<div class="panel-content">
					<FilterSelector 
						presets={$arvr.filterPresets} 
						{selectedFilterId}
						onFilterSelect={handleFilterSelect}
					/>
				</div>
			{/if}
		</div>
	{/if}

	{#if $arvr.sessionState.gestureDetectionEnabled && videoElement}
		<div class="control-section">
			<h3>Gesture Detection</h3>
			<div class="button-group">
				<button on:click={handleStartGestureDetection}>Start Detection</button>
				<button on:click={handleStopGestureDetection}>Stop Detection</button>
			</div>
			{#if $arvr.lastGesture}
				<div class="gesture-info">
					<strong>Last Gesture:</strong> {$arvr.lastGesture.gesture || 'Unknown'}
					<br />
					<strong>Type:</strong> {$arvr.lastGesture.gestureType}
					<br />
					<strong>Confidence:</strong> {($arvr.lastGesture.confidence || 0).toFixed(2)}
				</div>
			{/if}
		</div>
	{/if}

	{#if $arvr.sessionState.spatialEnabled}
		<div class="control-section">
			<h3>Spatial Objects</h3>
			<div class="spatial-info">
				<strong>Active Objects:</strong> {$arvr.spatialObjects.size}
			</div>
		</div>
	{/if}
</div>

<style>
	.arvr-control-panel {
		padding: 20px;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		max-width: 600px;
		margin: 0 auto;
	}

	h2 {
		margin: 0 0 20px 0;
		font-size: 24px;
		font-weight: 700;
		color: #2d3748;
	}

	h3 {
		margin: 0 0 12px 0;
		font-size: 16px;
		font-weight: 600;
		color: #4a5568;
	}

	.status-section {
		background: #f7fafc;
		padding: 12px;
		border-radius: 6px;
		margin-bottom: 20px;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 0;
		border-bottom: 1px solid #e2e8f0;
	}

	.status-item:last-child {
		border-bottom: none;
	}

	.status-label {
		font-weight: 600;
		color: #4a5568;
	}

	.status-value {
		color: #718096;
	}

	.status-value.enabled {
		color: #48bb78;
		font-weight: 600;
	}

	.control-section {
		margin-bottom: 20px;
		padding-bottom: 20px;
		border-bottom: 1px solid #e2e8f0;
	}

	.control-section:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.button-group {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	button {
		padding: 10px 16px;
		background: #4299e1;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:hover:not(:disabled) {
		background: #3182ce;
	}

	button:disabled {
		background: #cbd5e0;
		cursor: not-allowed;
	}

	.toggle-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toggle-item {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		padding: 8px;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.toggle-item:hover {
		background: #f7fafc;
	}

	.toggle-item input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.toggle-item span {
		font-size: 14px;
		color: #2d3748;
	}

	.panel-content {
		margin-top: 16px;
		padding: 16px;
		background: #f7fafc;
		border-radius: 6px;
	}

	.gesture-info {
		margin-top: 12px;
		padding: 12px;
		background: #f7fafc;
		border-radius: 6px;
		font-size: 14px;
		line-height: 1.6;
	}

	.spatial-info {
		padding: 12px;
		background: #f7fafc;
		border-radius: 6px;
		font-size: 14px;
	}

	@media (max-width: 768px) {
		.arvr-control-panel {
			padding: 16px;
		}

		h2 {
			font-size: 20px;
		}

		.button-group button {
			flex: 1;
			min-width: 120px;
		}
	}
</style>
