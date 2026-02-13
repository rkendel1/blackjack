# sl-messaging - Drop-in Messaging Component

A standalone, minimal-dependency messaging web component that can be easily integrated into any web application.

## Features

- ✨ **Minimal Dependencies**: Works with simple JavaScript backend
- 💬 **Text Messaging**: iMessage-style chat interface
- 📹 **Video Calls**: Built-in video call UI (integrate with your WebRTC backend)
- 👥 **Conversations**: Inbox-style conversation management
- 🎨 **iOS Design**: Clean, Apple-inspired interface
- 📱 **Responsive**: Works on desktop and mobile
- 🔌 **Easy Integration**: Drop in the script and use the component
- 🔗 **Backend Ready**: Simple JavaScript backend integration (no TypeScript required)

## Files Included

- `sl-messaging.svelte` - Original component (uses StackLive backend with TypeScript)
- `sl-messaging-standalone.svelte` - Standalone Svelte component (no TypeScript, demo mode)
- `sl-messaging-backend.js` - JavaScript backend integration (no TypeScript)
- `demo.html` - HTML demo page
- `javascript-example.html` - Pure JavaScript integration example
- `README.md` - This file

## Quick Start

### Option 1: Use the Pre-built Component (Recommended)

1. Build the component from the repository:
   ```bash
   npm install
   npm run build
   ```

2. The built component will be in `public/build/bundle.js`

3. Include it in your HTML:
   ```html
   <script src="path/to/bundle.js"></script>
   <sl-messaging embedId="my-messaging"></sl-messaging>
   ```

### Option 2: Use with Your Own Backend (No TypeScript)

1. Include the backend integration file:
   ```html
   <script src="sl-messaging-backend.js"></script>
   ```

2. Create a messaging instance:
   ```javascript
   // Import backend
   import { MessagingBackend } from './sl-messaging-backend.js';

   // Create backend instance
   const backend = new MessagingBackend({
     embedId: 'my-chat',
     sessionId: 'optional-session-id',
     enableVideo: true,
     enableAudio: true,
     debug: true
   });

   // Create or join session
   const session = await backend.createSession();
   // OR: const participant = await backend.joinSession('session-id');

   // Send messages
   backend.sendMessage('Hello!');
   backend.sendMedia('https://example.com/image.jpg', 'image/jpeg', 'Check this out!');

   // Get messages
   const messages = backend.getMessages();

   // Subscribe to new messages
   backend.onMessage((messages) => {
     console.log('New messages:', messages);
   });
   ```

### Option 3: Use the Standalone Svelte File

If you're using Svelte in your project, you can import the standalone component:

```svelte
<script>
  import SlMessaging from './sl-messaging-standalone.svelte';
</script>

<SlMessaging 
  embedId="my-messaging" 
  sessionId="" 
  enableVideo="true" 
  enableAudio="true" />
```

## Component Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `embedId` | string | `"messaging-app"` | Unique identifier for this component instance |
| `sessionId` | string | `""` | Optional session ID to join an existing conversation |
| `enableVideo` | string | `"true"` | Enable/disable video features (`"true"` or `"false"`) |
| `enableAudio` | string | `"true"` | Enable/disable audio features (`"true"` or `"false"`) |

**Note**: All attributes must be strings for web components.

## Events

The component dispatches custom events:

### `ready`
Fired when the component is initialized and ready to use.

```javascript
const messaging = document.querySelector('sl-messaging');
messaging.addEventListener('ready', (event) => {
  console.log('Component ready:', event.detail);
  // event.detail = { embedId, sessionId }
});
```

## Usage Examples

### Basic Usage
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Messaging App</title>
</head>
<body>
  <sl-messaging embedId="chat-app"></sl-messaging>
  <script src="bundle.js"></script>
</body>
</html>
```

### With Session ID
```html
<sl-messaging 
  embedId="my-chat" 
  sessionId="session-123"
  enableVideo="true"
  enableAudio="true">
</sl-messaging>
```

### Programmatic Control
```javascript
// Create component programmatically
const messaging = document.createElement('sl-messaging');
messaging.setAttribute('embedId', 'dynamic-chat');
messaging.setAttribute('sessionId', 'abc-123');
messaging.addEventListener('ready', (e) => {
  console.log('Ready!', e.detail);
});
document.body.appendChild(messaging);
```

## Styling

The component comes with built-in styles inspired by iOS/iMessage. It's fully self-contained and doesn't require external CSS.

The component is responsive and will adapt to:
- Desktop: 500px width, 600px height with rounded corners
- Mobile: Full screen width and height

## Files

- `sl-messaging.svelte` - Standalone Svelte component (no TypeScript)
- `demo.html` - HTML demo page
- `README.md` - This file

## Backend Integration

### Using the JavaScript Backend (No TypeScript)

The `sl-messaging-backend.js` file provides a simple JavaScript backend integration that works without TypeScript. This is perfect for drop-in usage or as a starting point for your own backend.

**Features:**
- No TypeScript dependencies
- Simple message storage
- Session management
- Event-based updates
- Compatible with any backend API

**Example Integration:**
```javascript
import { MessagingBackend } from './sl-messaging-backend.js';

// Initialize
const backend = new MessagingBackend({
  embedId: 'my-messaging-app',
  sessionId: null, // Leave null to create new session
  debug: true
});

// Create session
const session = await backend.createSession();
console.log('Session ID:', session.id);

// Send messages
backend.sendMessage('Hello world!');

// Get all messages
const messages = backend.getMessages(100);

// Listen for new messages
backend.onMessage((allMessages) => {
  console.log('Messages updated:', allMessages);
});

// Get session info
const currentSession = backend.getSession();
const participants = backend.getParticipants();
```

### Connecting to Your Own Backend

To connect to your own backend API instead of the demo implementation:

1. Modify `sl-messaging-backend.js` to call your API endpoints:
   ```javascript
   async createSession() {
     const response = await fetch('https://your-api.com/sessions', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ embedId: this.config.embedId })
     });
     this.session = await response.json();
     return this.session;
   }
   ```

2. Update the `sendMessage` and `getMessages` methods similarly

3. Add WebSocket support for real-time updates:
   ```javascript
   constructor(config) {
     // ... existing code ...
     this.ws = new WebSocket('wss://your-api.com/messages');
     this.ws.onmessage = (event) => {
       const message = JSON.parse(event.data);
       this.messageStore.addMessage(message);
     };
   }
   ```

### Using with StackLive Backend (TypeScript)

The main component (`MessagingEmbed.wc.svelte`) in the repository uses the full StackLive backend with TypeScript. To use it:

1. Build the full project:
   ```bash
   npm install
   npm run build
   ```

2. Use the compiled bundle which includes all backend connectivity:
   ```html
   <script src="/build/bundle.js"></script>
   <sl-messaging embedId="my-app" sessionId="optional-id"></sl-messaging>
   ```

This version includes:
- Full WebRTC video/audio support
- Real-time synchronization
- Session management
- Participant tracking
- Media streaming


## Customization

To customize the component:

1. Edit `sl-messaging.svelte` to modify functionality
2. Update the `<style>` section for visual changes
3. Rebuild if using the compiled version

## Browser Support

- Chrome/Edge (Chromium): ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

Requires a modern browser with ES6+ support and Web Components API.

## License

See the main repository LICENSE file.

## Support

For issues or questions, please refer to the main repository documentation or create an issue on GitHub.
