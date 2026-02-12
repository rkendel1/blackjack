import { Deck } from '../../../../shared/deck';
import type { Card, Rank } from '../../../../shared/deck';
import type { SpiderState, Pile, SpiderMove } from './types';

const RANK_VALUES: Record<Rank, number> = {
	'1': 1,
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

function getRankValue(rank: Rank): number {
	return RANK_VALUES[rank];
}

function canPlaceOnTableau(card: Card, onCard: Card | null): boolean {
	if (!onCard) {
		return true;
	}
	return getRankValue(card.rank) === getRankValue(onCard.rank) - 1;
}

function isSequenceComplete(cards: Card[]): boolean {
	if (cards.length !== 13) return false;

	const suit = cards[0].suit;
	for (let i = 0; i < 13; i++) {
		if (cards[i].suit !== suit || getRankValue(cards[i].rank) !== 13 - i) {
			return false;
		}
	}
	return true;
}

function findCompleteSequences(pile: Pile, revealed: boolean[]): number[] {
	const sequences: number[] = [];

	for (let i = 0; i < pile.length; i++) {
		if (!revealed[i]) continue;

		if (pile.length - i >= 13 && pile[i].rank === 'king') {
			const sequence = pile.slice(i, i + 13);
			if (isSequenceComplete(sequence)) {
				sequences.push(i);
			}
		}
	}

	return sequences;
}

function isValidSequence(cards: Card[]): boolean {
	if (cards.length === 0) return true;
	const suit = cards[0].suit;

	for (let i = 1; i < cards.length; i++) {
		if (
			cards[i].suit !== suit ||
			getRankValue(cards[i].rank) !== getRankValue(cards[i - 1].rank) - 1
		) {
			return false;
		}
	}
	return true;
}

export class SpiderEngine {
	private tableau: Pile[];
	private foundations: Pile[];
	private stock: Card[];
	private revealedTableau: boolean[][];
	private moves: number;

	constructor() {
		this.tableau = Array(10)
			.fill(null)
			.map(() => []);
		this.foundations = [];
		this.stock = [];
		this.revealedTableau = Array(10)
			.fill(null)
			.map(() => []);
		this.moves = 0;
	}

	newGame(): void {
		const deck1 = new Deck();
		const deck2 = new Deck();
		const combinedDeck = [...deck1.cards, ...deck2.cards];

		for (let i = combinedDeck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[combinedDeck[i], combinedDeck[j]] = [combinedDeck[j], combinedDeck[i]];
		}

		this.tableau = Array(10)
			.fill(null)
			.map(() => []);
		this.revealedTableau = Array(10)
			.fill(null)
			.map(() => []);

		let cardIndex = 0;

		for (let col = 0; col < 10; col++) {
			const cardCount = col < 4 ? 6 : 5;
			for (let row = 0; row < cardCount; row++) {
				this.tableau[col].push(combinedDeck[cardIndex]);
				this.revealedTableau[col].push(row === cardCount - 1);
				cardIndex++;
			}
		}

		this.stock = combinedDeck.slice(cardIndex);
		this.foundations = [];
		this.moves = 0;
		this.checkForCompleteSequences();
	}

	dealFromStock(): boolean {
		if (this.stock.length < 10) return false;

		const allPilesHaveCards = this.tableau.every((pile) => pile.length > 0);
		if (!allPilesHaveCards) return false;

		for (let i = 0; i < 10; i++) {
			const card = this.stock.shift();
			if (card) {
				this.tableau[i].push(card);
				this.revealedTableau[i].push(true);
			}
		}

		this.moves++;
		this.checkForCompleteSequences();
		return true;
	}

	private checkForCompleteSequences(): void {
		let foundSequence = false;

		for (let i = 0; i < 10; i++) {
			const pile = this.tableau[i];
			const revealed = this.revealedTableau[i];
			const sequences = findCompleteSequences(pile, revealed);

			if (sequences.length > 0) {
				foundSequence = true;
				const seqIndex = sequences[0];
				const completedSequence = pile.splice(seqIndex, 13);
				this.foundations.push(completedSequence);

				revealed.splice(seqIndex, 13);

				if (pile.length > 0 && !revealed[revealed.length - 1]) {
					revealed[revealed.length - 1] = true;
				}
			}
		}

		if (foundSequence) {
			this.checkForCompleteSequences();
		}
	}

	moveTableauToTableau(fromIndex: number, cardIndex: number, toIndex: number): boolean {
		if (fromIndex === toIndex) return false;

		const fromPile = this.tableau[fromIndex];
		const toPile = this.tableau[toIndex];

		if (cardIndex < 0 || cardIndex >= fromPile.length) return false;
		if (!this.revealedTableau[fromIndex][cardIndex]) return false;

		const movingCards = fromPile.slice(cardIndex);
		const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

		if (!canPlaceOnTableau(movingCards[0], targetCard)) return false;

		const revealedMovingCards = this.revealedTableau[fromIndex].slice(cardIndex);
		if (!isValidSequence(movingCards)) {
			if (movingCards.length > 1) return false;
		}

		this.tableau[fromIndex] = fromPile.slice(0, cardIndex);
		this.tableau[toIndex].push(...movingCards);

		if (this.tableau[fromIndex].length > 0) {
			this.revealedTableau[fromIndex][this.tableau[fromIndex].length - 1] = true;
		}

		this.revealedTableau[fromIndex] = this.revealedTableau[fromIndex].slice(0, cardIndex);
		this.revealedTableau[toIndex].push(...revealedMovingCards);

		this.moves++;
		this.checkForCompleteSequences();
		return true;
	}

	canAutoPlay(): boolean {
		for (let i = 0; i < this.tableau.length; i++) {
			const pile = this.tableau[i];
			const revealed = this.revealedTableau[i];
			const sequences = findCompleteSequences(pile, revealed);
			if (sequences.length > 0) {
				return true;
			}
		}
		return false;
	}

	autoPlay(): boolean {
		this.checkForCompleteSequences();
		return this.canAutoPlay();
	}

	getHint(): { from: number; cardIndex: number; to: number } | null {
		for (let from = 0; from < 10; from++) {
			const fromPile = this.tableau[from];
			const revealed = this.revealedTableau[from];

			for (let cardIdx = 0; cardIdx < fromPile.length; cardIdx++) {
				if (!revealed[cardIdx]) continue;

				const movingCards = fromPile.slice(cardIdx);

				for (let to = 0; to < 10; to++) {
					if (from === to) continue;

					const toPile = this.tableau[to];
					const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

					if (canPlaceOnTableau(movingCards[0], targetCard)) {
						if (movingCards.length === 1 || isValidSequence(movingCards)) {
							return { from, cardIndex: cardIdx, to };
						}
					}
				}
			}
		}

		return null;
	}

	canDealFromStock(): boolean {
		if (this.stock.length < 10) return false;
		return this.tableau.every((pile) => pile.length > 0);
	}

	isWon(): boolean {
		return this.foundations.length === 8;
	}

	applyMove(move: SpiderMove): void {
		switch (move.type) {
			case 'newGame':
				this.newGame();
				break;
			case 'dealFromStock':
				this.dealFromStock();
				break;
			case 'moveTableauToTableau':
				this.moveTableauToTableau(move.fromIndex, move.cardIndex, move.toIndex);
				break;
		}
	}

	getState(): SpiderState {
		return {
			tableau: this.tableau.map((pile) => [...pile]),
			foundations: this.foundations.map((pile) => [...pile]),
			stock: [...this.stock],
			revealedTableau: this.revealedTableau.map((revealed) => [...revealed]),
			moves: this.moves
		};
	}
}
