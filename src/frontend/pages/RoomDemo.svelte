<script lang="ts">
	import { onMount } from 'svelte';

	// Import web components to register them
	import '$frontend/webcomponents';

	let roomElement: HTMLElement;
	let sessionId = '';
	let roomName = 'Work Room Demo';

	onMount(() => {
		// Listen for custom events from room component
		if (roomElement) {
			roomElement.addEventListener('ready', (e: CustomEvent) => {
				console.log('Room ready:', e.detail);
				if (e.detail.sessionId) {
					sessionId = e.detail.sessionId;
				}
			});
		}
	});

	function handleSendMessage() {
		if (roomElement && 'sendMessage' in roomElement) {
			(roomElement as any).sendMessage('Hello from external API!');
		}
	}

	function handleSendShout() {
		if (roomElement && 'sendShout' in roomElement) {
			(roomElement as any).sendShout('Important announcement!');
		}
	}

	function handleSendSmokeSignal() {
		if (roomElement && 'sendSmokeSignal' in roomElement) {
			(roomElement as any).sendSmokeSignal('Quick update!');
		}
	}

	function handleGetRoomInfo() {
		if (roomElement && 'getRoomInfo' in roomElement) {
			const info = (roomElement as any).getRoomInfo();
			console.log('Room info:', info);
			alert(JSON.stringify(info, null, 2));
		}
	}

	function copySessionLink() {
		if (sessionId) {
			const url = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
			navigator.clipboard.writeText(url);
			alert('Session link copied to clipboard!');
		}
	}
</script>

<svelte:head>
	<title>Room Component Demo - StackLive</title>
</svelte:head>

