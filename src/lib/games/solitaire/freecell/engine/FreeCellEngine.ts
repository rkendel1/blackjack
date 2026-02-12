import { Deck } from '../../../../shared/deck';
import type { Card, Suit, Rank } from '../../../../shared/deck';
import type { FreeCellState, Pile, Foundation, FreeCellMove } from './types';

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
		return true;
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

function countEmptyFreeCells(freeCells: (Card | null)[]): number {
	return freeCells.filter((cell) => cell === null).length;
}

function countEmptyTableauColumns(tableau: Pile[]): number {
	return tableau.filter((pile) => pile.length === 0).length;
}

function maxMovableCards(emptyFreeCells: number, emptyTableauColumns: number): number {
	return (emptyFreeCells + 1) * (emptyTableauColumns + 1);
}

export class FreeCellEngine {
	private tableau: Pile[];
	private foundations: Foundation[];
	private freeCells: (Card | null)[];
	private moves: number;

	constructor() {
		this.tableau = [[], [], [], [], [], [], [], []];
		this.foundations = [
			{ suit: 'heart', cards: [] },
			{ suit: 'diamond', cards: [] },
			{ suit: 'club', cards: [] },
			{ suit: 'spade', cards: [] }
		];
		this.freeCells = [null, null, null, null];
		this.moves = 0;
	}

	newGame(): void {
		const deck = new Deck();
		deck.shuffle();
		const cards = deck.cards;

		this.tableau = [[], [], [], [], [], [], [], []];

		let cardIndex = 0;

		for (let col = 0; col < 8; col++) {
			const cardsInColumn = col < 4 ? 7 : 6;
			for (let row = 0; row < cardsInColumn; row++) {
				this.tableau[col].push(cards[cardIndex]);
				cardIndex++;
			}
		}

		this.freeCells = [null, null, null, null];
		this.foundations = [
			{ suit: 'heart', cards: [] },
			{ suit: 'diamond', cards: [] },
			{ suit: 'club', cards: [] },
			{ suit: 'spade', cards: [] }
		];
		this.moves = 0;
	}

	moveTableauToFreeCell(tableauIndex: number, freeCellIndex: number): boolean {
		const pile = this.tableau[tableauIndex];
		if (pile.length === 0) return false;
		if (this.freeCells[freeCellIndex] !== null) return false;

		const card = pile[pile.length - 1];
		this.tableau[tableauIndex] = pile.slice(0, -1);
		this.freeCells[freeCellIndex] = card;

		this.moves++;
		return true;
	}

	moveFreeCellToTableau(freeCellIndex: number, tableauIndex: number): boolean {
		const card = this.freeCells[freeCellIndex];
		if (!card) return false;

		const targetPile = this.tableau[tableauIndex];
		const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;

		if (canPlaceOnTableau(card, targetCard)) {
			this.freeCells[freeCellIndex] = null;
			this.tableau[tableauIndex].push(card);

			this.moves++;
			return true;
		}

		return false;
	}

	moveFreeCellToFoundation(freeCellIndex: number, foundationIndex: number): boolean {
		const card = this.freeCells[freeCellIndex];
		if (!card) return false;

		const foundation = this.foundations[foundationIndex];

		if (canPlaceOnFoundation(card, foundation)) {
			this.freeCells[freeCellIndex] = null;
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

		const movingCards = fromPile.slice(cardIndex);
		const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

		for (let i = 0; i < movingCards.length - 1; i++) {
			if (!canPlaceOnTableau(movingCards[i + 1], movingCards[i])) {
				return false;
			}
		}

		const emptyFreeCells = countEmptyFreeCells(this.freeCells);
		const emptyColumns = countEmptyTableauColumns(this.tableau) - (toPile.length === 0 ? 1 : 0);
		const maxCards = maxMovableCards(emptyFreeCells, emptyColumns);

		if (movingCards.length > maxCards) {
			return false;
		}

		if (canPlaceOnTableau(movingCards[0], targetCard)) {
			this.tableau[fromIndex] = fromPile.slice(0, cardIndex);
			this.tableau[toIndex].push(...movingCards);

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
			this.tableau[tableauIndex] = pile.slice(0, -1);
			foundation.cards.push(card);

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

		for (let i = 0; i < this.freeCells.length; i++) {
			const card = this.freeCells[i];
			if (card) {
				for (let f = 0; f < this.foundations.length; f++) {
					if (canPlaceOnFoundation(card, this.foundations[f])) {
						return true;
					}
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

		for (let i = 0; i < this.freeCells.length; i++) {
			const card = this.freeCells[i];
			if (card) {
				for (let f = 0; f < this.foundations.length; f++) {
					if (canPlaceOnFoundation(card, this.foundations[f])) {
						this.moveFreeCellToFoundation(i, f);
						return true;
					}
				}
			}
		}

		return false;
	}

	isWon(): boolean {
		return this.foundations.every((f) => f.cards.length === 13);
	}

	applyMove(move: FreeCellMove): void {
		switch (move.type) {
			case 'newGame':
				this.newGame();
				break;
			case 'moveTableauToFreeCell':
				this.moveTableauToFreeCell(move.tableauIndex, move.freeCellIndex);
				break;
			case 'moveFreeCellToTableau':
				this.moveFreeCellToTableau(move.freeCellIndex, move.tableauIndex);
				break;
			case 'moveFreeCellToFoundation':
				this.moveFreeCellToFoundation(move.freeCellIndex, move.foundationIndex);
				break;
			case 'moveTableauToTableau':
				this.moveTableauToTableau(move.fromIndex, move.cardIndex, move.toIndex);
				break;
			case 'moveTableauToFoundation':
				this.moveTableauToFoundation(move.tableauIndex, move.foundationIndex);
				break;
		}
	}

	getState(): FreeCellState {
		return {
			tableau: this.tableau.map((pile) => [...pile]),
			foundations: this.foundations.map((f) => ({ suit: f.suit, cards: [...f.cards] })),
			freeCells: [...this.freeCells],
			moves: this.moves
		};
	}
}
