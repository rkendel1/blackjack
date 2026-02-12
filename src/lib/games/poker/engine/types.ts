import type { Card } from '../../../shared/deck';
import type { HandEvaluation } from '../../shared/poker-hands';

export type GamePhase = 'setup' | 'deal' | 'betting' | 'draw' | 'final-betting' | 'showdown';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise';

export interface PokerPlayerState {
	name: string;
	type: 'human' | 'bot';
	hand: Card[];
	chips: number;
	currentBet: number;
	folded: boolean;
	bestHand: HandEvaluation | null;
	selectedCards: boolean[];
}

export interface PokerState {
	players: PokerPlayerState[];
	pot: number;
	currentBet: number;
	currentPlayerIndex: number;
	phase: GamePhase;
	deckRemaining: number;
	winners: number[]; // indices of winning players
}

export type PokerMove =
	| {
			type: 'setup';
			humanCount: number;
			botCount: number;
			botDifficulty?: 'easy' | 'medium' | 'hard';
	  }
	| { type: 'start' }
	| { type: 'player-action'; action: PlayerAction; raiseAmount?: number }
	| { type: 'toggle-card'; cardIndex: number }
	| { type: 'draw-cards' }
	| { type: 'next-hand' }
	| { type: 'bot-action' };
