<svelte:options customElement="sl-rss-reader" />

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// Exposed attributes (all strings for web components)
	export let feedUrl: string = '';
	export let maxItems: string = '10';
	export let refreshInterval: string = '300000'; // 5 minutes in ms
	export let showImages: string = 'true';
	export let showDescription: string = 'true';
	export let showDate: string = 'true';
	export let theme: string = 'light'; // 'light' or 'dark'
	export let compact: string = 'false';
	export let openInNewTab: string = 'true';

	// Convert string attributes to proper types
	$: maxItemsValue = parseInt(maxItems) || 10;
	$: refreshIntervalValue = parseInt(refreshInterval) || 300000;
	$: showImagesBool = showImages === 'true';
	$: showDescriptionBool = showDescription === 'true';
	$: showDateBool = showDate === 'true';
	$: compactBool = compact === 'true';
	$: openInNewTabBool = openInNewTab === 'true';

	// State
	interface RSSItem {
		title: string;
		link: string;
		description?: string;
		pubDate?: string;
		image?: string;
		guid?: string;
	}

	let items: RSSItem[] = [];
	let loading = false;
	let error: string | null = null;
	let refreshTimer: number | null = null;
	let mounted = false;

	onMount(() => {
		mounted = true;

		// Initial load
		if (feedUrl) {
			loadFeed();
		}

		// Set up auto-refresh
		if (refreshIntervalValue > 0) {
			refreshTimer = window.setInterval(() => {
				if (feedUrl) {
					loadFeed();
				}
			}, refreshIntervalValue);
		}

		// Dispatch ready event
		dispatchEvent(
			new CustomEvent('ready', {
				detail: { feedUrl, maxItems: maxItemsValue }
			})
		);
	});

	onDestroy(() => {
		if (refreshTimer !== null) {
			clearInterval(refreshTimer);
		}
	});

	async function loadFeed() {
		if (!feedUrl) {
			error = 'No feed URL provided';
			return;
		}

		loading = true;
		error = null;

		try {
			// Use RSS2JSON API as a CORS proxy for demo purposes
			// NOTE: Free tier limited to 10,000 requests/day. For production, use your own backend proxy.
			// API docs: https://rss2json.com/docs
			const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
			
			const response = await fetch(proxyUrl);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.status !== 'ok') {
				throw new Error(data.message || 'Failed to fetch RSS feed');
			}

			// Parse and limit items
			items = (data.items || [])
				.slice(0, maxItemsValue)
				.map((item: any) => ({
					title: item.title || 'Untitled',
					link: item.link || '#',
					description: item.description || item.content || '',
					pubDate: item.pubDate || '',
					image: item.thumbnail || item.enclosure?.link || extractImageFromContent(item.description || item.content),
					guid: item.guid || item.link
				}));

			// Dispatch feed loaded event
			dispatchEvent(
				new CustomEvent('feed-loaded', {
					detail: { 
						feedUrl, 
						itemCount: items.length,
						feedTitle: data.feed?.title || 'RSS Feed'
					}
				})
			);

			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load RSS feed';
			loading = false;

			// Dispatch error event
			dispatchEvent(
				new CustomEvent('error', {
					detail: { feedUrl, error }
				})
			);
		}
	}

	function extractImageFromContent(content: string): string | undefined {
		if (!content) return undefined;
		
		// Try to extract first image from HTML content
		const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
		return imgMatch ? imgMatch[1] : undefined;
	}

	// Time constants for date formatting
	const MS_PER_MINUTE = 60000;
	const MS_PER_HOUR = 3600000;
	const MS_PER_DAY = 86400000;

	function formatDate(dateString: string): string {
		if (!dateString) return '';
		
		try {
			const date = new Date(dateString);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
			const diffHours = Math.floor(diffMs / MS_PER_HOUR);
			const diffDays = Math.floor(diffMs / MS_PER_DAY);

			if (diffMins < 1) return 'Just now';
			if (diffMins < 60) return `${diffMins}m ago`;
			if (diffHours < 24) return `${diffHours}h ago`;
			if (diffDays < 7) return `${diffDays}d ago`;
			
			return date.toLocaleDateString(undefined, { 
				month: 'short', 
				day: 'numeric',
				year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
			});
		} catch (e) {
			return dateString;
		}
	}

	function stripHtml(html: string): string {
		if (!html) return '';
		
		// Remove HTML tags and decode entities
		const doc = new DOMParser().parseFromString(html, 'text/html');
		return doc.body.textContent || '';
	}

	function handleItemClick(item: RSSItem) {
		dispatchEvent(
			new CustomEvent('item-clicked', {
				detail: { item }
			})
		);
	}

	// Watch for feedUrl changes after mount to reload feed when URL is updated
	$: if (mounted && feedUrl) {
		loadFeed();
	}
