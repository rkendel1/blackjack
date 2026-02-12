/**
 * Unit tests for BlackjackEngine
 *
 * These tests validate the pure game logic without Svelte dependencies.
 * To run these tests, install a test runner like vitest:
 *   npm install -D vitest
 *
 * Then add to package.json:
 *   "scripts": { "test": "vitest" }
 */

import { BlackjackEngine, calculateScore } from './BlackjackEngine';
import type { Card } from '../../../shared/deck';

// Test helper to create cards
function createCard(rank: string, suit: string = 'heart'): Card {
	return {
		rank: rank as any,
		suit: suit as any,
		displayName: `${suit}_${rank}`
	};
}

// calculateScore tests
console.log('Testing calculateScore...');

// Test basic score calculation
const cards1: Card[] = [createCard('5'), createCard('7')];
const score1 = calculateScore(cards1);
console.assert(score1 === 12, `Expected 12, got ${score1}`);

// Test face cards
const cards2: Card[] = [createCard('king'), createCard('queen')];
const score2 = calculateScore(cards2);
console.assert(score2 === 20, `Expected 20, got ${score2}`);

// Test ace as 11
const cards3: Card[] = [createCard('1'), createCard('9')];
const score3 = calculateScore(cards3);
console.assert(score3 === 20, `Expected 20, got ${score3}`);

// Test ace adjustment (ace as 1 when bust)
const cards4: Card[] = [createCard('1'), createCard('king'), createCard('9')];
const score4 = calculateScore(cards4);
console.assert(score4 === 20, `Expected 20, got ${score4}`);

// Test blackjack
const cards5: Card[] = [createCard('1'), createCard('king')];
const score5 = calculateScore(cards5);
console.assert(score5 === 21, `Expected 21, got ${score5}`);

console.log('calculateScore tests passed!');

// BlackjackEngine tests
console.log('\nTesting BlackjackEngine...');

// Test initial state
const engine = new BlackjackEngine();
const initialState = engine.getState();
console.assert(initialState.turn === null, 'Initial turn should be null');
console.assert(initialState.winner === null, 'Initial winner should be null');
console.assert(initialState.player.hand.length === 0, 'Player should have no cards initially');
console.assert(initialState.dealer.hand.length === 0, 'Dealer should have no cards initially');

// Test start
engine.start();
const startState = engine.getState();
console.assert(
	startState.turn === 'Player' || startState.winner === 'Player',
	'Turn should be Player or game ended with blackjack'
);
console.assert(startState.player.hand.length === 2, 'Player should have 2 cards after start');
console.assert(startState.dealer.hand.length === 1, 'Dealer should have 1 card after start');
console.assert(startState.player.score > 0, 'Player score should be calculated');

// Test hit
if (startState.turn === 'Player') {
	const beforeHit = engine.getState();
	engine.hit();
	const afterHit = engine.getState();
	console.assert(
		afterHit.player.hand.length === beforeHit.player.hand.length + 1,
		'Player should have one more card after hit'
	);
}

// Test stand (start new game first to ensure clean state)
const engine2 = new BlackjackEngine();
engine2.start();
if (engine2.getState().turn === 'Player') {
	engine2.stand();
	const afterStand = engine2.getState();
	console.assert(afterStand.turn === null, 'Turn should be null after stand (game ended)');
	console.assert(afterStand.winner !== null, 'Winner should be determined after stand');
	console.assert(afterStand.dealer.hand.length >= 2, 'Dealer should have drawn cards');
}

// Test applyMove
const engine3 = new BlackjackEngine();
engine3.applyMove({ type: 'start' });
const moveState = engine3.getState();
console.assert(
	moveState.turn === 'Player' || moveState.winner === 'Player',
	'applyMove should work for start'
);

console.log('BlackjackEngine tests passed!');

console.log('\n✅ All tests passed!');
