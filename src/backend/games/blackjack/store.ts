import { writable, derived, get } from 'svelte/store';
import { Deck } from '../../shared/deck';
import type { Card } from '../../shared/deck';
import { BasePlayer } from '../../shared/player';
import { tick } from 'svelte';

const SCORES: Record<string, number> = {
	'1': 11,
	'2': 2,
	'3': 3,
	'4': 4,
	'5': 5,
	'6': 6,
	'7': 7,
	'8': 8,
	'9': 9,
	'10': 10,
	jack: 10,
	queen: 10,
	king: 10
};

export const calculateScore = (cards: Card[]): number => {
	let score = 0;
	let aces = 0;

	for (const card of cards) {
		if (card.rank === '1') {
			aces++;
			score += 11;
		} else {
			score += SCORES[card.rank];
		}
	}

	// Adjust for aces if score > 21
	while (score > 21 && aces > 0) {
		score -= 10;
		aces--;
	}

	return score;
};

export class BlackjackPlayer extends BasePlayer {
	get score(): number {
		return calculateScore(this.hand);
	}

	get canDraw(): boolean {
		return this.score < 21;
	}

	draw = (card: Card) => {
		if (this.canDraw) {
			this.hand.push(card);
		}
	};
}

export class BlackjackDealer extends BasePlayer {
	get score(): number {
		return calculateScore(this.hand);
	}

	get shouldDraw(): boolean {
		return this.score < 17;
	}

	draw = (card: Card) => {
		this.hand.push(card);
	};
}

export type Winner = null | 'Player' | 'Dealer' | 'Draw';
export type Turn = null | 'Player' | 'Dealer';

export function createBlackjackGame() {
	const player = writable(new BlackjackPlayer('Player'));
	const dealer = writable(new BlackjackDealer('Dealer'));
	const deck = writable(new Deck());
	const winner = writable<Winner>(null);
	const turn = writable<Turn>(null);

	let drawSound: HTMLAudioElement | null = null;

	const inGame = derived(turn, ($turn) => $turn !== null);

	const playDrawSound = () => {
		return new Promise((resolve) => {
			if (drawSound) {
				drawSound.onended = resolve;
				drawSound?.play();
				return;
			}
			resolve(null);
		});
	};

	const checkBlackjack = () => {
		const $player = get(player);
		if ($player.score === 21) {
			winner.set('Player');
		}
	};

	const checkBust = () => {
		const $player = get(player);
		if ($player.score > 21) {
			winner.set('Dealer');
		}
	};

	const calculateWinner = () => {
		const $player = get(player);
		const $dealer = get(dealer);

		if ($dealer.score > 21) {
			winner.set('Player');
		} else if ($player.score > $dealer.score) {
			winner.set('Player');
		} else if ($player.score < $dealer.score) {
			winner.set('Dealer');
		} else {
			winner.set('Draw');
		}
	};

	const dealerTurn = async () => {
		turn.set('Dealer');
		const $dealer = get(dealer);
		const $deck = get(deck);

		while ($dealer.shouldDraw) {
			$dealer.draw($deck.deal());
			dealer.set($dealer);
			await playDrawSound();
		}

		calculateWinner();
	};

	const start = async (restart = false) => {
		const newDeck = new Deck();
		const newPlayer = new BlackjackPlayer('Player');
		const newDealer = new BlackjackDealer('Dealer');

		deck.set(newDeck);
		player.set(newPlayer);
		dealer.set(newDealer);
		winner.set(null);
		turn.set('Player');

		if (restart) {
			await tick();
		}

		await playDrawSound();
		newDealer.draw(newDeck.deal());
		newPlayer.draw(newDeck.deal());
		newPlayer.draw(newDeck.deal());

		dealer.set(newDealer);
		player.set(newPlayer);

		checkBlackjack();
	};

	const playerTurn = (option: 'draw' | 'stop') => {
		const $player = get(player);
		const $deck = get(deck);

		if (option === 'draw') {
			playDrawSound();
			$player.draw($deck.deal());
			player.set($player);
			checkBust();
		} else {
			dealerTurn();
		}
	};

	const setAudio = (audio: HTMLAudioElement) => {
		drawSound = audio;
	};

	return {
		player,
		dealer,
		deck,
		winner,
		turn,
		inGame,
		start,
		playerTurn,
		setAudio
	};
}
