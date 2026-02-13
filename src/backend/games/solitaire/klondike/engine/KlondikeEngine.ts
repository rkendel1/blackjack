import { Deck } from '../../../../shared/deck';
import type { Card, Suit, Rank } from '../../../../shared/deck';
import type { KlondikeState, Pile, Foundation, KlondikeMove } from './types';

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

function isRed(suit: Suit): boolean {
	return suit === 'heart' || suit === 'diamond';
}

function canPlaceOnTableau(card: Card, onCard: Card | null): boolean {
	if (!onCard) {
		return card.rank === 'king';
	}

	if (isRed(card.suit) === isRed(onCard.suit)) {
		return false;
	}

	return getRankValue(card.rank) === getRankValue(onCard.rank) - 1;
}

function canPlaceOnFoundation(card: Card, foundation: Foundation): boolean {
	if (foundation.cards.length === 0) {
		return card.rank === '1';
	}

	const topCard = foundation.cards[foundation.cards.length - 1];
	return (
		card.suit === foundation.suit && getRankValue(card.rank) === getRankValue(topCard.rank) + 1
	);
}

export class KlondikeEngine {
	private tableau: Pile[];
	private foundations: Foundation[];
	private stock: Card[];
	private waste: Card[];
	private revealedTableau: boolean[][];
	private moves: number;

	constructor() {
		this.tableau = [[], [], [], [], [], [], []];
		this.foundations = [
			{ suit: 'heart', cards: [] },
			{ suit: 'diamond', cards: [] },
			{ suit: 'club', cards: [] },
			{ suit: 'spade', cards: [] }
		];
		this.stock = [];
		this.waste = [];
		this.revealedTableau = [[], [], [], [], [], [], []];
		this.moves = 0;
	}

	newGame(): void {
		const deck = new Deck();
		deck.shuffle();
		const cards = deck.cards;

		this.tableau = [[], [], [], [], [], [], []];
		this.revealedTableau = [[], [], [], [], [], [], []];

		let cardIndex = 0;

		for (let col = 0; col < 7; col++) {
			for (let row = 0; row <= col; row++) {
				this.tableau[col].push(cards[cardIndex]);
				this.revealedTableau[col].push(row === col);
				cardIndex++;
			}
		}

		this.stock = cards.slice(cardIndex);
		this.waste = [];
		this.foundations = [
			{ suit: 'heart', cards: [] },
			{ suit: 'diamond', cards: [] },
			{ suit: 'club', cards: [] },
			{ suit: 'spade', cards: [] }
		];
		this.moves = 0;
	}

	drawFromStock(): void {
		if (this.stock.length > 0) {
			const cardsToDraw = Math.min(3, this.stock.length);
			const drawnCards = this.stock.splice(0, cardsToDraw);
			this.waste.push(...drawnCards);
			this.moves++;
		} else if (this.waste.length > 0) {
			this.stock = [...this.waste].reverse();
			this.waste = [];
			this.moves++;
		}
	}

	moveWasteToTableau(tableauIndex: number): boolean {
		if (this.waste.length === 0) return false;

		const card = this.waste[this.waste.length - 1];
		const targetPile = this.tableau[tableauIndex];
		const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;

		if (canPlaceOnTableau(card, targetCard)) {
			this.waste.pop();
			this.tableau[tableauIndex].push(card);
			this.moves++;
			return true;
		}

		return false;
	}

	moveWasteToFoundation(foundationIndex: number): boolean {
		if (this.waste.length === 0) return false;

		const card = this.waste[this.waste.length - 1];
		const foundation = this.foundations[foundationIndex];

		if (canPlaceOnFoundation(card, foundation)) {
			this.waste.pop();
			foundation.cards.push(card);
			this.moves++;
			return true;
		}

		return false;
	}

