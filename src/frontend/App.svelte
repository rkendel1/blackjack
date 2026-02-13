<script lang="ts">
	import { inject } from '@vercel/analytics';
	import { dev } from '../backend/utils/browser';
	import { createRouter } from '../backend/router';

	// Import all page components
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
	import Freecell from './pages/Freecell.svelte';
	import Multiplayer from './pages/Multiplayer.svelte';
	import BlackjackMultiplayer from './pages/BlackjackMultiplayer.svelte';
	import ArvrDemo from './pages/ArvrDemo.svelte';
	import WebcomponentsDemo from './pages/WebcomponentsDemo.svelte';
	import Messaging from './pages/Messaging.svelte';
	import Tictactoe from './pages/Tictactoe.svelte';
	import TictactoeMultiplayer from './pages/TictactoeMultiplayer.svelte';
	import TictactoeEmbedDemo from './pages/TictactoeEmbedDemo.svelte';
	import RssReaderDemo from './pages/RssReaderDemo.svelte';
	import RoomDemo from './pages/RoomDemo.svelte';

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
		{ path: '/solitaire/freecell', component: Freecell },
		{ path: '/multiplayer', component: Multiplayer },
		{ path: '/blackjack-multiplayer', component: BlackjackMultiplayer },
		{ path: '/arvr-demo', component: ArvrDemo },
		{ path: '/webcomponents-demo', component: WebcomponentsDemo },
		{ path: '/messaging', component: Messaging },
		{ path: '/tictactoe', component: Tictactoe },
		{ path: '/tictactoe-multiplayer', component: TictactoeMultiplayer },
		{ path: '/tictactoe-embed-demo', component: TictactoeEmbedDemo },
		{ path: '/rss-reader-demo', component: RssReaderDemo },
		{ path: '/room-demo', component: RoomDemo }
	];

	const router = createRouter(routes);
	const { currentRoute } = router;
</script>

<svelte:component this={$currentRoute} />
