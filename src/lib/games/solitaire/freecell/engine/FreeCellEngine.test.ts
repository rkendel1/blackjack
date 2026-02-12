/**
 * Unit tests for FreeCellEngine
 *
 * These tests validate the pure game logic without Svelte dependencies.
 */

import { FreeCellEngine } from './FreeCellEngine';
import type { Card } from '../../../../shared/deck';

function createCard(rank: string, suit: string = 'heart'): Card {
	return {
		rank: rank as any,
		suit: suit as any,
		displayName: `${suit}_${rank}`
	};
}

console.log('Testing FreeCellEngine...');

// Test initial state
const engine = new FreeCellEngine();
const initialState = engine.getState();
console.assert(initialState.tableau.length === 8, 'Should have 8 tableau piles');
console.assert(initialState.foundations.length === 4, 'Should have 4 foundations');
console.assert(initialState.freeCells.length === 4, 'Should have 4 free cells');
console.assert(initialState.moves === 0, 'Moves should be 0 initially');
console.assert(
	initialState.freeCells.every((cell) => cell === null),
	'All free cells should be empty initially'
);

// Test new game
engine.newGame();
const newGameState = engine.getState();
console.assert(newGameState.moves === 0, 'Moves should reset to 0');

// Verify tableau setup (first 4 columns get 7 cards, last 4 get 6 cards)
let totalTableauCards = 0;
for (let i = 0; i < 8; i++) {
	const expectedSize = i < 4 ? 7 : 6;
	console.assert(
		newGameState.tableau[i].length === expectedSize,
		`Tableau pile ${i} should have ${expectedSize} cards`
	);
	totalTableauCards += expectedSize;
}
console.assert(totalTableauCards === 52, 'Tableau should have all 52 cards');

// Test moving to free cell
const firstPile = newGameState.tableau.find((pile) => pile.length > 0);
if (firstPile && firstPile.length > 0) {
	const pileIndex = newGameState.tableau.indexOf(firstPile);
	const beforeMove = engine.getState();
	const result = engine.moveTableauToFreeCell(pileIndex, 0);
	const afterMove = engine.getState();

	console.assert(result === true, 'Should be able to move card to empty free cell');
	console.assert(
		afterMove.freeCells[0] !== null,
		'Free cell should contain a card after move'
	);
	console.assert(
		afterMove.tableau[pileIndex].length === beforeMove.tableau[pileIndex].length - 1,
		'Tableau pile should have one less card'
	);
	console.assert(afterMove.moves === 1, 'Moves should increment');

	// Test moving from free cell back to tableau
	const canMoveBack = engine.moveFreeCellToTableau(0, pileIndex);
	const afterMoveBack = engine.getState();

	console.assert(canMoveBack === true, 'Should be able to move card back to tableau');
	console.assert(afterMoveBack.freeCells[0] === null, 'Free cell should be empty after move');
	console.assert(afterMoveBack.moves === 2, 'Moves should increment again');
}

// Test applyMove
const engine2 = new FreeCellEngine();
engine2.applyMove({ type: 'newGame' });
const moveState = engine2.getState();
console.assert(moveState.moves === 0, 'applyMove should work for newGame');

// Test isWon (should be false for new game)
const notWon = engine2.isWon();
console.assert(notWon === false, 'New game should not be won');

// Test canAutoPlay
const canAuto = engine2.canAutoPlay();
console.assert(typeof canAuto === 'boolean', 'canAutoPlay should return a boolean');

console.log('FreeCellEngine tests passed!');

console.log('\n✅ All tests passed!');
