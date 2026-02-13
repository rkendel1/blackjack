<script lang="ts">
	import { onMount } from 'svelte';

	// Import web components to register them
	import '$frontend/components/webcomponents';

	let sceneElement: HTMLElement;
	let avatarElement: HTMLElement;
	let filterElement: HTMLElement;
	let spatialElement: HTMLElement;

	let sceneUserId = 'demo-user-1';
	let sceneSessionId = 'demo-session-1';

	onMount(() => {
		// Listen for custom events from web components
		if (sceneElement) {
			sceneElement.addEventListener('ready', (e: CustomEvent) => {
				console.log('AR/VR Scene ready:', e.detail);
			});
		}

		if (avatarElement) {
			avatarElement.addEventListener('rendered', (e: CustomEvent) => {
				console.log('Avatar rendered:', e.detail);
			});
		}

		if (filterElement) {
			filterElement.addEventListener('filter-selected', (e: CustomEvent) => {
				console.log('Filter selected:', e.detail);
			});
		}

		if (spatialElement) {
			spatialElement.addEventListener('object-placed', (e: CustomEvent) => {
				console.log('Object placed:', e.detail);
			});

			spatialElement.addEventListener('object-moved', (e: CustomEvent) => {
				console.log('Object moved:', e.detail);
			});
		}
	});

	function handleStartAR() {
		if (sceneElement && 'startAR' in sceneElement) {
			(sceneElement as any).startAR();
		}
	}

	function handleLoadAvatar() {
		if (sceneElement && 'loadAvatar' in sceneElement) {
			(sceneElement as any).loadAvatar('/models/default-avatar.glb', {
				bodyType: 'athletic',
				skinTone: '#f0d5a8'
			});
		}
	}

	function handleApplyFilter() {
		if (sceneElement && 'applyFilter' in sceneElement) {
			(sceneElement as any).applyFilter('beauty-smooth');
		}
	}

	function handlePlaceObject() {
		if (sceneElement && 'placeObject' in sceneElement) {
			(sceneElement as any).placeObject('cube-1', [0, 0, -2]);
		}
	}
</script>

<svelte:head>
	<title>AR/VR Web Components Demo - StackLive</title>
</svelte:head>

