import { c as create_ssr_component, a as subscribe, v as validate_component, e as escape, b as each } from "../../../chunks/ssr.js";
/* empty css                     */
import { w as writable, d as derived } from "../../../chunks/index.js";
import { D as Deck, C as CardsDefinitions } from "../../../chunks/CardsDefinitions.js";
import { C as Card } from "../../../chunks/Card.js";
import { B as Button } from "../../../chunks/Button.js";
function removePairs(hand) {
  const rankCounts = /* @__PURE__ */ new Map();
  for (const card of hand) {
    if (!rankCounts.has(card.rank)) {
      rankCounts.set(card.rank, []);
    }
    rankCounts.get(card.rank).push(card);
  }
  const newHand = [];
  const pairs = [];
  for (const [rank, cards] of rankCounts.entries()) {
    const pairCount = Math.floor(cards.length / 2);
    for (let i = 0; i < pairCount; i++) {
      pairs.push(rank);
    }
    if (cards.length % 2 === 1) {
      newHand.push(cards[cards.length - 1]);
    }
  }
  return { newHand, pairs };
}
class OldMaidEngine {
  player;
  bot;
  gameState;
  winner;
  constructor() {
    this.player = this.createPlayer();
    this.bot = this.createBot();
    this.gameState = "ready";
    this.winner = null;
  }
  createPlayer() {
    return {
      name: "Player",
      hand: [],
      pairs: [],
      pairCount: 0,
      cardCount: 0
    };
  }
  createBot() {
    return {
      name: "Bot",
      hand: [],
      pairs: [],
      pairCount: 0,
      cardCount: 0
    };
  }
  updatePlayerPairs() {
    const result = removePairs(this.player.hand);
    this.player.hand = result.newHand;
    this.player.pairs.push(...result.pairs);
    this.player.pairCount = this.player.pairs.length;
    this.player.cardCount = this.player.hand.length;
  }
  updateBotPairs() {
    const result = removePairs(this.bot.hand);
    this.bot.hand = result.newHand;
    this.bot.pairs.push(...result.pairs);
    this.bot.pairCount = this.bot.pairs.length;
    this.bot.cardCount = this.bot.hand.length;
  }
  checkWinner() {
    if (this.player.hand.length === 0 && this.bot.hand.length > 0) {
      this.winner = "player";
      this.gameState = "won";
    } else if (this.bot.hand.length === 0 && this.player.hand.length > 0) {
      this.winner = "bot";
      this.gameState = "won";
    } else if (this.player.hand.length === 0 && this.bot.hand.length === 0) {
      this.gameState = "won";
    }
  }
  start() {
    const deck = new Deck();
    this.player = this.createPlayer();
    this.bot = this.createBot();
    this.winner = null;
    const queens = deck.cards.filter((c) => c.rank === "queen");
    if (queens.length >= 3) {
      for (let i = 0; i < 3; i++) {
        const index = deck.cards.indexOf(queens[i]);
        deck.cards.splice(index, 1);
      }
    }
    deck.shuffle();
    let isPlayer = true;
    while (deck.remaining > 0) {
      const card = deck.deal();
      if (isPlayer) {
        this.player.hand.push(card);
      } else {
        this.bot.hand.push(card);
      }
      isPlayer = !isPlayer;
    }
    this.updatePlayerPairs();
    this.updateBotPairs();
    this.gameState = "player-turn";
  }
  playerDrawCard(index) {
    if (this.gameState !== "player-turn") {
      return { drewCard: false };
    }
    if (this.bot.hand.length === 0 || index < 0 || index >= this.bot.hand.length) {
      return { drewCard: false };
    }
    const card = this.bot.hand.splice(index, 1)[0];
    this.player.hand.push(card);
    this.bot.cardCount = this.bot.hand.length;
    this.updatePlayerPairs();
    if (this.player.hand.length === 0 || this.bot.hand.length === 0) {
      this.checkWinner();
      return { drewCard: true };
    }
    this.gameState = "bot-turn";
    return { drewCard: true };
  }
  botDrawCard() {
    if (this.gameState !== "bot-turn") {
      return { drewCard: false, cardIndex: -1 };
    }
    if (this.player.hand.length === 0) {
      this.checkWinner();
      return { drewCard: false, cardIndex: -1 };
    }
    const cardIndex = Math.floor(Math.random() * this.player.hand.length);
    const card = this.player.hand.splice(cardIndex, 1)[0];
    this.bot.hand.push(card);
    this.player.cardCount = this.player.hand.length;
    this.updateBotPairs();
    if (this.player.hand.length === 0 || this.bot.hand.length === 0) {
      this.checkWinner();
      return { drewCard: true, cardIndex };
    }
    this.gameState = "player-turn";
    return { drewCard: true, cardIndex };
  }
  applyMove(move) {
    switch (move.type) {
      case "start":
        this.start();
        break;
      case "draw":
        this.playerDrawCard(move.playerIndex);
        break;
      case "bot-draw":
        this.botDrawCard();
        break;
    }
  }
  getState() {
    return {
      player: {
        ...this.player,
        hand: [...this.player.hand],
        pairs: [...this.player.pairs]
      },
      bot: {
        ...this.bot,
        hand: [...this.bot.hand],
        pairs: [...this.bot.pairs]
      },
      gameState: this.gameState,
      winner: this.winner
    };
  }
  // Helper for UI to know if bot should draw
  shouldBotDraw() {
    return this.gameState === "bot-turn";
  }
}
function createOldMaidStore() {
  const engine = new OldMaidEngine();
  const state = writable(engine.getState());
  const selectedCardIndex = writable(null);
  const lastAction = writable("");
  function sync() {
    state.set(engine.getState());
  }
  const start = () => {
    engine.applyMove({ type: "start" });
    sync();
    selectedCardIndex.set(null);
    lastAction.set("Game started! Initial pairs removed.");
  };
  const playerDrawCard = (index) => {
    const currentState = engine.getState();
    if (currentState.gameState !== "player-turn") return;
    const result = engine.playerDrawCard(index);
    if (result.drewCard) {
      lastAction.set("You drew a card from the bot.");
      sync();
      const newState = engine.getState();
      if (newState.gameState === "bot-turn") {
        setTimeout(() => {
          botTurn();
        }, 1500);
      }
    }
  };
  const botTurn = () => {
    const result = engine.botDrawCard();
    if (result.drewCard) {
      lastAction.set("Bot drew a card from you.");
      sync();
    }
  };
  const player = derived(state, ($state) => ({
    name: $state.player.name,
    hand: $state.player.hand,
    pairs: $state.player.pairs,
    pairCount: $state.player.pairCount,
    type: "human"
  }));
  const bot = derived(state, ($state) => ({
    name: $state.bot.name,
    hand: $state.bot.hand,
    pairs: $state.bot.pairs,
    pairCount: $state.bot.pairCount,
    type: "bot"
  }));
  const gameState = derived(state, ($state) => $state.gameState);
  const winner = derived(state, ($state) => $state.winner);
  const message = derived(state, ($state) => {
    switch ($state.gameState) {
      case "ready":
        return 'Click "Start Game" to begin';
      case "player-turn":
        return "Your turn! Pick a card from the bot.";
      case "bot-turn":
        return "Bot is choosing...";
      case "won":
        if ($state.winner === "player") {
          return "You win! Bot has the Old Maid!";
        } else if ($state.winner === "bot") {
          return "Bot wins! You have the Old Maid!";
        } else {
          return "It's a tie!";
        }
      default:
        return "";
    }
  });
  return {
    state,
    player,
    bot,
    gameState,
    message,
    selectedCardIndex,
    winner,
    lastAction,
    start,
    playerDrawCard
  };
}
const css = {
  code: "main.svelte-1jplt90.svelte-1jplt90{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);padding:20px;display:flex;align-items:center;justify-content:center}.container.svelte-1jplt90.svelte-1jplt90{max-width:1200px;width:100%}.header.svelte-1jplt90.svelte-1jplt90{text-align:center;margin-bottom:1.5rem;position:relative}.back-button.svelte-1jplt90.svelte-1jplt90{position:absolute;left:0;top:50%;transform:translateY(-50%);color:goldenrod;text-decoration:none;font-size:1rem;transition:opacity 0.3s}.back-button.svelte-1jplt90.svelte-1jplt90:hover{opacity:0.8}h1.svelte-1jplt90.svelte-1jplt90{font-size:2.5rem;color:goldenrod;margin:0;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5)}h3.svelte-1jplt90.svelte-1jplt90{color:#e8eaed;margin:0 0 1rem 0;font-size:1.2rem}.scores.svelte-1jplt90.svelte-1jplt90{display:flex;justify-content:center;gap:2rem;margin-bottom:1.5rem;flex-wrap:wrap}.score-item.svelte-1jplt90.svelte-1jplt90{background:rgba(0, 0, 0, 0.4);padding:0.75rem 1.5rem;border-radius:8px;border:2px solid rgba(255, 215, 0, 0.3);color:#e8eaed}.score-item.svelte-1jplt90 strong.svelte-1jplt90{color:goldenrod;margin-left:0.5rem;font-size:1.2rem}.message-box.svelte-1jplt90.svelte-1jplt90{background:rgba(0, 0, 0, 0.4);border:2px solid rgba(255, 215, 0, 0.3);border-radius:12px;padding:1rem;margin-bottom:1.5rem;text-align:center}.message.svelte-1jplt90.svelte-1jplt90{color:goldenrod;font-size:1.2rem;font-weight:bold;margin:0}.last-action.svelte-1jplt90.svelte-1jplt90{color:#c4c4cc;font-size:0.95rem;margin:0.5rem 0 0 0}.game-area.svelte-1jplt90.svelte-1jplt90{display:flex;flex-direction:column;gap:2rem;margin-bottom:2rem}.opponent-hand.svelte-1jplt90.svelte-1jplt90,.player-hand.svelte-1jplt90.svelte-1jplt90{background:rgba(0, 0, 0, 0.3);border:2px solid rgba(255, 215, 0, 0.2);border-radius:12px;padding:1.5rem}.cards-row.svelte-1jplt90.svelte-1jplt90{display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:center}.card-back-button.svelte-1jplt90.svelte-1jplt90{background:none;border:none;padding:0;cursor:pointer}.card-back.svelte-1jplt90.svelte-1jplt90{width:80px;height:112px;background:rgba(139, 0, 0, 0.6);border:2px solid rgba(255, 215, 0, 0.4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2rem;color:rgba(255, 215, 0, 0.6);transition:transform 0.2s,\n			border-color 0.2s}.card-back-button.selectable.svelte-1jplt90:hover .card-back.svelte-1jplt90{transform:translateY(-10px);border-color:goldenrod}.card-back-button.svelte-1jplt90.svelte-1jplt90:disabled{cursor:not-allowed}.player-card.svelte-1jplt90.svelte-1jplt90{opacity:0.9}.controls.svelte-1jplt90.svelte-1jplt90{display:flex;justify-content:center;gap:1rem}@media(max-width: 768px){h1.svelte-1jplt90.svelte-1jplt90{font-size:2rem}.back-button.svelte-1jplt90.svelte-1jplt90{position:static;display:block;margin-bottom:1rem;transform:none}.scores.svelte-1jplt90.svelte-1jplt90{gap:1rem}.score-item.svelte-1jplt90.svelte-1jplt90{padding:0.5rem 1rem;font-size:0.9rem}.message.svelte-1jplt90.svelte-1jplt90{font-size:1rem}.card-back.svelte-1jplt90.svelte-1jplt90{width:60px;height:84px;font-size:1.5rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../global.css\\";\\nimport { createOldMaidStore } from \\"$lib/adapters/createOldMaidStore\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Card from \\"$lib/Components/Card.svelte\\";\\nimport Button from \\"$lib/Components/Button.svelte\\";\\nconst game = createOldMaidStore();\\nconst { player, bot, gameState, message, lastAction, start, playerDrawCard } = game;\\nfunction handleCardClick(index) {\\n  if ($gameState === \\"player-turn\\") {\\n    playerDrawCard(index);\\n  }\\n}\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n<main>\\n\\t<div class=\\"container\\">\\n\\t\\t<div class=\\"header\\">\\n\\t\\t\\t<a href=\\"/\\" class=\\"back-button\\">← Back to Games</a>\\n\\t\\t\\t<h1>Old Maid</h1>\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"scores\\">\\n\\t\\t\\t<div class=\\"score-item\\">\\n\\t\\t\\t\\t<span>Your Pairs:</span>\\n\\t\\t\\t\\t<strong>{$player.pairCount}</strong>\\n\\t\\t\\t</div>\\n\\t\\t\\t<div class=\\"score-item\\">\\n\\t\\t\\t\\t<span>Bot Pairs:</span>\\n\\t\\t\\t\\t<strong>{$bot.pairCount}</strong>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"message-box\\">\\n\\t\\t\\t<p class=\\"message\\">{$message}</p>\\n\\t\\t\\t{#if $lastAction}\\n\\t\\t\\t\\t<p class=\\"last-action\\">{$lastAction}</p>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\n\\t\\t<div class=\\"game-area\\">\\n\\t\\t\\t<!-- Computer Hand -->\\n\\t\\t\\t<div class=\\"opponent-hand\\">\\n\\t\\t\\t\\t<h3>Bot ({$bot.hand.length} cards)</h3>\\n\\t\\t\\t\\t<div class=\\"cards-row\\">\\n\\t\\t\\t\\t\\t<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->\\n\\t\\t\\t\\t\\t{#each $bot.hand as _, i}\\n\\t\\t\\t\\t\\t\\t<button\\n\\t\\t\\t\\t\\t\\t\\tclass=\\"card-back-button\\"\\n\\t\\t\\t\\t\\t\\t\\tclass:selectable={$gameState === 'player-turn'}\\n\\t\\t\\t\\t\\t\\t\\ton:click={() => handleCardClick(i)}\\n\\t\\t\\t\\t\\t\\t\\tdisabled={$gameState !== 'player-turn'}\\n\\t\\t\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t\\t\\t<div class=\\"card-back\\">?</div>\\n\\t\\t\\t\\t\\t\\t</button>\\n\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\n\\t\\t\\t<!-- Player Hand -->\\n\\t\\t\\t<div class=\\"player-hand\\">\\n\\t\\t\\t\\t<h3>Your Hand ({$player.hand.length} cards)</h3>\\n\\t\\t\\t\\t<div class=\\"cards-row\\">\\n\\t\\t\\t\\t\\t{#each $player.hand as card}\\n\\t\\t\\t\\t\\t\\t<div class=\\"player-card\\">\\n\\t\\t\\t\\t\\t\\t\\t<Card name={card.displayName} />\\n\\t\\t\\t\\t\\t\\t</div>\\n\\t\\t\\t\\t\\t{/each}\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\n\\t\\t<!-- Controls -->\\n\\t\\t<div class=\\"controls\\">\\n\\t\\t\\t{#if $gameState === 'ready' || $gameState === 'won'}\\n\\t\\t\\t\\t<Button variant=\\"deal\\" onclick={() => start()}>\\n\\t\\t\\t\\t\\t{$gameState === 'ready' ? 'Start Game' : 'Play Again'}\\n\\t\\t\\t\\t</Button>\\n\\t\\t\\t{/if}\\n\\t\\t</div>\\n\\t</div>\\n</main>\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t\\tpadding: 20px;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.container {\\n\\t\\tmax-width: 1200px;\\n\\t\\twidth: 100%;\\n\\t}\\n\\n\\t.header {\\n\\t\\ttext-align: center;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\tposition: relative;\\n\\t}\\n\\n\\t.back-button {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 50%;\\n\\t\\ttransform: translateY(-50%);\\n\\t\\tcolor: goldenrod;\\n\\t\\ttext-decoration: none;\\n\\t\\tfont-size: 1rem;\\n\\t\\ttransition: opacity 0.3s;\\n\\t}\\n\\n\\t.back-button:hover {\\n\\t\\topacity: 0.8;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2.5rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin: 0;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t}\\n\\n\\th3 {\\n\\t\\tcolor: #e8eaed;\\n\\t\\tmargin: 0 0 1rem 0;\\n\\t\\tfont-size: 1.2rem;\\n\\t}\\n\\n\\t.scores {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\tgap: 2rem;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\tflex-wrap: wrap;\\n\\t}\\n\\n\\t.score-item {\\n\\t\\tbackground: rgba(0, 0, 0, 0.4);\\n\\t\\tpadding: 0.75rem 1.5rem;\\n\\t\\tborder-radius: 8px;\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t\\tcolor: #e8eaed;\\n\\t}\\n\\n\\t.score-item strong {\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-left: 0.5rem;\\n\\t\\tfont-size: 1.2rem;\\n\\t}\\n\\n\\t.message-box {\\n\\t\\tbackground: rgba(0, 0, 0, 0.4);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 1rem;\\n\\t\\tmargin-bottom: 1.5rem;\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\t.message {\\n\\t\\tcolor: goldenrod;\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tfont-weight: bold;\\n\\t\\tmargin: 0;\\n\\t}\\n\\n\\t.last-action {\\n\\t\\tcolor: #c4c4cc;\\n\\t\\tfont-size: 0.95rem;\\n\\t\\tmargin: 0.5rem 0 0 0;\\n\\t}\\n\\n\\t.game-area {\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tgap: 2rem;\\n\\t\\tmargin-bottom: 2rem;\\n\\t}\\n\\n\\t.opponent-hand,\\n\\t.player-hand {\\n\\t\\tbackground: rgba(0, 0, 0, 0.3);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.2);\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 1.5rem;\\n\\t}\\n\\n\\t.cards-row {\\n\\t\\tdisplay: flex;\\n\\t\\tgap: 0.5rem;\\n\\t\\tflex-wrap: wrap;\\n\\t\\tjustify-content: center;\\n\\t}\\n\\n\\t.card-back-button {\\n\\t\\tbackground: none;\\n\\t\\tborder: none;\\n\\t\\tpadding: 0;\\n\\t\\tcursor: pointer;\\n\\t}\\n\\n\\t.card-back {\\n\\t\\twidth: 80px;\\n\\t\\theight: 112px;\\n\\t\\tbackground: rgba(139, 0, 0, 0.6);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.4);\\n\\t\\tborder-radius: 8px;\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tfont-size: 2rem;\\n\\t\\tcolor: rgba(255, 215, 0, 0.6);\\n\\t\\ttransition:\\n\\t\\t\\ttransform 0.2s,\\n\\t\\t\\tborder-color 0.2s;\\n\\t}\\n\\n\\t.card-back-button.selectable:hover .card-back {\\n\\t\\ttransform: translateY(-10px);\\n\\t\\tborder-color: goldenrod;\\n\\t}\\n\\n\\t.card-back-button:disabled {\\n\\t\\tcursor: not-allowed;\\n\\t}\\n\\n\\t.player-card {\\n\\t\\topacity: 0.9;\\n\\t}\\n\\n\\t.controls {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\tgap: 1rem;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 2rem;\\n\\t\\t}\\n\\n\\t\\t.back-button {\\n\\t\\t\\tposition: static;\\n\\t\\t\\tdisplay: block;\\n\\t\\t\\tmargin-bottom: 1rem;\\n\\t\\t\\ttransform: none;\\n\\t\\t}\\n\\n\\t\\t.scores {\\n\\t\\t\\tgap: 1rem;\\n\\t\\t}\\n\\n\\t\\t.score-item {\\n\\t\\t\\tpadding: 0.5rem 1rem;\\n\\t\\t\\tfont-size: 0.9rem;\\n\\t\\t}\\n\\n\\t\\t.message {\\n\\t\\t\\tfont-size: 1rem;\\n\\t\\t}\\n\\n\\t\\t.card-back {\\n\\t\\t\\twidth: 60px;\\n\\t\\t\\theight: 84px;\\n\\t\\t\\tfont-size: 1.5rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $gameState, $$unsubscribe_gameState;
  let $player, $$unsubscribe_player;
  let $bot, $$unsubscribe_bot;
  let $message, $$unsubscribe_message;
  let $lastAction, $$unsubscribe_lastAction;
  const game = createOldMaidStore();
  const { player, bot, gameState, message, lastAction, start } = game;
  $$unsubscribe_player = subscribe(player, (value) => $player = value);
  $$unsubscribe_bot = subscribe(bot, (value) => $bot = value);
  $$unsubscribe_gameState = subscribe(gameState, (value) => $gameState = value);
  $$unsubscribe_message = subscribe(message, (value) => $message = value);
  $$unsubscribe_lastAction = subscribe(lastAction, (value) => $lastAction = value);
  $$result.css.add(css);
  $$unsubscribe_gameState();
  $$unsubscribe_player();
  $$unsubscribe_bot();
  $$unsubscribe_message();
  $$unsubscribe_lastAction();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} <main class="svelte-1jplt90"><div class="container svelte-1jplt90"><div class="header svelte-1jplt90" data-svelte-h="svelte-138wwbh"><a href="/" class="back-button svelte-1jplt90">← Back to Games</a> <h1 class="svelte-1jplt90">Old Maid</h1></div> <div class="scores svelte-1jplt90"><div class="score-item svelte-1jplt90"><span data-svelte-h="svelte-1fqw3fq">Your Pairs:</span> <strong class="svelte-1jplt90">${escape($player.pairCount)}</strong></div> <div class="score-item svelte-1jplt90"><span data-svelte-h="svelte-qfmxj4">Bot Pairs:</span> <strong class="svelte-1jplt90">${escape($bot.pairCount)}</strong></div></div> <div class="message-box svelte-1jplt90"><p class="message svelte-1jplt90">${escape($message)}</p> ${$lastAction ? `<p class="last-action svelte-1jplt90">${escape($lastAction)}</p>` : ``}</div> <div class="game-area svelte-1jplt90"> <div class="opponent-hand svelte-1jplt90"><h3 class="svelte-1jplt90">Bot (${escape($bot.hand.length)} cards)</h3> <div class="cards-row svelte-1jplt90"> ${each($bot.hand, (_, i) => {
    return `<button class="${[
      "card-back-button svelte-1jplt90",
      $gameState === "player-turn" ? "selectable" : ""
    ].join(" ").trim()}" ${$gameState !== "player-turn" ? "disabled" : ""}><div class="card-back svelte-1jplt90" data-svelte-h="svelte-gjq2s4">?</div> </button>`;
  })}</div></div>  <div class="player-hand svelte-1jplt90"><h3 class="svelte-1jplt90">Your Hand (${escape($player.hand.length)} cards)</h3> <div class="cards-row svelte-1jplt90">${each($player.hand, (card) => {
    return `<div class="player-card svelte-1jplt90">${validate_component(Card, "Card").$$render($$result, { name: card.displayName }, {}, {})} </div>`;
  })}</div></div></div>  <div class="controls svelte-1jplt90">${$gameState === "ready" || $gameState === "won" ? `${validate_component(Button, "Button").$$render($$result, { variant: "deal", onclick: () => start() }, {}, {
    default: () => {
      return `${escape($gameState === "ready" ? "Start Game" : "Play Again")}`;
    }
  })}` : ``}</div></div> </main>`;
});
export {
  Page as default
};
