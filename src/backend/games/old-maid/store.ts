import { writable, get } from 'svelte/store';
import { Deck } from '../../shared/deck';
import type { Card, Rank } from '../../shared/deck';
import { BasePlayer, BotPlayer } from '../../shared/player';

export class OldMaidPlayer extends BasePlayer {
	pairs: Rank[] = [];

	removePairs() {
		const rankCounts = new Map<Rank, Card[]>();

		// Group cards by rank
		for (const card of this.hand) {
			if (!rankCounts.has(card.rank)) {
				rankCounts.set(card.rank, []);
			}
			rankCounts.get(card.rank)!.push(card);
		}

		// Remove pairs
		const newHand: Card[] = [];
		for (const [rank, cards] of rankCounts.entries()) {
			const pairCount = Math.floor(cards.length / 2);
			for (let i = 0; i < pairCount; i++) {
				this.pairs.push(rank);
			}
			// Keep remaining odd card(s)
			if (cards.length % 2 === 1) {
				newHand.push(cards[cards.length - 1]);
			}
		}

		this.hand = newHand;
	}

	get pairCount(): number {
		return this.pairs.length;
	}
}

export class OldMaidBot extends BotPlayer {
	pairs: Rank[] = [];

	removePairs() {
		const rankCounts = new Map<Rank, Card[]>();

		for (const card of this.hand) {
			if (!rankCounts.has(card.rank)) {
				rankCounts.set(card.rank, []);
			}
			rankCounts.get(card.rank)!.push(card);
		}

		const newHand: Card[] = [];
		for (const [rank, cards] of rankCounts.entries()) {
			const pairCount = Math.floor(cards.length / 2);
			for (let i = 0; i < pairCount; i++) {
				this.pairs.push(rank);
			}
			if (cards.length % 2 === 1) {
				newHand.push(cards[cards.length - 1]);
			}
		}

		this.hand = newHand;
	}

	get pairCount(): number {
		return this.pairs.length;
	}

	chooseCardIndex(): number {
		// Bot randomly chooses a card index from opponent
		return Math.floor(Math.random() * 1000); // Will be modulo'd by hand length
	}
}

export type GameState = 'ready' | 'player-turn' | 'bot-turn' | 'won';

export function createOldMaidGame() {
	const player = writable(new OldMaidPlayer('Player'));
	const bot = writable(new OldMaidBot('Bot'));
	const state = writable<GameState>('ready');
	const message = writable('');
	const selectedCardIndex = writable<number | null>(null);
	const winner = writable<'player' | 'bot' | null>(null);
	const lastAction = writable('');

	const start = () => {
		const deck = new Deck();
		const newPlayer = new OldMaidPlayer('Player');
		const newBot = new OldMaidBot('Bot');

		// Remove one Queen to make it the "Old Maid"
		// Remove 3 queens, keep 1 as old maid
		const queens = deck.cards.filter((c) => c.rank === 'queen');
		if (queens.length >= 3) {
			for (let i = 0; i < 3; i++) {
				const index = deck.cards.indexOf(queens[i]);
				deck.cards.splice(index, 1);
			}
		}

		deck.shuffle();

		// Deal all cards
		let isPlayer = true;
		while (deck.remaining > 0) {
			const card = deck.deal();
			if (isPlayer) {
				newPlayer.addCard(card);
			} else {
				newBot.addCard(card);
			}
			isPlayer = !isPlayer;
		}

		// Remove initial pairs
		newPlayer.removePairs();
		newBot.removePairs();

		player.set(newPlayer);
		bot.set(newBot);
		state.set('player-turn');
		message.set('Your turn! Pick a card from the bot.');
		selectedCardIndex.set(null);
		winner.set(null);
		lastAction.set('Game started! Initial pairs removed.');
	};

	const checkWinner = () => {
		const $player = get(player);
		const $bot = get(bot);

		state.set('won');

		if ($player.hand.length === 0 && $bot.hand.length > 0) {
			winner.set('player');
			message.set('You win! Bot has the Old Maid!');
		} else if ($bot.hand.length === 0 && $player.hand.length > 0) {
			winner.set('bot');
			message.set('Bot wins! You have the Old Maid!');
		} else if ($player.hand.length === 0 && $bot.hand.length === 0) {
			message.set("It's a tie!");
		}
	};

	const botTurn = () => {
		state.set('bot-turn');
		const $player = get(player);
		const $bot = get(bot);

		if ($player.hand.length === 0) {
			checkWinner();
			return;
		}

		const index = $bot.chooseCardIndex() % $player.hand.length;
		const card = $player.hand.splice(index, 1)[0];
		$bot.addCard(card);
		lastAction.set(`Bot drew a card from you.`);

		$bot.removePairs();

		player.set($player);
		bot.set($bot);

		if ($player.hand.length === 0 || $bot.hand.length === 0) {
			checkWinner();
		} else {
			state.set('player-turn');
			message.set('Your turn! Pick a card from the bot.');
		}
	};

	const playerDrawCard = (index: number) => {
		if (get(state) !== 'player-turn') return;

		const $bot = get(bot);
		const $player = get(player);

		if ($bot.hand.length === 0) return;

		const card = $bot.hand.splice(index, 1)[0];
		$player.addCard(card);
		lastAction.set(`You drew a card from the bot.`);

		$player.removePairs();

		player.set($player);
		bot.set($bot);

		if ($player.hand.length === 0 || $bot.hand.length === 0) {
			checkWinner();
		} else {
			setTimeout(() => botTurn(), 1500);
		}
	};

	return {
		player,
		bot,
		state,
		message,
		selectedCardIndex,
		winner,
		lastAction,
		start,
		playerDrawCard
	};
}
