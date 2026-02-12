import type { Card } from '../../../../shared/deck';

export type Pile = Card[];

export interface SpiderState {
	tableau: Pile[];
	foundations: Pile[];
	stock: Card[];
	revealedTableau: boolean[][];
	moves: number;
}

export type SpiderMove =
	| { type: 'newGame' }
	| { type: 'dealFromStock' }
	| { type: 'moveTableauToTableau'; fromIndex: number; cardIndex: number; toIndex: number };
