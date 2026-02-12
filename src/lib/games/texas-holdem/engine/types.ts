import type { Card } from '../../../shared/deck';
import type { HandEvaluation } from '../../shared/poker-hands';

export type GamePhase = 'setup' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown' | 'ended';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export interface TexasHoldemPlayerState {
	name: string;
	type: 'human' | 'bot';
	hand: Card[];
	chips: number;
	currentBet: number;
	folded: boolean;
	allIn: boolean;
	bestHand: HandEvaluation | null;
}

export interface TexasHoldemState {
	players: TexasHoldemPlayerState[];
	communityCards: Card[];
	pot: number;
	currentBet: number;
	currentPlayerIndex: number;
	dealerIndex: number;
	phase: GamePhase;
	deckRemaining: number;
	winners: number[]; // indices of winning players
}

export type TexasHoldemMove =
	| {
			type: 'setup';
			humanCount: number;
			botCount: number;
			botDifficulty?: 'easy' | 'medium' | 'hard';
	  }
	| { type: 'start' }
	| { type: 'player-action'; action: PlayerAction; raiseAmount?: number }
	| { type: 'next-hand' }
	| { type: 'bot-action' };
