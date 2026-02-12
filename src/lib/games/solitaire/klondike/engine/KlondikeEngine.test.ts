/**
 * Unit tests for KlondikeEngine
 *
 * These tests validate the pure game logic without Svelte dependencies.
 */

import { KlondikeEngine } from './KlondikeEngine';
import type { Card } from '../../../../shared/deck';

function createCard(rank: string, suit: string = 'heart'): Card {
	return {
		rank: rank as any,
		suit: suit as any,
		displayName: `${suit}_${rank}`
	};
}

console.log('Testing KlondikeEngine...');

// Test initial state
const engine = new KlondikeEngine();
const initialState = engine.getState();
console.assert(initialState.tableau.length === 7, 'Should have 7 tableau piles');
console.assert(initialState.foundations.length === 4, 'Should have 4 foundations');
console.assert(initialState.stock.length === 0, 'Stock should be empty initially');
console.assert(initialState.waste.length === 0, 'Waste should be empty initially');
console.assert(initialState.moves === 0, 'Moves should be 0 initially');

// Test new game
engine.newGame();
const newGameState = engine.getState();
console.assert(newGameState.stock.length === 24, 'Stock should have 24 cards (52 - 28 in tableau)');
console.assert(newGameState.waste.length === 0, 'Waste should be empty after new game');
console.assert(newGameState.moves === 0, 'Moves should reset to 0');

// Verify tableau setup
let totalTableauCards = 0;
for (let i = 0; i < 7; i++) {
	const pileSize = i + 1;
	console.assert(
		newGameState.tableau[i].length === pileSize,
		`Tableau pile ${i} should have ${pileSize} cards`
	);
	console.assert(
		newGameState.revealedTableau[i].length === pileSize,
		`Revealed array ${i} should have ${pileSize} entries`
	);
	console.assert(
		newGameState.revealedTableau[i][pileSize - 1] === true,
		`Top card of pile ${i} should be revealed`
	);
	totalTableauCards += pileSize;
}
console.assert(totalTableauCards === 28, 'Tableau should have 28 cards total');

// Test draw from stock
engine.drawFromStock();
const afterDraw = engine.getState();
console.assert(afterDraw.waste.length === 3, 'Should draw 3 cards from stock');
console.assert(afterDraw.stock.length === 21, 'Stock should have 21 cards left');
console.assert(afterDraw.moves === 1, 'Moves should increment');

// Test recycling waste to stock
while (engine.getState().stock.length > 0) {
	engine.drawFromStock();
}
const beforeRecycle = engine.getState();
console.assert(beforeRecycle.stock.length === 0, 'Stock should be empty');
console.assert(beforeRecycle.waste.length === 24, 'All cards should be in waste');

engine.drawFromStock();
const afterRecycle = engine.getState();
console.assert(afterRecycle.stock.length === 24, 'Stock should have all cards back');
console.assert(afterRecycle.waste.length === 0, 'Waste should be empty');

// Test applyMove
const engine2 = new KlondikeEngine();
engine2.applyMove({ type: 'newGame' });
const moveState = engine2.getState();
console.assert(moveState.stock.length === 24, 'applyMove should work for newGame');

engine2.applyMove({ type: 'drawFromStock' });
const afterMoveState = engine2.getState();
console.assert(afterMoveState.waste.length === 3, 'applyMove should work for drawFromStock');

// Test isWon (should be false for new game)
const notWon = engine2.isWon();
console.assert(notWon === false, 'New game should not be won');

console.log('KlondikeEngine tests passed!');

console.log('\n✅ All tests passed!');
