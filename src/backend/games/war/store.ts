import { writable, get } from 'svelte/store';
import { Deck } from '../../shared/deck';
import type { Card, Rank } from '../../shared/deck';
import { BasePlayer, BotPlayer } from '../../shared/player';

const RANK_VALUES: Record<Rank, number> = {
	'1': 14, // Ace is highest
	'2': 2,
	'3': 3,
	'4': 4,
	'5': 5,
	'6': 6,
	'7': 7,
	'8': 8,
	'9': 9,
	'10': 10,
	jack: 11,
	queen: 12,
	king: 13
};

export class WarPlayer extends BasePlayer {
	wonCards: Card[] = [];

	get totalCards(): number {
		return this.hand.length + this.wonCards.length;
	}

	playCard(): Card | null {
		if (this.hand.length === 0) {
			// Shuffle won cards back into hand
			this.hand = [...this.wonCards];
			this.wonCards = [];
			// Shuffle
			this.hand.sort(() => Math.random() - 0.5);
		}
		return this.hand.pop() || null;
	}

	addWonCards(cards: Card[]) {
		this.wonCards.push(...cards);
	}
}

export class WarBotPlayer extends BotPlayer {
	wonCards: Card[] = [];

	get totalCards(): number {
		return this.hand.length + this.wonCards.length;
	}

	playCard(): Card | null {
		if (this.hand.length === 0) {
			this.hand = [...this.wonCards];
			this.wonCards = [];
			this.hand.sort(() => Math.random() - 0.5);
		}
		return this.hand.pop() || null;
	}

	addWonCards(cards: Card[]) {
		this.wonCards.push(...cards);
	}

	makeMove() {
		return this.playCard();
	}
}

export type GameState = 'ready' | 'playing' | 'war' | 'won';
export type RoundResult = 'player' | 'opponent' | 'war' | null;

export function createWarGame() {
	const player = writable(new WarPlayer('Player'));
	const opponent = writable(new WarBotPlayer('Bot'));
	const state = writable<GameState>('ready');
	const playerCard = writable<Card | null>(null);
	const opponentCard = writable<Card | null>(null);
	const roundResult = writable<RoundResult>(null);
	const cardsInPlay = writable<Card[]>([]);
	const warCount = writable(0);
	const message = writable('');
	const winner = writable<'player' | 'opponent' | null>(null);

	const start = () => {
		const deck = new Deck();
		const newPlayer = new WarPlayer('Player');
		const newOpponent = new WarBotPlayer('Bot');

		// Deal all cards equally
		while (deck.remaining > 0) {
			const card1 = deck.deal();
			const card2 = deck.deal();
			newPlayer.addCard(card1);
			if (card2) newOpponent.addCard(card2);
		}

		player.set(newPlayer);
		opponent.set(newOpponent);
		state.set('playing');
		playerCard.set(null);
		opponentCard.set(null);
		roundResult.set(null);
		cardsInPlay.set([]);
		warCount.set(0);
		message.set('Click "Play Card" to start!');
		winner.set(null);
	};

	const checkWinner = () => {
		const $player = get(player);
		const $opponent = get(opponent);

		if ($player.totalCards === 0) {
			state.set('won');
			winner.set('opponent');
			message.set('Bot wins the game!');
		} else if ($opponent.totalCards === 0) {
			state.set('won');
			winner.set('player');
			message.set('You win the game!');
		}
	};

	const playRound = () => {
		const $state = get(state);
		if ($state === 'won') return;

		const $player = get(player);
		const $opponent = get(opponent);

		const pCard = $player.playCard();
		const oCard = $opponent.playCard();

		playerCard.set(pCard);
		opponentCard.set(oCard);

		if (!pCard || !oCard) {
			checkWinner();
			return;
		}

		const $cardsInPlay = get(cardsInPlay);
		const newCardsInPlay = [...$cardsInPlay, pCard, oCard];
		cardsInPlay.set(newCardsInPlay);

		const playerValue = RANK_VALUES[pCard.rank];
		const opponentValue = RANK_VALUES[oCard.rank];

		if (playerValue > opponentValue) {
			roundResult.set('player');
			$player.addWonCards([...newCardsInPlay]);
			message.set(`You won this round! (+${newCardsInPlay.length} cards)`);
			cardsInPlay.set([]);
			warCount.set(0);
		} else if (opponentValue > playerValue) {
			roundResult.set('opponent');
			$opponent.addWonCards([...newCardsInPlay]);
			message.set(`Bot won this round! (+${newCardsInPlay.length} cards)`);
			cardsInPlay.set([]);
			warCount.set(0);
		} else {
			roundResult.set('war');
			state.set('war');
			warCount.update((count) => count + 1);
			message.set('WAR! Click "Play Card" again!');
		}

		player.set($player);
		opponent.set($opponent);

		checkWinner();
	};

	const continueWar = () => {
		const $state = get(state);
		if ($state === 'war') {
			state.set('playing');
			playRound();
		}
	};

	return {
		player,
		opponent,
		state,
		playerCard,
		opponentCard,
		roundResult,
		cardsInPlay,
		warCount,
		message,
		winner,
		start,
		playRound,
		continueWar
	};
}
