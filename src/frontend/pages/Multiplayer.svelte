<script lang="ts">
	import MultiplayerLobby from '$frontend/components/MultiplayerLobby.svelte';
	import '../global.css';
</script>

<div class="container">
	<header>
		<h1>🎮 StackLive Multiplayer Platform</h1>
		<p>Experience real-time multiplayer card games</p>
	</header>

	<main>
		<div class="info-section">
			<h2>Features</h2>
			<ul>
				<li>🔐 Host-Authoritative gameplay</li>
				<li>📡 WebRTC peer-to-peer connections</li>
				<li>⚡ Low-latency state synchronization</li>
				<li>🔄 Automatic reconnection</li>
				<li>📊 Real-time connection quality monitoring</li>
				<li>👥 Multiplayer lobby system</li>
			</ul>
		</div>

		<MultiplayerLobby gameId="blackjack" maxPlayers={4} allowSpectators={true} />

		<div class="tech-info">
			<h2>Technology Stack</h2>
			<div class="tech-grid">
				<div class="tech-card">
					<h3>WebRTC</h3>
					<p>Peer-to-peer data channels for real-time game communication</p>
				</div>
				<div class="tech-card">
					<h3>State Sync</h3>
					<p>Event + Snapshot hybrid for drift-free gameplay</p>
				</div>
				<div class="tech-card">
					<h3>Session Management</h3>
					<p>Full lifecycle state machine with automatic cleanup</p>
				</div>
				<div class="tech-card">
					<h3>Latency Tracking</h3>
					<p>Real-time ping measurement and quality metrics</p>
				</div>
			</div>
		</div>

		<div class="architecture">
			<h2>Architecture</h2>
			<pre><code>
┌────────────────────────────────────┐
│ StackLive Multiplayer Runtime (SMR)
│  - Session Manager
│  - Authority Engine
│  - State Sync Adapter
│  - Reconnect Manager
│  - Latency Manager
│  - Presence Manager
└────────────────────────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
WebRTC P2P         Future: Convex
(Data Channels)    (Signaling Server)
			</code></pre>
		</div>

		<div class="status">
			<h2>Implementation Status</h2>
			<div class="status-grid">
				<div class="status-item complete">
					<span class="icon">✅</span>
					<span>Core Runtime Types</span>
				</div>
				<div class="status-item complete">
					<span class="icon">✅</span>
					<span>WebRTC Connection Manager</span>
				</div>
				<div class="status-item complete">
					<span class="icon">✅</span>
					<span>Session Lifecycle</span>
				</div>
				<div class="status-item complete">
					<span class="icon">✅</span>
					<span>Latency Monitoring</span>
				</div>
				<div class="status-item complete">
					<span class="icon">✅</span>
					<span>Svelte Integration</span>
				</div>
				<div class="status-item complete">
					<span class="icon">✅</span>
					<span>Lobby UI</span>
				</div>
				<div class="status-item pending">
					<span class="icon">🔜</span>
					<span>Convex Signaling</span>
				</div>
				<div class="status-item pending">
					<span class="icon">🔜</span>
					<span>Matchmaking System</span>
				</div>
				<div class="status-item pending">
					<span class="icon">🔜</span>
					<span>Game Integration</span>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem;
	}

	header {
		text-align: center;
		color: white;
		margin-bottom: 2rem;
	}

	header h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	header p {
		font-size: 1.25rem;
		opacity: 0.9;
	}

	main {
		max-width: 1200px;
		margin: 0 auto;
	}

	.info-section {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.info-section h2 {
		margin-top: 0;
		color: #667eea;
	}

	.info-section ul {
		list-style: none;
		padding: 0;
	}

	.info-section li {
		padding: 0.5rem 0;
		font-size: 1.1rem;
	}

	.tech-info,
	.architecture,
	.status {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		margin-top: 2rem;
	}

	.tech-info h2,
	.architecture h2,
	.status h2 {
		margin-top: 0;
		color: #667eea;
	}

	.tech-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.tech-card {
		background: #f5f5f5;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #667eea;
	}

	.tech-card h3 {
		margin-top: 0;
		color: #667eea;
	}

	.tech-card p {
		margin-bottom: 0;
		color: #666;
	}

	.architecture pre {
		background: #1e1e1e;
		color: #d4d4d4;
		padding: 1.5rem;
		border-radius: 8px;
		overflow-x: auto;
	}

	.architecture code {
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 0.9rem;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 8px;
		background: #f5f5f5;
	}

	.status-item.complete {
		border-left: 4px solid #4caf50;
	}

	.status-item.pending {
		border-left: 4px solid #ff9800;
	}

	.status-item .icon {
		font-size: 1.5rem;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		header h1 {
			font-size: 1.75rem;
		}

		header p {
			font-size: 1rem;
		}

		.tech-grid,
		.status-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
