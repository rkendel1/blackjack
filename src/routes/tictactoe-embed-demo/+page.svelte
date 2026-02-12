<script lang="ts">
  import { onMount } from 'svelte';

  let embedMode: 'single' | 'multiplayer' = 'single';
  let enableBot = true;
  let botDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  let sessionId = '';

  onMount(() => {
    // Listen for events from the web component
    const embed = document.querySelector('sl-tictactoe');
    if (embed) {
      embed.addEventListener('ready', (e: any) => {
        console.log('Tic Tac Toe embed ready:', e.detail);
      });

      embed.addEventListener('move', (e: any) => {
        console.log('Move made:', e.detail);
      });

      embed.addEventListener('reset', (e: any) => {
        console.log('Game reset:', e.detail);
      });

      embed.addEventListener('start', (e: any) => {
        console.log('Game started:', e.detail);
      });
    }
  });

  function createMultiplayerSession() {
    // In a real scenario, this would create a session and get the sessionId
    // For demo purposes, we'll just show how it would be used
    sessionId = 'demo-session-' + Math.random().toString(36).substring(7);
    embedMode = 'multiplayer';
  }

  $: embedHtml = `<sl-tictactoe 
  mode="${embedMode}"
  ${embedMode === 'single' ? `enable-bot="${enableBot}" bot-difficulty="${botDifficulty}"` : `session-id="${sessionId}"`}
></sl-tictactoe>`;
</script>

<div class="demo-container">
  <h1>Tic Tac Toe Web Component Demo</h1>

  <div class="demo-layout">
    <!-- Settings Panel -->
    <div class="settings-panel">
      <h2>Settings</h2>

      <div class="setting-group">
        <h3>Game Mode</h3>
        <label>
          <input type="radio" bind:group={embedMode} value="single" />
          Single Player
        </label>
        <label>
          <input type="radio" bind:group={embedMode} value="multiplayer" />
          Multiplayer
        </label>
      </div>

      {#if embedMode === 'single'}
        <div class="setting-group">
          <h3>Bot Settings</h3>
          <label>
            <input type="checkbox" bind:checked={enableBot} />
            Enable Bot
          </label>

          {#if enableBot}
            <label>
              Difficulty:
              <select bind:value={botDifficulty}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
          {/if}
        </div>
      {:else}
        <div class="setting-group">
          <h3>Multiplayer</h3>
          {#if !sessionId}
            <button class="btn-create" on:click={createMultiplayerSession}>
              Create Session
            </button>
          {:else}
            <p>Session ID: <code>{sessionId}</code></p>
            <button class="btn-create" on:click={() => sessionId = ''}>
              Clear Session
            </button>
          {/if}
        </div>
      {/if}

      <div class="code-section">
        <h3>Embed Code</h3>
        <pre><code>{embedHtml}</code></pre>
      </div>
    </div>

    <!-- Component Preview -->
    <div class="preview-panel">
      <h2>Live Preview</h2>
      <div class="preview-container">
        <sl-tictactoe
          mode={embedMode}
          enable-bot={enableBot.toString()}
          bot-difficulty={botDifficulty}
          session-id={sessionId}
        />
      </div>
    </div>
  </div>

  <!-- Documentation -->
  <div class="documentation">
    <h2>Documentation</h2>

    <section>
      <h3>Usage</h3>
      <p>The <code>&lt;sl-tictactoe&gt;</code> web component provides a complete tic tac toe game with both single-player and multiplayer modes.</p>
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
            <td><code>mode</code></td>
            <td>string</td>
            <td>'single'</td>
            <td>Game mode: 'single' or 'multiplayer'</td>
          </tr>
          <tr>
            <td><code>enable-bot</code></td>
            <td>string</td>
            <td>'false'</td>
            <td>Enable bot opponent in single-player mode</td>
          </tr>
          <tr>
            <td><code>bot-difficulty</code></td>
            <td>string</td>
            <td>'medium'</td>
            <td>Bot difficulty: 'easy', 'medium', or 'hard'</td>
          </tr>
          <tr>
            <td><code>session-id</code></td>
            <td>string</td>
            <td>''</td>
            <td>Session ID for multiplayer mode</td>
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
            <td><code>&#123; mode, sessionId, enableBot &#125;</code></td>
            <td>Fired when component is initialized</td>
          </tr>
          <tr>
            <td><code>move</code></td>
            <td><code>&#123; position, mode &#125;</code></td>
            <td>Fired when a move is made</td>
          </tr>
          <tr>
            <td><code>reset</code></td>
            <td><code>&#123; mode &#125;</code></td>
            <td>Fired when game is reset</td>
          </tr>
          <tr>
            <td><code>start</code></td>
            <td><code>&#123; mode &#125;</code></td>
            <td>Fired when multiplayer game starts</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h3>Examples</h3>

      <h4>Single Player with Bot</h4>
      <pre><code>&lt;sl-tictactoe 
  mode="single" 
  enable-bot="true" 
  bot-difficulty="hard"
&gt;&lt;/sl-tictactoe&gt;</code></pre>

      <h4>Multiplayer</h4>
      <pre><code>&lt;sl-tictactoe 
  mode="multiplayer" 
  session-id="your-session-id"
&gt;&lt;/sl-tictactoe&gt;</code></pre>

      <h4>Listening to Events</h4>
      <pre><code>&lt;script&gt;
  const embed = document.querySelector('sl-tictactoe');
  embed.addEventListener('move', (e) => &#123;
    console.log('Move made at position:', e.detail.position);
  &#125;);
&lt;/script&gt;</code></pre>
    </section>
  </div>
</div>

<style>
  .demo-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
  }

  .demo-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  @media (max-width: 768px) {
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
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .setting-group {
    margin-bottom: 1.5rem;
  }

  .setting-group h3 {
    margin-top: 0;
  }

  .setting-group label {
    display: block;
    margin: 0.5rem 0;
    font-size: 0.95rem;
  }

  .setting-group select {
    margin-left: 0.5rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
  }

  .code-section {
    margin-top: 2rem;
  }

  .code-section pre {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
  }

  .code-section code {
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.85rem;
    color: #1f2937;
  }

  .btn-create {
    padding: 0.5rem 1rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-create:hover {
    background: #059669;
  }

  .preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    background: #f9fafb;
    border-radius: 8px;
    padding: 2rem;
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

  .documentation h4 {
    color: #4b5563;
    font-size: 1rem;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .documentation p {
    color: #6b7280;
    line-height: 1.6;
  }

  .documentation table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
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
</style>