</script>

<div class="rss-reader" class:dark={theme === 'dark'} class:compact={compactBool}>
	{#if loading && items.length === 0}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading feed...</p>
		</div>
	{:else if error}
		<div class="error">
			<p class="error-icon">⚠️</p>
			<p class="error-message">{error}</p>
			<button class="retry-button" on:click={loadFeed}>Retry</button>
		</div>
	{:else if items.length === 0}
		<div class="empty">
			<p class="empty-icon">📰</p>
			<p class="empty-message">No feed items available</p>
			{#if !feedUrl}
				<p class="empty-hint">Please provide a feedUrl attribute</p>
			{/if}
		</div>
	{:else}
		<div class="feed-items">
			{#each items as item (item.guid || item.link)}
				<article class="feed-item">
					<a 
						href={item.link} 
						target={openInNewTabBool ? '_blank' : '_self'}
						rel={openInNewTabBool ? 'noopener noreferrer' : ''}
						on:click={() => handleItemClick(item)}
					>
						{#if showImagesBool && item.image}
							<div class="item-image">
								<img src={item.image} alt={item.title} loading="lazy" />
							</div>
						{/if}
						<div class="item-content">
							<h3 class="item-title">{item.title}</h3>
							{#if showDescriptionBool && item.description}
								{@const plainDescription = stripHtml(item.description)}
								{@const maxLength = compactBool ? 100 : 200}
								<p class="item-description">
									{plainDescription.substring(0, maxLength)}
									{plainDescription.length > maxLength ? '...' : ''}
								</p>
							{/if}
							{#if showDateBool && item.pubDate}
								<time class="item-date">{formatDate(item.pubDate)}</time>
							{/if}
						</div>
					</a>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.rss-reader {
		font-family: system-ui, -apple-system, sans-serif;
		background: #ffffff;
		border-radius: 8px;
		overflow: hidden;
		max-width: 100%;
	}

	.rss-reader.dark {
		background: #1a202c;
		color: #e2e8f0;
	}

	.loading,
	.error,
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		text-align: center;
		color: #718096;
	}

	.dark .loading,
	.dark .error,
	.dark .empty {
		color: #a0aec0;
	}

	.spinner {
		border: 3px solid #e2e8f0;
		border-top: 3px solid #4299e1;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-icon,
	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.error-message,
	.empty-message {
		font-size: 1rem;
		margin: 0.5rem 0;
		color: #4a5568;
	}

	.dark .error-message,
	.dark .empty-message {
		color: #cbd5e0;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: #a0aec0;
		margin-top: 0.5rem;
	}

	.retry-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #4299e1;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.retry-button:hover {
		background: #3182ce;
	}

	.feed-items {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.feed-item {
		border-bottom: 1px solid #e2e8f0;
	}

	.dark .feed-item {
		border-bottom-color: #2d3748;
	}

	.feed-item:last-child {
		border-bottom: none;
	}

	.feed-item a {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		text-decoration: none;
		color: inherit;
		transition: background 0.2s;
	}

	.feed-item a:hover {
		background: #f7fafc;
	}

	.dark .feed-item a:hover {
		background: #2d3748;
	}

	.compact .feed-item a {
		padding: 0.75rem 1rem;
		gap: 0.75rem;
	}

	.item-image {
		flex-shrink: 0;
		width: 120px;
		height: 80px;
		border-radius: 6px;
		overflow: hidden;
		background: #edf2f7;
	}

	.compact .item-image {
		width: 80px;
		height: 60px;
	}

	.item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #2d3748;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.dark .item-title {
		color: #f7fafc;
	}

	.compact .item-title {
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
		-webkit-line-clamp: 1;
	}

	.item-description {
		font-size: 0.875rem;
		color: #718096;
		margin: 0 0 0.5rem 0;
		line-height: 1.5;
	}

	.dark .item-description {
		color: #a0aec0;
	}

	.compact .item-description {
		font-size: 0.8rem;
		margin-bottom: 0.25rem;
	}

	.item-date {
		font-size: 0.75rem;
		color: #a0aec0;
		font-weight: 500;
	}

	.dark .item-date {
		color: #718096;
	}

	.compact .item-date {
		font-size: 0.7rem;
	}
</style>