<div class="demo-page">
	<header>
		<h1>🎭 AR/VR Web Components Demo</h1>
		<p class="subtitle">
			Drop-in AR/VR web components for immersive experiences
		</p>
	</header>

	<div class="demo-section">
		<h2>1️⃣ AR/VR Scene Component</h2>
		<p class="description">
			The main <code>&lt;sl-arvr-scene&gt;</code> component provides a full AR/VR experience with camera integration,
			gesture detection, and spatial interactions.
		</p>

		<div class="component-demo">
			<sl-arvr-scene
				bind:this={sceneElement}
				userId={sceneUserId}
				sessionId={sceneSessionId}
				mode="inline"
				avatarEnabled="true"
				filtersEnabled="true"
				spatialEnabled="true"
				gestureEnabled="true"
				width="100%"
				height="500px"
			></sl-arvr-scene>

			<div class="controls">
				<button on:click={handleStartAR}>Start AR Session</button>
				<button on:click={handleLoadAvatar}>Load Avatar</button>
				<button on:click={handleApplyFilter}>Apply Filter</button>
				<button on:click={handlePlaceObject}>Place Object</button>
			</div>
		</div>

		<div class="code-example">
			<h3>Usage Example:</h3>
			<pre><code>{`<sl-arvr-scene
  userId="user-123"
  sessionId="session-456"
  mode="inline"
  avatarEnabled="true"
  filtersEnabled="true"
  spatialEnabled="true"
  width="100%"
  height="600px"
></sl-arvr-scene>

<script>
  const scene = document.querySelector('sl-arvr-scene');
  
  // Start AR session
  await scene.startAR();
  
  // Load avatar
  await scene.loadAvatar('/models/avatar.glb');
  
  // Apply filter
  scene.applyFilter('beauty-smooth');
  
  // Place object in space
  scene.placeObject('cube-1', [0, 0, -2]);
</script>`}</code></pre>
		</div>
	</div>

	<div class="demo-section">
		<h2>2️⃣ Avatar Component</h2>
		<p class="description">
			The <code>&lt;sl-arvr-avatar&gt;</code> component displays a 3D avatar with customization options.
		</p>

		<div class="component-demo">
			<div class="avatar-grid">
				<sl-arvr-avatar
					bind:this={avatarElement}
					userId="user-1"
					skinTone="#f0d5a8"
					bodyType="average"
					width="200px"
					height="300px"
					showInfo="true"
				></sl-arvr-avatar>

				<sl-arvr-avatar
					userId="user-2"
					skinTone="#8d5524"
					bodyType="athletic"
					width="200px"
					height="300px"
					showInfo="true"
				></sl-arvr-avatar>

				<sl-arvr-avatar
					userId="user-3"
					skinTone="#c58c85"
					bodyType="slim"
					width="200px"
					height="300px"
					showInfo="true"
				></sl-arvr-avatar>
			</div>
		</div>

		<div class="code-example">
			<h3>Usage Example:</h3>
			<pre><code>{`<sl-arvr-avatar
  userId="user-123"
  skinTone="#f0d5a8"
  bodyType="average"
  width="300px"
  height="400px"
  showInfo="true"
></sl-arvr-avatar>`}</code></pre>
		</div>
	</div>

	<div class="demo-section">
		<h2>3️⃣ Filter Component</h2>
		<p class="description">
			The <code>&lt;sl-arvr-filter&gt;</code> component represents an AR filter that can be applied to faces, bodies, or environments.
		</p>

		<div class="component-demo">
			<div class="filter-grid">
				<sl-arvr-filter
					bind:this={filterElement}
					filterType="face"
					filterName="beauty"
					intensity="0.7"
				></sl-arvr-filter>

				<sl-arvr-filter
					filterType="face"
					filterName="bunny"
					intensity="1.0"
				></sl-arvr-filter>

				<sl-arvr-filter
					filterType="environment"
					filterName="vintage"
					intensity="0.5"
				></sl-arvr-filter>

				<sl-arvr-filter
					filterType="body"
					filterName="glow"
					intensity="0.6"
				></sl-arvr-filter>
			</div>
		</div>

		<div class="code-example">
			<h3>Usage Example:</h3>
			<pre><code>{`<sl-arvr-filter
  filterType="face"
  filterName="beauty"
  intensity="0.7"
></sl-arvr-filter>

<script>
  const filter = document.querySelector('sl-arvr-filter');
  
  filter.addEventListener('filter-selected', (e) => {
    console.log('Filter selected:', e.detail);
  });
</script>`}</code></pre>
		</div>
	</div>

	<div class="demo-section">
		<h2>4️⃣ Spatial Object Component</h2>
		<p class="description">
			The <code>&lt;sl-arvr-spatial&gt;</code> component displays interactive 3D objects that can be placed in AR/VR space.
		</p>

		<div class="component-demo">
			<div class="spatial-grid">
				<sl-arvr-spatial
					bind:this={spatialElement}
					objectId="cube-1"
					objectType="cube"
					position="0,0,-2"
					color="#4299e1"
					interactive="true"
				></sl-arvr-spatial>

				<sl-arvr-spatial
					objectId="sphere-1"
					objectType="sphere"
					position="1,1,-3"
					color="#10b981"
					interactive="true"
				></sl-arvr-spatial>

				<sl-arvr-spatial
					objectId="cylinder-1"
					objectType="cylinder"
					position="-1,0,-2"
					color="#f59e0b"
					interactive="true"
				></sl-arvr-spatial>
			</div>
		</div>

		<div class="code-example">
			<h3>Usage Example:</h3>
			<pre><code>{`<sl-arvr-spatial
  objectId="cube-1"
  objectType="cube"
  position="0,0,-2"
  color="#4299e1"
  interactive="true"
></sl-arvr-spatial>

<script>
  const spatial = document.querySelector('sl-arvr-spatial');
  
  spatial.addEventListener('object-placed', (e) => {
    console.log('Object placed:', e.detail);
  });
  
  spatial.addEventListener('object-moved', (e) => {
    console.log('Object moved:', e.detail);
  });
</script>`}</code></pre>
		</div>
	</div>

	<div class="integration-section">
		<h2>🔧 Integration Guide</h2>
		
		<div class="integration-content">
			<h3>Installation</h3>
			<p>Import the web components in your HTML or JavaScript:</p>
			<pre><code>{`<!-- Option 1: Direct HTML import -->
<script type="module">
  import '$frontend/components/webcomponents';
</script>

<!-- Option 2: JavaScript import -->
<script type="module">
  import { 
    ARVRScene, 
    ARVRAvatar, 
    ARVRFilter, 
    ARVRSpatial 
  } from '$frontend/components/webcomponents';
</script>`}</code></pre>

			<h3>Features</h3>
			<ul>
				<li>✅ <strong>Native Web Components</strong> - Works with any framework or vanilla JS</li>
				<li>✅ <strong>WebXR Support</strong> - Full AR/VR capabilities when supported</li>
				<li>✅ <strong>Camera Integration</strong> - Real-time video processing</li>
				<li>✅ <strong>Gesture Detection</strong> - Hand, face, and body tracking</li>
				<li>✅ <strong>Spatial Interactions</strong> - Place and manipulate 3D objects</li>
				<li>✅ <strong>Cross-Device</strong> - Fallback rendering for unsupported devices</li>
				<li>✅ <strong>Event-Driven</strong> - Custom events for all interactions</li>
				<li>✅ <strong>Customizable</strong> - Extensive attribute API</li>
			</ul>

			<h3>Browser Support</h3>
			<ul>
				<li><strong>Chrome 79+</strong> (Android) - Full WebXR support</li>
				<li><strong>Edge 79+</strong> (Windows Mixed Reality) - Full WebXR support</li>
				<li><strong>Firefox Reality</strong> - VR headset support</li>
				<li><strong>Safari</strong> (iOS 13+) - Limited AR support via AR Quick Look</li>
				<li><strong>Fallback</strong> - Canvas 2D rendering on unsupported browsers</li>
			</ul>

			<h3>Documentation</h3>
			<p>
				For complete documentation and advanced usage, see:
			</p>
			<ul>
				<li><a href="/arvr-demo">AR/VR Control Panel Demo</a></li>
				<li><a href="https://github.com/rkendel1/blackjack/blob/main/ARVR_DOCUMENTATION.md" target="_blank" rel="noopener noreferrer">ARVR_DOCUMENTATION.md</a></li>
				<li><a href="https://github.com/rkendel1/blackjack/blob/main/WEBCOMPONENTS.md" target="_blank" rel="noopener noreferrer">WEBCOMPONENTS.md</a></li>
			</ul>
		</div>
	</div>

	<footer>
		<p>
			Built with ❤️ using StackLive Realtime Multiplayer Platform
		</p>
		<p class="note">
			Note: Some features require WebXR support. Fallback rendering provided for unsupported devices.
		</p>
	</footer>
