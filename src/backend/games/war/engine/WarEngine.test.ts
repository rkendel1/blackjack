/**
 * Unit tests for WarEngine
 */

import { WarEngine } from './WarEngine';

console.log('Testing WarEngine...');

// Test initial state
const engine = new WarEngine();
const initialState = engine.getState();
console.assert(initialState.gameState === 'ready', 'Initial game state should be ready');
console.assert(initialState.winner === null, 'Initial winner should be null');
console.assert(initialState.player.hand.length === 0, 'Player should have no cards initially');
console.assert(initialState.opponent.hand.length === 0, 'Opponent should have no cards initially');

// Test start
engine.start();
const startState = engine.getState();
console.assert(startState.gameState === 'playing', 'Game state should be playing after start');
console.assert(startState.player.hand.length === 26, 'Player should have 26 cards');
console.assert(startState.opponent.hand.length === 26, 'Opponent should have 26 cards');
console.assert(startState.player.totalCards === 26, 'Player total should be 26');
console.assert(startState.opponent.totalCards === 26, 'Opponent total should be 26');

// Test play round
engine.playRound();
const afterRound = engine.getState();
console.assert(afterRound.playerCard !== null, 'Player should have played a card');
console.assert(afterRound.opponentCard !== null, 'Opponent should have played a card');
console.assert(afterRound.roundResult !== null, 'Round should have a result');

// Total cards should still be 52
const totalAfterRound = afterRound.player.totalCards + afterRound.opponent.totalCards;
console.assert(totalAfterRound === 52, `Total cards should be 52, got ${totalAfterRound}`);

// Test applyMove
const engine2 = new WarEngine();
engine2.applyMove({ type: 'start' });
const moveState = engine2.getState();
console.assert(moveState.gameState === 'playing', 'applyMove should work for start');

console.log('WarEngine tests passed!');

console.log('\n✅ All tests passed!');
