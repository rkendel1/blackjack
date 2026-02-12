import { writable, derived, get } from 'svelte/store';
import { Deck } from '$lib/shared/deck';
import type { Card, Rank, Suit } from '$lib/shared/deck';
import { BasePlayer, AIPlayer } from '$lib/shared/player';

export class CrazyEightsPlayer extends BasePlayer {
	canPlayCard(card: Card, topCard: Card, currentSuit: Suit | null): boolean {
		// Eights are wild
		if (card.rank === '8') return true;
		// Match suit
		if (card.suit === (currentSuit || topCard.suit)) return true;
		// Match rank
		if (card.rank === topCard.rank) return true;
		return false;
	}

	getPlayableCards(topCard: Card, currentSuit: Suit | null): Card[] {
		return this.hand.filter((card) => this.canPlayCard(card, topCard, currentSuit));
	}
}

export class CrazyEightsAI extends AIPlayer {
	canPlayCard(card: Card, topCard: Card, currentSuit: Suit | null): boolean {
		if (card.rank === '8') return true;
		if (card.suit === (currentSuit || topCard.suit)) return true;
		if (card.rank === topCard.rank) return true;
		return false;
	}

	getPlayableCards(topCard: Card, currentSuit: Suit | null): Card[] {
		return this.hand.filter((card) => this.canPlayCard(card, topCard, currentSuit));
	}

	chooseCardToPlay(topCard: Card, currentSuit: Suit | null): Card | null {
		const playable = this.getPlayableCards(topCard, currentSuit);
		if (playable.length === 0) return null;

		// Simple strategy: prefer non-eights first, save eights for when needed
		const nonEights = playable.filter((c) => c.rank !== '8');
		if (nonEights.length > 0) {
			return nonEights[0];
		}
		return playable[0];
	}

	chooseSuit(): Suit {
		// Count cards by suit
		const suitCounts = new Map<Suit, number>();
		for (const card of this.hand) {
			suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
		}

		// Choose suit with most cards
		let bestSuit: Suit = 'heart';
		let maxCount = 0;
		for (const [suit, count] of suitCounts.entries()) {
			if (count > maxCount) {
				maxCount = count;
				bestSuit = suit;
			}
		}
		return bestSuit;
	}
}

export type GameState = 'ready' | 'player-turn' | 'ai-turn' | 'won' | 'choosing-suit';

const getCardName = (card: Card): string => {
	const rankNames: Record<Rank, string> = {
		'1': 'Ace',
		'2': '2',
		'3': '3',
		'4': '4',
		'5': '5',
		'6': '6',
		'7': '7',
		'8': '8',
		'9': '9',
		'10': '10',
		jack: 'Jack',
		queen: 'Queen',
		king: 'King'
	};
	return `${rankNames[card.rank]} of ${card.suit}s`;
};