	moveTableauToTableau(fromIndex: number, cardIndex: number, toIndex: number): boolean {
		const fromPile = this.tableau[fromIndex];
		const toPile = this.tableau[toIndex];

		if (cardIndex < 0 || cardIndex >= fromPile.length) return false;
		if (!this.revealedTableau[fromIndex][cardIndex]) return false;

		const movingCards = fromPile.slice(cardIndex);
		const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

		if (canPlaceOnTableau(movingCards[0], targetCard)) {
			this.tableau[fromIndex] = fromPile.slice(0, cardIndex);
			this.tableau[toIndex].push(...movingCards);

			if (this.tableau[fromIndex].length > 0) {
				this.revealedTableau[fromIndex][this.tableau[fromIndex].length - 1] = true;
			}

			this.revealedTableau[fromIndex] = this.revealedTableau[fromIndex].slice(0, cardIndex);
			this.moves++;
			return true;
		}

		return false;
	}

	moveTableauToFoundation(tableauIndex: number, foundationIndex: number): boolean {
		const pile = this.tableau[tableauIndex];
		if (pile.length === 0) return false;

		const card = pile[pile.length - 1];
		const foundation = this.foundations[foundationIndex];

		if (canPlaceOnFoundation(card, foundation)) {
			pile.pop();
			foundation.cards.push(card);

			if (pile.length > 0) {
				this.revealedTableau[tableauIndex][pile.length - 1] = true;
			}

			this.revealedTableau[tableauIndex].pop();
			this.moves++;
			return true;
		}

		return false;
	}

	canAutoPlay(): boolean {
		for (let i = 0; i < this.tableau.length; i++) {
			const pile = this.tableau[i];
			if (pile.length > 0) {
				const card = pile[pile.length - 1];
				for (let f = 0; f < this.foundations.length; f++) {
					if (canPlaceOnFoundation(card, this.foundations[f])) {
						return true;
					}
				}
			}
		}

		if (this.waste.length > 0) {
			const card = this.waste[this.waste.length - 1];
			for (let f = 0; f < this.foundations.length; f++) {
				if (canPlaceOnFoundation(card, this.foundations[f])) {
					return true;
				}
			}
		}

		return false;
	}

	autoPlay(): boolean {
		for (let i = 0; i < this.tableau.length; i++) {
			const pile = this.tableau[i];
			if (pile.length > 0) {
				const card = pile[pile.length - 1];
				for (let f = 0; f < this.foundations.length; f++) {
					if (canPlaceOnFoundation(card, this.foundations[f])) {
						this.moveTableauToFoundation(i, f);
						return true;
					}
				}
			}
		}

		if (this.waste.length > 0) {
			const card = this.waste[this.waste.length - 1];
			for (let f = 0; f < this.foundations.length; f++) {
				if (canPlaceOnFoundation(card, this.foundations[f])) {
					this.moveWasteToFoundation(f);
					return true;
				}
			}
		}

		return false;
	}

	isWon(): boolean {
		return this.foundations.every((f) => f.cards.length === 13);
	}

	applyMove(move: KlondikeMove): void {
		switch (move.type) {
			case 'newGame':
				this.newGame();
				break;
			case 'drawFromStock':
				this.drawFromStock();
				break;
			case 'moveWasteToTableau':
				this.moveWasteToTableau(move.tableauIndex);
				break;
			case 'moveWasteToFoundation':
				this.moveWasteToFoundation(move.foundationIndex);
				break;
			case 'moveTableauToTableau':
				this.moveTableauToTableau(move.fromIndex, move.cardIndex, move.toIndex);
				break;
			case 'moveTableauToFoundation':
				this.moveTableauToFoundation(move.tableauIndex, move.foundationIndex);
				break;
		}
	}

	getState(): KlondikeState {
		return {
			tableau: this.tableau.map((pile) => [...pile]),
			foundations: this.foundations.map((f) => ({ suit: f.suit, cards: [...f.cards] })),
			stock: [...this.stock],
			waste: [...this.waste],
			revealedTableau: this.revealedTableau.map((revealed) => [...revealed]),
			moves: this.moves
		};
	}
}
