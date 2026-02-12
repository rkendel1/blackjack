import { c as create_ssr_component, a as subscribe, v as validate_component, d as add_attribute, b as each, e as escape } from "../../../chunks/ssr.js";
/* empty css                     */
import { w as writable, d as derived } from "../../../chunks/index.js";
import { D as Deck, C as CardsDefinitions } from "../../../chunks/CardsDefinitions.js";
import { g as getBestHand } from "../../../chunks/poker-hands.js";
import { S as SolitaireCard } from "../../../chunks/SolitaireCard.js";
import { B as Button } from "../../../chunks/Button.js";
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
class Player {
  constructor(name, type, chips = 1e3) {
    this.name = name;
    this.type = type;
    this.chips = chips;
    this.currentBet = 0;
    this.folded = false;
    this.allIn = false;
  }
  hand = [];
  chips;
  currentBet;
  folded;
  allIn;
  bestHand = null;
  bet(amount) {
    const actualBet = Math.min(amount, this.chips);
    this.chips -= actualBet;
    this.currentBet += actualBet;
    if (this.chips === 0) {
      this.allIn = true;
    }
    return actualBet;
  }
  fold() {
    this.folded = true;
  }
  evaluateBestHand(communityCards) {
    if (communityCards.length >= 3) {
      const allCards = [...this.hand, ...communityCards];
      this.bestHand = getBestHand(allCards);
    }
  }
  addCard(card) {
    this.hand.push(card);
  }
}
class Bot extends Player {
  constructor(name, difficulty = "medium", chips = 1e3) {
    super(name, "bot", chips);
    this.difficulty = difficulty;
  }
  makeDecision(currentBet, pot, communityCards) {
    this.evaluateBestHand(communityCards);
    const toCall = currentBet - this.currentBet;
    const handStrength = this.bestHand ? this.bestHand.score / 1e7 : 0.1;
    if (this.difficulty === "easy") {
      const rand = Math.random();
      if (toCall === 0) {
        return rand > 0.5 ? { action: "check" } : { action: "raise", amount: 20 };
      }
      if (rand < 0.3) return { action: "fold" };
      if (rand < 0.7) return { action: "call" };
      return { action: "raise", amount: toCall + 20 };
    }
    if (this.difficulty === "medium") {
      if (toCall === 0) {
        return handStrength > 0.5 ? { action: "raise", amount: 40 } : { action: "check" };
      }
      if (handStrength < 0.3) return { action: "fold" };
      if (handStrength < 0.6) return { action: "call" };
      return { action: "raise", amount: toCall + 50 };
    }
    if (toCall === 0) {
      if (handStrength > 0.7) return { action: "raise", amount: pot * 0.5 };
      if (handStrength > 0.5) return { action: "raise", amount: 50 };
      return { action: "check" };
    }
    const potOdds = toCall / (pot + toCall);
    if (handStrength < potOdds - 0.1) return { action: "fold" };
    if (handStrength > 0.8) return { action: "raise", amount: toCall + pot * 0.5 };
    return { action: "call" };
  }
}
class TexasHoldemEngine {
  deck;
  players;
  communityCards;
  pot;
  currentBet;
  currentPlayerIndex;
  dealerIndex;
  phase;
  winners;
  botDifficulty;
  constructor() {
    this.deck = new Deck();
    this.players = [];
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.currentPlayerIndex = 0;
    this.dealerIndex = 0;
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
        allIn: p.allIn,
        bestHand: p.bestHand
      })),
      communityCards: [...this.communityCards],
      pot: this.pot,
      currentBet: this.currentBet,
      currentPlayerIndex: this.currentPlayerIndex,
      dealerIndex: this.dealerIndex,
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
    } else if (move.type === "next-hand") {
      this.nextHand();
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
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = BIG_BLIND;
    this.winners = [];
    this.players.forEach((player) => {
      player.hand = [];
      player.currentBet = 0;
      player.folded = false;
      player.allIn = false;
      player.bestHand = null;
    });
    const smallBlindIndex = (this.dealerIndex + 1) % this.players.length;
    const bigBlindIndex = (this.dealerIndex + 2) % this.players.length;
    const smallBlindAmount = this.players[smallBlindIndex].bet(SMALL_BLIND);
    const bigBlindAmount = this.players[bigBlindIndex].bet(BIG_BLIND);
    this.pot += smallBlindAmount + bigBlindAmount;
    for (let i = 0; i < 2; i++) {
      this.players.forEach((player) => {
        player.addCard(this.deck.deal());
      });
    }
    this.currentPlayerIndex = (bigBlindIndex + 1) % this.players.length;
    this.phase = "pre-flop";
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
      const totalRaise = toCall + (raiseAmount || 50);
      const betAmount = player.bet(totalRaise);
      this.pot += betAmount;
      this.currentBet = player.currentBet;
    } else if (action === "all-in") {
      const betAmount = player.bet(player.chips);
      this.pot += betAmount;
      if (player.currentBet > this.currentBet) {
        this.currentBet = player.currentBet;
      }
    }
    this.nextPlayer();
  }
  nextPlayer() {
    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    let attempts = 0;
    while ((this.players[nextIndex].folded || this.players[nextIndex].allIn) && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts++;
    }
    const activePlayers = this.players.filter((p) => !p.folded && !p.allIn);
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
    if (this.phase === "pre-flop") {
      this.communityCards.push(this.deck.deal(), this.deck.deal(), this.deck.deal());
      this.phase = "flop";
    } else if (this.phase === "flop") {
      this.communityCards.push(this.deck.deal());
      this.phase = "turn";
    } else if (this.phase === "turn") {
      this.communityCards.push(this.deck.deal());
      this.phase = "river";
    } else if (this.phase === "river") {
      this.showdown();
      return;
    }
    this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
  }
  showdown() {
    const activePlayers = this.players.filter((p) => !p.folded);
    activePlayers.forEach((player) => {
      player.evaluateBestHand(this.communityCards);
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
  nextHand() {
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
    this.start();
  }
  processBotAction() {
    const bot = this.players[this.currentPlayerIndex];
    if (bot.type === "bot") {
      const decision = bot.makeDecision(this.currentBet, this.pot, this.communityCards);
      this.handlePlayerAction(decision.action, decision.amount);
    }
  }
  needsBotAction() {
    if (this.phase === "setup" || this.phase === "showdown" || this.phase === "ended") {
      return false;
    }
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
      allIn: p.allIn,
      bestHand: p.bestHand
    };
  }
}
function createTexasHoldemStore() {
  const engine = new TexasHoldemEngine();
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
  const communityCards = derived(state, ($state) => $state.communityCards);
  const pot = derived(state, ($state) => $state.pot);
  const currentBet = derived(state, ($state) => $state.currentBet);
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
    communityCards,
    pot,
    currentBet,
    currentPlayer,
    activePlayers,
    phase,
    winners,
    setupGame,
    startGame,
    playerAction,
    nextHand
  };
}
const css = {
  code: "main.svelte-2jh179.svelte-2jh179{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00)}.setup.svelte-2jh179.svelte-2jh179{display:flex;align-items:center;justify-content:center;padding:20px}.setup-panel.svelte-2jh179.svelte-2jh179{background:rgba(0, 0, 0, 0.6);border:2px solid goldenrod;border-radius:12px;padding:2rem;max-width:500px;width:100%}h1.svelte-2jh179.svelte-2jh179{font-size:2.5rem;color:goldenrod;margin-bottom:0.5rem;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5);text-align:center}.subtitle.svelte-2jh179.svelte-2jh179{color:#e8eaed;text-align:center;margin-bottom:2rem}.config-group.svelte-2jh179.svelte-2jh179{display:flex;flex-direction:column;gap:1rem;margin-bottom:2rem}label.svelte-2jh179.svelte-2jh179{display:flex;flex-direction:column;color:#e8eaed;font-size:1rem;gap:0.5rem}input.svelte-2jh179.svelte-2jh179,select.svelte-2jh179.svelte-2jh179{padding:0.5rem;border-radius:4px;border:1px solid #ccc;font-size:1rem}.game.svelte-2jh179.svelte-2jh179{position:relative;height:100dvh;overflow:hidden}.table.svelte-2jh179.svelte-2jh179{position:relative;width:100%;height:100%;padding:2rem}.community-cards.svelte-2jh179.svelte-2jh179{position:absolute;top:35%;left:50%;transform:translate(-50%, -50%);text-align:center}.community-cards.svelte-2jh179 h3.svelte-2jh179{color:goldenrod;margin-bottom:1rem}.cards.svelte-2jh179.svelte-2jh179{display:flex;gap:8px;justify-content:center}.pot-info.svelte-2jh179.svelte-2jh179{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);text-align:center;background:rgba(0, 0, 0, 0.7);padding:1rem;border-radius:8px;border:2px solid goldenrod}.pot.svelte-2jh179.svelte-2jh179,.current-bet.svelte-2jh179.svelte-2jh179,.phase.svelte-2jh179.svelte-2jh179{color:#e8eaed;font-size:1.2rem;margin:0.25rem 0}.player.svelte-2jh179.svelte-2jh179{position:absolute;transform:translate(-50%, -50%);display:flex;flex-direction:column;align-items:center;gap:0.5rem}.player-info.svelte-2jh179.svelte-2jh179{background:rgba(0, 0, 0, 0.7);padding:0.75rem;border-radius:8px;border:2px solid transparent;min-width:120px;text-align:center}.player-info.active.svelte-2jh179.svelte-2jh179{border-color:goldenrod;box-shadow:0 0 10px goldenrod}.player-info.folded.svelte-2jh179.svelte-2jh179{opacity:0.5}.player-name.svelte-2jh179.svelte-2jh179{color:goldenrod;font-weight:bold;margin-bottom:0.25rem}.player-chips.svelte-2jh179.svelte-2jh179,.player-bet.svelte-2jh179.svelte-2jh179,.status.svelte-2jh179.svelte-2jh179{color:#e8eaed;font-size:0.9rem}.player-cards.svelte-2jh179.svelte-2jh179{display:flex;gap:4px}.hand-rank.svelte-2jh179.svelte-2jh179{color:goldenrod;font-size:0.85rem;font-weight:bold;background:rgba(0, 0, 0, 0.8);padding:0.25rem 0.5rem;border-radius:4px}.controls.svelte-2jh179.svelte-2jh179{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);display:flex;gap:1rem;background:rgba(0, 0, 0, 0.8);padding:1rem;border-radius:12px;border:2px solid goldenrod}.raise-control.svelte-2jh179.svelte-2jh179{display:flex;gap:0.5rem;align-items:center}.raise-control.svelte-2jh179 input.svelte-2jh179{width:80px}.showdown.svelte-2jh179.svelte-2jh179{position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);background:rgba(0, 0, 0, 0.9);border:3px solid goldenrod;border-radius:12px;padding:2rem;text-align:center;min-width:300px}.showdown.svelte-2jh179 h2.svelte-2jh179{color:goldenrod;margin-bottom:1rem}.showdown.svelte-2jh179 p.svelte-2jh179{color:#e8eaed;margin:0.5rem 0}@media(max-width: 768px){.table.svelte-2jh179.svelte-2jh179{padding:1rem}.controls.svelte-2jh179.svelte-2jh179{flex-wrap:wrap;max-width:90%}.player-info.svelte-2jh179.svelte-2jh179{min-width:80px;font-size:0.8rem;padding:0.5rem}h1.svelte-2jh179.svelte-2jh179{font-size:1.8rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../global.css\\";\\nimport { createTexasHoldemStore } from \\"$lib/adapters/createTexasHoldemStore\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Card from \\"$lib/Components/SolitaireCard.svelte\\";\\nimport Button from \\"$lib/Components/Button.svelte\\";\\nconst game = createTexasHoldemStore();\\nconst { players, communityCards, pot, currentBet, currentPlayer, phase, winners } = game;\\nlet humanCount = 1;\\nlet botCount = 3;\\nlet botDifficulty = \\"medium\\";\\nlet raiseAmount = 50;\\nfunction handleSetup() {\\n  game.setupGame(humanCount, botCount, botDifficulty);\\n  game.startGame();\\n}\\nfunction handlePlayerAction(action) {\\n  if (action === \\"raise\\") {\\n    game.playerAction(action, raiseAmount);\\n  } else {\\n    game.playerAction(action);\\n  }\\n}\\nfunction getPlayerPosition(index, total) {\\n  const angle = index / total * 360;\\n  const radius = 35;\\n  const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180));\\n  const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180));\\n  return \`left: \${x}%; top: \${y}%;\`;\\n}\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n{#if $phase === 'setup'}\\n\\t<main class=\\"setup\\">\\n\\t\\t<div class=\\"setup-panel\\">\\n\\t\\t\\t<h1>🃏 Texas Hold'em Poker</h1>\\n\\t\\t\\t<p class=\\"subtitle\\">Configure your game</p>\\n\\n\\t\\t\\t<div class=\\"config-group\\">\\n\\t\\t\\t\\t<label>\\n\\t\\t\\t\\t\\tHuman Players:\\n\\t\\t\\t\\t\\t<input type=\\"number\\" bind:value={humanCount} min=\\"1\\" max=\\"6\\" />\\n\\t\\t\\t\\t</label>\\n\\n\\t\\t\\t\\t<label>\\n\\t\\t\\t\\t\\tBot Players:\\n\\t\\t\\t\\t\\t<input type=\\"number\\" bind:value={botCount} min=\\"0\\" max=\\"5\\" />\\n\\t\\t\\t\\t</label>\\n\\n\\t\\t\\t\\t<label>\\n\\t\\t\\t\\t\\tBot Difficulty:\\n\\t\\t\\t\\t\\t<select bind:value={botDifficulty}>\\n\\t\\t\\t\\t\\t\\t<option value=\\"easy\\">Easy</option>\\n\\t\\t\\t\\t\\t\\t<option value=\\"medium\\">Medium</option>\\n\\t\\t\\t\\t\\t\\t<option value=\\"hard\\">Hard</option>\\n\\t\\t\\t\\t\\t</select>\\n\\t\\t\\t\\t</label>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<Button onclick={handleSetup} variant=\\"deal\\">Start Game</Button>\\n\\t\\t</div>\\n\\t</main>\\n{:else}\\n\\t<main class=\\"game\\">\\n\\t\\t<!-- Poker Table -->\\n\\t\\t<div class=\\"table\\">\\n\\t\\t\\t<!-- Community Cards -->\\n\\t\\t\\t<div class=\\"community-cards\\">\\n\\t\\t\\t\\t<h3>Community Cards</h3>\\n\\t\\t\\t\\t<div class=\\"cards\\">\\n\\t\\t\\t\\t\\t{#each $communityCards as card}\\n\\t\\t\\t\\t\\t\\t<Card {card} faceUp={true} />\\n\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<!-- Pot -->\\n\\t\\t\\t<div class=\\"pot-info\\">\\n\\t\\t\\t\\t<div class=\\"pot\\">Pot: \${$pot}</div>\\n\\t\\t\\t\\t<div class=\\"current-bet\\">Current Bet: \${$currentBet}</div>\\n\\t\\t\\t\\t<div class=\\"phase\\">{$phase}</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<!-- Players -->\\n\\t\\t\\t{#each $players as player, i}\\n\\t\\t\\t\\t<div class=\\"player\\" style={getPlayerPosition(i, $players.length)}>\\n\\t\\t\\t\\t\\t<div\\n\\t\\t\\t\\t\\t\\tclass=\\"player-info\\"\\n\\t\\t\\t\\t\\t\\tclass:active={$currentPlayer === player}\\n\\t\\t\\t\\t\\t\\tclass:folded={player.folded}\\n\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t<div class=\\"player-name\\">{player.name}</div>\\n\\t\\t\\t\\t\\t\\t<div class=\\"player-chips\\">💰 \${player.chips}</div>\\n\\t\\t\\t\\t\\t\\t{#if player.currentBet > 0}\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"player-bet\\">Bet: \${player.currentBet}</div>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t\\t{#if player.folded}\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"status\\">Folded</div>\\n\\t\\t\\t\\t\\t\\t{:else if player.allIn}\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"status\\">All In</div>\\n\\t\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t<div class=\\"player-cards\\">\\n\\t\\t\\t\\t\\t\\t{#each player.hand as card}\\n\\t\\t\\t\\t\\t\\t\\t<Card {card} faceUp={player.type === 'human' || $phase === 'showdown'} />\\n\\t\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t{#if $phase === 'showdown' && player.bestHand}\\n\\t\\t\\t\\t\\t\\t<div class=\\"hand-rank\\">{player.bestHand.description}</div>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t{/each}\\n\\t\\t</div>\\n\\n\\t\\t<!-- Controls -->\\n\\t\\t{#if $phase !== 'showdown' && $currentPlayer && $currentPlayer.type === 'human'}\\n\\t\\t\\t<div class=\\"controls\\">\\n\\t\\t\\t\\t<Button onclick={() => handlePlayerAction('fold')} variant=\\"draw\\">Fold</Button>\\n\\t\\t\\t\\t{#if $currentBet === $currentPlayer.currentBet}\\n\\t\\t\\t\\t\\t<Button onclick={() => handlePlayerAction('check')} variant=\\"draw\\">Check</Button>\\n\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t<Button onclick={() => handlePlayerAction('call')} variant=\\"draw\\">\\n\\t\\t\\t\\t\\t\\tCall \${$currentBet - $currentPlayer.currentBet}\\n\\t\\t\\t\\t\\t</Button>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t<div class=\\"raise-control\\">\\n\\t\\t\\t\\t\\t<input type=\\"number\\" bind:value={raiseAmount} min=\\"10\\" step=\\"10\\" />\\n\\t\\t\\t\\t\\t<Button onclick={() => handlePlayerAction('raise')} variant=\\"draw\\">Raise</Button>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t<Button onclick={() => handlePlayerAction('all-in')} variant=\\"draw\\">All In</Button>\\n\\t\\t\\t</div>\\n\\t\\t{/if}\\n\\n\\t\\t{#if $phase === 'showdown'}\\n\\t\\t\\t<div class=\\"showdown\\">\\n\\t\\t\\t\\t<h2>Winner{$winners.length > 1 ? 's' : ''}!</h2>\\n\\t\\t\\t\\t{#each $winners as winner}\\n\\t\\t\\t\\t\\t<p>{winner.name} - {winner.bestHand?.description}</p>\\n\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t<Button onclick={() => game.nextHand()} variant=\\"deal\\">Next Hand</Button>\\n\\t\\t\\t</div>\\n\\t\\t{/if}\\n\\t</main>\\n{/if}\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t}\\n\\n\\t.setup {\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tpadding: 20px;\\n\\t}\\n\\n\\t.setup-panel {\\n\\t\\tbackground: rgba(0, 0, 0, 0.6);\\n\\t\\tborder: 2px solid goldenrod;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 2rem;\\n\\t\\tmax-width: 500px;\\n\\t\\twidth: 100%;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-bottom: 0.5rem;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.subtitle {\\n\\t\\tcolor: #e8eaed;\\n\\t\\ttext-align: center;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t.config-group {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tgap: 1rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\tlabel {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1rem;\\n\\t\\tgap: 0.5rem;\\n\\t}\\n\\n\\tinput,\\n\\tselect {\\n\\t\\tpadding: 0.5rem;\\n\\t\\tborder-radius: 4px;\\n\\t\\tborder: 1px solid #ccc;\\n\\t\\tfont-size: 1rem;\\n\\t}\\n\\n\\t.game {\\n\\t\\tposition: relative;\\n\\t\\theight: 100dvh;\\n\\t\\toverflow: hidden;\\n\\t}\\n\\n\\t.table {\\n\\t\\tposition: relative;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tpadding: 2rem;\\n\\t}\\n\\n\\t.community-cards {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 35%;\\n\\t\\tleft: 50%;\\n\\t\\ttransform: translate(-50%, -50%);\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.community-cards h3 {\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.cards {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 8px;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.pot-info {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 50%;\\n\\t\\tleft: 50%;\\n\\t\\ttransform: translate(-50%, -50%);\\n\\t\\ttext-align: center;\\n\\t\\tbackground: rgba(0, 0, 0, 0.7);\\n\\t\\tpadding: 1rem;\\n\\t\\tborder-radius: 8px;\\n\\t\\tborder: 2px solid goldenrod;\\n\\t}\\n\\n\\t.pot,\\n\\t.current-bet,\\n\\t.phase {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tmargin: 0.25rem 0;\\n\\t}\\n\\n\\t.player {\\n\\t\\tposition: absolute;\\n\\t\\ttransform: translate(-50%, -50%);\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\talign-items: center;\\n\\t\\tgap: 0.5rem;\\n\\t}\\n\\n\\t.player-info {\\n\\t\\tbackground: rgba(0, 0, 0, 0.7);\\n\\t\\tpadding: 0.75rem;\\n\\t\\tborder-radius: 8px;\\n\\t\\tborder: 2px solid transparent;\\n\\t\\tmin-width: 120px;\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.player-info.active {\\n\\t\\tborder-color: goldenrod;\\n\\t\\tbox-shadow: 0 0 10px goldenrod;\\n\\t}\\n\\n\\t.player-info.folded {\\n\\t\\topacity: 0.5;\\n\\t}\\n\\n\\t.player-name {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-weight: bold;\\n\\t\\tmargin-bottom: 0.25rem;\\n\\t}\\n\\n\\t.player-chips,\\n\\t.player-bet,\\n\\t.status {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tfont-size: 0.9rem;\\n\\t}\\n\\n\\t.player-cards {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 4px;\\n\\t}\\n\\n\\t.hand-rank {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 0.85rem;\\n\\t\\tfont-weight: bold;\\n\\t\\tbackground: rgba(0, 0, 0, 0.8);\\n\\t\\tpadding: 0.25rem 0.5rem;\\n\\t\\tborder-radius: 4px;\\n\\t}\\n\\n\\t.controls {\\n\\t\\tposition: fixed;\\n\\t\\tbottom: 2rem;\\n\\t\\tleft: 50%;\\n\\t\\ttransform: translateX(-50%);\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 1rem;\\n\\t\\tbackground: rgba(0, 0, 0, 0.8);\\n\\t\\tpadding: 1rem;\\n\\t\\tborder-radius: 12px;\\n\\t\\tborder: 2px solid goldenrod;\\n\\t}\\n\\n\\t.raise-control {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 0.5rem;\\n\\t\\talign-items: center;\\n\\t}\\n\\n\\t.raise-control input {\\n\\t\\twidth: 80px;\\n\\t}\\n\\n\\t.showdown {\\n\\t\\tposition: fixed;\\n\\t\\ttop: 50%;\\n\\t\\tleft: 50%;\\n\\t\\ttransform: translate(-50%, -50%);\\n\\t\\tbackground: rgba(0, 0, 0, 0.9);\\n\\t\\tborder: 3px solid goldenrod;\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 2rem;\\n\\t\\ttext-align: center;\\n\\t\\tmin-width: 300px;\\n\\t}\\n\\n\\t.showdown h2 {\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.showdown p {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tmargin: 0.5rem 0;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\t.table {\\n\\t\\t\\tpadding: 1rem;\\n\\t\\t}\\n\\n\\t\\t.controls {\\n\\t\\t\\tflex-wrap: wrap;\\n\\t\\t\\tmax-width: 90%;\\n\\t\\t}\\n\\n\\t\\t.player-info {\\n\\t\\t\\tmin-width: 80px;\\n\\t\\t\\tfont-size: 0.8rem;\\n\\t\\t\\tpadding: 0.5rem;\\n\\t\\t}\\n\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 1.8rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
function getPlayerPosition(index, total) {
  const angle = index / total * 360;
  const radius = 35;
  const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180));
  const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180));
  return `left: ${x}%; top: ${y}%;`;
}
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $phase, $$unsubscribe_phase;
  let $communityCards, $$unsubscribe_communityCards;
  let $pot, $$unsubscribe_pot;
  let $currentBet, $$unsubscribe_currentBet;
  let $players, $$unsubscribe_players;
  let $currentPlayer, $$unsubscribe_currentPlayer;
  let $winners, $$unsubscribe_winners;
  const game = createTexasHoldemStore();
  const { players, communityCards, pot, currentBet, currentPlayer, phase, winners } = game;
  $$unsubscribe_players = subscribe(players, (value) => $players = value);
  $$unsubscribe_communityCards = subscribe(communityCards, (value) => $communityCards = value);
  $$unsubscribe_pot = subscribe(pot, (value) => $pot = value);
  $$unsubscribe_currentBet = subscribe(currentBet, (value) => $currentBet = value);
  $$unsubscribe_currentPlayer = subscribe(currentPlayer, (value) => $currentPlayer = value);
  $$unsubscribe_phase = subscribe(phase, (value) => $phase = value);
  $$unsubscribe_winners = subscribe(winners, (value) => $winners = value);
  let humanCount = 1;
  let botCount = 3;
  let botDifficulty = "medium";
  let raiseAmount = 50;
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
  $$result.css.add(css);
  $$unsubscribe_phase();
  $$unsubscribe_communityCards();
  $$unsubscribe_pot();
  $$unsubscribe_currentBet();
  $$unsubscribe_players();
  $$unsubscribe_currentPlayer();
  $$unsubscribe_winners();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} ${$phase === "setup" ? `<main class="setup svelte-2jh179"><div class="setup-panel svelte-2jh179"><h1 class="svelte-2jh179" data-svelte-h="svelte-13bce6x">🃏 Texas Hold&#39;em Poker</h1> <p class="subtitle svelte-2jh179" data-svelte-h="svelte-1ydfqhg">Configure your game</p> <div class="config-group svelte-2jh179"><label class="svelte-2jh179">Human Players:
					<input type="number" min="1" max="6" class="svelte-2jh179"${add_attribute("value", humanCount, 0)}></label> <label class="svelte-2jh179">Bot Players:
					<input type="number" min="0" max="5" class="svelte-2jh179"${add_attribute("value", botCount, 0)}></label> <label class="svelte-2jh179">Bot Difficulty:
					<select class="svelte-2jh179"><option value="easy" data-svelte-h="svelte-37ek0m">Easy</option><option value="medium" data-svelte-h="svelte-1u6j0ru">Medium</option><option value="hard" data-svelte-h="svelte-1v0xlpi">Hard</option></select></label></div> ${validate_component(Button, "Button").$$render($$result, { onclick: handleSetup, variant: "deal" }, {}, {
    default: () => {
      return `Start Game`;
    }
  })}</div></main>` : `<main class="game svelte-2jh179"> <div class="table svelte-2jh179"> <div class="community-cards svelte-2jh179"><h3 class="svelte-2jh179" data-svelte-h="svelte-1pjwbso">Community Cards</h3> <div class="cards svelte-2jh179">${each($communityCards, (card) => {
    return `${validate_component(SolitaireCard, "Card").$$render($$result, { card, faceUp: true }, {}, {})}`;
  })}</div></div>  <div class="pot-info svelte-2jh179"><div class="pot svelte-2jh179">Pot: $${escape($pot)}</div> <div class="current-bet svelte-2jh179">Current Bet: $${escape($currentBet)}</div> <div class="phase svelte-2jh179">${escape($phase)}</div></div>  ${each($players, (player, i) => {
    return `<div class="player svelte-2jh179"${add_attribute("style", getPlayerPosition(i, $players.length), 0)}><div class="${[
      "player-info svelte-2jh179",
      ($currentPlayer === player ? "active" : "") + " " + (player.folded ? "folded" : "")
    ].join(" ").trim()}"><div class="player-name svelte-2jh179">${escape(player.name)}</div> <div class="player-chips svelte-2jh179">💰 $${escape(player.chips)}</div> ${player.currentBet > 0 ? `<div class="player-bet svelte-2jh179">Bet: $${escape(player.currentBet)}</div>` : ``} ${player.folded ? `<div class="status svelte-2jh179" data-svelte-h="svelte-lpqflj">Folded</div>` : `${player.allIn ? `<div class="status svelte-2jh179" data-svelte-h="svelte-wsr2h7">All In</div>` : ``}`}</div> <div class="player-cards svelte-2jh179">${each(player.hand, (card) => {
      return `${validate_component(SolitaireCard, "Card").$$render(
        $$result,
        {
          card,
          faceUp: player.type === "human" || $phase === "showdown"
        },
        {},
        {}
      )}`;
    })}</div> ${$phase === "showdown" && player.bestHand ? `<div class="hand-rank svelte-2jh179">${escape(player.bestHand.description)}</div>` : ``} </div>`;
  })}</div>  ${$phase !== "showdown" && $currentPlayer && $currentPlayer.type === "human" ? `<div class="controls svelte-2jh179">${validate_component(Button, "Button").$$render(
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
  )}`} <div class="raise-control svelte-2jh179"><input type="number" min="10" step="10" class="svelte-2jh179"${add_attribute("value", raiseAmount, 0)}> ${validate_component(Button, "Button").$$render(
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
  )}</div> ${validate_component(Button, "Button").$$render(
    $$result,
    {
      onclick: () => handlePlayerAction("all-in"),
      variant: "draw"
    },
    {},
    {
      default: () => {
        return `All In`;
      }
    }
  )}</div>` : ``} ${$phase === "showdown" ? `<div class="showdown svelte-2jh179"><h2 class="svelte-2jh179">Winner${escape($winners.length > 1 ? "s" : "")}!</h2> ${each($winners, (winner) => {
    return `<p class="svelte-2jh179">${escape(winner.name)} - ${escape(winner.bestHand?.description)}</p>`;
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
  )}</div>` : ``}</main>`}`;
});
export {
  Page as default
};
