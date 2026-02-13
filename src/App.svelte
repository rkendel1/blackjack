<script lang="ts">
	import { onMount } from 'svelte';
	import { inject } from '@vercel/analytics';
	import { dev } from '$lib/utils/browser';
	import { createRouter } from '$lib/router';

	// Import all pages
	import Home from './pages/Home.svelte';
	import Blackjack from './pages/Blackjack.svelte';
	import War from './pages/War.svelte';
	import OldMaid from './pages/OldMaid.svelte';
	import GoFish from './pages/GoFish.svelte';
	import CrazyEights from './pages/CrazyEights.svelte';
	import Poker from './pages/Poker.svelte';
	import TexasHoldem from './pages/TexasHoldem.svelte';
	import Klondike from './pages/Klondike.svelte';
	import Spider from './pages/Spider.svelte';
	import FreeCell from './pages/FreeCell.svelte';
	import Multiplayer from './pages/Multiplayer.svelte';
	import BlackjackMultiplayer from './pages/BlackjackMultiplayer.svelte';
	import ARVRDemo from './pages/ARVRDemo.svelte';
	import WebComponentsDemo from './pages/WebComponentsDemo.svelte';
	import Messaging from './pages/Messaging.svelte';
	import MessagingDemo from './pages/MessagingDemo.svelte';
	import TicTacToe from './pages/TicTacToe.svelte';
	import TicTacToeMultiplayer from './pages/TicTacToeMultiplayer.svelte';
	import TicTacToeEmbedDemo from './pages/TicTacToeEmbedDemo.svelte';
<<<<<<< copilot/add-user-customizable-rss-reader
	import RSSReaderDemo from './pages/RSSReaderDemo.svelte';
=======
	import RoomDemo from './pages/RoomDemo.svelte';
>>>>>>> main

	// Initialize Vercel analytics
	inject({ mode: dev ? 'development' : 'production' });

	// Define routes
	const routes = [
		{ path: '/', component: Home },
		{ path: '/blackjack', component: Blackjack },
		{ path: '/war', component: War },
		{ path: '/old-maid', component: OldMaid },
		{ path: '/go-fish', component: GoFish },
		{ path: '/crazy-eights', component: CrazyEights },
		{ path: '/poker', component: Poker },
		{ path: '/texas-holdem', component: TexasHoldem },
		{ path: '/solitaire/klondike', component: Klondike },
		{ path: '/solitaire/spider', component: Spider },
		{ path: '/solitaire/freecell', component: FreeCell },
		{ path: '/multiplayer', component: Multiplayer },
		{ path: '/blackjack-multiplayer', component: BlackjackMultiplayer },
		{ path: '/arvr-demo', component: ARVRDemo },
		{ path: '/webcomponents-demo', component: WebComponentsDemo },
		{ path: '/messaging', component: Messaging },
		{ path: '/messaging/demo', component: MessagingDemo },
		{ path: '/tictactoe', component: TicTacToe },
		{ path: '/tictactoe-multiplayer', component: TicTacToeMultiplayer },
		{ path: '/tictactoe-embed-demo', component: TicTacToeEmbedDemo },
<<<<<<< copilot/add-user-customizable-rss-reader
		{ path: '/rss-reader-demo', component: RSSReaderDemo }
=======
		{ path: '/room-demo', component: RoomDemo }
>>>>>>> main
	];

	const router = createRouter(routes);
	const { currentRoute } = router;

	// Handle link clicks for client-side navigation
	onMount(() => {
		function handleClick(event: MouseEvent) {
			const target = event.target as HTMLElement;
			const anchor = target.closest('a');
			
			if (anchor && anchor.href && anchor.origin === window.location.origin) {
				event.preventDefault();
				router.navigate(anchor.pathname);
			}
		}

		document.addEventListener('click', handleClick);
		return () => document.removeEventListener('click', handleClick);
	});
</script>

{#if $currentRoute}
	<svelte:component this={$currentRoute.component} />
{:else}
	<div style="padding: 2rem; text-align: center;">
		<h1>404 - Page Not Found</h1>
		<p><a href="/">Go Home</a></p>
	</div>
{/if}
