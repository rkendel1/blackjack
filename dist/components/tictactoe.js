import { J as get_store_value, c as create_custom_element, S as SvelteComponent, i as init, s as safe_not_equal, f as flush, a as append_styles, n as noop, d as detach, e as insert, h as element, k as attr, o as onMount, l as onDestroy, q as subscribe, g as append, j as space, m as set_data, p as text, x as destroy_each, y as empty, t as toggle_class, u as listen } from './chunks/index-DR_90iw3.js';
import { S as StackLiveMultiplayerRuntime, e as ensure_array_like } from './chunks/StackLiveMultiplayerRuntime-S5LYZDT9.js';
import { d as derived, w as writable } from './chunks/index-DrPl72qu.js';

/**
 * Tic Tac Toe Game Engine
 * Pure game logic without framework dependencies
 */
class TicTacToeEngine {
    state;
    config;
    constructor(config = {}) {
        this.config = {
            startingPlayer: config.startingPlayer || 'X',
            enableBot: config.enableBot || false,
            botDifficulty: config.botDifficulty || 'medium',
        };
        this.state = this.createInitialState();
    }
    createInitialState() {
        return {
            board: Array(9).fill(null),
            currentPlayer: this.config.startingPlayer,
            status: 'playing',
            winner: null,
            winningLine: null,
        };
    }
    /**
     * Get current game state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Apply a move to the game state
     */
    applyMove(move) {
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
    checkGameEnd() {
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
            if (this.state.board[a] !== null &&
                this.state.board[a] === this.state.board[b] &&
                this.state.board[a] === this.state.board[c]) {
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
    getValidMoves() {
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
    reset() {
        this.state = this.createInitialState();
    }
    /**
     * Get bot move using minimax algorithm
     */
    getBotMove() {
        if (this.state.status !== 'playing' || !this.config.enableBot) {
            return null;
        }
        const validMoves = this.getValidMoves();
        if (validMoves.length === 0) {
            return null;
        }
        if (this.config.botDifficulty === 'easy') {
            return this.getRandomMove(validMoves);
        }
        else if (this.config.botDifficulty === 'medium') {
            return this.getMediumMove(validMoves);
        }
        else {
            return this.getMinimaxMove();
        }
    }
    /**
     * Random move for easy difficulty
     */
    getRandomMove(validMoves) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    /**
     * Medium difficulty: tries to win or block, otherwise random
     */
    getMediumMove(validMoves) {
        // Try to win
        for (const move of validMoves) {
            const testBoard = [...this.state.board];
            testBoard[move] = this.state.currentPlayer;
            if (this.checkWin(testBoard, this.state.currentPlayer)) {
                return move;
            }
        }
        // Try to block opponent
        const opponent = this.state.currentPlayer === 'X' ? 'O' : 'X';
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
    checkWin(board, player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6], // diagonals
        ];
        return winPatterns.some(([a, b, c]) => board[a] === player && board[b] === player && board[c] === player);
    }
    /**
     * Minimax algorithm for hard difficulty (optimal play)
     */
    getMinimaxMove() {
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
    minimax(board, depth, isMaximizing) {
        const botPlayer = this.state.currentPlayer;
        const humanPlayer = botPlayer === 'X' ? 'O' : 'X';
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
        }
        else {
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
    applyState(state) {
        this.state = { ...state };
    }
}

/**
 * Svelte Store Adapter for StackLive Multiplayer Runtime
 * Provides a reactive Svelte interface to the multiplayer runtime
 */
function useStackLiveMultiplayer(config) {
    let runtime = null;
    // Reactive stores
    const session = writable(null);
    const participants = writable([]);
    const connectionQuality = writable({
        latency: 0,
        jitter: 0,
        packetLoss: 0,
        quality: 'excellent'
    });
    const sessionState = writable('IDLE');
    const isHost = writable(false);
    const isConnected = writable(false);
    // Derived stores
    const playerCount = derived(participants, ($participants) => $participants.filter((p) => p.role === 'player').length);
    const spectatorCount = derived(participants, ($participants) => $participants.filter((p) => p.role === 'spectator').length);
    /**
     * Initialize the multiplayer runtime
     */
    function initialize(userId) {
        if (runtime) {
            runtime.destroy();
        }
        runtime = new StackLiveMultiplayerRuntime(config, userId);
        // Setup event listeners
        runtime.on('playerJoined', (data) => {
            updateSession();
        });
        runtime.on('playerLeft', (data) => {
            updateSession();
        });
        runtime.on('connectionLost', () => {
            isConnected.set(false);
        });
        runtime.on('reconnected', () => {
            isConnected.set(true);
        });
        runtime.on('gameStart', () => {
            updateSession();
        });
        runtime.on('gameEnd', () => {
            session.set(null);
            participants.set([]);
            sessionState.set('ENDED');
        });
        runtime.on('stateChanged', (data) => {
            updateSession();
        });
        // Start periodic connection quality updates
        setInterval(() => {
            if (runtime) {
                connectionQuality.set(runtime.getConnectionQuality());
            }
        }, 2000);
    }
    /**
     * Create a new session
     */
    async function createSession() {
        if (!runtime) {
            initialize();
        }
        try {
            const newSession = await runtime.createSession();
            session.set(newSession);
            isHost.set(true);
            sessionState.set(newSession.status);
            participants.set(newSession.participants);
            return newSession;
        }
        catch (error) {
            console.error('Failed to create session:', error);
            return null;
        }
    }
    /**
     * Join an existing session
     */
    async function joinSession(sessionId) {
        if (!runtime) {
            initialize();
        }
        try {
            const participant = await runtime.joinSession(sessionId);
            if (participant) {
                updateSession();
                isHost.set(false);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Failed to join session:', error);
            return false;
        }
    }
    /**
     * Leave the current session
     */
    function leaveSession() {
        if (runtime) {
            runtime.leaveSession();
            session.set(null);
            participants.set([]);
            sessionState.set('IDLE');
            isHost.set(false);
        }
    }
    /**
     * Send input to other players
     */
    function sendInput(input) {
        if (runtime) {
            runtime.sendInput(input);
        }
    }
    /**
     * Send state update to other players
     */
    function sendState(state) {
        if (runtime) {
            runtime.sendState(state);
        }
    }
    /**
     * Request state sync from host
     */
    function requestStateSync() {
        if (runtime) {
            runtime.requestStateSync();
        }
    }
    /**
     * Register callback for input events
     */
    function onInput(callback) {
        if (runtime) {
            runtime.onInput(callback);
        }
    }
    /**
     * Register callback for state sync events
     */
    function onStateSync(callback) {
        if (runtime) {
            runtime.onStateSync(callback);
        }
    }
    /**
     * Get current latency
     */
    function getLatency() {
        return runtime?.getLatency() ?? 0;
    }
    /**
     * Update session data
     */
    function updateSession() {
        if (runtime) {
            const currentSession = runtime.getSession();
            if (currentSession) {
                session.set(currentSession);
                participants.set(currentSession.participants);
                sessionState.set(currentSession.status);
                isHost.set(runtime.isHost());
            }
        }
    }
    /**
     * Cleanup
     */
    function destroy() {
        if (runtime) {
            runtime.destroy();
            runtime = null;
        }
    }
    // Auto-initialize on first use
    initialize();
    return {
        // Stores
        session,
        participants,
        connectionQuality,
        sessionState,
        isHost,
        isConnected,
        playerCount,
        spectatorCount,
        // Actions
        createSession,
        joinSession,
        leaveSession,
        sendInput,
        sendState,
        requestStateSync,
        onInput,
        onStateSync,
        getLatency,
        destroy
    };
}

/**
 * Game State Synchronization System
 * Handles syncing game state between host and guests
 */
class GameStateSyncManager {
    isHost;
    localState = null;
    sequenceNumber = 0;
    actionQueue = [];
    onStateUpdateCallback;
    onActionCallback;
    currentTurn;
    turnCallbacks = [];
    // Snapshot configuration
    snapshotInterval = 5000; // Send full snapshot every 5 seconds
    lastSnapshotTime = 0;
    snapshotTimer;
    constructor(isHost) {
        this.isHost = isHost;
        if (isHost) {
            this.startSnapshotTimer();
        }
    }
    /**
     * Set local game state (host only)
     */
    setState(state) {
        if (!this.isHost) {
            console.warn('[GameSync] Only host can set state directly');
            return;
        }
        this.localState = state;
        this.sequenceNumber++;
    }
    /**
     * Get current game state
     */
    getState() {
        return this.localState;
    }
    /**
     * Apply an action to the game
     */
    applyAction(action) {
        // Validate sequence number
        if (action.sequenceNumber <= this.sequenceNumber) {
            console.warn('[GameSync] Received old action, ignoring');
            return;
        }
        this.sequenceNumber = action.sequenceNumber;
        this.actionQueue.push(action);
        // Notify callback
        if (this.onActionCallback) {
            this.onActionCallback(action);
        }
        console.log('[GameSync] Applied action:', action.type, 'seq:', action.sequenceNumber);
    }
    /**
     * Create an action from local player
     */
    createAction(type, payload, playerId) {
        this.sequenceNumber++;
        const action = {
            type,
            payload,
            playerId,
            timestamp: Date.now(),
            sequenceNumber: this.sequenceNumber
        };
        // If host, apply immediately
        if (this.isHost) {
            this.actionQueue.push(action);
        }
        return action;
    }
    /**
     * Create a state snapshot (host only)
     */
    createSnapshot() {
        if (!this.isHost || !this.localState) {
            return null;
        }
        return {
            state: this.localState,
            timestamp: Date.now(),
            sequenceNumber: this.sequenceNumber
        };
    }
    /**
     * Apply a state snapshot (guest only)
     */
    applySnapshot(snapshot) {
        if (this.isHost) {
            console.warn('[GameSync] Host should not apply snapshots');
            return;
        }
        // Only apply if newer
        if (snapshot.sequenceNumber <= this.sequenceNumber) {
            console.warn('[GameSync] Received old snapshot, ignoring');
            return;
        }
        this.localState = snapshot.state;
        this.sequenceNumber = snapshot.sequenceNumber;
        this.lastSnapshotTime = snapshot.timestamp;
        // Clear old actions
        this.actionQueue = [];
        // Notify callback
        if (this.onStateUpdateCallback) {
            this.onStateUpdateCallback(snapshot.state);
        }
        console.log('[GameSync] Applied snapshot, seq:', snapshot.sequenceNumber);
    }
    /**
     * Check if snapshot should be sent
     */
    shouldSendSnapshot() {
        if (!this.isHost)
            return false;
        const timeSinceLastSnapshot = Date.now() - this.lastSnapshotTime;
        return timeSinceLastSnapshot >= this.snapshotInterval;
    }
    /**
     * Start periodic snapshot timer (host only)
     */
    startSnapshotTimer() {
        if (!this.isHost)
            return;
        this.snapshotTimer = window.setInterval(() => {
            if (this.shouldSendSnapshot() && this.onStateUpdateCallback) {
                const snapshot = this.createSnapshot();
                if (snapshot) {
                    this.lastSnapshotTime = Date.now();
                    // Trigger callback to send snapshot
                    this.onStateUpdateCallback(snapshot.state);
                }
            }
        }, this.snapshotInterval);
    }
    /**
     * Set current turn
     */
    setCurrentTurn(turn) {
        this.currentTurn = turn;
        // Notify turn callbacks
        this.turnCallbacks.forEach((callback) => callback(turn));
        console.log('[GameSync] Turn updated:', turn.currentPlayer, 'turn', turn.turnNumber);
    }
    /**
     * Get current turn
     */
    getCurrentTurn() {
        return this.currentTurn;
    }
    /**
     * Check if it's a specific player's turn
     */
    isPlayerTurn(playerId) {
        return this.currentTurn?.currentPlayer === playerId;
    }
    /**
     * Register callback for state updates
     */
    onStateUpdate(callback) {
        this.onStateUpdateCallback = callback;
    }
    /**
     * Register callback for actions
     */
    onAction(callback) {
        this.onActionCallback = callback;
    }
    /**
     * Register callback for turn changes
     */
    onTurnChange(callback) {
        this.turnCallbacks.push(callback);
    }
    /**
     * Get action history
     */
    getActionHistory() {
        return [...this.actionQueue];
    }
    /**
     * Clear action history
     */
    clearActionHistory() {
        this.actionQueue = [];
    }
    /**
     * Cleanup
     */
    destroy() {
        if (this.snapshotTimer) {
            clearInterval(this.snapshotTimer);
        }
        this.turnCallbacks = [];
        this.onStateUpdateCallback = undefined;
        this.onActionCallback = undefined;
    }
}
/**
 * Convert messages to/from game sync format
 */
class GameSyncMessageAdapter {
    /**
     * Create a StackLive message from an action
     */
    static actionToMessage(action) {
        return {
            type: 'input',
            frame: action.sequenceNumber,
            payload: {
                actionType: action.type,
                actionPayload: action.payload,
                playerId: action.playerId,
                timestamp: action.timestamp
            }
        };
    }
    /**
     * Parse an action from a StackLive message
     */
    static messageToAction(message) {
        if (message.type !== 'input')
            return null;
        const payload = message.payload;
        return {
            type: payload.actionType,
            payload: payload.actionPayload,
            playerId: payload.playerId,
            timestamp: payload.timestamp,
            sequenceNumber: message.frame
        };
    }
    /**
     * Create a StackLive message from a snapshot
     */
    static snapshotToMessage(snapshot) {
        return {
            type: 'state',
            payload: {
                state: snapshot.state,
                timestamp: snapshot.timestamp,
                sequenceNumber: snapshot.sequenceNumber
            }
        };
    }
    /**
     * Parse a snapshot from a StackLive message
     */
    static messageToSnapshot(message) {
        if (message.type !== 'state' && message.type !== 'sync-response')
            return null;
        const payload = message.payload;
        return {
            state: payload.state,
            timestamp: payload.timestamp || Date.now(),
            sequenceNumber: payload.sequenceNumber || 0
        };
    }
    /**
     * Create a turn update message
     */
    static turnToMessage(turn) {
        return {
            type: 'input',
            frame: turn.turnNumber,
            payload: {
                actionType: 'turn_change',
                actionPayload: turn,
                playerId: turn.currentPlayer,
                timestamp: Date.now()
            }
        };
    }
}

/**
 * Multiplayer Tic Tac Toe Game
 * Integrates TicTacToe engine with multiplayer runtime
 */
function createMultiplayerTicTacToe(sessionId) {
    const config = {
        gameId: 'tictactoe',
        mode: 'host-authoritative',
        maxPlayers: 2,
        spectators: true,
        debug: true,
    };
    const mp = useStackLiveMultiplayer(config);
    let engine = null;
    let syncManager = null;
    // Game state stores
    const gameState = writable(null);
    const myPlayerId = writable('');
    const mySymbol = writable(null);
    const isMyTurn = writable(false);
    const gameStarted = writable(false);
    const playerSymbols = writable(new Map());
    // Derived stores
    const board = derived(gameState, ($state) => $state?.board || Array(9).fill(null));
    const currentPlayer = derived(gameState, ($state) => $state?.currentPlayer || null);
    const status = derived(gameState, ($state) => $state?.status || 'playing');
    const winner = derived(gameState, ($state) => $state?.winner || null);
    const winningLine = derived(gameState, ($state) => $state?.winningLine || null);
    /**
     * Initialize game
     */
    async function initialize() {
        if (sessionId) {
            // Join existing session
            const success = await mp.joinSession(sessionId);
            if (success) {
                setupGuestMode();
            }
        }
        else {
            // Create new session
            const session = await mp.createSession();
            if (session) {
                setupHostMode();
            }
        }
    }
    /**
     * Setup host mode
     */
    function setupHostMode() {
        engine = new TicTacToeEngine({ startingPlayer: 'X' });
        syncManager = new GameStateSyncManager(true);
        const currentSession = get_store_value(mp.session);
        if (currentSession) {
            myPlayerId.set(currentSession.hostId);
            mySymbol.set('X'); // Host is always X
            // Update player symbols map
            playerSymbols.update((map) => {
                map.set(currentSession.hostId, 'X');
                return map;
            });
        }
        // Send state updates to guests
        syncManager.onStateUpdate((state) => {
            mp.sendState(state);
        });
        // Handle guest actions
        mp.onInput((input) => {
            if (!engine || !syncManager)
                return;
            const action = GameSyncMessageAdapter.messageToAction({
                type: 'input',
                frame: input.sequenceNumber || 0,
                payload: input,
            });
            if (action) {
                handleGuestAction(action);
            }
        });
        console.log('[MP TicTacToe] Host mode initialized');
    }
    /**
     * Setup guest mode
     */
    function setupGuestMode() {
        syncManager = new GameStateSyncManager(false);
        const currentSession = get_store_value(mp.session);
        if (currentSession) {
            const participants = currentSession.participants.filter((p) => p.role === 'player');
            const myParticipant = participants.find((p) => p.userId !== currentSession.hostId);
            if (myParticipant) {
                myPlayerId.set(myParticipant.userId);
                mySymbol.set('O'); // Guest is always O
                // Update player symbols map
                playerSymbols.update((map) => {
                    map.set(currentSession.hostId, 'X');
                    map.set(myParticipant.userId, 'O');
                    return map;
                });
            }
        }
        // Receive state updates from host
        mp.onStateSync((state) => {
            const snapshot = GameSyncMessageAdapter.messageToSnapshot({
                type: 'state',
                payload: state,
            });
            if (snapshot && syncManager) {
                syncManager.applySnapshot(snapshot);
                gameState.set(snapshot.state);
                checkMyTurn();
            }
        });
        // Request initial state
        mp.requestStateSync();
        console.log('[MP TicTacToe] Guest mode initialized');
    }
    /**
     * Handle action from guest player
     */
    function handleGuestAction(action) {
        if (!engine)
            return;
        console.log('[MP TicTacToe] Guest action:', action.type, action.payload);
        // Convert action to game move
        const move = action.payload;
        // Apply move to engine
        engine.applyMove(move);
        // Update state
        const newState = engine.getState();
        gameState.set(newState);
        if (syncManager) {
            syncManager.setState(newState);
        }
        checkMyTurn();
    }
    /**
     * Start a new game
     */
    function startGame() {
        if (!engine || !get_store_value(mp.isHost)) {
            console.warn('[MP TicTacToe] Only host can start game');
            return;
        }
        // Reset the engine
        engine.reset();
        const newState = engine.getState();
        gameState.set(newState);
        if (syncManager) {
            syncManager.setState(newState);
        }
        gameStarted.set(true);
        checkMyTurn();
        console.log('[MP TicTacToe] Game started');
    }
    /**
     * Make a move
     */
    function makeMove(position) {
        const currentMySymbol = get_store_value(mySymbol);
        const currentPlayerId = get_store_value(myPlayerId);
        if (!currentMySymbol) {
            console.warn('[MP TicTacToe] Player symbol not set');
            return;
        }
        const move = {
            type: 'place',
            player: currentMySymbol,
            position,
        };
        if (get_store_value(mp.isHost)) {
            // Host can act directly
            if (!engine)
                return;
            const success = engine.applyMove(move);
            if (!success) {
                console.warn('[MP TicTacToe] Invalid move');
                return;
            }
            const newState = engine.getState();
            gameState.set(newState);
            if (syncManager) {
                syncManager.setState(newState);
            }
            checkMyTurn();
        }
        else {
            // Guest sends action to host
            if (!syncManager)
                return;
            const action = syncManager.createAction('place', move, currentPlayerId);
            const message = GameSyncMessageAdapter.actionToMessage(action);
            {
                mp.sendInput(message.payload);
            }
        }
        console.log('[MP TicTacToe] Move made at position', position);
    }
    /**
     * Check if it's my turn
     */
    function checkMyTurn() {
        const currentState = get_store_value(gameState);
        const currentMySymbol = get_store_value(mySymbol);
        if (!currentState || !currentMySymbol) {
            isMyTurn.set(false);
            return;
        }
        // Check if current player matches my symbol
        const myTurn = currentState.currentPlayer === currentMySymbol && currentState.status === 'playing';
        isMyTurn.set(myTurn);
    }
    /**
     * Reset game
     */
    function resetGame() {
        if (!get_store_value(mp.isHost)) {
            console.warn('[MP TicTacToe] Only host can reset game');
            return;
        }
        if (!engine)
            return;
        engine.reset();
        const newState = engine.getState();
        gameState.set(newState);
        if (syncManager) {
            syncManager.setState(newState);
        }
        checkMyTurn();
        console.log('[MP TicTacToe] Game reset');
    }
    /**
     * Leave game
     */
    function leave() {
        mp.leaveSession();
        if (syncManager) {
            syncManager.destroy();
            syncManager = null;
        }
        engine = null;
        gameState.set(null);
        gameStarted.set(false);
    }
    // Auto-initialize
    initialize();
    return {
        // Multiplayer stores
        ...mp,
        // Game state stores
        gameState,
        board,
        currentPlayer,
        status,
        winner,
        winningLine,
        isMyTurn,
        gameStarted,
        myPlayerId,
        mySymbol,
        playerSymbols,
        // Actions
        startGame,
        makeMove,
        resetGame,
        leave,
    };
}

/**
 * Single-player Tic Tac Toe Store
 * Svelte store adapter for TicTacToeEngine
 */
function createTicTacToeStore(config = {}) {
    const engine = new TicTacToeEngine(config);
    const state = writable(engine.getState());
    function updateState() {
        state.set(engine.getState());
    }
    return {
        subscribe: state.subscribe,
        // Derived stores
        board: derived(state, ($state) => $state.board),
        currentPlayer: derived(state, ($state) => $state.currentPlayer),
        status: derived(state, ($state) => $state.status),
        winner: derived(state, ($state) => $state.winner),
        winningLine: derived(state, ($state) => $state.winningLine),
        // Actions
        makeMove(position) {
            const currentState = get_store_value(state);
            const move = {
                type: 'place',
                player: currentState.currentPlayer,
                position,
            };
            const success = engine.applyMove(move);
            if (success) {
                updateState();
                // If bot is enabled and game is still playing, make bot move
                if (config.enableBot && engine.getState().status === 'playing') {
                    setTimeout(() => {
                        const botMove = engine.getBotMove();
                        if (botMove !== null) {
                            const botMoveObj = {
                                type: 'place',
                                player: engine.getState().currentPlayer,
                                position: botMove,
                            };
                            engine.applyMove(botMoveObj);
                            updateState();
                        }
                    }, 500); // Small delay for better UX
                }
            }
            return success;
        },
        reset() {
            engine.reset();
            updateState();
        },
        getValidMoves() {
            return engine.getValidMoves();
        },
    };
}

/* src/lib/Components/webcomponents/TicTacToeEmbed.wc.svelte generated by Svelte v4.2.20 */

function add_css(target) {
	append_styles(target, "svelte-qq5ok", ".tictactoe-embed.svelte-qq5ok.svelte-qq5ok{font-family:system-ui, -apple-system, sans-serif;padding:1rem;max-width:500px;margin:0 auto}.loading.svelte-qq5ok.svelte-qq5ok{text-align:center;padding:2rem;color:#6b7280}.game-container.svelte-qq5ok.svelte-qq5ok{display:flex;flex-direction:column;gap:1rem}.multiplayer-info.svelte-qq5ok.svelte-qq5ok{text-align:center;padding:0.75rem;background:#f0f9ff;border-radius:8px;font-size:0.9rem}.multiplayer-info.svelte-qq5ok p.svelte-qq5ok{margin:0.25rem 0}.player-symbol.svelte-qq5ok.svelte-qq5ok{font-weight:600}.waiting.svelte-qq5ok.svelte-qq5ok{color:#6b7280}.game-status.svelte-qq5ok.svelte-qq5ok{text-align:center;min-height:2rem}.status.svelte-qq5ok.svelte-qq5ok{font-size:1.2rem;font-weight:bold;margin:0;color:#333}.status.your-turn.svelte-qq5ok.svelte-qq5ok{color:#10b981}.status.winner.svelte-qq5ok.svelte-qq5ok{color:#10b981}.status.loser.svelte-qq5ok.svelte-qq5ok{color:#ef4444}.status.draw.svelte-qq5ok.svelte-qq5ok{color:#6b7280}.board.svelte-qq5ok.svelte-qq5ok{display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;max-width:300px;margin:0 auto;aspect-ratio:1}.cell.svelte-qq5ok.svelte-qq5ok{background:white;border:2px solid #ddd;border-radius:6px;font-size:2rem;font-weight:bold;cursor:pointer;transition:all 0.2s;color:#333;display:flex;align-items:center;justify-content:center}.cell.my-turn.svelte-qq5ok.svelte-qq5ok:not(:disabled){border-color:#10b981;background:#f0fdf4}.cell.svelte-qq5ok.svelte-qq5ok:hover:not(:disabled){background:#f0f0f0;border-color:#4f46e5;transform:scale(1.05)}.cell.svelte-qq5ok.svelte-qq5ok:disabled{cursor:not-allowed}.cell.winning-cell.svelte-qq5ok.svelte-qq5ok{background:#fef3c7;border-color:#f59e0b}.actions.svelte-qq5ok.svelte-qq5ok{display:flex;justify-content:center;gap:0.5rem}.btn-start.svelte-qq5ok.svelte-qq5ok,.btn-reset.svelte-qq5ok.svelte-qq5ok{padding:0.5rem 1rem;border:none;border-radius:6px;font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s;background:#10b981;color:white}.btn-start.svelte-qq5ok.svelte-qq5ok:hover,.btn-reset.svelte-qq5ok.svelte-qq5ok:hover{background:#059669;transform:translateY(-1px)}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[19] = list[i];
	child_ctx[21] = i;
	return child_ctx;
}

// (99:2) {:else}
function create_else_block(ctx) {
	let div;
	let t;
	let if_block0 = /*isMultiplayer*/ ctx[2] && /*$game*/ ctx[3].session && create_if_block_11(ctx);
	let if_block1 = /*canPlay*/ ctx[6] && create_if_block_1(ctx);

	return {
		c() {
			div = element("div");
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			attr(div, "class", "game-container svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block0) if_block0.m(div, null);
			append(div, t);
			if (if_block1) if_block1.m(div, null);
		},
		p(ctx, dirty) {
			if (/*isMultiplayer*/ ctx[2] && /*$game*/ ctx[3].session) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_11(ctx);
					if_block0.c();
					if_block0.m(div, t);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*canPlay*/ ctx[6]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					if_block1.m(div, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
		}
	};
}

// (95:2) {#if !isInitialized}
function create_if_block(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			div.innerHTML = `<p>Loading game...</p>`;
			attr(div, "class", "loading svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (102:6) {#if isMultiplayer && $game.session}
function create_if_block_11(ctx) {
	let div;
	let p;
	let t0;
	let strong;
	let t1_value = (/*$game*/ ctx[3].mySymbol || '?') + "";
	let t1;
	let t2;
	let if_block = !/*gameStarted*/ ctx[1] && create_if_block_12(ctx);

	return {
		c() {
			div = element("div");
			p = element("p");
			t0 = text("You are: ");
			strong = element("strong");
			t1 = text(t1_value);
			t2 = space();
			if (if_block) if_block.c();
			attr(p, "class", "player-symbol svelte-qq5ok");
			attr(div, "class", "multiplayer-info svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, p);
			append(p, t0);
			append(p, strong);
			append(strong, t1);
			append(div, t2);
			if (if_block) if_block.m(div, null);
		},
		p(ctx, dirty) {
			if (dirty & /*$game*/ 8 && t1_value !== (t1_value = (/*$game*/ ctx[3].mySymbol || '?') + "")) set_data(t1, t1_value);

			if (!/*gameStarted*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_12(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block) if_block.d();
		}
	};
}

// (107:10) {#if !gameStarted}
function create_if_block_12(ctx) {
	let p;
	let t0;
	let t1;
	let t2;
	let t3;
	let if_block_anchor;
	let if_block = /*canStart*/ ctx[7] && create_if_block_13(ctx);

	return {
		c() {
			p = element("p");
			t0 = text("Waiting for ");
			t1 = text(/*playerCount*/ ctx[0]);
			t2 = text("/2 players...");
			t3 = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
			attr(p, "class", "waiting svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t0);
			append(p, t1);
			append(p, t2);
			insert(target, t3, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*playerCount*/ 1) set_data(t1, /*playerCount*/ ctx[0]);

			if (/*canStart*/ ctx[7]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_13(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(p);
				detach(t3);
				detach(if_block_anchor);
			}

			if (if_block) if_block.d(detaching);
		}
	};
}

// (109:12) {#if canStart}
function create_if_block_13(ctx) {
	let button;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			button.textContent = "Start Game";
			attr(button, "class", "btn-start svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!mounted) {
				dispose = listen(button, "click", /*handleStartGame*/ ctx[10]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			dispose();
		}
	};
}

// (117:6) {#if canPlay}
function create_if_block_1(ctx) {
	let div0;
	let t0;
	let div1;
	let t1;
	let if_block1_anchor;

	function select_block_type_1(ctx, dirty) {
		if (/*$game*/ ctx[3].status === 'playing') return create_if_block_5;
		if (/*$game*/ ctx[3].status === 'won') return create_if_block_8;
		if (/*$game*/ ctx[3].status === 'draw') return create_if_block_10;
	}

	let current_block_type = select_block_type_1(ctx);
	let if_block0 = current_block_type && current_block_type(ctx);
	let each_value = ensure_array_like(/*$game*/ ctx[3].board);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	let if_block1 = /*$game*/ ctx[3].status !== 'playing' && create_if_block_2(ctx);

	return {
		c() {
			div0 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			div1 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
			attr(div0, "class", "game-status svelte-qq5ok");
			attr(div1, "class", "board svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			if (if_block0) if_block0.m(div0, null);
			insert(target, t0, anchor);
			insert(target, div1, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div1, null);
				}
			}

			insert(target, t1, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if (if_block0) if_block0.d(1);
				if_block0 = current_block_type && current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(div0, null);
				}
			}

			if (dirty & /*isMultiplayer, $game, handleCellClick*/ 268) {
				each_value = ensure_array_like(/*$game*/ ctx[3].board);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (/*$game*/ ctx[3].status !== 'playing') {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_2(ctx);
					if_block1.c();
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div0);
				detach(t0);
				detach(div1);
				detach(t1);
				detach(if_block1_anchor);
			}

			if (if_block0) {
				if_block0.d();
			}

			destroy_each(each_blocks, detaching);
			if (if_block1) if_block1.d(detaching);
		}
	};
}

// (137:44) 
function create_if_block_10(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Draw!";
			attr(p, "class", "status draw svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

// (129:43) 
function create_if_block_8(ctx) {
	let if_block_anchor;

	function select_block_type_4(ctx, dirty) {
		if (/*isMultiplayer*/ ctx[2]) return create_if_block_9;
		return create_else_block_4;
	}

	let current_block_type = select_block_type_4(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_4(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if_block.d(detaching);
		}
	};
}

// (119:10) {#if $game.status === 'playing'}
function create_if_block_5(ctx) {
	let if_block_anchor;

	function select_block_type_2(ctx, dirty) {
		if (/*isMultiplayer*/ ctx[2]) return create_if_block_6;
		return create_else_block_3;
	}

	let current_block_type = select_block_type_2(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if_block.d(detaching);
		}
	};
}

// (134:12) {:else}
function create_else_block_4(ctx) {
	let p;
	let t0_value = /*$game*/ ctx[3].winner + "";
	let t0;
	let t1;

	return {
		c() {
			p = element("p");
			t0 = text(t0_value);
			t1 = text(" wins!");
			attr(p, "class", "status winner svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t0);
			append(p, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*$game*/ 8 && t0_value !== (t0_value = /*$game*/ ctx[3].winner + "")) set_data(t0, t0_value);
		},
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

// (130:12) {#if isMultiplayer}
function create_if_block_9(ctx) {
	let p;

	let t_value = (/*$game*/ ctx[3].winner === /*$game*/ ctx[3].mySymbol
	? 'You win!'
	: 'You lose!') + "";

	let t;
	let p_class_value;

	return {
		c() {
			p = element("p");
			t = text(t_value);

			attr(p, "class", p_class_value = "status " + (/*$game*/ ctx[3].winner === /*$game*/ ctx[3].mySymbol
			? 'winner'
			: 'loser') + " svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t);
		},
		p(ctx, dirty) {
			if (dirty & /*$game*/ 8 && t_value !== (t_value = (/*$game*/ ctx[3].winner === /*$game*/ ctx[3].mySymbol
			? 'You win!'
			: 'You lose!') + "")) set_data(t, t_value);

			if (dirty & /*$game*/ 8 && p_class_value !== (p_class_value = "status " + (/*$game*/ ctx[3].winner === /*$game*/ ctx[3].mySymbol
			? 'winner'
			: 'loser') + " svelte-qq5ok")) {
				attr(p, "class", p_class_value);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

// (126:12) {:else}
function create_else_block_3(ctx) {
	let p;
	let t0;
	let t1_value = /*$game*/ ctx[3].currentPlayer + "";
	let t1;

	return {
		c() {
			p = element("p");
			t0 = text("Current: ");
			t1 = text(t1_value);
			attr(p, "class", "status svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, p, anchor);
			append(p, t0);
			append(p, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*$game*/ 8 && t1_value !== (t1_value = /*$game*/ ctx[3].currentPlayer + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

// (120:12) {#if isMultiplayer}
function create_if_block_6(ctx) {
	let if_block_anchor;

	function select_block_type_3(ctx, dirty) {
		if (/*$game*/ ctx[3].isMyTurn) return create_if_block_7;
		return create_else_block_2;
	}

	let current_block_type = select_block_type_3(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (current_block_type !== (current_block_type = select_block_type_3(ctx))) {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if_block.d(detaching);
		}
	};
}

// (123:14) {:else}
function create_else_block_2(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Opponent's turn";
			attr(p, "class", "status svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

// (121:14) {#if $game.isMyTurn}
function create_if_block_7(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = "Your turn";
			attr(p, "class", "status your-turn svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

// (144:10) {#each $game.board as cell, i}
function create_each_block(ctx) {
	let button;
	let t0_value = (/*cell*/ ctx[19] || '') + "";
	let t0;
	let t1;
	let button_disabled_value;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[18](/*i*/ ctx[21]);
	}

	return {
		c() {
			button = element("button");
			t0 = text(t0_value);
			t1 = space();
			attr(button, "class", "cell svelte-qq5ok");
			button.disabled = button_disabled_value = /*isMultiplayer*/ ctx[2] && (!/*$game*/ ctx[3].isMyTurn || /*$game*/ ctx[3].status !== 'playing') || !/*isMultiplayer*/ ctx[2] && /*$game*/ ctx[3].status !== 'playing' || /*cell*/ ctx[19] !== null;
			toggle_class(button, "winning-cell", /*$game*/ ctx[3].winningLine?.includes(/*i*/ ctx[21]));
			toggle_class(button, "my-turn", /*isMultiplayer*/ ctx[2] && /*$game*/ ctx[3].isMyTurn && /*cell*/ ctx[19] === null);
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, t0);
			append(button, t1);

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*$game*/ 8 && t0_value !== (t0_value = (/*cell*/ ctx[19] || '') + "")) set_data(t0, t0_value);

			if (dirty & /*isMultiplayer, $game*/ 12 && button_disabled_value !== (button_disabled_value = /*isMultiplayer*/ ctx[2] && (!/*$game*/ ctx[3].isMyTurn || /*$game*/ ctx[3].status !== 'playing') || !/*isMultiplayer*/ ctx[2] && /*$game*/ ctx[3].status !== 'playing' || /*cell*/ ctx[19] !== null)) {
				button.disabled = button_disabled_value;
			}

			if (dirty & /*$game*/ 8) {
				toggle_class(button, "winning-cell", /*$game*/ ctx[3].winningLine?.includes(/*i*/ ctx[21]));
			}

			if (dirty & /*isMultiplayer, $game*/ 12) {
				toggle_class(button, "my-turn", /*isMultiplayer*/ ctx[2] && /*$game*/ ctx[3].isMyTurn && /*cell*/ ctx[19] === null);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			dispose();
		}
	};
}

// (160:8) {#if $game.status !== 'playing'}
function create_if_block_2(ctx) {
	let div;

	function select_block_type_5(ctx, dirty) {
		if (/*isMultiplayer*/ ctx[2]) return create_if_block_3;
		return create_else_block_1;
	}

	let current_block_type = select_block_type_5(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
			attr(div, "class", "actions svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_block.m(div, null);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_5(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div, null);
				}
			}
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if_block.d();
		}
	};
}

// (166:12) {:else}
function create_else_block_1(ctx) {
	let button;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			button.textContent = "New Game";
			attr(button, "class", "btn-reset svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!mounted) {
				dispose = listen(button, "click", /*handleReset*/ ctx[9]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			dispose();
		}
	};
}

// (162:12) {#if isMultiplayer}
function create_if_block_3(ctx) {
	let if_block_anchor;
	let if_block = /*$game*/ ctx[3].isHost && create_if_block_4(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (/*$game*/ ctx[3].isHost) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_4(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if (if_block) if_block.d(detaching);
		}
	};
}

// (163:14) {#if $game.isHost}
function create_if_block_4(ctx) {
	let button;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			button.textContent = "New Game";
			attr(button, "class", "btn-reset svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!mounted) {
				dispose = listen(button, "click", /*handleReset*/ ctx[9]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			dispose();
		}
	};
}

function create_fragment(ctx) {
	let div;

	function select_block_type(ctx, dirty) {
		if (!/*isInitialized*/ ctx[5]) return create_if_block;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
			attr(div, "class", "tictactoe-embed svelte-qq5ok");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_block.m(div, null);
		},
		p(ctx, [dirty]) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div, null);
				}
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if_block.d();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let enableBotBool;
	let botDifficultyValue;
	let sessionIdOrUndefined;
	let isMultiplayer;
	let playerCount;
	let canStart;
	let gameStarted;
	let canPlay;

	let $game,
		$$unsubscribe_game = noop,
		$$subscribe_game = () => ($$unsubscribe_game(), $$unsubscribe_game = subscribe(game, $$value => $$invalidate(3, $game = $$value)), game);

	$$self.$$.on_destroy.push(() => $$unsubscribe_game());
	let { sessionId = '' } = $$props;
	let { enableBot = 'false' } = $$props;
	let { botDifficulty = 'medium' } = $$props;
	let { mode = 'single' } = $$props;

	// Game state - use different stores based on mode
	let game;

	let isInitialized = false;

	onMount(() => {
		// Dispatch ready event
		dispatchEvent(new CustomEvent('ready',
		{
				detail: {
					mode,
					sessionId: sessionIdOrUndefined,
					enableBot: enableBotBool
				}
			}));
	});

	onDestroy(() => {
		if (isMultiplayer && game?.leave) {
			game.leave();
		}
	});

	function handleCellClick(position) {
		if (!game || !isInitialized) return;

		if (isMultiplayer) {
			// Multiplayer mode
			if ($game.board[position] === null && $game.isMyTurn && $game.status === 'playing') {
				game.makeMove(position);
			}
		} else {
			// Single player mode
			if ($game.board[position] === null && $game.status === 'playing') {
				game.makeMove(position);
			}
		}

		// Dispatch move event
		dispatchEvent(new CustomEvent('move', { detail: { position, mode } }));
	}

	function handleReset() {
		if (!game || !isInitialized) return;

		if (isMultiplayer && game.resetGame) {
			game.resetGame();
		} else if (!isMultiplayer && game.reset) {
			game.reset();
		}

		// Dispatch reset event
		dispatchEvent(new CustomEvent('reset', { detail: { mode } }));
	}

	function handleStartGame() {
		if (isMultiplayer && game?.startGame) {
			game.startGame();

			// Dispatch start event
			dispatchEvent(new CustomEvent('start', { detail: { mode } }));
		}
	}

	const click_handler = i => handleCellClick(i);

	$$self.$$set = $$props => {
		if ('sessionId' in $$props) $$invalidate(11, sessionId = $$props.sessionId);
		if ('enableBot' in $$props) $$invalidate(12, enableBot = $$props.enableBot);
		if ('botDifficulty' in $$props) $$invalidate(13, botDifficulty = $$props.botDifficulty);
		if ('mode' in $$props) $$invalidate(14, mode = $$props.mode);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*enableBot*/ 4096) {
			// Convert string attributes
			$$invalidate(15, enableBotBool = enableBot === 'true');
		}

		if ($$self.$$.dirty & /*botDifficulty*/ 8192) {
			$$invalidate(17, botDifficultyValue = botDifficulty || 'medium');
		}

		if ($$self.$$.dirty & /*sessionId*/ 2048) {
			$$invalidate(16, sessionIdOrUndefined = sessionId || undefined);
		}

		if ($$self.$$.dirty & /*mode*/ 16384) {
			$$invalidate(2, isMultiplayer = mode === 'multiplayer');
		}

		if ($$self.$$.dirty & /*isMultiplayer, sessionIdOrUndefined, enableBotBool, botDifficultyValue*/ 229380) {
			{
				if (isMultiplayer && sessionIdOrUndefined) {
					$$subscribe_game($$invalidate(4, game = createMultiplayerTicTacToe(sessionIdOrUndefined)));
					$$invalidate(5, isInitialized = true);
				} else if (!isMultiplayer) {
					$$subscribe_game($$invalidate(4, game = createTicTacToeStore({
						enableBot: enableBotBool,
						botDifficulty: botDifficultyValue
					})));

					$$invalidate(5, isInitialized = true);
				}
			}
		}

		if ($$self.$$.dirty & /*isMultiplayer, $game*/ 12) {
			$$invalidate(0, playerCount = isMultiplayer
			? $game?.session?.participants.filter(p => p.role === 'player').length || 0
			: 1);
		}

		if ($$self.$$.dirty & /*isMultiplayer, $game, playerCount*/ 13) {
			$$invalidate(7, canStart = isMultiplayer && $game?.isHost && $game?.sessionState === 'waiting_for_players' && playerCount >= 2);
		}

		if ($$self.$$.dirty & /*isMultiplayer, $game*/ 12) {
			$$invalidate(1, gameStarted = isMultiplayer ? $game?.gameStarted : true);
		}

		if ($$self.$$.dirty & /*isMultiplayer, gameStarted, playerCount*/ 7) {
			$$invalidate(6, canPlay = isMultiplayer ? gameStarted && playerCount >= 2 : true);
		}
	};

	return [
		playerCount,
		gameStarted,
		isMultiplayer,
		$game,
		game,
		isInitialized,
		canPlay,
		canStart,
		handleCellClick,
		handleReset,
		handleStartGame,
		sessionId,
		enableBot,
		botDifficulty,
		mode,
		enableBotBool,
		sessionIdOrUndefined,
		botDifficultyValue,
		click_handler
	];
}

class TicTacToeEmbed_wc extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				sessionId: 11,
				enableBot: 12,
				botDifficulty: 13,
				mode: 14
			},
			add_css
		);
	}

	get sessionId() {
		return this.$$.ctx[11];
	}

	set sessionId(sessionId) {
		this.$$set({ sessionId });
		flush();
	}

	get enableBot() {
		return this.$$.ctx[12];
	}

	set enableBot(enableBot) {
		this.$$set({ enableBot });
		flush();
	}

	get botDifficulty() {
		return this.$$.ctx[13];
	}

	set botDifficulty(botDifficulty) {
		this.$$set({ botDifficulty });
		flush();
	}

	get mode() {
		return this.$$.ctx[14];
	}

	set mode(mode) {
		this.$$set({ mode });
		flush();
	}
}

customElements.get("sl-tictactoe")||customElements.define("sl-tictactoe", create_custom_element(TicTacToeEmbed_wc, {"sessionId":{},"enableBot":{},"botDifficulty":{},"mode":{}}, [], [], true));

export { TicTacToeEmbed_wc as default };
//# sourceMappingURL=tictactoe.js.map
