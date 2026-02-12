import { c as create_ssr_component, a as subscribe, v as validate_component, d as add_attribute, e as escape, b as each } from "../../../chunks/ssr.js";
/* empty css                     */
import { w as writable, d as derived } from "../../../chunks/index.js";
import { D as Deck, C as CardsDefinitions } from "../../../chunks/CardsDefinitions.js";
import { e as evaluateHand } from "../../../chunks/poker-hands.js";
import { S as SolitaireCard } from "../../../chunks/SolitaireCard.js";
import { B as Button } from "../../../chunks/Button.js";
const ANTE = 10;
class Player {
  constructor(name, type, chips = 1e3) {
    this.name = name;
    this.type = type;
    this.chips = chips;
    this.currentBet = 0;
    this.folded = false;
  }
  hand = [];
  chips;
  currentBet;
  folded;
  bestHand = null;
  selectedCards = [false, false, false, false, false];
  bet(amount) {
    const actualBet = Math.min(amount, this.chips);
    this.chips -= actualBet;
    this.currentBet += actualBet;
    return actualBet;
  }
  fold() {
    this.folded = true;
  }
  evaluateHand() {
    if (this.hand.length === 5) {
      this.bestHand = evaluateHand(this.hand);
    }
  }
  addCard(card) {
    this.hand.push(card);
  }
  discardAndDraw(deck) {
    const newCards = [];
    for (let i = this.selectedCards.length - 1; i >= 0; i--) {
      if (this.selectedCards[i]) {
        this.hand.splice(i, 1);
        newCards.push(deck.deal());
      }
    }
    this.hand.push(...newCards);
    this.selectedCards = [false, false, false, false, false];
  }
}
class Bot extends Player {
  constructor(name, difficulty = "medium", chips = 1e3) {
    super(name, "bot", chips);
    this.difficulty = difficulty;
  }
  selectCardsToDiscard() {
    this.evaluateHand();
    if (!this.bestHand) return;
    const handRank = this.bestHand.rank;
    if (handRank === "royal-flush" || handRank === "straight-flush" || handRank === "full-house" || handRank === "flush" || handRank === "straight") {
      this.selectedCards = [false, false, false, false, false];
    } else if (handRank === "four-of-a-kind") {
      const rankCounts = /* @__PURE__ */ new Map();
      this.hand.forEach((card) => {
        rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
      });
      const quadRank = Array.from(rankCounts.entries()).find(([, count]) => count === 4)?.[0];
      this.selectedCards = this.hand.map((card) => card.rank !== quadRank);
    } else if (handRank === "three-of-a-kind") {
      const rankCounts = /* @__PURE__ */ new Map();
      this.hand.forEach((card) => {
        rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
      });
      const tripRank = Array.from(rankCounts.entries()).find(([, count]) => count === 3)?.[0];
      this.selectedCards = this.hand.map((card) => card.rank !== tripRank);
    } else if (handRank === "two-pair") {
      const rankCounts = /* @__PURE__ */ new Map();
      this.hand.forEach((card) => {
        rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
      });
      const pairRanks = Array.from(rankCounts.entries()).filter(([, count]) => count === 2).map(([rank]) => rank);
      this.selectedCards = this.hand.map((card) => !pairRanks.includes(card.rank));
    } else if (handRank === "pair") {
      const rankCounts = /* @__PURE__ */ new Map();
      this.hand.forEach((card) => {
        rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
      });
      const pairRank = Array.from(rankCounts.entries()).find(([, count]) => count === 2)?.[0];
      this.selectedCards = this.hand.map((card) => card.rank !== pairRank);
    } else {
      if (this.difficulty === "easy") {
        this.selectedCards = this.hand.map(() => Math.random() > 0.5);
      } else {
        const sorted = [...this.hand].sort((a, b) => {
          const rankValue = (rank) => {
            if (rank === "1") return 14;
            if (rank === "king") return 13;
            if (rank === "queen") return 12;
            if (rank === "jack") return 11;
            return parseInt(rank);
          };
          return rankValue(b.rank) - rankValue(a.rank);
        });
        const keepCount = this.difficulty === "hard" ? 2 : 1;
        this.selectedCards = this.hand.map((card) => !sorted.slice(0, keepCount).includes(card));
      }
    }
  }
  makeDecision(currentBet) {
    this.evaluateHand();
    const handStrength = this.bestHand ? this.bestHand.score / 1e7 : 0.1;
    const toCall = currentBet - this.currentBet;
    if (this.difficulty === "easy") {
      const rand = Math.random();
      if (toCall === 0) {
        return rand > 0.5 ? { action: "check" } : { action: "raise", amount: 20 };
      }
      if (rand < 0.4) return { action: "fold" };
      if (rand < 0.8) return { action: "call" };
      return { action: "raise", amount: toCall + 20 };
    }
    if (toCall === 0) {
      return handStrength > 0.4 ? { action: "raise", amount: 30 } : { action: "check" };
    }
    if (handStrength < 0.25) return { action: "fold" };
    if (handStrength < 0.5) return { action: "call" };
    return { action: "raise", amount: toCall + 40 };
  }
}
class PokerEngine {
  deck;
  players;
  pot;
  currentBet;
  currentPlayerIndex;
  phase;
  winners;
  botDifficulty;
  constructor() {
    this.deck = new Deck();
    this.players = [];
    this.pot = 0;
    this.currentBet = 0;
    this.currentPlayerIndex = 0;
    this.phase = "setup";
    this.winners = [];
    this.botDifficulty = "medium";
  }
  getState() {
    return {
      players: this.players.map((p) => ({
        name: p.name,
        type: p.type,
        hand: [...p.hand],
        chips: p.chips,
        currentBet: p.currentBet,
        folded: p.folded,
        bestHand: p.bestHand,
        selectedCards: [...p.selectedCards]
      })),
      pot: this.pot,
      currentBet: this.currentBet,
      currentPlayerIndex: this.currentPlayerIndex,
      phase: this.phase,
      deckRemaining: this.deck.remaining,
      winners: [...this.winners]
    };
  }
  applyMove(move) {
    if (move.type === "setup") {
      this.setup(move.humanCount, move.botCount, move.botDifficulty);
    } else if (move.type === "start") {
      this.start();
    } else if (move.type === "player-action") {
      this.handlePlayerAction(move.action, move.raiseAmount);
    } else if (move.type === "toggle-card") {
      this.toggleCard(move.cardIndex);
    } else if (move.type === "draw-cards") {
      this.drawCards();
    } else if (move.type === "next-hand") {
      this.start();
    } else if (move.type === "bot-action") {
      this.processBotAction();
    }
  }
  setup(humanCount, botCount, botDifficulty = "medium") {
    this.players = [];
    this.botDifficulty = botDifficulty;
    for (let i = 0; i < humanCount; i++) {
      this.players.push(new Player(`Player ${i + 1}`, "human"));
    }
    for (let i = 0; i < botCount; i++) {
      this.players.push(new Bot(`Bot ${i + 1}`, botDifficulty));
    }
    this.phase = "setup";
  }
  start() {
    if (this.players.length < 2) {
      throw new Error("Need at least 2 players to start");
    }
    this.deck = new Deck();
    this.pot = 0;
    this.currentBet = ANTE;
    this.winners = [];
    this.players.forEach((player) => {
      player.hand = [];
      player.currentBet = 0;
      player.folded = false;
      player.bestHand = null;
      player.selectedCards = [false, false, false, false, false];
      const anteAmount = player.bet(ANTE);
      this.pot += anteAmount;
    });
    for (let i = 0; i < 5; i++) {
      this.players.forEach((player) => {
        player.addCard(this.deck.deal());
      });
    }
    this.currentPlayerIndex = 0;
    this.phase = "betting";
  }
  handlePlayerAction(action, raiseAmount) {
    const player = this.players[this.currentPlayerIndex];
    if (action === "fold") {
      player.fold();
    } else if (action === "check") ;
    else if (action === "call") {
      const toCall = this.currentBet - player.currentBet;
      const betAmount = player.bet(toCall);
      this.pot += betAmount;
    } else if (action === "raise") {
      const toCall = this.currentBet - player.currentBet;
      const totalRaise = toCall + (raiseAmount || 30);
      const betAmount = player.bet(totalRaise);
      this.pot += betAmount;
      this.currentBet = player.currentBet;
    }
    this.nextPlayer();
  }
  nextPlayer() {
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    let attempts = 0;
    while (this.players[nextIndex].folded && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts++;
    }
    const activePlayers = this.players.filter((p) => !p.folded);
    const allBetsEqual = activePlayers.every((p) => p.currentBet === this.currentBet);
    if (allBetsEqual && attempts > 0) {
      this.nextPhase();
    } else {
      this.currentPlayerIndex = nextIndex;
    }
  }
  nextPhase() {
    this.players.forEach((player) => {
      player.currentBet = 0;
    });
    this.currentBet = 0;
    if (this.phase === "betting") {
      this.phase = "draw";
      this.handleDrawPhase();
    } else if (this.phase === "draw") {
      this.phase = "final-betting";
      this.currentPlayerIndex = 0;
    } else if (this.phase === "final-betting") {
      this.showdown();
    }
  }
  handleDrawPhase() {
    this.players.forEach((player) => {
      if (player.type === "bot" && !player.folded) {
        player.selectCardsToDiscard();
        player.discardAndDraw(this.deck);
      }
    });
  }
  toggleCard(cardIndex) {
    const player = this.players[this.currentPlayerIndex];
    if (player.type === "human" && this.phase === "draw") {
      player.selectedCards[cardIndex] = !player.selectedCards[cardIndex];
    }
  }
  drawCards() {
    const player = this.players[this.currentPlayerIndex];
    if (player.type === "human" && this.phase === "draw") {
      player.discardAndDraw(this.deck);
      this.nextPhase();
    }
  }
  showdown() {
    const activePlayers = this.players.filter((p) => !p.folded);
    activePlayers.forEach((player) => {
      player.evaluateHand();
    });
    let bestScore = 0;
    const winningIndices = [];
    activePlayers.forEach((player) => {
      if (player.bestHand) {
        const playerIndex = this.players.indexOf(player);
        if (player.bestHand.score > bestScore) {
          bestScore = player.bestHand.score;
          winningIndices.length = 0;
          winningIndices.push(playerIndex);
        } else if (player.bestHand.score === bestScore) {
          winningIndices.push(playerIndex);
        }
      }
    });
    const winAmount = Math.floor(this.pot / winningIndices.length);
    winningIndices.forEach((index) => {
      this.players[index].chips += winAmount;
    });
    this.winners = winningIndices;
    this.phase = "showdown";
  }
  processBotAction() {
    const bot = this.players[this.currentPlayerIndex];
    if (bot.type === "bot") {
      const decision = bot.makeDecision(this.currentBet);
      this.handlePlayerAction(decision.action, decision.amount);
    }
  }
  needsBotAction() {
    if (this.phase !== "betting" && this.phase !== "final-betting") return false;
    return this.players[this.currentPlayerIndex]?.type === "bot";
  }
  getCurrentPlayer() {
    if (this.currentPlayerIndex < 0 || this.currentPlayerIndex >= this.players.length) {
      return null;
    }
    const p = this.players[this.currentPlayerIndex];
    return {
      name: p.name,
      type: p.type,
      hand: [...p.hand],
      chips: p.chips,
      currentBet: p.currentBet,
      folded: p.folded,
      bestHand: p.bestHand,
      selectedCards: [...p.selectedCards]
    };
  }
}
function createPokerStore() {
  const engine = new PokerEngine();
  const state = writable(engine.getState());
  function sync() {
    state.set(engine.getState());
  }
  const setupGame = (humanCount, botCount, botDifficulty = "medium") => {
    engine.applyMove({ type: "setup", humanCount, botCount, botDifficulty });
    sync();
  };
  const startGame = async () => {
    engine.applyMove({ type: "start" });
    sync();
    while (engine.needsBotAction()) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      engine.applyMove({ type: "bot-action" });
      sync();
    }
  };
  const playerAction = async (action, raiseAmount) => {
    engine.applyMove({ type: "player-action", action, raiseAmount });
    sync();
    while (engine.needsBotAction()) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      engine.applyMove({ type: "bot-action" });
      sync();
    }
  };
  const toggleCard = (cardIndex) => {
    engine.applyMove({ type: "toggle-card", cardIndex });
    sync();
  };
  const drawPhase = () => {
    engine.applyMove({ type: "draw-cards" });
    sync();
  };
  const humanDraw = async () => {
    engine.applyMove({ type: "draw-cards" });
    sync();
    while (engine.needsBotAction()) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      engine.applyMove({ type: "bot-action" });
      sync();
    }
  };
  const nextHand = async () => {
    engine.applyMove({ type: "next-hand" });
    sync();
    while (engine.needsBotAction()) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      engine.applyMove({ type: "bot-action" });
      sync();
    }
  };
  const players = derived(state, ($state) => $state.players);
  const pot = derived(state, ($state) => $state.pot);
  const currentBet = derived(state, ($state) => $state.currentBet);
  const currentPlayerIndex = derived(state, ($state) => $state.currentPlayerIndex);
  const phase = derived(state, ($state) => $state.phase);
  const winners = derived(state, ($state) => $state.winners.map((idx) => $state.players[idx]));
  const currentPlayer = derived(state, ($state) => {
    const idx = $state.currentPlayerIndex;
    return idx >= 0 && idx < $state.players.length ? $state.players[idx] : null;
  });
  const activePlayers = derived(
    state,
    ($state) => $state.players.filter((p) => !p.folded && p.chips > 0)
  );
  return {
    state,
    players,
    pot,
    currentBet,
    currentPlayer,
    currentPlayerIndex,
    activePlayers,
    phase,
    winners,
    setupGame,
    startGame,
    playerAction,
    toggleCard,
    drawPhase,
    humanDraw,
    nextHand
  };
}
const css = {
  code: "main.svelte-maaxex.svelte-maaxex{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);padding:20px}.setup.svelte-maaxex.svelte-maaxex{display:flex;align-items:center;justify-content:center}.setup-panel.svelte-maaxex.svelte-maaxex{background:rgba(0, 0, 0, 0.6);border:2px solid goldenrod;border-radius:12px;padding:2rem;max-width:500px;width:100%}h1.svelte-maaxex.svelte-maaxex{font-size:2.5rem;color:goldenrod;margin-bottom:0.5rem;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5);text-align:center}.subtitle.svelte-maaxex.svelte-maaxex{color:#e8eaed;text-align:center;margin-bottom:2rem}.config-group.svelte-maaxex.svelte-maaxex{display:flex;flex-direction:column;gap:1rem;margin-bottom:2rem}label.svelte-maaxex.svelte-maaxex{display:flex;flex-direction:column;color:#e8eaed;font-size:1rem;gap:0.5rem}input.svelte-maaxex.svelte-maaxex,select.svelte-maaxex.svelte-maaxex{padding:0.5rem;border-radius:4px;border:1px solid #ccc;font-size:1rem}.game-area.svelte-maaxex.svelte-maaxex{max-width:1200px;margin:0 auto}.info-panel.svelte-maaxex.svelte-maaxex{background:rgba(0, 0, 0, 0.7);padding:1rem;border-radius:8px;border:2px solid goldenrod;text-align:center;margin-bottom:2rem;display:flex;justify-content:space-around;flex-wrap:wrap;gap:1rem}.pot.svelte-maaxex.svelte-maaxex,.current-bet.svelte-maaxex.svelte-maaxex,.phase-info.svelte-maaxex.svelte-maaxex{color:goldenrod;font-size:1.2rem;font-weight:bold}.players-area.svelte-maaxex.svelte-maaxex{display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:1.5rem;margin-bottom:2rem}.player-section.svelte-maaxex.svelte-maaxex{background:rgba(0, 0, 0, 0.6);border:2px solid rgba(255, 215, 0, 0.3);border-radius:12px;padding:1rem}.player-section.active.svelte-maaxex.svelte-maaxex{border-color:goldenrod;box-shadow:0 0 15px rgba(255, 215, 0, 0.5)}.player-section.folded.svelte-maaxex.svelte-maaxex{opacity:0.5}.player-header.svelte-maaxex.svelte-maaxex{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem}.player-name.svelte-maaxex.svelte-maaxex{color:goldenrod;font-weight:bold;font-size:1.1rem}.player-chips.svelte-maaxex.svelte-maaxex,.player-bet.svelte-maaxex.svelte-maaxex,.status.svelte-maaxex.svelte-maaxex{color:#e8eaed;font-size:0.9rem}.player-hand.svelte-maaxex.svelte-maaxex{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:0.5rem}.card-wrapper.svelte-maaxex.svelte-maaxex{cursor:pointer;transition:transform 0.2s;position:relative}.card-wrapper.svelte-maaxex.svelte-maaxex:hover{transform:translateY(-5px)}.card-wrapper.selected.svelte-maaxex.svelte-maaxex{transform:translateY(-10px)}.card-wrapper.selected.svelte-maaxex.svelte-maaxex::after{content:'✓';position:absolute;top:-10px;right:-5px;background:goldenrod;color:black;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold}.hand-rank.svelte-maaxex.svelte-maaxex{color:goldenrod;font-size:1rem;font-weight:bold;text-align:center;margin-top:0.5rem;background:rgba(0, 0, 0, 0.5);padding:0.5rem;border-radius:4px}.controls.svelte-maaxex.svelte-maaxex{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);display:flex;gap:1rem;background:rgba(0, 0, 0, 0.9);padding:1rem;border-radius:12px;border:2px solid goldenrod;align-items:center;flex-wrap:wrap;justify-content:center;max-width:90%}.instruction.svelte-maaxex.svelte-maaxex{color:#e8eaed;margin:0;flex-basis:100%;text-align:center}.raise-control.svelte-maaxex.svelte-maaxex{display:flex;gap:0.5rem;align-items:center}.raise-control.svelte-maaxex input.svelte-maaxex{width:80px}.showdown.svelte-maaxex.svelte-maaxex{position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);background:rgba(0, 0, 0, 0.95);border:3px solid goldenrod;border-radius:12px;padding:2rem;text-align:center;min-width:300px;z-index:100}.showdown.svelte-maaxex h2.svelte-maaxex{color:goldenrod;margin-bottom:1rem}.showdown.svelte-maaxex p.svelte-maaxex{color:#e8eaed;margin:0.5rem 0;font-size:1.1rem}@media(max-width: 768px){.players-area.svelte-maaxex.svelte-maaxex{grid-template-columns:1fr}.info-panel.svelte-maaxex.svelte-maaxex{flex-direction:column;gap:0.5rem}h1.svelte-maaxex.svelte-maaxex{font-size:1.8rem}.controls.svelte-maaxex.svelte-maaxex{bottom:1rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../global.css\\";\\nimport { createPokerStore } from \\"$lib/adapters/createPokerStore\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Card from \\"$lib/Components/SolitaireCard.svelte\\";\\nimport Button from \\"$lib/Components/Button.svelte\\";\\nconst game = createPokerStore();\\nconst { players, pot, currentBet, currentPlayer, currentPlayerIndex, phase, winners } = game;\\nlet humanCount = 1;\\nlet botCount = 3;\\nlet botDifficulty = \\"medium\\";\\nlet raiseAmount = 30;\\nfunction handleSetup() {\\n  game.setupGame(humanCount, botCount, botDifficulty);\\n  game.startGame();\\n}\\nfunction handlePlayerAction(action) {\\n  if (action === \\"raise\\") {\\n    game.playerAction(action, raiseAmount);\\n  } else {\\n    game.playerAction(action);\\n  }\\n}\\nfunction toggleCardSelection(playerIndex, cardIndex) {\\n  if (playerIndex === $currentPlayerIndex) {\\n    game.toggleCard(cardIndex);\\n  }\\n}\\nfunction handleDraw() {\\n  game.humanDraw();\\n}\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n{#if $phase === 'setup'}\\n\\t<main class=\\"setup\\">\\n\\t\\t<div class=\\"setup-panel\\">\\n\\t\\t\\t<h1>🎴 Five-Card Draw Poker</h1>\\n\\t\\t\\t<p class=\\"subtitle\\">Configure your game</p>\\n\\n\\t\\t\\t<div class=\\"config-group\\">\\n\\t\\t\\t\\t<label>\\n\\t\\t\\t\\t\\tHuman Players:\\n\\t\\t\\t\\t\\t<input type=\\"number\\" bind:value={humanCount} min=\\"1\\" max=\\"6\\" />\\n\\t\\t\\t\\t</label>\\n\\n\\t\\t\\t\\t<label>\\n\\t\\t\\t\\t\\tBot Players:\\n\\t\\t\\t\\t\\t<input type=\\"number\\" bind:value={botCount} min=\\"0\\" max=\\"5\\" />\\n\\t\\t\\t\\t</label>\\n\\n\\t\\t\\t\\t<label>\\n\\t\\t\\t\\t\\tBot Difficulty:\\n\\t\\t\\t\\t\\t<select bind:value={botDifficulty}>\\n\\t\\t\\t\\t\\t\\t<option value=\\"easy\\">Easy</option>\\n\\t\\t\\t\\t\\t\\t<option value=\\"medium\\">Medium</option>\\n\\t\\t\\t\\t\\t\\t<option value=\\"hard\\">Hard</option>\\n\\t\\t\\t\\t\\t</select>\\n\\t\\t\\t\\t</label>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<Button onclick={handleSetup} variant=\\"deal\\">Start Game</Button>\\n\\t\\t</div>\\n\\t</main>\\n{:else}\\n\\t<main class=\\"game\\">\\n\\t\\t<div class=\\"game-area\\">\\n\\t\\t\\t<!-- Pot and Phase Info -->\\n\\t\\t\\t<div class=\\"info-panel\\">\\n\\t\\t\\t\\t<div class=\\"pot\\">💰 Pot: \${$pot}</div>\\n\\t\\t\\t\\t<div class=\\"current-bet\\">Current Bet: \${$currentBet}</div>\\n\\t\\t\\t\\t<div class=\\"phase-info\\">{$phase}</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<!-- All Players -->\\n\\t\\t\\t<div class=\\"players-area\\">\\n\\t\\t\\t\\t{#each $players as player, i}\\n\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\tclass=\\"player-section\\"\\n\\t\\t\\t\\t\\t\\tclass:active={$currentPlayer === player}\\n\\t\\t\\t\\t\\t\\tclass:folded={player.folded}\\n\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t<div class=\\"player-header\\">\\n\\t\\t\\t\\t\\t\\t\\t<span class=\\"player-name\\">{player.name}</span>\\n\\t\\t\\t\\t\\t\\t\\t<span class=\\"player-chips\\">💰 \${player.chips}</span>\\n\\t\\t\\t\\t\\t\\t\\t{#if player.currentBet > 0}\\n\\t\\t\\t\\t\\t\\t\\t\\t<span class=\\"player-bet\\">Bet: \${player.currentBet}</span>\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t\\t\\t{#if player.folded}\\n\\t\\t\\t\\t\\t\\t\\t\\t<span class=\\"status\\">Folded</span>\\n\\t\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t\\t</div>\\n\\n\\t\\t\\t\\t\\t\\t<!-- Player Cards -->\\n\\t\\t\\t\\t\\t\\t<div class=\\"player-hand\\">\\n\\t\\t\\t\\t\\t\\t\\t{#each player.hand as card, cardIndex}\\n\\t\\t\\t\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tclass=\\"card-wrapper\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tclass:selected={player.selectedCards[cardIndex]}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ton:click={() => {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tif (player.type === 'human' && $phase === 'draw' && i === $currentPlayerIndex) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttoggleCardSelection(i, cardIndex);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ton:keydown={(e) => {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tif (\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\te.key === 'Enter' &&\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tplayer.type === 'human' &&\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t$phase === 'draw' &&\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ti === $currentPlayerIndex\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttoggleCardSelection(i, cardIndex);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\trole=\\"button\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttabindex={player.type === 'human' &&\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t$phase === 'draw' &&\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ti === $currentPlayerIndex\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t? 0\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t: -1}\\n\\t\\t\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t<Card {card} faceUp={player.type === 'human' || $phase === 'showdown'} />\\n\\t\\t\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t\\t</div>\\n\\n\\t\\t\\t\\t\\t\\t{#if $phase === 'showdown' && player.bestHand}\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"hand-rank\\">{player.bestHand.description}</div>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t{/each}\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<!-- Controls for Betting -->\\n\\t\\t\\t{#if ($phase === 'betting' || $phase === 'final-betting') && $currentPlayer && $currentPlayer.type === 'human'}\\n\\t\\t\\t\\t<div class=\\"controls\\">\\n\\t\\t\\t\\t\\t<Button onclick={() => handlePlayerAction('fold')} variant=\\"draw\\">Fold</Button>\\n\\t\\t\\t\\t\\t{#if $currentBet === $currentPlayer.currentBet}\\n\\t\\t\\t\\t\\t\\t<Button onclick={() => handlePlayerAction('check')} variant=\\"draw\\">Check</Button>\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t<Button onclick={() => handlePlayerAction('call')} variant=\\"draw\\">\\n\\t\\t\\t\\t\\t\\t\\tCall \${$currentBet - $currentPlayer.currentBet}\\n\\t\\t\\t\\t\\t\\t</Button>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t<div class=\\"raise-control\\">\\n\\t\\t\\t\\t\\t\\t<input type=\\"number\\" bind:value={raiseAmount} min=\\"10\\" step=\\"10\\" />\\n\\t\\t\\t\\t\\t\\t<Button onclick={() => handlePlayerAction('raise')} variant=\\"draw\\">Raise</Button>\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/if}\\n\\n\\t\\t\\t<!-- Draw Phase Controls -->\\n\\t\\t\\t{#if $phase === 'draw' && $currentPlayer && $currentPlayer.type === 'human'}\\n\\t\\t\\t\\t<div class=\\"controls\\">\\n\\t\\t\\t\\t\\t<p class=\\"instruction\\">Select cards to discard (click on cards), then click Draw</p>\\n\\t\\t\\t\\t\\t<Button onclick={handleDraw} variant=\\"draw\\">\\n\\t\\t\\t\\t\\t\\tDraw ({$currentPlayer.selectedCards.filter((s) => s).length} selected)\\n\\t\\t\\t\\t\\t</Button>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/if}\\n\\n\\t\\t\\t<!-- Showdown -->\\n\\t\\t\\t{#if $phase === 'showdown'}\\n\\t\\t\\t\\t<div class=\\"showdown\\">\\n\\t\\t\\t\\t\\t<h2>Winner{$winners.length > 1 ? 's' : ''}!</h2>\\n\\t\\t\\t\\t\\t{#each $winners as winner}\\n\\t\\t\\t\\t\\t\\t<p>{winner.name} - {winner.bestHand?.description}</p>\\n\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t<Button onclick={() => game.nextHand()} variant=\\"deal\\">Next Hand</Button>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\t</main>\\n{/if}\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t\\tpadding: 20px;\\n\\t}\\n\\n\\t.setup {\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.setup-panel {\\n\\t\\tbackground: rgba(0, 0, 0, 0.6);\\n\\t\\tborder: 2px solid goldenrod;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 2rem;\\n\\t\\tmax-width: 500px;\\n\\t\\twidth: 100%;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-bottom: 0.5rem;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.subtitle {\\n\\t\\tcolor: #e8eaed;\\n\\t\\ttext-align: center;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t.config-group {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tgap: 1rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\tlabel {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1rem;\\n\\t\\tgap: 0.5rem;\\n\\t}\\n\\n\\tinput,\\n\\tselect {\\n\\t\\tpadding: 0.5rem;\\n\\t\\tborder-radius: 4px;\\n\\t\\tborder: 1px solid #ccc;\\n\\t\\tfont-size: 1rem;\\n\\t}\\n\\n\\t.game-area {\\n\\t\\tmax-width: 1200px;\\n\\t\\tmargin: 0 auto;\\n\\t}\\n\\n\\t.info-panel {\\n\\t\\tbackground: rgba(0, 0, 0, 0.7);\\n\\t\\tpadding: 1rem;\\n\\t\\tborder-radius: 8px;\\n\\t\\tborder: 2px solid goldenrod;\\n\\t\\ttext-align: center;\\n\\t\\tmargin-bottom: 2rem;\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-around;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t.pot,\\n\\t.current-bet,\\n\\t.phase-info {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tfont-weight: bold;\\n\\t}\\n\\n\\t.players-area {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\\n\\t\\tgap: 1.5rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t.player-section {\\n\\t\\tbackground: rgba(0, 0, 0, 0.6);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 1rem;\\n\\t}\\n\\n\\t.player-section.active {\\n\\t\\tborder-color: goldenrod;\\n\\t\\tbox-shadow: 0 0 15px rgba(255, 215, 0, 0.5);\\n\\t}\\n\\n\\t.player-section.folded {\\n\\t\\topacity: 0.5;\\n\\t}\\n\\n\\t.player-header {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: space-between;\\n\\t\\talign-items: center;\\n\\t\\tmargin-bottom: 1rem;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tgap: 0.5rem;\\n\\t}\\n\\n\\t.player-name {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-weight: bold;\\n\\t\\tfont-size: 1.1rem;\\n\\t}\\n\\n\\t.player-chips,\\n\\t.player-bet,\\n\\t.status {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 0.9rem;\\n\\t}\\n\\n\\t.player-hand {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 8px;\\n\\t\\tjustify-content: center;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tmargin-bottom: 0.5rem;\\n\\t}\\n\\n\\t.card-wrapper {\\n\\t\\tcursor: pointer;\\n\\t\\ttransition: transform 0.2s;\\n\\t\\tposition: relative;\\n\\t}\\n\\n\\t.card-wrapper:hover {\\n\\t\\ttransform: translateY(-5px);\\n\\t}\\n\\n\\t.card-wrapper.selected {\\n\\t\\ttransform: translateY(-10px);\\n\\t}\\n\\n\\t.card-wrapper.selected::after {\\n\\t\\tcontent: '✓';\\n\\t\\tposition: absolute;\\n\\t\\ttop: -10px;\\n\\t\\tright: -5px;\\n\\t\\tbackground: goldenrod;\\n\\t\\tcolor: black;\\n\\t\\twidth: 20px;\\n\\t\\theight: 20px;\\n\\t\\tborder-radius: 50%;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tfont-weight: bold;\\n\\t}\\n\\n\\t.hand-rank {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 1rem;\\n\\t\\tfont-weight: bold;\\n\\t\\ttext-align: center;\\n\\t\\tmargin-top: 0.5rem;\\n\\t\\tbackground: rgba(0, 0, 0, 0.5);\\n\\t\\tpadding: 0.5rem;\\n\\t\\tborder-radius: 4px;\\n\\t}\\n\\n\\t.controls {\\n\\t\\tposition: fixed;\\n\\t\\tbottom: 2rem;\\n\\t\\tleft: 50%;\\n\\t\\ttransform: translateX(-50%);\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 1rem;\\n\\t\\tbackground: rgba(0, 0, 0, 0.9);\\n\\t\\tpadding: 1rem;\\n\\t\\tborder-radius: 12px;\\n\\t\\tborder: 2px solid goldenrod;\\n\\t\\talign-items: center;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tjustify-content: center;\\n\\t\\tmax-width: 90%;\\n\\t}\\n\\n\\t.instruction {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tmargin: 0;\\n\\t\\tflex-basis: 100%;\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.raise-control {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 0.5rem;\\n\\t\\talign-items: center;\\n\\t}\\n\\n\\t.raise-control input {\\n\\t\\twidth: 80px;\\n\\t}\\n\\n\\t.showdown {\\n\\t\\tposition: fixed;\\n\\t\\ttop: 50%;\\n\\t\\tleft: 50%;\\n\\t\\ttransform: translate(-50%, -50%);\\n\\t\\tbackground: rgba(0, 0, 0, 0.95);\\n\\t\\tborder: 3px solid goldenrod;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 2rem;\\n\\t\\ttext-align: center;\\n\\t\\tmin-width: 300px;\\n\\t\\tz-index: 100;\\n\\t}\\n\\n\\t.showdown h2 {\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.showdown p {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tmargin: 0.5rem 0;\\n\\t\\tfont-size: 1.1rem;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.players-area {\\n\\t\\t\\tgrid-template-columns: 1fr;\\n\\t\\t}\\n\\n\\t\\t.info-panel {\\n\\t\\t\\tflex-direction: column;\\n\\t\\t\\tgap: 0.5rem;\\n\\t\\t}\\n\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 1.8rem;\\n\\t\\t}\\n\\n\\t\\t.controls {\\n\\t\\t\\tbottom: 1rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $currentPlayerIndex, $$unsubscribe_currentPlayerIndex;
  let $phase, $$unsubscribe_phase;
  let $pot, $$unsubscribe_pot;
  let $currentBet, $$unsubscribe_currentBet;
  let $players, $$unsubscribe_players;
  let $currentPlayer, $$unsubscribe_currentPlayer;
  let $winners, $$unsubscribe_winners;
  const game = createPokerStore();
  const { players, pot, currentBet, currentPlayer, currentPlayerIndex, phase, winners } = game;
  $$unsubscribe_players = subscribe(players, (value) => $players = value);
  $$unsubscribe_pot = subscribe(pot, (value) => $pot = value);
  $$unsubscribe_currentBet = subscribe(currentBet, (value) => $currentBet = value);
  $$unsubscribe_currentPlayer = subscribe(currentPlayer, (value) => $currentPlayer = value);
  $$unsubscribe_currentPlayerIndex = subscribe(currentPlayerIndex, (value) => $currentPlayerIndex = value);
  $$unsubscribe_phase = subscribe(phase, (value) => $phase = value);
  $$unsubscribe_winners = subscribe(winners, (value) => $winners = value);
  let humanCount = 1;
  let botCount = 3;
  let botDifficulty = "medium";
  let raiseAmount = 30;
  function handleSetup() {
    game.setupGame(humanCount, botCount, botDifficulty);
    game.startGame();
  }
  function handlePlayerAction(action) {
    if (action === "raise") {
      game.playerAction(action, raiseAmount);
    } else {
      game.playerAction(action);
    }
  }
  function handleDraw() {
    game.humanDraw();
  }
  $$result.css.add(css);
  $$unsubscribe_currentPlayerIndex();
  $$unsubscribe_phase();
  $$unsubscribe_pot();
  $$unsubscribe_currentBet();
  $$unsubscribe_players();
  $$unsubscribe_currentPlayer();
  $$unsubscribe_winners();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} ${$phase === "setup" ? `<main class="setup svelte-maaxex"><div class="setup-panel svelte-maaxex"><h1 class="svelte-maaxex" data-svelte-h="svelte-1u2uw0m">🎴 Five-Card Draw Poker</h1> <p class="subtitle svelte-maaxex" data-svelte-h="svelte-1ydfqhg">Configure your game</p> <div class="config-group svelte-maaxex"><label class="svelte-maaxex">Human Players:
					<input type="number" min="1" max="6" class="svelte-maaxex"${add_attribute("value", humanCount, 0)}></label> <label class="svelte-maaxex">Bot Players:
					<input type="number" min="0" max="5" class="svelte-maaxex"${add_attribute("value", botCount, 0)}></label> <label class="svelte-maaxex">Bot Difficulty:
					<select class="svelte-maaxex"><option value="easy" data-svelte-h="svelte-37ek0m">Easy</option><option value="medium" data-svelte-h="svelte-1u6j0ru">Medium</option><option value="hard" data-svelte-h="svelte-1v0xlpi">Hard</option></select></label></div> ${validate_component(Button, "Button").$$render($$result, { onclick: handleSetup, variant: "deal" }, {}, {
    default: () => {
      return `Start Game`;
    }
  })}</div></main>` : `<main class="game svelte-maaxex"><div class="game-area svelte-maaxex"> <div class="info-panel svelte-maaxex"><div class="pot svelte-maaxex">💰 Pot: $${escape($pot)}</div> <div class="current-bet svelte-maaxex">Current Bet: $${escape($currentBet)}</div> <div class="phase-info svelte-maaxex">${escape($phase)}</div></div>  <div class="players-area svelte-maaxex">${each($players, (player, i) => {
    return `<div class="${[
      "player-section svelte-maaxex",
      ($currentPlayer === player ? "active" : "") + " " + (player.folded ? "folded" : "")
    ].join(" ").trim()}"><div class="player-header svelte-maaxex"><span class="player-name svelte-maaxex">${escape(player.name)}</span> <span class="player-chips svelte-maaxex">💰 $${escape(player.chips)}</span> ${player.currentBet > 0 ? `<span class="player-bet svelte-maaxex">Bet: $${escape(player.currentBet)}</span>` : ``} ${player.folded ? `<span class="status svelte-maaxex" data-svelte-h="svelte-lt5jtx">Folded</span>` : ``}</div>  <div class="player-hand svelte-maaxex">${each(player.hand, (card, cardIndex) => {
      return `<div class="${[
        "card-wrapper svelte-maaxex",
        player.selectedCards[cardIndex] ? "selected" : ""
      ].join(" ").trim()}" role="button"${add_attribute(
        "tabindex",
        player.type === "human" && $phase === "draw" && i === $currentPlayerIndex ? 0 : -1,
        0
      )}>${validate_component(SolitaireCard, "Card").$$render(
        $$result,
        {
          card,
          faceUp: player.type === "human" || $phase === "showdown"
        },
        {},
        {}
      )} </div>`;
    })}</div> ${$phase === "showdown" && player.bestHand ? `<div class="hand-rank svelte-maaxex">${escape(player.bestHand.description)}</div>` : ``} </div>`;
  })}</div>  ${($phase === "betting" || $phase === "final-betting") && $currentPlayer && $currentPlayer.type === "human" ? `<div class="controls svelte-maaxex">${validate_component(Button, "Button").$$render(
    $$result,
    {
      onclick: () => handlePlayerAction("fold"),
      variant: "draw"
    },
    {},
    {
      default: () => {
        return `Fold`;
      }
    }
  )} ${$currentBet === $currentPlayer.currentBet ? `${validate_component(Button, "Button").$$render(
    $$result,
    {
      onclick: () => handlePlayerAction("check"),
      variant: "draw"
    },
    {},
    {
      default: () => {
        return `Check`;
      }
    }
  )}` : `${validate_component(Button, "Button").$$render(
    $$result,
    {
      onclick: () => handlePlayerAction("call"),
      variant: "draw"
    },
    {},
    {
      default: () => {
        return `Call $${escape($currentBet - $currentPlayer.currentBet)}`;
      }
    }
  )}`} <div class="raise-control svelte-maaxex"><input type="number" min="10" step="10" class="svelte-maaxex"${add_attribute("value", raiseAmount, 0)}> ${validate_component(Button, "Button").$$render(
    $$result,
    {
      onclick: () => handlePlayerAction("raise"),
      variant: "draw"
    },
    {},
    {
      default: () => {
        return `Raise`;
      }
    }
  )}</div></div>` : ``}  ${$phase === "draw" && $currentPlayer && $currentPlayer.type === "human" ? `<div class="controls svelte-maaxex"><p class="instruction svelte-maaxex" data-svelte-h="svelte-1161an">Select cards to discard (click on cards), then click Draw</p> ${validate_component(Button, "Button").$$render($$result, { onclick: handleDraw, variant: "draw" }, {}, {
    default: () => {
      return `Draw (${escape($currentPlayer.selectedCards.filter((s) => s).length)} selected)`;
    }
  })}</div>` : ``}  ${$phase === "showdown" ? `<div class="showdown svelte-maaxex"><h2 class="svelte-maaxex">Winner${escape($winners.length > 1 ? "s" : "")}!</h2> ${each($winners, (winner) => {
    return `<p class="svelte-maaxex">${escape(winner.name)} - ${escape(winner.bestHand?.description)}</p>`;
  })} ${validate_component(Button, "Button").$$render(
    $$result,
    {
      onclick: () => game.nextHand(),
      variant: "deal"
    },
    {},
    {
      default: () => {
        return `Next Hand`;
      }
    }
  )}</div>` : ``}</div></main>`}`;
});
export {
  Page as default
};
