import { writable, derived, get } from 'svelte/store';
import { buildDeck, shuffleDeck } from '$lib/shared/deck';
import type { Card, Suit, Rank } from '$lib/shared/deck';

export type Pile = Card[];
export type Foundation = { suit: Suit; cards: Card[] };

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
		// Any card can be placed on empty tableau
		return true;
	}

	// Must be opposite color
	if (isRed(card.suit) === isRed(onCard.suit)) {
		return false;
	}

	// Must be one rank lower
	return getRankValue(card.rank) === getRankValue(onCard.rank) - 1;
}

function canPlaceOnFoundation(card: Card, foundation: Foundation): boolean {
	if (foundation.cards.length === 0) {
		return card.rank === '1'; // Only aces can start a foundation
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
	// Formula: (empty free cells + 1) × (empty tableau columns + 1)
	return (emptyFreeCells + 1) * (emptyTableauColumns + 1);
}

export function createFreeCellGame() {
	const tableau = writable<Pile[]>([[], [], [], [], [], [], [], []]);
	const foundations = writable<Foundation[]>([
		{ suit: 'heart', cards: [] },
		{ suit: 'diamond', cards: [] },
		{ suit: 'club', cards: [] },
		{ suit: 'spade', cards: [] }
	]);
	const freeCells = writable<(Card | null)[]>([null, null, null, null]);
	const moves = writable(0);
	const autoPlayAvailable = writable(false);

	const isWon = derived(foundations, ($foundations) =>
		$foundations.every((f) => f.cards.length === 13)
	);

	const newGame = () => {
		const deck = shuffleDeck(buildDeck());
		const newTableau: Pile[] = [[], [], [], [], [], [], [], []];

		let cardIndex = 0;

		// Deal cards to tableau: first 4 columns get 7 cards, last 4 get 6 cards
		for (let col = 0; col < 8; col++) {
			const cardsInColumn = col < 4 ? 7 : 6;
			for (let row = 0; row < cardsInColumn; row++) {
				newTableau[col].push(deck[cardIndex]);
				cardIndex++;
			}
		}

		tableau.set(newTableau);
		freeCells.set([null, null, null, null]);
		foundations.set([
			{ suit: 'heart', cards: [] },
			{ suit: 'diamond', cards: [] },
			{ suit: 'club', cards: [] },
			{ suit: 'spade', cards: [] }
		]);
		moves.set(0);
		autoPlayAvailable.set(false);
		checkAutoPlay();
	};

	const moveTableauToFreeCell = (tableauIndex: number, freeCellIndex: number) => {
		const $tableau = get(tableau);
		const $freeCells = get(freeCells);

		const pile = $tableau[tableauIndex];
		if (pile.length === 0) return false;
		if ($freeCells[freeCellIndex] !== null) return false;

		const card = pile[pile.length - 1];
		$tableau[tableauIndex] = pile.slice(0, -1);
		$freeCells[freeCellIndex] = card;

		tableau.set($tableau);
		freeCells.set($freeCells);
		moves.update((m) => m + 1);
		checkAutoPlay();
		return true;
	};

	const moveFreeCellToTableau = (freeCellIndex: number, tableauIndex: number) => {
		const $freeCells = get(freeCells);
		const $tableau = get(tableau);

		const card = $freeCells[freeCellIndex];
		if (!card) return false;

		const targetPile = $tableau[tableauIndex];
		const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;

		if (canPlaceOnTableau(card, targetCard)) {
			$freeCells[freeCellIndex] = null;
			$tableau[tableauIndex].push(card);

			freeCells.set($freeCells);
			tableau.set($tableau);
			moves.update((m) => m + 1);
			checkAutoPlay();
			return true;
		}

		return false;
	};

	const moveFreeCellToFoundation = (freeCellIndex: number, foundationIndex: number) => {
		const $freeCells = get(freeCells);
		const $foundations = get(foundations);

		const card = $freeCells[freeCellIndex];
		if (!card) return false;

		const foundation = $foundations[foundationIndex];

		if (canPlaceOnFoundation(card, foundation)) {
			$freeCells[freeCellIndex] = null;
			foundation.cards.push(card);

			freeCells.set($freeCells);
			foundations.set($foundations);
			moves.update((m) => m + 1);
			checkAutoPlay();
			return true;
		}

		return false;
	};

	const moveTableauToTableau = (fromIndex: number, cardIndex: number, toIndex: number) => {
		const $tableau = get(tableau);
		const $freeCells = get(freeCells);

		const fromPile = $tableau[fromIndex];
		const toPile = $tableau[toIndex];

		if (cardIndex < 0 || cardIndex >= fromPile.length) return false;

		const movingCards = fromPile.slice(cardIndex);
		const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

		// Check if the sequence is valid (alternating colors, descending)
		for (let i = 0; i < movingCards.length - 1; i++) {
			if (!canPlaceOnTableau(movingCards[i + 1], movingCards[i])) {
				return false;
			}
		}

		// Check if we can move this many cards
		const emptyFreeCells = countEmptyFreeCells($freeCells);
		const emptyColumns = countEmptyTableauColumns($tableau) - (toPile.length === 0 ? 1 : 0);
		const maxCards = maxMovableCards(emptyFreeCells, emptyColumns);

		if (movingCards.length > maxCards) {
			return false;
		}

		if (canPlaceOnTableau(movingCards[0], targetCard)) {
			$tableau[fromIndex] = fromPile.slice(0, cardIndex);
			$tableau[toIndex].push(...movingCards);

			tableau.set($tableau);
			moves.update((m) => m + 1);
			checkAutoPlay();
			return true;
		}

		return false;
	};

	const moveTableauToFoundation = (tableauIndex: number, foundationIndex: number) => {
		const $tableau = get(tableau);
		const $foundations = get(foundations);

		const pile = $tableau[tableauIndex];
		if (pile.length === 0) return false;

		const card = pile[pile.length - 1];
		const foundation = $foundations[foundationIndex];

		if (canPlaceOnFoundation(card, foundation)) {
			$tableau[tableauIndex] = pile.slice(0, -1);
			foundation.cards.push(card);

			tableau.set($tableau);
			foundations.set($foundations);
			moves.update((m) => m + 1);
			checkAutoPlay();
			return true;
		}

		return false;
	};

	const checkAutoPlay = () => {
		const $tableau = get(tableau);
		const $freeCells = get(freeCells);
		const $foundations = get(foundations);

		// Check if any card can be auto-played to foundations
		for (let i = 0; i < $tableau.length; i++) {
			const pile = $tableau[i];
			if (pile.length > 0) {
				const card = pile[pile.length - 1];
				for (let f = 0; f < $foundations.length; f++) {
					if (canPlaceOnFoundation(card, $foundations[f])) {
						autoPlayAvailable.set(true);
						return;
					}
				}
			}
		}

		for (let i = 0; i < $freeCells.length; i++) {
			const card = $freeCells[i];
			if (card) {
				for (let f = 0; f < $foundations.length; f++) {
					if (canPlaceOnFoundation(card, $foundations[f])) {
						autoPlayAvailable.set(true);
						return;
					}
				}
			}
		}

		autoPlayAvailable.set(false);
	};

	const autoPlay = () => {
		const $tableau = get(tableau);
		const $freeCells = get(freeCells);
		const $foundations = get(foundations);

		// Try to move from tableau to foundation
		for (let i = 0; i < $tableau.length; i++) {
			const pile = $tableau[i];
			if (pile.length > 0) {
				const card = pile[pile.length - 1];
				for (let f = 0; f < $foundations.length; f++) {
					if (canPlaceOnFoundation(card, $foundations[f])) {
						moveTableauToFoundation(i, f);
						return true;
					}
				}
			}
		}

		// Try to move from free cells to foundation
		for (let i = 0; i < $freeCells.length; i++) {
			const card = $freeCells[i];
			if (card) {
				for (let f = 0; f < $foundations.length; f++) {
					if (canPlaceOnFoundation(card, $foundations[f])) {
						moveFreeCellToFoundation(i, f);
						return true;
					}
				}
			}
		}

		return false;
	};

	return {
		tableau,
		foundations,
		freeCells,
		moves,
		isWon,
		autoPlayAvailable,
		newGame,
		moveTableauToFreeCell,
		moveFreeCellToTableau,
		moveFreeCellToFoundation,
		moveTableauToTableau,
		moveTableauToFoundation,
		autoPlay
	};
}
