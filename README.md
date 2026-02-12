# Card Games Collection - Svelte 4

A collection of classic card games built with Svelte 4, optimized for mobile-first design. Play against bots in various popular card games!

![Card Games Collection](https://github.com/user-attachments/assets/97e37f51-598a-45ed-898c-882e13901032)

## 🎮 Available Games

### ✅ Playable Now

1. **Blackjack** - Classic casino card game. Beat the dealer without going over 21!
2. **War** - Simple card battle game. Highest card wins each round.
   ![War Game](https://github.com/user-attachments/assets/74ffbbb3-d9c9-4e46-a6e5-d4799b5bcb3c)
3. **Go Fish** - Collect matching sets by asking opponents for cards.
4. **Old Maid** - Avoid being left with the Old Maid card.
5. **Crazy Eights** - Discard all your cards by matching rank or suit.

### 🔜 Coming Soon

- Texas Hold'em
- Klondike Solitaire
- Spider Solitaire
- FreeCell

## 🎯 Features

- **Mobile-First Design** - Optimized for portrait mode on all devices
- **Bot Opponents** - Play against computer bots in each game
- **Shared Components** - Reusable card deck and UI components
- **Multiple Games** - 5 games currently playable, more coming soon
- **Responsive Design** - Works great on desktop and mobile

## 🛠️ Technologies

- **Svelte 4** - Reactive UI framework
- **Rollup** - Module bundler optimized for production
- **TypeScript** - Type-safe code
- **SVG Cards** - Beautiful card graphics from [SVG-cards](https://github.com/htdebeer/SVG-cards)

## 🚀 Run Locally

Use Node 20.x

```bash
npm install       # Install dependencies
npm run dev       # Run dev server (build + watch)
npm run build     # Build for production
npm run start     # Serve production build
```

## 📁 Project Structure

```
src/
├── main.ts             # Application entry point
├── App.svelte          # Root component with routing
├── global.css          # Global styles
├── lib/
│   ├── shared/         # Shared utilities
│   │   ├── deck.ts     # Card deck logic
│   │   └── player.ts   # Base player & bot classes
│   ├── games/          # Individual game modules
│   │   ├── blackjack/
│   │   ├── war/
│   │   ├── go-fish/
│   │   ├── old-maid/
│   │   └── crazy-eights/
│   ├── multiplayer/    # Multiplayer infrastructure
│   ├── Components/     # Reusable UI components
│   ├── router.ts       # Client-side routing
│   └── utils/          # Utility functions
└── pages/              # Page components
    ├── Home.svelte     # Game selection menu
    ├── Blackjack.svelte
    ├── War.svelte
    └── ...
```

## 🎲 Game Rules

### Blackjack

Beat the dealer by getting closer to 21 without going over. Aces can be 1 or 11, face cards are 10.

### War

Both players flip a card. Highest card wins both cards. If tied, it's WAR!

### Go Fish

Ask your opponent for cards to make sets of 4. If they don't have it, "Go Fish" and draw from the deck.

### Old Maid

Match pairs and discard them. Avoid being left with the odd Queen (Old Maid) at the end.

### Crazy Eights

Play cards matching the rank or suit of the top card. Eights are wild and let you choose the suit.

## 🤝 Contribution

If you have ideas for improvements or want to contribute to the project, please feel free to fork the repository, make your changes, and submit pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.
