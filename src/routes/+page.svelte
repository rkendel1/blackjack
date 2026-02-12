<script lang="ts">
	import './global.css';

	const games = [
		{
			name: 'Blackjack',
			path: '/blackjack',
			description: 'Classic casino card game - beat the dealer without going over 21',
			status: 'ready'
		},
		{
			name: "Texas Hold'em",
			path: '/texas-holdem',
			description: 'Popular poker variant with community cards',
			status: 'coming-soon'
		},
		{
			name: 'War',
			path: '/war',
			description: 'Simple card battle game - highest card wins',
			status: 'ready'
		},
		{
			name: 'Go Fish',
			path: '/go-fish',
			description: 'Collect matching sets by asking opponents for cards',
			status: 'ready'
		},
		{
			name: 'Old Maid',
			path: '/old-maid',
			description: 'Avoid being left with the Old Maid card',
			status: 'ready'
		},
		{
			name: 'Crazy Eights',
			path: '/crazy-eights',
			description: 'Discard all your cards by matching rank or suit',
			status: 'ready'
		},
		{
			name: 'Klondike Solitaire',
			path: '/solitaire/klondike',
			description: 'Classic solitaire patience game',
			status: 'coming-soon'
		}
	];
</script>

<main>
	<div class="container">
		<h1>🎴 Card Games Collection</h1>
		<p class="subtitle">Choose a game to play</p>

		<div class="games-grid">
			{#each games as game}
				<a
					href={game.status === 'ready' ? game.path : '#'}
					class="game-card"
					class:disabled={game.status !== 'ready'}
				>
					<h2>{game.name}</h2>
					<p class="description">{game.description}</p>
					{#if game.status === 'coming-soon'}
						<span class="badge">Coming Soon</span>
					{/if}
				</a>
			{/each}
		</div>
	</div>
</main>

<style>
	main {
		min-height: 100dvh;
		width: 100dvw;
		background: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.container {
		max-width: 1200px;
		width: 100%;
		text-align: center;
	}

	h1 {
		font-size: 3rem;
		color: goldenrod;
		margin-bottom: 0.5rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	.subtitle {
		font-size: 1.2rem;
		color: #e8eaed;
		margin-bottom: 3rem;
	}

	.games-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		padding: 20px 0;
	}

	.game-card {
		background: rgba(0, 0, 0, 0.4);
		border: 2px solid rgba(255, 215, 0, 0.3);
		border-radius: 12px;
		padding: 2rem;
		text-decoration: none;
		color: #e8eaed;
		transition: all 0.3s ease;
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}

	.game-card:hover:not(.disabled) {
		border-color: goldenrod;
		transform: translateY(-5px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
		background: rgba(0, 0, 0, 0.6);
	}

	.game-card.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.game-card h2 {
		font-size: 1.5rem;
		color: goldenrod;
		margin-bottom: 0.75rem;
	}

	.description {
		font-size: 0.95rem;
		color: #c4c4cc;
		line-height: 1.5;
	}

	.badge {
		display: inline-block;
		background: rgba(255, 215, 0, 0.2);
		color: goldenrod;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.8rem;
		font-weight: bold;
		margin-top: 1rem;
		border: 1px solid goldenrod;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}

		.subtitle {
			font-size: 1rem;
			margin-bottom: 2rem;
		}

		.games-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.game-card {
			padding: 1.5rem;
		}

		.game-card h2 {
			font-size: 1.25rem;
		}
	}
</style>
