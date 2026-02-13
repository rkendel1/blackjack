<script lang="ts">
	import { onMount } from 'svelte';

	let feedUrl = 'https://hnrss.org/frontpage';
	let maxItems = 10;
	let refreshInterval = 300000; // 5 minutes
	let showImages = true;
	let showDescription = true;
	let showDate = true;
	let theme: 'light' | 'dark' = 'light';
	let compact = false;
	let openInNewTab = true;

	// Preset feeds
	const presetFeeds = [
		{ name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
		{ name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
		{ name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
		{ name: 'Wired', url: 'https://www.wired.com/feed/rss' },
		{ name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
		{ name: 'Reddit - Programming', url: 'https://www.reddit.com/r/programming/.rss' },
		{ name: 'Dev.to', url: 'https://dev.to/feed' },
		{ name: 'CSS Tricks', url: 'https://css-tricks.com/feed/' }
	];

	onMount(() => {
		// Listen for events from the web component
		const reader = document.querySelector('sl-rss-reader');
		if (!reader) {
			console.warn('RSS reader element not found');
			return;
		}

		reader.addEventListener('ready', (e: any) => {
			console.log('RSS Reader ready:', e.detail);
		});

		reader.addEventListener('feed-loaded', (e: any) => {
			console.log('Feed loaded:', e.detail);
		});

		reader.addEventListener('item-clicked', (e: any) => {
			console.log('Item clicked:', e.detail);
		});

		reader.addEventListener('error', (e: any) => {
			console.error('RSS Reader error:', e.detail);
		});
	});

	function selectPreset(url: string) {
		feedUrl = url;
	}

	$: embedHtml = `<sl-rss-reader 
  feed-url="${feedUrl}"
  max-items="${maxItems}"
  refresh-interval="${refreshInterval}"
  show-images="${showImages}"
  show-description="${showDescription}"
  show-date="${showDate}"
  theme="${theme}"
  compact="${compact}"
  open-in-new-tab="${openInNewTab}"
></sl-rss-reader>`;
</script>

<svelte:head>
	<title>RSS Reader Web Component Demo - StackLive</title>
</svelte:head>

<div class="demo-container">
	<h1>📰 RSS Reader Web Component Demo</h1>

	<div class="demo-layout">
		<!-- Settings Panel -->
		<div class="settings-panel">
			<h2>Settings</h2>

			<div class="setting-group">
				<h3>Feed URL</h3>
				<input
					type="text"
					bind:value={feedUrl}
					placeholder="https://example.com/feed.rss"
					class="feed-input"
				/>
				
				<div class="presets">
					<h4>Preset Feeds:</h4>
					<div class="preset-buttons">
						{#each presetFeeds as preset}
							<button 
								class="preset-btn"
								class:active={feedUrl === preset.url}
								on:click={() => selectPreset(preset.url)}
							>
								{preset.name}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="setting-group">
				<h3>Display Options</h3>
				<label>
					<input type="checkbox" bind:checked={showImages} />
					Show Images
				</label>
				<label>
					<input type="checkbox" bind:checked={showDescription} />
					Show Description
				</label>
				<label>
					<input type="checkbox" bind:checked={showDate} />
					Show Date
				</label>
				<label>
					<input type="checkbox" bind:checked={compact} />
					Compact Mode
				</label>
				<label>
					<input type="checkbox" bind:checked={openInNewTab} />
					Open in New Tab
				</label>
			</div>

			<div class="setting-group">
				<h3>Theme</h3>
				<label>
					<input type="radio" bind:group={theme} value="light" />
					Light
				</label>
				<label>
					<input type="radio" bind:group={theme} value="dark" />
					Dark
				</label>
			</div>

			<div class="setting-group">
				<h3>Items</h3>
				<label>
					Max Items:
					<input
						type="number"
						bind:value={maxItems}
						min="1"
						max="50"
						class="number-input"
					/>
				</label>
			</div>

			<div class="setting-group">
				<h3>Refresh Interval</h3>
				<label>
					<select bind:value={refreshInterval} class="select-input">
						<option value={60000}>1 minute</option>
						<option value={300000}>5 minutes</option>
						<option value={600000}>10 minutes</option>
						<option value={1800000}>30 minutes</option>
						<option value={3600000}>1 hour</option>
						<option value={0}>Never</option>
					</select>
				</label>
			</div>

			<div class="code-section">
				<h3>Embed Code</h3>
				<pre><code>{embedHtml}</code></pre>
			</div>
		</div>

		<!-- Component Preview -->
		<div class="preview-panel">
			<h2>Live Preview</h2>
			<div class="preview-container" class:dark-preview={theme === 'dark'}>
				<sl-rss-reader
					feed-url={feedUrl}
					max-items={maxItems.toString()}
					refresh-interval={refreshInterval.toString()}
					show-images={showImages.toString()}
					show-description={showDescription.toString()}
					show-date={showDate.toString()}
					theme={theme}
					compact={compact.toString()}
					open-in-new-tab={openInNewTab.toString()}
				/>
			</div>
		</div>
	</div>

	<!-- Documentation -->
	<div class="documentation">
		<h2>Documentation</h2>

		<section>
			<h3>Usage</h3>
			<p>
				The <code>&lt;sl-rss-reader&gt;</code> web component provides a customizable RSS feed reader
				that can be embedded in any web page. It supports automatic refresh, theming, and various
				display options.
			</p>
		</section>

		<section>
			<h3>Attributes</h3>
			<table>
				<thead>
					<tr>
						<th>Attribute</th>
						<th>Type</th>
						<th>Default</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>feed-url</code></td>
						<td>string</td>
						<td>''</td>
						<td>URL of the RSS feed to display</td>
					</tr>
					<tr>
						<td><code>max-items</code></td>
						<td>string</td>
						<td>'10'</td>
						<td>Maximum number of items to display</td>
					</tr>
					<tr>
						<td><code>refresh-interval</code></td>
						<td>string</td>
						<td>'300000'</td>
						<td>Auto-refresh interval in milliseconds (0 = disabled)</td>
					</tr>
					<tr>
						<td><code>show-images</code></td>
						<td>string</td>
						<td>'true'</td>
						<td>Show article images/thumbnails</td>
					</tr>
					<tr>
						<td><code>show-description</code></td>
						<td>string</td>
						<td>'true'</td>
						<td>Show article descriptions</td>
					</tr>
					<tr>
						<td><code>show-date</code></td>
						<td>string</td>
						<td>'true'</td>
						<td>Show publication dates</td>
					</tr>
					<tr>
						<td><code>theme</code></td>
						<td>string</td>
						<td>'light'</td>
						<td>Visual theme: 'light' or 'dark'</td>
					</tr>
					<tr>
						<td><code>compact</code></td>
						<td>string</td>
						<td>'false'</td>
						<td>Use compact layout with less spacing</td>
					</tr>
					<tr>
						<td><code>open-in-new-tab</code></td>
						<td>string</td>
						<td>'true'</td>
						<td>Open article links in new tab</td>
					</tr>
				</tbody>
			</table>
		</section>

		<section>
			<h3>Events</h3>
			<table>
				<thead>
					<tr>
						<th>Event</th>
						<th>Detail</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>ready</code></td>
						<td><code>&#123; feedUrl, maxItems &#125;</code></td>
						<td>Fired when component is initialized</td>
					</tr>
					<tr>
						<td><code>feed-loaded</code></td>
						<td><code>&#123; feedUrl, itemCount, feedTitle &#125;</code></td>
						<td>Fired when feed is successfully loaded</td>
					</tr>
					<tr>
						<td><code>item-clicked</code></td>
						<td><code>&#123; item &#125;</code></td>
						<td>Fired when a feed item is clicked</td>
					</tr>
					<tr>
						<td><code>error</code></td>
						<td><code>&#123; feedUrl, error &#125;</code></td>
						<td>Fired when an error occurs loading the feed</td>
					</tr>
				</tbody>
			</table>
		</section>

		<section>
			<h3>Examples</h3>

			<h4>Basic Usage</h4>
			<pre><code>&lt;sl-rss-reader 
  feed-url="https://hnrss.org/frontpage"
&gt;&lt;/sl-rss-reader&gt;</code></pre>

			<h4>Customized Display</h4>
			<pre><code>&lt;sl-rss-reader 
  feed-url="https://techcrunch.com/feed/"
  max-items="5"
  theme="dark"
  compact="true"
  show-images="false"
&gt;&lt;/sl-rss-reader&gt;</code></pre>

			<h4>With Auto-Refresh</h4>
			<pre><code>&lt;sl-rss-reader 
  feed-url="https://www.theverge.com/rss/index.xml"
  refresh-interval="60000"
  max-items="20"
&gt;&lt;/sl-rss-reader&gt;</code></pre>

			<h4>Listening to Events</h4>
			<pre><code>&lt;script&gt;
  const reader = document.querySelector('sl-rss-reader');
  
  reader.addEventListener('feed-loaded', (e) => &#123;
    console.log('Loaded', e.detail.itemCount, 'items');
  &#125;);
  
  reader.addEventListener('item-clicked', (e) => &#123;
    console.log('Clicked:', e.detail.item.title);
  &#125;);
&lt;/script&gt;</code></pre>
		</section>

		<section>
			<h3>Features</h3>
			<ul>
				<li>📡 <strong>RSS Feed Support</strong> - Display any RSS feed via CORS proxy</li>
				<li>🔄 <strong>Auto-Refresh</strong> - Automatically update feed at configurable intervals</li>
				<li>🎨 <strong>Theming</strong> - Light and dark theme options</li>
				<li>📱 <strong>Responsive</strong> - Adapts to different screen sizes</li>
				<li>🖼️ <strong>Image Support</strong> - Display article thumbnails and images</li>
				<li>⚡ <strong>Compact Mode</strong> - Space-efficient layout option</li>
				<li>🔗 <strong>Customizable Links</strong> - Control link behavior (new tab, same tab)</li>
				<li>📅 <strong>Smart Dates</strong> - Relative time display (e.g., "2h ago")</li>
				<li>🎯 <strong>Event-Driven</strong> - Custom events for feed loaded, errors, clicks</li>
			</ul>
		</section>

		<section>
			<h3>CORS & Feed Proxy</h3>
			<p>
				The component uses <a href="https://rss2json.com" target="_blank" rel="noopener">RSS2JSON</a> 
				as a CORS proxy to fetch RSS feeds from any domain. For production use, consider:
			</p>
			<ul>
				<li>Setting up your own backend proxy for better reliability</li>
				<li>Using a serverless function to fetch and cache feeds</li>
				<li>Implementing rate limiting and caching</li>
			</ul>
		</section>

		<section>
			<h3>Browser Support</h3>
			<p>
				Works in all modern browsers that support Web Components (Custom Elements v1):
			</p>
			<ul>
				<li>Chrome/Edge 67+</li>
				<li>Firefox 63+</li>
				<li>Safari 10.1+</li>
				<li>Opera 54+</li>
			</ul>
		</section>
	</div>
</div>

<style>
	.demo-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	h1 {
		text-align: center;
		color: #333;
		margin-bottom: 2rem;
		font-size: 2.5rem;
	}

	.demo-layout {
		display: grid;
		grid-template-columns: 400px 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	@media (max-width: 1024px) {
		.demo-layout {
			grid-template-columns: 1fr;
		}
	}

	.settings-panel,
	.preview-panel {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
	}

	h2 {
		margin-top: 0;
		color: #1f2937;
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
	}

	h3 {
		color: #374151;
		font-size: 1.1rem;
		margin-top: 0;
		margin-bottom: 0.75rem;
	}

	h4 {
		color: #4b5563;
		font-size: 0.9rem;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	.setting-group {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.setting-group:last-child {
		border-bottom: none;
	}

	.setting-group label {
		display: block;
		margin: 0.5rem 0;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.feed-input,
	.number-input,
	.select-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	.number-input {
		width: 80px;
		margin-left: 0.5rem;
		display: inline-block;
	}

	.presets {
		margin-top: 1rem;
	}

	.preset-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.preset-btn {
		padding: 0.4rem 0.8rem;
		border: 1px solid #d1d5db;
		background: white;
		border-radius: 6px;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.preset-btn:hover {
		border-color: #4299e1;
		background: #f0f9ff;
	}

	.preset-btn.active {
		border-color: #4299e1;
		background: #4299e1;
		color: white;
	}

	.code-section {
		margin-top: 1.5rem;
	}

	.code-section pre {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1rem;
		overflow-x: auto;
		margin-top: 0.5rem;
	}

	.code-section code {
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.75rem;
		color: #1f2937;
		white-space: pre;
	}

	.preview-container {
		min-height: 600px;
		max-height: 800px;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #f9fafb;
	}

	.preview-container.dark-preview {
		background: #1a202c;
	}

	.documentation {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 2rem;
	}

	.documentation section {
		margin-bottom: 2rem;
	}

	.documentation p {
		color: #6b7280;
		line-height: 1.6;
	}

	.documentation ul {
		color: #6b7280;
		line-height: 1.8;
	}

	.documentation table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		font-size: 0.9rem;
	}

	.documentation th,
	.documentation td {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.documentation th {
		background: #f9fafb;
		font-weight: 600;
		color: #374151;
	}

	.documentation td {
		color: #6b7280;
	}

	.documentation code {
		background: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.875rem;
		color: #1f2937;
	}

	.documentation pre {
		background: #1f2937;
		color: #f9fafb;
		padding: 1rem;
		border-radius: 6px;
		overflow-x: auto;
		margin: 1rem 0;
	}

	.documentation pre code {
		background: transparent;
		color: #f9fafb;
		padding: 0;
	}

	.documentation a {
		color: #4299e1;
		text-decoration: none;
	}

	.documentation a:hover {
		text-decoration: underline;
	}
</style>
