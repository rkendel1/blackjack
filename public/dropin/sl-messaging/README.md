# sl-messaging - Drop-in Messaging Component

A standalone, zero-dependency messaging web component that can be easily integrated into any web application.

## Features

- ✨ **Zero Dependencies**: Works completely standalone - no external libraries required
- 💬 **Text Messaging**: iMessage-style chat interface
- 📹 **Video Calls**: Built-in video call UI (demo mode - integrate with your own WebRTC backend)
- 👥 **Conversations**: Inbox-style conversation management
- 🎨 **iOS Design**: Clean, Apple-inspired interface
- 📱 **Responsive**: Works on desktop and mobile
- 🔌 **Easy Integration**: Just drop in the script and use the component

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

### Option 2: Use the Standalone Svelte File

If you're using Svelte in your project, you can import the standalone component:

```svelte
<script>
  import SlMessaging from './sl-messaging.svelte';
</script>

<SlMessaging embedId="my-messaging" sessionId="" enableVideo="true" enableAudio="true" />
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

## Integration with Your Backend

This is a **UI component only**. For production use, you'll need to integrate it with your own backend for:

1. **Real-time messaging**: Replace mock data with WebSocket or real-time database
2. **Video/Audio**: Integrate with WebRTC signaling server
3. **User authentication**: Add your authentication system
4. **Message persistence**: Connect to your database

The current version includes demo/mock data for demonstration purposes.

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
