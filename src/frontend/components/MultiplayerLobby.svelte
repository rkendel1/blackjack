<script lang="ts">
	import { useStackLiveMultiplayer } from '../../backend/multiplayer';
	import type { MultiplayerConfig } from '../../backend/multiplayer';

	export let gameId: string;
	export let maxPlayers = 4;
	export let allowSpectators = false;

	const config: MultiplayerConfig = {
		gameId,
		mode: 'host-authoritative',
		maxPlayers,
		spectators: allowSpectators,
		debug: true
	};

	const mp = useStackLiveMultiplayer(config);
	const { session, participants, connectionQuality, sessionState, isHost, playerCount, spectatorCount } = mp;

	let sessionId = '';
	let showCreateDialog = false;
	let showJoinDialog = false;

	async function handleCreateSession() {
		const newSession = await mp.createSession();
		if (newSession) {
			sessionId = newSession.id;
			showCreateDialog = false;
		}
	}

	async function handleJoinSession() {
		const success = await mp.joinSession(sessionId);
		if (success) {
			showJoinDialog = false;
		}
	}

	function handleLeaveSession() {
		mp.leaveSession();
		sessionId = '';
	}

	function copySessionLink() {
		const link = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
		navigator.clipboard.writeText(link);
	}
</script>

<div class="multiplayer-lobby">
	{#if !$session}
		<div class="lobby-menu">
			<h2>Multiplayer Lobby</h2>

			<div class="buttons">
				<button class="primary" on:click={() => (showCreateDialog = true)}>
					Create Session
				</button>
				<button class="secondary" on:click={() => (showJoinDialog = true)}>
					Join Session
				</button>
			</div>
		</div>

		{#if showCreateDialog}
			<div class="dialog">
				<h3>Create New Session</h3>
				<p>Game: {gameId}</p>
				<p>Max Players: {maxPlayers}</p>
				<p>Spectators: {allowSpectators ? 'Allowed' : 'Not Allowed'}</p>

				<div class="dialog-buttons">
					<button on:click={handleCreateSession}>Create</button>
					<button on:click={() => (showCreateDialog = false)}>Cancel</button>
				</div>
			</div>
		{/if}

		{#if showJoinDialog}
			<div class="dialog">
				<h3>Join Session</h3>
				<input type="text" bind:value={sessionId} placeholder="Enter Session ID" />

				<div class="dialog-buttons">
					<button on:click={handleJoinSession}>Join</button>
					<button on:click={() => (showJoinDialog = false)}>Cancel</button>
				</div>
			</div>
		{/if}
	{:else}
		<div class="active-session">
			<h2>Session Active</h2>

			<div class="session-info">
				<p><strong>Session ID:</strong> {$session.id}</p>
				<p><strong>Game:</strong> {$session.gameId}</p>
				<p><strong>Status:</strong> {$sessionState}</p>
				<p><strong>Role:</strong> {$isHost ? 'Host' : 'Player'}</p>
			</div>

			<div class="participants">
				<h3>Players ({$playerCount}/{maxPlayers})</h3>
				<ul>
					{#each $participants as participant}
						{#if participant.role === 'player' || participant.role === 'host'}
							<li>
								<span class="name">{participant.userId}</span>
								<span class="status {participant.connectionStatus}">
									{participant.connectionStatus}
								</span>
								{#if participant.role === 'host'}
									<span class="badge">Host</span>
								{/if}
							</li>
						{/if}
					{/each}
				</ul>

				{#if allowSpectators && $spectatorCount > 0}
					<h3>Spectators ({$spectatorCount})</h3>
					<ul>
						{#each $participants as participant}
							{#if participant.role === 'spectator'}
								<li>
									<span class="name">{participant.userId}</span>
									<span class="status {participant.connectionStatus}">
										{participant.connectionStatus}
									</span>
								</li>
							{/if}
						{/each}
					</ul>
				{/if}
			</div>

			<div class="connection-quality">
				<h3>Connection Quality</h3>
				<p><strong>Latency:</strong> {$connectionQuality.latency}ms</p>
				<p><strong>Jitter:</strong> {$connectionQuality.jitter}ms</p>
				<p>
					<strong>Quality:</strong>
					<span class="quality {$connectionQuality.quality}">
						{$connectionQuality.quality}
					</span>
				</p>
			</div>

			{#if $isHost}
				<button class="share-button" on:click={copySessionLink}>
					📋 Copy Invite Link
				</button>
			{/if}

			<button class="leave-button" on:click={handleLeaveSession}> Leave Session </button>
		</div>
	{/if}
</div>

<style>
	.multiplayer-lobby {
		padding: 1rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.lobby-menu {
		text-align: center;
	}

	.buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}

	button.primary {
		background: #4caf50;
		color: white;
	}

	button.primary:hover {
		background: #45a049;
	}

	button.secondary {
		background: #2196f3;
		color: white;
	}

	button.secondary:hover {
		background: #0b7dda;
	}

	.dialog {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		margin-top: 1rem;
	}

	.dialog input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		margin: 1rem 0;
		font-size: 1rem;
	}

	.dialog-buttons {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.active-session {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.session-info {
		margin: 1rem 0;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
	}

	.session-info p {
		margin: 0.5rem 0;
	}

	.participants ul {
		list-style: none;
		padding: 0;
	}

	.participants li {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: #f5f5f5;
		border-radius: 8px;
		margin: 0.5rem 0;
	}

	.participants .name {
		flex: 1;
		font-weight: 500;
	}

	.participants .status {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
	}

	.participants .status.connected {
		background: #4caf50;
		color: white;
	}

	.participants .status.connecting {
		background: #ff9800;
		color: white;
	}

	.participants .status.disconnected {
		background: #f44336;
		color: white;
	}

	.participants .badge {
		background: #2196f3;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
	}

	.connection-quality {
		margin: 1rem 0;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
	}

	.connection-quality .quality {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-weight: 500;
	}

	.connection-quality .quality.excellent {
		background: #4caf50;
		color: white;
	}

	.connection-quality .quality.good {
		background: #8bc34a;
		color: white;
	}

	.connection-quality .quality.fair {
		background: #ff9800;
		color: white;
	}

	.connection-quality .quality.poor {
		background: #f44336;
		color: white;
	}

	.share-button,
	.leave-button {
		width: 100%;
		margin-top: 1rem;
	}

	.share-button {
		background: #2196f3;
		color: white;
	}

	.share-button:hover {
		background: #0b7dda;
	}

	.leave-button {
		background: #f44336;
		color: white;
	}

	.leave-button:hover {
		background: #da190b;
	}

	@media (max-width: 768px) {
		.multiplayer-lobby {
			padding: 0.5rem;
		}

		.buttons {
			flex-direction: column;
		}
	}
</style>
