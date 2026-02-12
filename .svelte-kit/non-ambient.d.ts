
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/arvr-demo" | "/blackjack-multiplayer" | "/blackjack" | "/crazy-eights" | "/go-fish" | "/messaging" | "/messaging/demo" | "/multiplayer" | "/old-maid" | "/poker" | "/solitaire" | "/solitaire/freecell" | "/solitaire/klondike" | "/solitaire/spider" | "/texas-holdem" | "/war" | "/webcomponents-demo";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/arvr-demo": Record<string, never>;
			"/blackjack-multiplayer": Record<string, never>;
			"/blackjack": Record<string, never>;
			"/crazy-eights": Record<string, never>;
			"/go-fish": Record<string, never>;
			"/messaging": Record<string, never>;
			"/messaging/demo": Record<string, never>;
			"/multiplayer": Record<string, never>;
			"/old-maid": Record<string, never>;
			"/poker": Record<string, never>;
			"/solitaire": Record<string, never>;
			"/solitaire/freecell": Record<string, never>;
			"/solitaire/klondike": Record<string, never>;
			"/solitaire/spider": Record<string, never>;
			"/texas-holdem": Record<string, never>;
			"/war": Record<string, never>;
			"/webcomponents-demo": Record<string, never>
		};
		Pathname(): "/" | "/arvr-demo" | "/arvr-demo/" | "/blackjack-multiplayer" | "/blackjack-multiplayer/" | "/blackjack" | "/blackjack/" | "/crazy-eights" | "/crazy-eights/" | "/go-fish" | "/go-fish/" | "/messaging" | "/messaging/" | "/messaging/demo" | "/messaging/demo/" | "/multiplayer" | "/multiplayer/" | "/old-maid" | "/old-maid/" | "/poker" | "/poker/" | "/solitaire" | "/solitaire/" | "/solitaire/freecell" | "/solitaire/freecell/" | "/solitaire/klondike" | "/solitaire/klondike/" | "/solitaire/spider" | "/solitaire/spider/" | "/texas-holdem" | "/texas-holdem/" | "/war" | "/war/" | "/webcomponents-demo" | "/webcomponents-demo/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.png" | "/manifest.json" | string & {};
	}
}