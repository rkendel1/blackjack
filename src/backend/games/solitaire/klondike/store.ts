import { writable, derived, get } from 'svelte/store';
import { buildDeck, shuffleDeck } from '../../../shared/deck';
import type { Card, Suit, Rank } from '../../../shared/deck';

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
		// Only kings can be placed on empty tableaus
		return card.rank === 'king';
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

export function createKlondikeGame() {
	const tableau = writable<Pile[]>([[], [], [], [], [], [], []]);
	const foundations = writable<Foundation[]>([
		{ suit: 'heart', cards: [] },
		{ suit: 'diamond', cards: [] },
		{ suit: 'club', cards: [] },
		{ suit: 'spade', cards: [] }
	]);
	const stock = writable<Card[]>([]);
	const waste = writable<Card[]>([]);
	const revealedTableau = writable<boolean[][]>([
		[false],
		[false, false],
		[false, false, false],
		[false, false, false, false],
		[false, false, false, false, false],
		[false, false, false, false, false, false],
		[false, false, false, false, false, false, false]
	]);
	const moves = writable(0);
	const autoPlayAvailable = writable(false);

	const isWon = derived(foundations, ($foundations) =>
		$foundations.every((f) => f.cards.length === 13)
	);

	const newGame = () => {
		const deck = shuffleDeck(buildDeck());
		const newTableau: Pile[] = [[], [], [], [], [], [], []];
		const newRevealed: boolean[][] = [[], [], [], [], [], [], []];

		let cardIndex = 0;

		// Deal cards to tableau
		for (let col = 0; col < 7; col++) {
			for (let row = 0; row <= col; row++) {
				newTableau[col].push(deck[cardIndex]);
				newRevealed[col].push(row === col); // Only reveal the last card in each pile
				cardIndex++;
			}
		}

		// Remaining cards go to stock
		const remainingCards = deck.slice(cardIndex);

		tableau.set(newTableau);
		stock.set(remainingCards);
		waste.set([]);
		revealedTableau.set(newRevealed);
		foundations.set([
			{ suit: 'heart', cards: [] },
			{ suit: 'diamond', cards: [] },
			{ suit: 'club', cards: [] },
			{ suit: 'spade', cards: [] }
		]);
		moves.set(0);
		autoPlayAvailable.set(false);
	};

	const drawFromStock = () => {
		const $stock = get(stock);
		const $waste = get(waste);

		if ($stock.length > 0) {
			// Draw 3 cards or whatever remains
			const cardsToDraw = Math.min(3, $stock.length);
			const drawnCards = $stock.splice(0, cardsToDraw);
			$waste.push(...drawnCards);
			stock.set($stock);
			waste.set($waste);
			moves.update((m) => m + 1);
		} else if ($waste.length > 0) {
			// Recycle waste back to stock
			stock.set([...$waste].reverse());
			waste.set([]);
			moves.update((m) => m + 1);
		}
	};

	const moveWasteToTableau = (tableauIndex: number) => {
		const $waste = get(waste);
		const $tableau = get(tableau);

		if ($waste.length === 0) return false;

		const card = $waste[$waste.length - 1];
		const targetPile = $tableau[tableauIndex];
		const targetCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;

		if (canPlaceOnTableau(card, targetCard)) {
			$waste.pop();
			$tableau[tableauIndex].push(card);
			waste.set($waste);
			tableau.set($tableau);
			moves.update((m) => m + 1);
			return true;
		}

		return false;
	};

	const moveWasteToFoundation = (foundationIndex: number) => {
		const $waste = get(waste);
		const $foundations = get(foundations);

		if ($waste.length === 0) return false;

		const card = $waste[$waste.length - 1];
		const foundation = $foundations[foundationIndex];

		if (canPlaceOnFoundation(card, foundation)) {
			$waste.pop();
			foundation.cards.push(card);
			waste.set($waste);
			foundations.set($foundations);
			moves.update((m) => m + 1);
			checkAutoPlay();
			return true;
		}

		return false;
	};

	const moveTableauToTableau = (fromIndex: number, cardIndex: number, toIndex: number) => {
		const $tableau = get(tableau);
		const $revealedTableau = get(revealedTableau);

		const fromPile = $tableau[fromIndex];
		const toPile = $tableau[toIndex];

		if (cardIndex < 0 || cardIndex >= fromPile.length) return false;
		if (!$revealedTableau[fromIndex][cardIndex]) return false;

		const movingCards = fromPile.slice(cardIndex);
		const targetCard = toPile.length > 0 ? toPile[toPile.length - 1] : null;

		if (canPlaceOnTableau(movingCards[0], targetCard)) {
			$tableau[fromIndex] = fromPile.slice(0, cardIndex);
			$tableau[toIndex].push(...movingCards);

			// Reveal the new top card in the from pile
			if ($tableau[fromIndex].length > 0) {
				$revealedTableau[fromIndex][$tableau[fromIndex].length - 1] = true;
			}

			// Remove revealed status for moved cards from source
			$revealedTableau[fromIndex] = $revealedTableau[fromIndex].slice(0, cardIndex);

			tableau.set($tableau);
			revealedTableau.set($revealedTableau);
			moves.update((m) => m + 1);
			return true;
		}

		return false;
	};

	const moveTableauToFoundation = (tableauIndex: number, foundationIndex: number) => {
		const $tableau = get(tableau);
		const $foundations = get(foundations);
		const $revealedTableau = get(revealedTableau);

		const pile = $tableau[tableauIndex];
		if (pile.length === 0) return false;

		const card = pile[pile.length - 1];
		const foundation = $foundations[foundationIndex];

		if (canPlaceOnFoundation(card, foundation)) {
			pile.pop();
			foundation.cards.push(card);

			// Reveal the new top card
			if (pile.length > 0) {
				$revealedTableau[tableauIndex][pile.length - 1] = true;
			}

			$revealedTableau[tableauIndex].pop();

			tableau.set($tableau);
			foundations.set($foundations);
			revealedTableau.set($revealedTableau);
			moves.update((m) => m + 1);
			checkAutoPlay();
			return true;
		}

		return false;
	};

	const checkAutoPlay = () => {
		const $tableau = get(tableau);
		const $waste = get(waste);
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

		if ($waste.length > 0) {
			const card = $waste[$waste.length - 1];
			for (let f = 0; f < $foundations.length; f++) {
				if (canPlaceOnFoundation(card, $foundations[f])) {
					autoPlayAvailable.set(true);
					return;
				}
			}
		}

		autoPlayAvailable.set(false);
	};

	const autoPlay = () => {
		const $tableau = get(tableau);
		const $waste = get(waste);
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

		// Try to move from waste to foundation
		if ($waste.length > 0) {
			const card = $waste[$waste.length - 1];
			for (let f = 0; f < $foundations.length; f++) {
				if (canPlaceOnFoundation(card, $foundations[f])) {
					moveWasteToFoundation(f);
					return true;
				}
			}
		}

		return false;
	};

	return {
		tableau,
		foundations,
		stock,
		waste,
		revealedTableau,
		moves,
		isWon,
		autoPlayAvailable,
		newGame,
		drawFromStock,
		moveWasteToTableau,
		moveWasteToFoundation,
		moveTableauToTableau,
		moveTableauToFoundation,
		autoPlay
	};
}
