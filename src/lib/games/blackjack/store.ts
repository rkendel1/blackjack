import { Deck } from '$lib/shared/deck';
import type { Card } from '$lib/shared/deck';
import { BasePlayer } from '$lib/shared/player';
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
	score = $derived(calculateScore(this.hand));
	canDraw = $derived(this.score < 21);

	draw = (card: Card) => {
		if (this.canDraw) {
			this.hand.push(card);
		}
	};
}

export class BlackjackDealer extends BasePlayer {
	score = $derived(calculateScore(this.hand));
	shouldDraw = $derived(this.score < 17);

	draw = (card: Card) => {
		this.hand.push(card);
	};
}

export class BlackjackGame {
	winner = $state<Winner>(null);
	player = $state(new BlackjackPlayer('Player'));
	dealer = $state(new BlackjackDealer('Dealer'));
	deck = $state(new Deck());
	turn = $state<Turn>(null);
	inGame = $derived(this.turn !== null);
	drawSound: HTMLAudioElement | null = null;

	start = async (restart = false) => {
		this.deck = new Deck();
		this.player = new BlackjackPlayer('Player');
		this.dealer = new BlackjackDealer('Dealer');
		this.winner = null;
		this.turn = 'Player';

		if (restart) {
			// Wait one tick to trigger the animation on restart
			await tick();
		}

		this.playDrawSound();
		this.dealer.draw(this.deck.deal());
		this.player.draw(this.deck.deal());
		this.player.draw(this.deck.deal());

		this.checkBlackjack();
	};

	checkBlackjack = () => {
		if (this.player.score === 21) {
			this.winner = 'Player';
		}
	};

	checkBust = () => {
		if (this.player.score > 21) {
			this.winner = 'Dealer';
		}
	};

	calculateWinner = () => {
		if (this.dealer.score > 21) {
			this.winner = 'Player';
		} else if (this.player.score > this.dealer.score) {
			this.winner = 'Player';
		} else if (this.player.score < this.dealer.score) {
			this.winner = 'Dealer';
		} else {
			this.winner = 'Draw';
		}
	};

	playerTurn = (option: 'draw' | 'stop') => {
		if (option === 'draw') {
			this.playDrawSound();
			this.player.draw(this.deck.deal());
			this.checkBust();
		} else {
			this.dealerTurn();
		}
	};

	dealerTurn = async () => {
		this.turn = 'Dealer';

		while (this.dealer.shouldDraw) {
			this.dealer.draw(this.deck.deal());
			await this.playDrawSound();
		}

		this.calculateWinner();
	};

	setAudio(audio: HTMLAudioElement) {
		this.drawSound = audio;
	}

	playDrawSound = () => {
		return new Promise((resolve) => {
			if (this.drawSound) {
				this.drawSound.onended = resolve;
				this.drawSound?.play();
				return;
			}
			resolve(null);
		});
	};
}

export type Winner = null | 'Player' | 'Dealer' | 'Draw';
export type Turn = null | 'Player' | 'Dealer';
