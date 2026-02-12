import type { Card, Suit } from '../../../../shared/deck';

export type Pile = Card[];
export type Foundation = { suit: Suit; cards: Card[] };

export interface KlondikeState {
	tableau: Pile[];
	foundations: Foundation[];
	stock: Card[];
	waste: Card[];
	revealedTableau: boolean[][];
	moves: number;
}

export type KlondikeMove =
	| { type: 'newGame' }
	| { type: 'drawFromStock' }
	| { type: 'moveWasteToTableau'; tableauIndex: number }
	| { type: 'moveWasteToFoundation'; foundationIndex: number }
	| { type: 'moveTableauToTableau'; fromIndex: number; cardIndex: number; toIndex: number }
	| { type: 'moveTableauToFoundation'; tableauIndex: number; foundationIndex: number };
