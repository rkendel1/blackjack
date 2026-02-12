/**
 * Tic Tac Toe Game Types
 */

export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];

export type GameStatus = 'playing' | 'won' | 'draw';

export interface TicTacToeState {
  board: Board;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningLine: number[] | null;
}

export type TicTacToeMove = {
  type: 'place';
  player: Player;
  position: number; // 0-8
};

export interface TicTacToeConfig {
  startingPlayer?: Player;
  enableBot?: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
}
