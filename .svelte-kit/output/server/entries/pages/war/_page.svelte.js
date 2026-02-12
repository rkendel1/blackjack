import { c as create_ssr_component, a as subscribe, v as validate_component, e as escape } from "../../../chunks/ssr.js";
/* empty css                     */
import { w as writable, d as derived } from "../../../chunks/index.js";
import { D as Deck, C as CardsDefinitions } from "../../../chunks/CardsDefinitions.js";
import { C as Card } from "../../../chunks/Card.js";
import { B as Button } from "../../../chunks/Button.js";
const RANK_VALUES = {
  "1": 14,
  // Ace is highest
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  jack: 11,
  queen: 12,
  king: 13
};
class WarEngine {
  player;
  opponent;
  gameState;
  playerCard;
  opponentCard;
  roundResult;
  cardsInPlay;
  warCount;
  winner;
  constructor() {
    this.player = this.createPlayer();
    this.opponent = this.createOpponent();
    this.gameState = "ready";
    this.playerCard = null;
    this.opponentCard = null;
    this.roundResult = null;
    this.cardsInPlay = [];
    this.warCount = 0;
    this.winner = null;
  }
  createPlayer() {
    return {
      name: "Player",
      hand: [],
      wonCards: [],
      totalCards: 0
    };
  }
  createOpponent() {
    return {
      name: "Bot",
      hand: [],
      wonCards: [],
      totalCards: 0
    };
  }
  updateTotalCards() {
    this.player.totalCards = this.player.hand.length + this.player.wonCards.length;
    this.opponent.totalCards = this.opponent.hand.length + this.opponent.wonCards.length;
  }
  playCardFromDeck(playerState) {
    if (playerState.hand.length === 0) {
      playerState.hand = [...playerState.wonCards];
      playerState.wonCards = [];
      for (let i = playerState.hand.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playerState.hand[i], playerState.hand[j]] = [playerState.hand[j], playerState.hand[i]];
      }
    }
    return playerState.hand.pop() || null;
  }
  checkWinner() {
    if (this.player.totalCards === 0) {
      this.gameState = "won";
      this.winner = "opponent";
    } else if (this.opponent.totalCards === 0) {
      this.gameState = "won";
      this.winner = "player";
    }
  }
  start() {
    const deck = new Deck();
    this.player = this.createPlayer();
    this.opponent = this.createOpponent();
    this.playerCard = null;
    this.opponentCard = null;
    this.roundResult = null;
    this.cardsInPlay = [];
    this.warCount = 0;
    this.winner = null;
    while (deck.remaining > 0) {
      const card1 = deck.deal();
      this.player.hand.push(card1);
      if (deck.remaining > 0) {
        const card2 = deck.deal();
        this.opponent.hand.push(card2);
      }
    }
    this.updateTotalCards();
    this.gameState = "playing";
  }
  playRound() {
    if (this.gameState === "won") return;
    const pCard = this.playCardFromDeck(this.player);
    const oCard = this.playCardFromDeck(this.opponent);
    this.playerCard = pCard;
    this.opponentCard = oCard;
    if (!pCard || !oCard) {
      this.updateTotalCards();
      this.checkWinner();
      return;
    }
    this.cardsInPlay.push(pCard, oCard);
    const playerValue = RANK_VALUES[pCard.rank];
    const opponentValue = RANK_VALUES[oCard.rank];
    if (playerValue > opponentValue) {
      this.roundResult = "player";
      this.player.wonCards.push(...this.cardsInPlay);
      this.cardsInPlay = [];
      this.warCount = 0;
      this.gameState = "playing";
    } else if (opponentValue > playerValue) {
      this.roundResult = "opponent";
      this.opponent.wonCards.push(...this.cardsInPlay);
      this.cardsInPlay = [];
      this.warCount = 0;
      this.gameState = "playing";
    } else {
      this.roundResult = "war";
      this.gameState = "war";
      this.warCount++;
    }
    this.updateTotalCards();
    this.checkWinner();
  }
  applyMove(move) {
    switch (move.type) {
      case "start":
        this.start();
        break;
      case "play-round":
        this.playRound();
        break;
    }
  }
  getState() {
    return {
      player: {
        ...this.player,
        hand: [...this.player.hand],
        wonCards: [...this.player.wonCards]
      },
      opponent: {
        ...this.opponent,
        hand: [...this.opponent.hand],
        wonCards: [...this.opponent.wonCards]
      },
      gameState: this.gameState,
      playerCard: this.playerCard ? { ...this.playerCard } : null,
      opponentCard: this.opponentCard ? { ...this.opponentCard } : null,
      roundResult: this.roundResult,
      cardsInPlay: [...this.cardsInPlay],
      warCount: this.warCount,
      winner: this.winner
    };
  }
}
function createWarStore() {
  const engine = new WarEngine();
  const state = writable(engine.getState());
  function sync() {
    state.set(engine.getState());
  }
  const start = () => {
    engine.applyMove({ type: "start" });
    sync();
  };
  const playRound = () => {
    engine.applyMove({ type: "play-round" });
    sync();
  };
  const continueWar = () => {
    const currentState = engine.getState();
    if (currentState.gameState === "war") {
      playRound();
    }
  };
  const player = derived(state, ($state) => ({
    name: $state.player.name,
    hand: $state.player.hand,
    wonCards: $state.player.wonCards,
    totalCards: $state.player.totalCards,
    type: "human"
  }));
  const opponent = derived(state, ($state) => ({
    name: $state.opponent.name,
    hand: $state.opponent.hand,
    wonCards: $state.opponent.wonCards,
    totalCards: $state.opponent.totalCards,
    type: "bot"
  }));
  const gameState = derived(state, ($state) => $state.gameState);
  const playerCard = derived(state, ($state) => $state.playerCard);
  const opponentCard = derived(state, ($state) => $state.opponentCard);
  const roundResult = derived(state, ($state) => $state.roundResult);
  const cardsInPlay = derived(state, ($state) => $state.cardsInPlay);
  const warCount = derived(state, ($state) => $state.warCount);
  const winner = derived(state, ($state) => $state.winner);
  const message = derived(state, ($state) => {
    if ($state.gameState === "ready") {
      return 'Click "Start Game" to begin!';
    } else if ($state.gameState === "won") {
      if ($state.winner === "player") {
        return "You win the game!";
      } else if ($state.winner === "opponent") {
        return "Bot wins the game!";
      }
    } else if ($state.gameState === "war") {
      return 'WAR! Click "Play Card" again!';
    } else if ($state.roundResult === "player" && $state.cardsInPlay.length === 0) {
      const wonCount = $state.player.wonCards.length;
      return `You won this round! (${wonCount} cards)`;
    } else if ($state.roundResult === "opponent" && $state.cardsInPlay.length === 0) {
      const wonCount = $state.opponent.wonCards.length;
      return `Bot won this round! (${wonCount} cards)`;
    } else if ($state.gameState === "playing") {
      return 'Click "Play Card" to continue!';
    }
    return "";
  });
  return {
    state,
    player,
    opponent,
    gameState,
    playerCard,
    opponentCard,
    roundResult,
    cardsInPlay,
    warCount,
    message,
    winner,
    start,
    playRound,
    continueWar
  };
}
const css = {
  code: "main.svelte-1ggb84b{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);padding:20px;display:flex;align-items:center;justify-content:center}.container.svelte-1ggb84b{max-width:800px;width:100%}.header.svelte-1ggb84b{text-align:center;margin-bottom:2rem;position:relative}.back-button.svelte-1ggb84b{position:absolute;left:0;top:50%;transform:translateY(-50%);color:goldenrod;text-decoration:none;font-size:1rem;transition:opacity 0.3s}.back-button.svelte-1ggb84b:hover{opacity:0.8}h1.svelte-1ggb84b{font-size:2.5rem;color:goldenrod;margin:0;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5)}h2.svelte-1ggb84b{font-size:1.5rem;color:#e8eaed;margin:0 0 0.5rem 0}.game-board.svelte-1ggb84b{display:flex;flex-direction:column;gap:2rem;margin-bottom:2rem}.player-section.svelte-1ggb84b{text-align:center}.card-count.svelte-1ggb84b{color:goldenrod;font-size:1.2rem;font-weight:bold;margin-bottom:1rem}.card-area.svelte-1ggb84b{display:flex;justify-content:center;align-items:center;min-height:250px}.empty-slot.svelte-1ggb84b{width:200px;height:250px;border:3px dashed rgba(255, 215, 0, 0.3);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:4rem;color:rgba(255, 215, 0, 0.3)}.message-area.svelte-1ggb84b{text-align:center;padding:1.5rem;background:rgba(0, 0, 0, 0.4);border-radius:12px;border:2px solid rgba(255, 215, 0, 0.3)}.message.svelte-1ggb84b{font-size:1.3rem;color:#e8eaed;margin:0;font-weight:bold}.war-indicator.svelte-1ggb84b{font-size:2rem;color:#ff4444;margin:0.5rem 0 0 0;font-weight:bold;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.8);animation:svelte-1ggb84b-pulse 1s infinite}@keyframes svelte-1ggb84b-pulse{0%,100%{opacity:1}50%{opacity:0.5}}.controls.svelte-1ggb84b{display:flex;justify-content:center;gap:1rem}@media(max-width: 768px){h1.svelte-1ggb84b{font-size:2rem}.back-button.svelte-1ggb84b{position:static;display:block;margin-bottom:1rem;transform:none}.card-area.svelte-1ggb84b{min-height:150px}.empty-slot.svelte-1ggb84b{width:120px;height:150px;font-size:3rem}.message.svelte-1ggb84b{font-size:1.1rem}.war-indicator.svelte-1ggb84b{font-size:1.5rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../global.css\\";\\nimport { createWarStore } from \\"$lib/adapters/createWarStore\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Card from \\"$lib/Components/Card.svelte\\";\\nimport Button from \\"$lib/Components/Button.svelte\\";\\nconst game = createWarStore();\\nconst {\\n  player,\\n  opponent,\\n  gameState,\\n  playerCard,\\n  opponentCard,\\n  message,\\n  warCount,\\n  start,\\n  playRound\\n} = game;\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n<main>\\n\\t<div class=\\"container\\">\\n\\t\\t<div class=\\"header\\">\\n\\t\\t\\t<a href=\\"/\\" class=\\"back-button\\">← Back to Games</a>\\n\\t\\t\\t<h1>War</h1>\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"game-board\\">\\n\\t\\t\\t<!-- Opponent Section -->\\n\\t\\t\\t<div class=\\"player-section\\">\\n\\t\\t\\t\\t<h2>Bot</h2>\\n\\t\\t\\t\\t<div class=\\"card-count\\">Cards: {$opponent.totalCards}</div>\\n\\t\\t\\t\\t<div class=\\"card-area\\">\\n\\t\\t\\t\\t\\t{#if $opponentCard}\\n\\t\\t\\t\\t\\t\\t<Card name={$opponentCard.displayName} />\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t<div class=\\"empty-slot\\">?</div>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<!-- Message Area -->\\n\\t\\t\\t<div class=\\"message-area\\">\\n\\t\\t\\t\\t<p class=\\"message\\">{$message}</p>\\n\\t\\t\\t\\t{#if $warCount > 0}\\n\\t\\t\\t\\t\\t<p class=\\"war-indicator\\">WAR x{$warCount}</p>\\n\\t\\t\\t\\t{/if}\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<!-- Player Section -->\\n\\t\\t\\t<div class=\\"player-section\\">\\n\\t\\t\\t\\t<h2>You</h2>\\n\\t\\t\\t\\t<div class=\\"card-count\\">Cards: {$player.totalCards}</div>\\n\\t\\t\\t\\t<div class=\\"card-area\\">\\n\\t\\t\\t\\t\\t{#if $playerCard}\\n\\t\\t\\t\\t\\t\\t<Card name={$playerCard.displayName} />\\n\\t\\t\\t\\t\\t{:else}\\n\\t\\t\\t\\t\\t\\t<div class=\\"empty-slot\\">?</div>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Controls -->\\n\\t\\t<div class=\\"controls\\">\\n\\t\\t\\t{#if $gameState === 'ready' || $gameState === 'won'}\\n\\t\\t\\t\\t<Button variant=\\"deal\\" onclick={() => start()}>\\n\\t\\t\\t\\t\\t{$gameState === 'ready' ? 'Start Game' : 'Play Again'}\\n\\t\\t\\t\\t</Button>\\n\\t\\t\\t{:else if $gameState === 'playing' || $gameState === 'war'}\\n\\t\\t\\t\\t<Button variant=\\"draw\\" onclick={() => playRound()}>Play Card</Button>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\t</div>\\n</main>\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t\\tpadding: 20px;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.container {\\n\\t\\tmax-width: 800px;\\n\\t\\twidth: 100%;\\n\\t}\\n\\n\\t.header {\\n\\t\\ttext-align: center;\\n\\t\\tmargin-bottom: 2rem;\\n\\t\\tposition: relative;\\n\\t}\\n\\n\\t.back-button {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 50%;\\n\\t\\ttransform: translateY(-50%);\\n\\t\\tcolor: goldenrod;\\n\\t\\ttext-decoration: none;\\n\\t\\tfont-size: 1rem;\\n\\t\\ttransition: opacity 0.3s;\\n\\t}\\n\\n\\t.back-button:hover {\\n\\t\\topacity: 0.8;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin: 0;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t}\\n\\n\\th2 {\\n\\t\\tfont-size: 1.5rem;\\n\\t\\tcolor: #e8eaed;\\n\\t\\tmargin: 0 0 0.5rem 0;\\n\\t}\\n\\n\\t.game-board {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tgap: 2rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t.player-section {\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.card-count {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tfont-weight: bold;\\n\\t\\tmargin-bottom: 1rem;\\n\\t}\\n\\n\\t.card-area {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\tmin-height: 250px;\\n\\t}\\n\\n\\t.empty-slot {\\n\\t\\twidth: 200px;\\n\\t\\theight: 250px;\\n\\t\\tborder: 3px dashed rgba(255, 215, 0, 0.3);\\n\\t\\tborder-radius: 12px;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tfont-size: 4rem;\\n\\t\\tcolor: rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.message-area {\\n\\t\\ttext-align: center;\\n\\t\\tpadding: 1.5rem;\\n\\t\\tbackground: rgba(0, 0, 0, 0.4);\\n\\t\\tborder-radius: 12px;\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t}\\n\\n\\t.message {\\n\\t\\tfont-size: 1.3rem;\\n\\t\\tcolor: #e8eaed;\\n\\t\\tmargin: 0;\\n\\t\\tfont-weight: bold;\\n\\t}\\n\\n\\t.war-indicator {\\n\\t\\tfont-size: 2rem;\\n\\t\\tcolor: #ff4444;\\n\\t\\tmargin: 0.5rem 0 0 0;\\n\\t\\tfont-weight: bold;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);\\n\\t\\tanimation: pulse 1s infinite;\\n\\t}\\n\\n\\t@keyframes pulse {\\n\\t\\t0%,\\n\\t\\t100% {\\n\\t\\t\\topacity: 1;\\n\\t\\t}\\n\\t\\t50% {\\n\\t\\t\\topacity: 0.5;\\n\\t\\t}\\n\\t}\\n\\n\\t.controls {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 2rem;\\n\\t\\t}\\n\\n\\t\\t.back-button {\\n\\t\\t\\tposition: static;\\n\\t\\t\\tdisplay: block;\\n\\t\\t\\tmargin-bottom: 1rem;\\n\\t\\t\\ttransform: none;\\n\\t\\t}\\n\\n\\t\\t.card-area {\\n\\t\\t\\tmin-height: 150px;\\n\\t\\t}\\n\\n\\t\\t.empty-slot {\\n\\t\\t\\twidth: 120px;\\n\\t\\t\\theight: 150px;\\n\\t\\t\\tfont-size: 3rem;\\n\\t\\t}\\n\\n\\t\\t.message {\\n\\t\\t\\tfont-size: 1.1rem;\\n\\t\\t}\\n\\n\\t\\t.war-indicator {\\n\\t\\t\\tfont-size: 1.5rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $opponent, $$unsubscribe_opponent;
  let $opponentCard, $$unsubscribe_opponentCard;
  let $message, $$unsubscribe_message;
  let $warCount, $$unsubscribe_warCount;
  let $player, $$unsubscribe_player;
  let $playerCard, $$unsubscribe_playerCard;
  let $gameState, $$unsubscribe_gameState;
  const game = createWarStore();
  const { player, opponent, gameState, playerCard, opponentCard, message, warCount, start, playRound } = game;
  $$unsubscribe_player = subscribe(player, (value) => $player = value);
  $$unsubscribe_opponent = subscribe(opponent, (value) => $opponent = value);
  $$unsubscribe_gameState = subscribe(gameState, (value) => $gameState = value);
  $$unsubscribe_playerCard = subscribe(playerCard, (value) => $playerCard = value);
  $$unsubscribe_opponentCard = subscribe(opponentCard, (value) => $opponentCard = value);
  $$unsubscribe_message = subscribe(message, (value) => $message = value);
  $$unsubscribe_warCount = subscribe(warCount, (value) => $warCount = value);
  $$result.css.add(css);
  $$unsubscribe_opponent();
  $$unsubscribe_opponentCard();
  $$unsubscribe_message();
  $$unsubscribe_warCount();
  $$unsubscribe_player();
  $$unsubscribe_playerCard();
  $$unsubscribe_gameState();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} <main class="svelte-1ggb84b"><div class="container svelte-1ggb84b"><div class="header svelte-1ggb84b" data-svelte-h="svelte-14wvodh"><a href="/" class="back-button svelte-1ggb84b">← Back to Games</a> <h1 class="svelte-1ggb84b">War</h1></div> <div class="game-board svelte-1ggb84b"> <div class="player-section svelte-1ggb84b"><h2 class="svelte-1ggb84b" data-svelte-h="svelte-15kgaxd">Bot</h2> <div class="card-count svelte-1ggb84b">Cards: ${escape($opponent.totalCards)}</div> <div class="card-area svelte-1ggb84b">${$opponentCard ? `${validate_component(Card, "Card").$$render($$result, { name: $opponentCard.displayName }, {}, {})}` : `<div class="empty-slot svelte-1ggb84b" data-svelte-h="svelte-fghfum">?</div>`}</div></div>  <div class="message-area svelte-1ggb84b"><p class="message svelte-1ggb84b">${escape($message)}</p> ${$warCount > 0 ? `<p class="war-indicator svelte-1ggb84b">WAR x${escape($warCount)}</p>` : ``}</div>  <div class="player-section svelte-1ggb84b"><h2 class="svelte-1ggb84b" data-svelte-h="svelte-49er2j">You</h2> <div class="card-count svelte-1ggb84b">Cards: ${escape($player.totalCards)}</div> <div class="card-area svelte-1ggb84b">${$playerCard ? `${validate_component(Card, "Card").$$render($$result, { name: $playerCard.displayName }, {}, {})}` : `<div class="empty-slot svelte-1ggb84b" data-svelte-h="svelte-fghfum">?</div>`}</div></div></div>  <div class="controls svelte-1ggb84b">${$gameState === "ready" || $gameState === "won" ? `${validate_component(Button, "Button").$$render($$result, { variant: "deal", onclick: () => start() }, {}, {
    default: () => {
      return `${escape($gameState === "ready" ? "Start Game" : "Play Again")}`;
    }
  })}` : `${$gameState === "playing" || $gameState === "war" ? `${validate_component(Button, "Button").$$render(
    $$result,
    {
      variant: "draw",
      onclick: () => playRound()
    },
    {},
    {
      default: () => {
        return `Play Card`;
      }
    }
  )}` : ``}`}</div></div> </main>`;
});
export {
  Page as default
};
