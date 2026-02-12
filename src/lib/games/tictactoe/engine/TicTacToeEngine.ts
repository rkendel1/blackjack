/**
 * Tic Tac Toe Game Engine
 * Pure game logic without framework dependencies
 */

import type { TicTacToeState, TicTacToeMove, TicTacToeConfig, Player, Cell } from './types';

export class TicTacToeEngine {
  private state: TicTacToeState;
  private config: TicTacToeConfig;

  constructor(config: TicTacToeConfig = {}) {
    this.config = {
      startingPlayer: config.startingPlayer || 'X',
      enableBot: config.enableBot || false,
      botDifficulty: config.botDifficulty || 'medium',
    };

    this.state = this.createInitialState();
  }

  private createInitialState(): TicTacToeState {
    return {
      board: Array(9).fill(null),
      currentPlayer: this.config.startingPlayer!,
      status: 'playing',
      winner: null,
      winningLine: null,
    };
  }

  /**
   * Get current game state
   */
  getState(): TicTacToeState {
    return { ...this.state };
  }

  /**
   * Apply a move to the game state
   */
  applyMove(move: TicTacToeMove): boolean {
    if (this.state.status !== 'playing') {
      return false;
    }

    if (move.type !== 'place') {
      return false;
    }

    // Validate position
    if (move.position < 0 || move.position > 8) {
      return false;
    }

    // Check if cell is empty
    if (this.state.board[move.position] !== null) {
      return false;
    }

    // Check if it's the correct player's turn
    if (move.player !== this.state.currentPlayer) {
      return false;
    }

    // Apply the move
    this.state.board[move.position] = move.player;

    // Check for win or draw
    this.checkGameEnd();

    // Switch player if game is still ongoing
    if (this.state.status === 'playing') {
      this.state.currentPlayer = this.state.currentPlayer === 'X' ? 'O' : 'X';
    }

    return true;
  }

  /**
   * Check if the game has ended (win or draw)
   */
  private checkGameEnd(): void {
    const winPatterns = [
      [0, 1, 2], // top row
      [3, 4, 5], // middle row
      [6, 7, 8], // bottom row
      [0, 3, 6], // left column
      [1, 4, 7], // middle column
      [2, 5, 8], // right column
      [0, 4, 8], // diagonal
      [2, 4, 6], // anti-diagonal
    ];

    // Check for win
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (
        this.state.board[a] !== null &&
        this.state.board[a] === this.state.board[b] &&
        this.state.board[a] === this.state.board[c]
      ) {
        this.state.status = 'won';
        this.state.winner = this.state.board[a];
        this.state.winningLine = pattern;
        return;
      }
    }

    // Check for draw
    if (this.state.board.every((cell) => cell !== null)) {
      this.state.status = 'draw';
    }
  }

  /**
   * Get valid moves for the current player
   */
  getValidMoves(): number[] {
    if (this.state.status !== 'playing') {
      return [];
    }

    return this.state.board
      .map((cell, index) => (cell === null ? index : -1))
      .filter((index) => index !== -1);
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Get bot move using minimax algorithm
   */
  getBotMove(): number | null {
    if (this.state.status !== 'playing' || !this.config.enableBot) {
      return null;
    }

    const validMoves = this.getValidMoves();
    if (validMoves.length === 0) {
      return null;
    }

    if (this.config.botDifficulty === 'easy') {
      return this.getRandomMove(validMoves);
    } else if (this.config.botDifficulty === 'medium') {
      return this.getMediumMove(validMoves);
    } else {
      return this.getMinimaxMove();
    }
  }

  /**
   * Random move for easy difficulty
   */
  private getRandomMove(validMoves: number[]): number {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  /**
   * Medium difficulty: tries to win or block, otherwise random
   */
  private getMediumMove(validMoves: number[]): number {
    // Try to win
    for (const move of validMoves) {
      const testBoard = [...this.state.board];
      testBoard[move] = this.state.currentPlayer;
      if (this.checkWin(testBoard, this.state.currentPlayer)) {
        return move;
      }
    }

    // Try to block opponent
    const opponent: Player = this.state.currentPlayer === 'X' ? 'O' : 'X';
    for (const move of validMoves) {
      const testBoard = [...this.state.board];
      testBoard[move] = opponent;
      if (this.checkWin(testBoard, opponent)) {
        return move;
      }
    }

    // Otherwise random
    return this.getRandomMove(validMoves);
  }

  /**
   * Check if a player has won on a given board
   */
  private checkWin(board: Cell[], player: Player): boolean {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6], // diagonals
    ];

    return winPatterns.some(([a, b, c]) => 
      board[a] === player && board[b] === player && board[c] === player
    );
  }

  /**
   * Minimax algorithm for hard difficulty (optimal play)
   */
  private getMinimaxMove(): number {
    const validMoves = this.getValidMoves();
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
      const testBoard = [...this.state.board];
      testBoard[move] = this.state.currentPlayer;
      const score = this.minimax(testBoard, 0, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * Minimax recursive function
   */
  private minimax(board: Cell[], depth: number, isMaximizing: boolean): number {
    const botPlayer = this.state.currentPlayer;
    const humanPlayer: Player = botPlayer === 'X' ? 'O' : 'X';

    // Check terminal states
    if (this.checkWin(board, botPlayer)) {
      return 10 - depth;
    }
    if (this.checkWin(board, humanPlayer)) {
      return depth - 10;
    }
    if (board.every((cell) => cell !== null)) {
      return 0; // draw
    }

    const currentPlayer = isMaximizing ? botPlayer : humanPlayer;
    const emptyIndices = board
      .map((cell, index) => (cell === null ? index : -1))
      .filter((index) => index !== -1);

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const index of emptyIndices) {
        const testBoard = [...board];
        testBoard[index] = currentPlayer;
        const score = this.minimax(testBoard, depth + 1, false);
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const index of emptyIndices) {
        const testBoard = [...board];
        testBoard[index] = currentPlayer;
        const score = this.minimax(testBoard, depth + 1, true);
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  }

  /**
   * Apply state from external source (for multiplayer sync)
   */
  applyState(state: TicTacToeState): void {
    this.state = { ...state };
  }
}
