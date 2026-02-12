import type { Card, Suit } from '../../../../shared/deck';

export type Pile = Card[];
export type Foundation = { suit: Suit; cards: Card[] };

export interface FreeCellState {
	tableau: Pile[];
	foundations: Foundation[];
	freeCells: (Card | null)[];
	moves: number;
}

export type FreeCellMove =
	| { type: 'newGame' }
	| { type: 'moveTableauToFreeCell'; tableauIndex: number; freeCellIndex: number }
	| { type: 'moveFreeCellToTableau'; freeCellIndex: number; tableauIndex: number }
	| { type: 'moveFreeCellToFoundation'; freeCellIndex: number; foundationIndex: number }
	| { type: 'moveTableauToTableau'; fromIndex: number; cardIndex: number; toIndex: number }
	| { type: 'moveTableauToFoundation'; tableauIndex: number; foundationIndex: number };