<div class="demo-page">
	<header>
		<h1>🏢 Work Room Component Demo</h1>
		<p class="subtitle">
			Persistent work room with ambient presence, messaging, shouts, and smoke signals
		</p>
	</header>

	<div class="demo-section">
		<h2>Live Demo</h2>
		<p class="description">
			The <code>&lt;sl-room&gt;</code> component provides a complete collaborative room experience with:
		</p>
		<ul class="features-list">
			<li>💬 <strong>Messaging</strong> - Real-time chat with all room members</li>
			<li>👥 <strong>Ambient Presence</strong> - See who's in the room and their status</li>
			<li>🔊 <strong>Shouts</strong> - Broadcast important messages to everyone</li>
			<li>💨 <strong>Smoke Signals</strong> - Quick ephemeral notifications (auto-disappear in 5s)</li>
			<li>🎭 <strong>Role-based Membership</strong> - Host, members, and guests with different permissions</li>
		</ul>

		<div class="component-demo">
			<sl-room
				bind:this={roomElement}
				embedId="demo-room"
				roomName={roomName}
				enableVideo="false"
				enableAudio="false"
				maxMembers="50"
				defaultRole="member"
			></sl-room>
		</div>

		{#if sessionId}
			<div class="session-info">
				<h3>Session Information</h3>
				<p><strong>Session ID:</strong> {sessionId}</p>
				<button class="btn-secondary" on:click={copySessionLink}>
					📋 Copy Session Link
				</button>
				<p class="hint">Share this link to invite others to join the room!</p>
			</div>
		{/if}
	</div>

	<div class="demo-section">
		<h2>JavaScript API</h2>
		<p class="description">
			You can programmatically control the room component using its JavaScript API:
		</p>

		<div class="api-controls">
			<button on:click={handleSendMessage}>Send Message</button>
			<button on:click={handleSendShout}>Send Shout</button>
			<button on:click={handleSendSmokeSignal}>Send Smoke Signal</button>
			<button on:click={handleGetRoomInfo}>Get Room Info</button>
		</div>

		<div class="code-example">
			<h3>Example Code</h3>
			<pre><code>{`<!-- Basic Usage -->
<sl-room
  embedId="my-room"
  roomName="Project Planning"
  maxMembers="25"
  defaultRole="member"
></sl-room>

<!-- Join Existing Session -->
<sl-room
  embedId="my-room"
  sessionId="session-abc123"
  roomName="Project Planning"
></sl-room>

<!-- JavaScript API -->
<script>
  const room = document.querySelector('sl-room');
  
  // Send a message
  room.sendMessage('Hello everyone!');
  
  // Send a shout (broadcast)
  room.sendShout('Meeting starts in 5 minutes!');
  
  // Send smoke signal (ephemeral notification)
  room.sendSmokeSignal('👍 Good idea!');
  
  // Get room info
  const info = room.getRoomInfo();
  console.log(\`Room has \${info.memberCount} members\`);
  
  // Listen for events
  room.addEventListener('ready', (e) => {
    console.log('Room ready:', e.detail);
  });
<\/script>`}</code></pre>
		</div>
	</div>

	<div class="demo-section">
		<h2>Attributes</h2>
		<table class="attributes-table">
			<thead>
				<tr>
					<th>Attribute</th>
					<th>Type</th>
					<th>Default</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>embedId</code></td>
					<td>string</td>
					<td>"room"</td>
					<td>Unique identifier for this room instance</td>
				</tr>
				<tr>
					<td><code>sessionId</code></td>
					<td>string</td>
					<td>""</td>
					<td>Join existing session (leave empty to create new)</td>
				</tr>
				<tr>
					<td><code>roomName</code></td>
					<td>string</td>
					<td>"Work Room"</td>
					<td>Display name for the room</td>
				</tr>
				<tr>
					<td><code>enableVideo</code></td>
					<td>string</td>
					<td>"false"</td>
					<td>Enable video streaming</td>
				</tr>
				<tr>
					<td><code>enableAudio</code></td>
					<td>string</td>
					<td>"false"</td>
					<td>Enable audio streaming</td>
				</tr>
				<tr>
					<td><code>maxMembers</code></td>
					<td>string</td>
					<td>"50"</td>
					<td>Maximum number of members allowed</td>
				</tr>
				<tr>
					<td><code>defaultRole</code></td>
					<td>string</td>
					<td>"member"</td>
					<td>Default role for joining participants</td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="demo-section">
		<h2>Methods</h2>
		<table class="attributes-table">
			<thead>
				<tr>
					<th>Method</th>
					<th>Parameters</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>sendMessage(text)</code></td>
					<td>text: string</td>
					<td>Send a text message to the room</td>
				</tr>
				<tr>
					<td><code>sendShout(text)</code></td>
					<td>text: string</td>
					<td>Send a broadcast shout to all members</td>
				</tr>
				<tr>
					<td><code>sendSmokeSignal(message)</code></td>
					<td>message: string</td>
					<td>Send an ephemeral notification</td>
				</tr>
				<tr>
					<td><code>getRoomInfo()</code></td>
					<td>-</td>
					<td>Get current room state and statistics</td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="demo-section">
		<h2>Events</h2>
		<table class="attributes-table">
			<thead>
				<tr>
					<th>Event</th>
					<th>Detail</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>ready</code></td>
					<td>{'{ embedId, sessionId, roomName }'}</td>
					<td>Fired when the room is initialized and ready</td>
				</tr>
			</tbody>
		</table>
	</div>

	<div class="demo-section">
		<h2>Features Explained</h2>
		
		<h3>💬 Chat Tab</h3>
		<p>Real-time messaging with all room members. Messages include sender name, timestamp, and support for media content.</p>
		
		<h3>👥 Members Tab</h3>
		<p>Shows all current room members with their presence status (online/offline), role (host/member/guest), and connection status.</p>
		
		<h3>🔊 Shouts Tab</h3>
		<p>Broadcast important messages that stand out. Shouts are highlighted differently from regular chat and are visible in a dedicated tab.</p>
		
		<h3>💨 Smoke Signals</h3>
		<p>Quick ephemeral notifications that appear briefly (5 seconds) in the top-right corner. Perfect for reactions like "👋 Hello!", "👍 Agreed", or "🎉 Celebrate!"</p>
		
		<h3>Quick Actions</h3>
		<p>Floating action buttons for instant smoke signals. Click emoji buttons to send quick reactions without typing.</p>
	</div>

	<div class="demo-section">
		<h2>Integration Guide</h2>
		<p>To use the sl-room component in your project:</p>
		
		<h3>1. Include the Script</h3>
		<pre><code>{`<script src="https://your-cdn.com/stacklive-webcomponents.js"><\/script>`}</code></pre>
		
		<h3>2. Add the Component</h3>
		<pre><code>{`<sl-room 
  embedId="my-team-room"
  roomName="Team Collaboration"
  maxMembers="30"
></sl-room>`}</code></pre>
		
		<h3>3. Style as Needed</h3>
		<pre><code>{`<style>
  sl-room {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }
</style>`}</code></pre>
	</div>

	<div class="demo-section">
		<h2>Browser Support</h2>
		<p>The sl-room component works in all modern browsers that support:</p>
		<ul>
			<li>Custom Elements (Web Components)</li>
			<li>WebRTC (for real-time communication)</li>
			<li>ES6+ JavaScript</li>
		</ul>
		<p>Tested on:</p>
		<ul>
			<li>✅ Chrome/Edge 88+</li>
			<li>✅ Firefox 85+</li>
			<li>✅ Safari 14.1+</li>
		</ul>
	</div>
</div>

<style>
	.demo-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: #111827;
	}

	.subtitle {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
	}

	.demo-section {
		margin-bottom: 3rem;
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	h2 {
		font-size: 1.75rem;
		margin-bottom: 1rem;
		color: #111827;
	}

	h3 {
		font-size: 1.25rem;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: #374151;
	}

	.description {
		color: #4b5563;
		line-height: 1.6;
	}

	.features-list {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0;
	}

	.features-list li {
		padding: 0.75rem 0;
		border-bottom: 1px solid #e5e7eb;
		color: #374151;
	}

	.features-list li:last-child {
		border-bottom: none;
	}

	.component-demo {
		margin: 2rem 0;
		display: flex;
		justify-content: center;
	}

	.session-info {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 8px;
		margin-top: 2rem;
	}

	.session-info h3 {
		margin-top: 0;
	}

	.hint {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.5rem;
	}

	.api-controls {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin: 1.5rem 0;
	}

	.api-controls button,
	.btn-secondary {
		padding: 0.75rem 1.5rem;
		background: #5b21b6;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.api-controls button:hover,
	.btn-secondary:hover {
		background: #7c3aed;
	}

	.code-example {
		background: #1f2937;
		color: #f9fafb;
		padding: 1.5rem;
		border-radius: 8px;
		margin: 1.5rem 0;
		overflow-x: auto;
	}

	.code-example h3 {
		color: #f9fafb;
		margin-top: 0;
	}

	pre {
		margin: 0;
	}

	code {
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	p code,
	td code {
		background: #f3f4f6;
		color: #5b21b6;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.attributes-table {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
	}

	.attributes-table th,
	.attributes-table td {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.attributes-table th {
		background: #f9fafb;
		font-weight: 600;
		color: #111827;
	}

	.attributes-table td {
		color: #374151;
	}

	.attributes-table tr:last-child td {
		border-bottom: none;
	}

	@media (max-width: 768px) {
		.demo-page {
			padding: 1rem;
		}

		h1 {
			font-size: 2rem;
		}

		.demo-section {
			padding: 1.5rem;
		}

		.api-controls {
			flex-direction: column;
		}

		.api-controls button {
			width: 100%;
		}
	}
</style>