</div>

<style>
	.demo-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		text-align: center;
		margin-bottom: 40px;
		padding-bottom: 20px;
		border-bottom: 2px solid #e2e8f0;
	}

	h1 {
		font-size: 36px;
		font-weight: 700;
		color: #2d3748;
		margin: 0 0 10px 0;
	}

	.subtitle {
		font-size: 18px;
		color: #718096;
		margin: 0;
	}

	.demo-section {
		margin-bottom: 60px;
	}

	h2 {
		font-size: 28px;
		font-weight: 600;
		color: #2d3748;
		margin: 0 0 12px 0;
	}

	.description {
		font-size: 16px;
		color: #4a5568;
		margin: 0 0 24px 0;
		line-height: 1.6;
	}

	.description code {
		background: #edf2f7;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 14px;
		color: #2d3748;
		font-family: 'Courier New', monospace;
	}

	.component-demo {
		background: #f7fafc;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 24px;
	}

	.controls {
		display: flex;
		gap: 12px;
		margin-top: 16px;
		flex-wrap: wrap;
	}

	button {
		padding: 10px 20px;
		background: #4299e1;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:hover {
		background: #3182ce;
	}

	.avatar-grid,
	.filter-grid,
	.spatial-grid {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.code-example {
		background: #2d3748;
		border-radius: 8px;
		padding: 20px;
		margin-top: 24px;
	}

	.code-example h3 {
		color: #e2e8f0;
		font-size: 16px;
		font-weight: 600;
		margin: 0 0 12px 0;
	}

	pre {
		margin: 0;
		overflow-x: auto;
	}

	code {
		color: #e2e8f0;
		font-family: 'Courier New', monospace;
		font-size: 13px;
		line-height: 1.6;
	}

	.integration-section {
		background: #ebf8ff;
		border: 2px solid #4299e1;
		border-radius: 12px;
		padding: 32px;
		margin-bottom: 40px;
	}

	.integration-content h3 {
		font-size: 20px;
		font-weight: 600;
		color: #2d3748;
		margin: 24px 0 12px 0;
	}

	.integration-content h3:first-child {
		margin-top: 0;
	}

	.integration-content p {
		font-size: 14px;
		color: #4a5568;
		line-height: 1.6;
		margin: 0 0 12px 0;
	}

	.integration-content ul {
		margin: 12px 0;
		padding-left: 24px;
	}

	.integration-content li {
		font-size: 14px;
		color: #4a5568;
		line-height: 1.8;
		margin-bottom: 8px;
	}

	.integration-content a {
		color: #4299e1;
		text-decoration: none;
		font-weight: 600;
	}

	.integration-content a:hover {
		text-decoration: underline;
	}

	footer {
		text-align: center;
		padding: 20px 0;
		border-top: 2px solid #e2e8f0;
		margin-top: 40px;
	}

	footer p {
		margin: 8px 0;
		color: #718096;
		font-size: 14px;
	}

	.note {
		font-size: 12px !important;
		font-style: italic;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 28px;
		}

		h2 {
			font-size: 24px;
		}

		.subtitle {
			font-size: 16px;
		}

		.avatar-grid,
		.filter-grid,
		.spatial-grid {
			flex-direction: column;
			align-items: center;
		}

		.controls {
			flex-direction: column;
		}

		button {
			width: 100%;
		}
	}
</style>