export function createCrazyEightsGame() {
	const player = writable(new CrazyEightsPlayer('Player'));
	const ai = writable(new CrazyEightsAI('Computer'));
	const deck = writable(new Deck());
	const discardPile = writable<Card[]>([]);
	const state = writable<GameState>('ready');
	const currentSuit = writable<Suit | null>(null);
	const message = writable('');
	const winner = writable<'player' | 'ai' | null>(null);
	const lastAction = writable('');

	const topCard = derived(discardPile, ($discardPile) =>
		$discardPile.length > 0 ? $discardPile[$discardPile.length - 1] : null
	);

	const start = () => {
		const newDeck = new Deck();
		const newPlayer = new CrazyEightsPlayer('Player');
		const newAI = new CrazyEightsAI('Computer');
		const newDiscardPile: Card[] = [];

		// Deal 5 cards to each player
		for (let i = 0; i < 5; i++) {
			newPlayer.addCard(newDeck.deal());
			newAI.addCard(newDeck.deal());
		}

		// Start discard pile
		newDiscardPile.push(newDeck.deal());

		deck.set(newDeck);
		player.set(newPlayer);
		ai.set(newAI);
		discardPile.set(newDiscardPile);
		state.set('player-turn');
		currentSuit.set(null);
		message.set('Your turn! Play a card or draw.');
		winner.set(null);
		lastAction.set('Game started!');
	};

	const checkWinner = () => {
		const $player = get(player);
		const $ai = get(ai);

		state.set('won');

		if ($player.hand.length === 0) {
			winner.set('player');
			message.set('You win!');
		} else if ($ai.hand.length === 0) {
			winner.set('ai');
			message.set('Computer wins!');
		}
	};

	const aiTurn = () => {
		state.set('ai-turn');
		const $ai = get(ai);
		const $deck = get(deck);
		const $topCard = get(topCard);
		const $currentSuit = get(currentSuit);
		const $discardPile = get(discardPile);

		const playableCard = $ai.chooseCardToPlay($topCard!, $currentSuit);

		if (playableCard) {
			const index = $ai.hand.indexOf(playableCard);
			$ai.hand.splice(index, 1);
			$discardPile.push(playableCard);
			lastAction.set(`Computer played ${getCardName(playableCard)}`);

			if (playableCard.rank === '8') {
				const chosenSuit = $ai.chooseSuit();
				currentSuit.set(chosenSuit);
				lastAction.update((la) => la + ` and chose ${chosenSuit}`);
			} else {
				currentSuit.set(null);
			}

			ai.set($ai);
			discardPile.set($discardPile);

			if ($ai.hand.length === 0) {
				checkWinner();
			} else {
				state.set('player-turn');
				message.set('Your turn! Play a card or draw.');
			}
		} else {
			// AI must draw
			if ($deck.remaining > 0) {
				const card = $deck.deal();
				$ai.addCard(card);
				lastAction.set('Computer drew a card');

				deck.set($deck);
				ai.set($ai);

				// Check if can play
				if ($ai.canPlayCard(card, $topCard!, $currentSuit)) {
					setTimeout(() => aiTurn(), 1000);
				} else {
					state.set('player-turn');
					message.set('Your turn! Play a card or draw.');
				}
			} else {
				state.set('player-turn');
				message.set('Deck is empty! Your turn.');
			}
		}
	};

	const playCard = (cardIndex: number) => {
		if (get(state) !== 'player-turn') return;

		const $player = get(player);
		const $topCard = get(topCard);
		const $currentSuit = get(currentSuit);
		const card = $player.hand[cardIndex];

		if (!card) return;

		if (!$player.canPlayCard(card, $topCard!, $currentSuit)) {
			message.set("Can't play that card!");
			return;
		}

		$player.hand.splice(cardIndex, 1);
		const $discardPile = get(discardPile);
		$discardPile.push(card);

		lastAction.set(`You played ${getCardName(card)}`);

		player.set($player);
		discardPile.set($discardPile);

		if (card.rank === '8') {
			state.set('choosing-suit');
			message.set('Choose a suit!');
			return;
		}

		currentSuit.set(null);

		if ($player.hand.length === 0) {
			checkWinner();
		} else {
			setTimeout(() => aiTurn(), 1000);
		}
	};

	const chooseSuit = (suit: Suit) => {
		if (get(state) !== 'choosing-suit') return;

		currentSuit.set(suit);
		lastAction.update((la) => la + ` and chose ${suit}`);
		message.set('Suit chosen!');

		if (get(player).hand.length === 0) {
			checkWinner();
		} else {
			setTimeout(() => aiTurn(), 1000);
		}
	};

	const drawCard = () => {
		if (get(state) !== 'player-turn') return;

		const $deck = get(deck);
		const $player = get(player);
		const $topCard = get(topCard);
		const $currentSuit = get(currentSuit);

		if ($deck.remaining > 0) {
			const card = $deck.deal();
			$player.addCard(card);
			lastAction.set('You drew a card');

			deck.set($deck);
			player.set($player);

			// Check if can play the drawn card
			if ($player.canPlayCard(card, $topCard!, $currentSuit)) {
				message.set('You can play the card you drew!');
			} else {
				message.set('Turn passed to computer.');
				setTimeout(() => aiTurn(), 1000);
			}
		} else {
			message.set('Deck is empty! Turn passed.');
			setTimeout(() => aiTurn(), 1000);
		}
	};

	return {
		player,
		ai,
		deck,
		discardPile,
		state,
		currentSuit,
		message,
		winner,
		lastAction,
		topCard,
		start,
		playCard,
		chooseSuit,
		drawCard
	};
}
