import { f as set_current_component, g as current_component, r as run_all, c as create_ssr_component, v as validate_component, e as escape, a as subscribe } from "../../../chunks/ssr.js";
/* empty css                     */
import { w as writable, d as derived } from "../../../chunks/index.js";
import { B as BlackjackEngine, D as Deck, H as Hand } from "../../../chunks/Hand.js";
import { B as Button } from "../../../chunks/Button.js";
import { C as CardsDefinitions } from "../../../chunks/CardsDefinitions.js";
const dirty_components = [];
const binding_callbacks = [];
let render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = /* @__PURE__ */ Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function tick() {
  schedule_update();
  return resolved_promise;
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length) binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
function createBlackjackStore() {
  const engine = new BlackjackEngine();
  const state = writable(engine.getState());
  let drawSound = null;
  const inGame = derived(state, ($state) => $state.turn !== null);
  function sync() {
    state.set(engine.getState());
  }
  const playDrawSound = () => {
    return new Promise((resolve) => {
      if (drawSound) {
        drawSound.onended = () => resolve();
        drawSound.play().catch(() => resolve());
        return;
      }
      resolve();
    });
  };
  const start = async (restart = false) => {
    engine.applyMove({ type: "start" });
    if (restart) {
      await tick();
    }
    await playDrawSound();
    sync();
  };
  const playerTurn = async (option) => {
    if (option === "draw") {
      await playDrawSound();
      engine.applyMove({ type: "hit" });
      sync();
    } else {
      engine.applyMove({ type: "stand" });
      const currentState = engine.getState();
      if (currentState.turn === "Dealer") {
        await new Promise((resolve) => setTimeout(resolve, 800));
        while (engine.shouldDealerDraw()) {
          await playDrawSound();
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
      sync();
    }
  };
  const setAudio = (audio) => {
    drawSound = audio;
  };
  const player = derived(state, ($state) => ({
    name: $state.player.name,
    hand: $state.player.hand,
    score: $state.player.score,
    type: "human"
  }));
  const dealer = derived(state, ($state) => ({
    name: $state.dealer.name,
    hand: $state.dealer.hand,
    score: $state.dealer.score,
    type: "human"
  }));
  const winner = derived(state, ($state) => $state.winner);
  const turn = derived(state, ($state) => $state.turn);
  return {
    state,
    player,
    dealer,
    winner,
    turn,
    inGame,
    start,
    playerTurn,
    setAudio
  };
}
const css$1 = {
  code: "div.svelte-ofic47{display:flex;justify-content:center;align-items:center;gap:20px;height:36px}span.svelte-ofic47{color:goldenrod;padding-right:6px;margin-right:3px;border-right:2px solid rgba(255, 255, 255, 0.759)}",
  map: `{"version":3,"file":"GameControlls.svelte","sources":["GameControlls.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Button from \\"./Button.svelte\\";\\nexport let winner;\\nexport let inGame;\\nexport let turn;\\nexport let draw;\\nexport let stop;\\nexport let start;\\nexport let restart;\\n$: winnerText = winner === \\"Draw\\" ? \\"Draw\\" : \`\${winner} won!\`;\\n<\/script>\\n\\n<div>\\n\\t{#if winner}\\n\\t\\t<Button variant=\\"deal\\" onclick={restart}>\\n\\t\\t\\t<span>{winnerText}</span> Start again\\n\\t\\t</Button>\\n\\t{:else if inGame}\\n\\t\\t<Button variant=\\"draw\\" disabled={turn === 'Dealer'} onclick={draw}>Draw</Button>\\n\\t\\t<Button variant=\\"stop\\" disabled={turn === 'Dealer'} onclick={stop}>Stop</Button>\\n\\t{:else}\\n\\t\\t<Button variant=\\"deal\\" onclick={start}>Start game</Button>\\n\\t{/if}\\n</div>\\n\\n<style>\\n\\tdiv {\\n\\t\\tdisplay: flex;\\n\\t\\tjustify-content: center;\\n\\t\\talign-items: center;\\n\\t\\tgap: 20px;\\n\\t\\theight: 36px;\\n\\t}\\n\\n\\tspan {\\n\\t\\tcolor: goldenrod;\\n\\t\\tpadding-right: 6px;\\n\\t\\tmargin-right: 3px;\\n\\t\\tborder-right: 2px solid rgba(255, 255, 255, 0.759);\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAyBC,iBAAI,CACH,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,GAAG,CAAE,IAAI,CACT,MAAM,CAAE,IACT,CAEA,kBAAK,CACJ,KAAK,CAAE,SAAS,CAChB,aAAa,CAAE,GAAG,CAClB,YAAY,CAAE,GAAG,CACjB,YAAY,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,KAAK,CAClD"}`
};
const GameControlls = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let winnerText;
  let { winner } = $$props;
  let { inGame } = $$props;
  let { turn } = $$props;
  let { draw } = $$props;
  let { stop } = $$props;
  let { start } = $$props;
  let { restart } = $$props;
  if ($$props.winner === void 0 && $$bindings.winner && winner !== void 0) $$bindings.winner(winner);
  if ($$props.inGame === void 0 && $$bindings.inGame && inGame !== void 0) $$bindings.inGame(inGame);
  if ($$props.turn === void 0 && $$bindings.turn && turn !== void 0) $$bindings.turn(turn);
  if ($$props.draw === void 0 && $$bindings.draw && draw !== void 0) $$bindings.draw(draw);
  if ($$props.stop === void 0 && $$bindings.stop && stop !== void 0) $$bindings.stop(stop);
  if ($$props.start === void 0 && $$bindings.start && start !== void 0) $$bindings.start(start);
  if ($$props.restart === void 0 && $$bindings.restart && restart !== void 0) $$bindings.restart(restart);
  $$result.css.add(css$1);
  winnerText = winner === "Draw" ? "Draw" : `${winner} won!`;
  return `<div class="svelte-ofic47">${winner ? `${validate_component(Button, "Button").$$render($$result, { variant: "deal", onclick: restart }, {}, {
    default: () => {
      return `<span class="svelte-ofic47">${escape(winnerText)}</span> Start again`;
    }
  })}` : `${inGame ? `${validate_component(Button, "Button").$$render(
    $$result,
    {
      variant: "draw",
      disabled: turn === "Dealer",
      onclick: draw
    },
    {},
    {
      default: () => {
        return `Draw`;
      }
    }
  )} ${validate_component(Button, "Button").$$render(
    $$result,
    {
      variant: "stop",
      disabled: turn === "Dealer",
      onclick: stop
    },
    {},
    {
      default: () => {
        return `Stop`;
      }
    }
  )}` : `${validate_component(Button, "Button").$$render($$result, { variant: "deal", onclick: start }, {}, {
    default: () => {
      return `Start game`;
    }
  })}`}`} </div>`;
});
const css = {
  code: "section.svelte-fw32ib{display:flex;height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00)}div.svelte-fw32ib{flex-grow:1;display:flex;flex-direction:column;justify-content:space-between;padding:48px;gap:20px}@media(max-width: 768px){div.svelte-fw32ib{padding:16px 8px;gap:12px}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"../global.css\\";\\nimport audioPath from \\"$lib/assets/draw.mp3\\";\\nimport { createBlackjackStore } from \\"$lib/adapters/createBlackjackStore\\";\\nimport GameControlls from \\"$lib/Components/GameControlls.svelte\\";\\nimport CardsDefinitions from \\"$lib/Components/CardsDefinitions.svelte\\";\\nimport Deck from \\"$lib/Components/Deck.svelte\\";\\nimport Hand from \\"$lib/Components/Hand.svelte\\";\\nimport { onMount } from \\"svelte\\";\\nconst game = createBlackjackStore();\\nconst { player, dealer, winner, turn, inGame } = game;\\nonMount(() => {\\n  game.setAudio(new Audio(audioPath));\\n});\\n<\/script>\\n\\n<CardsDefinitions />\\n\\n<section>\\n\\t<Deck />\\n\\t<div>\\n\\t\\t<Hand hand={$dealer.hand} score={$dealer.score} />\\n\\n\\t\\t<GameControlls\\n\\t\\t\\twinner={$winner}\\n\\t\\t\\tinGame={$inGame}\\n\\t\\t\\tturn={$turn}\\n\\t\\t\\tdraw={() => game.playerTurn('draw')}\\n\\t\\t\\tstop={() => game.playerTurn('stop')}\\n\\t\\t\\tstart={() => game.start()}\\n\\t\\t\\trestart={() => game.start(true)}\\n\\t\\t/>\\n\\n\\t\\t<Hand hand={$player.hand} score={$player.score} />\\n\\t</div>\\n</section>\\n\\n<style>\\n\\tsection {\\n\\t\\tdisplay: flex;\\n\\t\\theight: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t}\\n\\n\\tdiv {\\n\\t\\tflex-grow: 1;\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\tjustify-content: space-between;\\n\\t\\tpadding: 48px;\\n\\t\\tgap: 20px;\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\tdiv {\\n\\t\\t\\tpadding: 16px 8px;\\n\\t\\t\\tgap: 12px;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"AAqCC,qBAAQ,CACP,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,MAAM,CACd,KAAK,CAAE,MAAM,CACb,UAAU,CAAE,gBAAgB,MAAM,CAAC,EAAE,CAAC,MAAM,CAAC,CAAC,OAAO,CAAC,CAAC,OAAO,CAAC,GAAG,CAAC,CAAC,OAAO,CAC5E,CAEA,iBAAI,CACH,SAAS,CAAE,CAAC,CACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,aAAa,CAC9B,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IACN,CAEA,MAAO,YAAY,KAAK,CAAE,CACzB,iBAAI,CACH,OAAO,CAAE,IAAI,CAAC,GAAG,CACjB,GAAG,CAAE,IACN,CACD"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $dealer, $$unsubscribe_dealer;
  let $winner, $$unsubscribe_winner;
  let $inGame, $$unsubscribe_inGame;
  let $turn, $$unsubscribe_turn;
  let $player, $$unsubscribe_player;
  const game = createBlackjackStore();
  const { player, dealer, winner, turn, inGame } = game;
  $$unsubscribe_player = subscribe(player, (value) => $player = value);
  $$unsubscribe_dealer = subscribe(dealer, (value) => $dealer = value);
  $$unsubscribe_winner = subscribe(winner, (value) => $winner = value);
  $$unsubscribe_turn = subscribe(turn, (value) => $turn = value);
  $$unsubscribe_inGame = subscribe(inGame, (value) => $inGame = value);
  $$result.css.add(css);
  $$unsubscribe_dealer();
  $$unsubscribe_winner();
  $$unsubscribe_inGame();
  $$unsubscribe_turn();
  $$unsubscribe_player();
  return `${validate_component(CardsDefinitions, "CardsDefinitions").$$render($$result, {}, {}, {})} <section class="svelte-fw32ib">${validate_component(Deck, "Deck").$$render($$result, {}, {}, {})} <div class="svelte-fw32ib">${validate_component(Hand, "Hand").$$render($$result, { hand: $dealer.hand, score: $dealer.score }, {}, {})} ${validate_component(GameControlls, "GameControlls").$$render(
    $$result,
    {
      winner: $winner,
      inGame: $inGame,
      turn: $turn,
      draw: () => game.playerTurn("draw"),
      stop: () => game.playerTurn("stop"),
      start: () => game.start(),
      restart: () => game.start(true)
    },
    {},
    {}
  )} ${validate_component(Hand, "Hand").$$render($$result, { hand: $player.hand, score: $player.score }, {}, {})}</div> </section>`;
});
export {
  Page as default
};
