import { c as create_ssr_component, b as each, d as add_attribute, e as escape } from "../../chunks/ssr.js";
/* empty css                  */
const css = {
  code: "main.svelte-szx0h6.svelte-szx0h6{min-height:100dvh;width:100dvw;background:radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);display:flex;align-items:center;justify-content:center;padding:20px}.container.svelte-szx0h6.svelte-szx0h6{max-width:1200px;width:100%;text-align:center}h1.svelte-szx0h6.svelte-szx0h6{font-size:3rem;color:goldenrod;margin-bottom:0.5rem;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.5)}.subtitle.svelte-szx0h6.svelte-szx0h6{font-size:1.2rem;color:#e8eaed;margin-bottom:3rem}.games-grid.svelte-szx0h6.svelte-szx0h6{display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.5rem;padding:20px 0}.game-card.svelte-szx0h6.svelte-szx0h6{background:rgba(0, 0, 0, 0.4);border:2px solid rgba(255, 215, 0, 0.3);border-radius:12px;padding:2rem;text-decoration:none;color:#e8eaed;transition:all 0.3s ease;cursor:pointer;position:relative;overflow:hidden}.game-card.svelte-szx0h6.svelte-szx0h6:hover:not(.disabled){border-color:goldenrod;transform:translateY(-5px);box-shadow:0 8px 16px rgba(0, 0, 0, 0.5);background:rgba(0, 0, 0, 0.6)}.game-card.featured.svelte-szx0h6.svelte-szx0h6{background:linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));border-color:rgba(102, 126, 234, 0.6)}.game-card.featured.svelte-szx0h6.svelte-szx0h6:hover{border-color:rgba(102, 126, 234, 1);background:linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5))}.game-card.disabled.svelte-szx0h6.svelte-szx0h6{opacity:0.6;cursor:not-allowed}.game-card.svelte-szx0h6 h2.svelte-szx0h6{font-size:1.5rem;color:goldenrod;margin-bottom:0.75rem}.description.svelte-szx0h6.svelte-szx0h6{font-size:0.95rem;color:#c4c4cc;line-height:1.5}.badge.svelte-szx0h6.svelte-szx0h6{display:inline-block;background:rgba(255, 215, 0, 0.2);color:goldenrod;padding:0.25rem 0.75rem;border-radius:12px;font-size:0.8rem;font-weight:bold;margin-top:1rem;border:1px solid goldenrod}.badge.featured.svelte-szx0h6.svelte-szx0h6{background:rgba(102, 126, 234, 0.4);color:#667eea;border-color:#667eea;animation:svelte-szx0h6-pulse 2s ease-in-out infinite}@keyframes svelte-szx0h6-pulse{0%,100%{opacity:1}50%{opacity:0.7}}@media(max-width: 768px){h1.svelte-szx0h6.svelte-szx0h6{font-size:2rem}.subtitle.svelte-szx0h6.svelte-szx0h6{font-size:1rem;margin-bottom:2rem}.games-grid.svelte-szx0h6.svelte-szx0h6{grid-template-columns:1fr;gap:1rem}.game-card.svelte-szx0h6.svelte-szx0h6{padding:1.5rem}.game-card.svelte-szx0h6 h2.svelte-szx0h6{font-size:1.25rem}}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import \\"./global.css\\";\\nconst games = [\\n  {\\n    name: \\"\\\\u{1F3AD} AR/VR Demo\\",\\n    path: \\"/arvr-demo\\",\\n    description: \\"Experience immersive AR/VR with avatars, filters & spatial interactions\\",\\n    status: \\"ready\\",\\n    featured: true\\n  },\\n  {\\n    name: \\"\\\\u{1F3AE} Multiplayer Platform\\",\\n    path: \\"/multiplayer\\",\\n    description: \\"StackLive Realtime Multiplayer - WebRTC P2P gaming infrastructure\\",\\n    status: \\"ready\\",\\n    featured: true\\n  },\\n  {\\n    name: \\"\\\\u{1F4AC} Messaging Demo\\",\\n    path: \\"/messaging/demo\\",\\n    description: \\"StackLive Messaging with video calls, chat & media sharing\\",\\n    status: \\"ready\\",\\n    featured: true\\n  },\\n  {\\n    name: \\"\\\\u{1F0CF} Multiplayer Blackjack\\",\\n    path: \\"/blackjack-multiplayer\\",\\n    description: \\"Play Blackjack with friends in real-time - Full state sync & turns\\",\\n    status: \\"ready\\",\\n    featured: true\\n  },\\n  {\\n    name: \\"Blackjack\\",\\n    path: \\"/blackjack\\",\\n    description: \\"Classic casino card game - beat the dealer without going over 21\\",\\n    status: \\"ready\\"\\n  },\\n  {\\n    name: \\"Texas Hold'em\\",\\n    path: \\"/texas-holdem\\",\\n    description: \\"Popular poker variant with community cards\\",\\n    status: \\"ready\\"\\n  },\\n  {\\n    name: \\"Five-Card Draw Poker\\",\\n    path: \\"/poker\\",\\n    description: \\"Classic poker - draw cards to make the best hand\\",\\n    status: \\"ready\\"\\n  },\\n  {\\n    name: \\"War\\",\\n    path: \\"/war\\",\\n    description: \\"Simple card battle game - highest card wins\\",\\n    status: \\"ready\\"\\n  },\\n  {\\n    name: \\"Go Fish\\",\\n    path: \\"/go-fish\\",\\n    description: \\"Collect matching sets by asking opponents for cards\\",\\n    status: \\"ready\\"\\n  },\\n  {\\n    name: \\"Old Maid\\",\\n    path: \\"/old-maid\\",\\n    description: \\"Avoid being left with the Old Maid card\\",\\n    status: \\"ready\\"\\n  },\\n  {\\n    name: \\"Crazy Eights\\",\\n    path: \\"/crazy-eights\\",\\n    description: \\"Discard all your cards by matching rank or suit\\",\\n    status: \\"ready\\"\\n  },\\n  {\\n    name: \\"Klondike Solitaire\\",\\n    path: \\"/solitaire/klondike\\",\\n    description: \\"Classic solitaire patience game\\",\\n    status: \\"ready\\"\\n  },\\n  {\\n    name: \\"Spider Solitaire\\",\\n    path: \\"/solitaire/spider\\",\\n    description: \\"Advanced solitaire with eight foundation piles\\",\\n    status: \\"ready\\"\\n  },\\n  {\\n    name: \\"FreeCell Solitaire\\",\\n    path: \\"/solitaire/freecell\\",\\n    description: \\"Strategic solitaire using free cells\\",\\n    status: \\"ready\\"\\n  }\\n];\\n<\/script>\\n\\n<main>\\n\\t<div class=\\"container\\">\\n\\t\\t<h1>🎴 Card Games Collection</h1>\\n\\t\\t<p class=\\"subtitle\\">Choose a game to play</p>\\n\\n\\t\\t<div class=\\"games-grid\\">\\n\\t\\t\\t{#each games as game}\\n\\t\\t\\t\\t<a\\n\\t\\t\\t\\t\\thref={game.status === 'ready' ? game.path : '#'}\\n\\t\\t\\t\\t\\tclass=\\"game-card\\"\\n\\t\\t\\t\\t\\tclass:disabled={game.status !== 'ready'}\\n\\t\\t\\t\\t\\tclass:featured={game.featured}\\n\\t\\t\\t\\t>\\n\\t\\t\\t\\t\\t<h2>{game.name}</h2>\\n\\t\\t\\t\\t\\t<p class=\\"description\\">{game.description}</p>\\n\\t\\t\\t\\t\\t{#if game.status === 'coming-soon'}\\n\\t\\t\\t\\t\\t\\t<span class=\\"badge\\">Coming Soon</span>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t\\t{#if game.featured}\\n\\t\\t\\t\\t\\t\\t<span class=\\"badge featured\\">NEW</span>\\n\\t\\t\\t\\t\\t{/if}\\n\\t\\t\\t\\t</a>\\n\\t\\t\\t{/each}\\n\\t\\t</div>\\n\\t</div>\\n</main>\\n\\n<style>\\n\\tmain {\\n\\t\\tmin-height: 100dvh;\\n\\t\\twidth: 100dvw;\\n\\t\\tbackground: radial-gradient(circle at center, #007f0e, #004d00 50%, #001a00);\\n\\t\\tdisplay: flex;\\n\\t\\talign-items: center;\\n\\t\\tjustify-content: center;\\n\\t\\tpadding: 20px;\\n\\t}\\n\\n\\t.container {\\n\\t\\tmax-width: 1200px;\\n\\t\\twidth: 100%;\\n\\t\\ttext-align: center;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 3rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-bottom: 0.5rem;\\n\\t\\ttext-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);\\n\\t}\\n\\n\\t.subtitle {\\n\\t\\tfont-size: 1.2rem;\\n\\t\\tcolor: #e8eaed;\\n\\t\\tmargin-bottom: 3rem;\\n\\t}\\n\\n\\t.games-grid {\\n\\t\\tdisplay: grid;\\n\\t\\tgrid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\\n\\t\\tgap: 1.5rem;\\n\\t\\tpadding: 20px 0;\\n\\t}\\n\\n\\t.game-card {\\n\\t\\tbackground: rgba(0, 0, 0, 0.4);\\n\\t\\tborder: 2px solid rgba(255, 215, 0, 0.3);\\n\\t\\tborder-radius: 12px;\\n\\t\\tpadding: 2rem;\\n\\t\\ttext-decoration: none;\\n\\t\\tcolor: #e8eaed;\\n\\t\\ttransition: all 0.3s ease;\\n\\t\\tcursor: pointer;\\n\\t\\tposition: relative;\\n\\t\\toverflow: hidden;\\n\\t}\\n\\n\\t.game-card:hover:not(.disabled) {\\n\\t\\tborder-color: goldenrod;\\n\\t\\ttransform: translateY(-5px);\\n\\t\\tbox-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);\\n\\t\\tbackground: rgba(0, 0, 0, 0.6);\\n\\t}\\n\\n\\t.game-card.featured {\\n\\t\\tbackground: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));\\n\\t\\tborder-color: rgba(102, 126, 234, 0.6);\\n\\t}\\n\\n\\t.game-card.featured:hover {\\n\\t\\tborder-color: rgba(102, 126, 234, 1);\\n\\t\\tbackground: linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5));\\n\\t}\\n\\n\\t.game-card.disabled {\\n\\t\\topacity: 0.6;\\n\\t\\tcursor: not-allowed;\\n\\t}\\n\\n\\t.game-card h2 {\\n\\t\\tfont-size: 1.5rem;\\n\\t\\tcolor: goldenrod;\\n\\t\\tmargin-bottom: 0.75rem;\\n\\t}\\n\\n\\t.description {\\n\\t\\tfont-size: 0.95rem;\\n\\t\\tcolor: #c4c4cc;\\n\\t\\tline-height: 1.5;\\n\\t}\\n\\n\\t.badge {\\n\\t\\tdisplay: inline-block;\\n\\t\\tbackground: rgba(255, 215, 0, 0.2);\\n\\t\\tcolor: goldenrod;\\n\\t\\tpadding: 0.25rem 0.75rem;\\n\\t\\tborder-radius: 12px;\\n\\t\\tfont-size: 0.8rem;\\n\\t\\tfont-weight: bold;\\n\\t\\tmargin-top: 1rem;\\n\\t\\tborder: 1px solid goldenrod;\\n\\t}\\n\\n\\t.badge.featured {\\n\\t\\tbackground: rgba(102, 126, 234, 0.4);\\n\\t\\tcolor: #667eea;\\n\\t\\tborder-color: #667eea;\\n\\t\\tanimation: pulse 2s ease-in-out infinite;\\n\\t}\\n\\n\\t@keyframes pulse {\\n\\t\\t0%,\\n\\t\\t100% {\\n\\t\\t\\topacity: 1;\\n\\t\\t}\\n\\t\\t50% {\\n\\t\\t\\topacity: 0.7;\\n\\t\\t}\\n\\t}\\n\\n\\t@media (max-width: 768px) {\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 2rem;\\n\\t\\t}\\n\\n\\t\\t.subtitle {\\n\\t\\t\\tfont-size: 1rem;\\n\\t\\t\\tmargin-bottom: 2rem;\\n\\t\\t}\\n\\n\\t\\t.games-grid {\\n\\t\\t\\tgrid-template-columns: 1fr;\\n\\t\\t\\tgap: 1rem;\\n\\t\\t}\\n\\n\\t\\t.game-card {\\n\\t\\t\\tpadding: 1.5rem;\\n\\t\\t}\\n\\n\\t\\t.game-card h2 {\\n\\t\\t\\tfont-size: 1.25rem;\\n\\t\\t}\\n\\t}\\n</style>\\n"],"names":[],"mappings":"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"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const games = [
    {
      name: "🎭 AR/VR Demo",
      path: "/arvr-demo",
      description: "Experience immersive AR/VR with avatars, filters & spatial interactions",
      status: "ready",
      featured: true
    },
    {
      name: "🎮 Multiplayer Platform",
      path: "/multiplayer",
      description: "StackLive Realtime Multiplayer - WebRTC P2P gaming infrastructure",
      status: "ready",
      featured: true
    },
    {
      name: "💬 Messaging Demo",
      path: "/messaging/demo",
      description: "StackLive Messaging with video calls, chat & media sharing",
      status: "ready",
      featured: true
    },
    {
      name: "🃏 Multiplayer Blackjack",
      path: "/blackjack-multiplayer",
      description: "Play Blackjack with friends in real-time - Full state sync & turns",
      status: "ready",
      featured: true
    },
    {
      name: "Blackjack",
      path: "/blackjack",
      description: "Classic casino card game - beat the dealer without going over 21",
      status: "ready"
    },
    {
      name: "Texas Hold'em",
      path: "/texas-holdem",
      description: "Popular poker variant with community cards",
      status: "ready"
    },
    {
      name: "Five-Card Draw Poker",
      path: "/poker",
      description: "Classic poker - draw cards to make the best hand",
      status: "ready"
    },
    {
      name: "War",
      path: "/war",
      description: "Simple card battle game - highest card wins",
      status: "ready"
    },
    {
      name: "Go Fish",
      path: "/go-fish",
      description: "Collect matching sets by asking opponents for cards",
      status: "ready"
    },
    {
      name: "Old Maid",
      path: "/old-maid",
      description: "Avoid being left with the Old Maid card",
      status: "ready"
    },
    {
      name: "Crazy Eights",
      path: "/crazy-eights",
      description: "Discard all your cards by matching rank or suit",
      status: "ready"
    },
    {
      name: "Klondike Solitaire",
      path: "/solitaire/klondike",
      description: "Classic solitaire patience game",
      status: "ready"
    },
    {
      name: "Spider Solitaire",
      path: "/solitaire/spider",
      description: "Advanced solitaire with eight foundation piles",
      status: "ready"
    },
    {
      name: "FreeCell Solitaire",
      path: "/solitaire/freecell",
      description: "Strategic solitaire using free cells",
      status: "ready"
    }
  ];
  $$result.css.add(css);
  return `<main class="svelte-szx0h6"><div class="container svelte-szx0h6"><h1 class="svelte-szx0h6" data-svelte-h="svelte-gyk84z">🎴 Card Games Collection</h1> <p class="subtitle svelte-szx0h6" data-svelte-h="svelte-1o8w8ky">Choose a game to play</p> <div class="games-grid svelte-szx0h6">${each(games, (game) => {
    return `<a${add_attribute("href", game.status === "ready" ? game.path : "#", 0)} class="${[
      "game-card svelte-szx0h6",
      (game.status !== "ready" ? "disabled" : "") + " " + (game.featured ? "featured" : "")
    ].join(" ").trim()}"><h2 class="svelte-szx0h6">${escape(game.name)}</h2> <p class="description svelte-szx0h6">${escape(game.description)}</p> ${game.status === "coming-soon" ? `<span class="badge svelte-szx0h6" data-svelte-h="svelte-bje97s">Coming Soon</span>` : ``} ${game.featured ? `<span class="badge featured svelte-szx0h6" data-svelte-h="svelte-uqv8wu">NEW</span>` : ``} </a>`;
  })}</div></div> </main>`;
});
export {
  Page as default
};
