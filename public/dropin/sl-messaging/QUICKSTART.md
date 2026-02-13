# sl-messaging Quick Start Guide

## What You Get

This package provides a complete messaging component that works with or without TypeScript:

### Files Included
- `sl-messaging-backend.js` - JavaScript backend (no TypeScript)
- `sl-messaging-standalone.svelte` - Standalone Svelte component
- `demo.html` - HTML demo
- `javascript-example.html` - JS integration example
- `README.md` - Full documentation

## Quick Integration

### 1. Simple HTML Page (Fastest)

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Messaging App</title>
</head>
<body>
    <!-- Include the built bundle -->
    <script src="/build/bundle.js"></script>
    
    <!-- Use the component -->
    <sl-messaging 
        embedId="my-app" 
        enableVideo="true" 
        enableAudio="true">
    </sl-messaging>
</body>
</html>
```

### 2. With JavaScript Backend (No TypeScript)

```html
<!-- Include the backend -->
<script type="module">
    import { MessagingBackend } from './sl-messaging-backend.js';
    
    // Initialize
    const backend = new MessagingBackend({
        embedId: 'my-app',
        debug: true
    });
    
    // Create session
    const session = await backend.createSession();
    console.log('Session ID:', session.id);
    
    // Send messages
    backend.sendMessage('Hello!');
    
    // Get messages
    const messages = backend.getMessages();
</script>
```

### 3. In a Svelte Project

```svelte
<script>
    import SlMessaging from './sl-messaging-standalone.svelte';
</script>

<SlMessaging 
    embedId="my-messaging" 
    enableVideo="true" 
    enableAudio="true" 
/>
```

## Component Attributes

All attributes are strings (required for web components):

- `embedId` - Unique identifier (default: "messaging-app")
- `sessionId` - Join existing session (optional)
- `enableVideo` - Enable video ("true" or "false", default: "true")
- `enableAudio` - Enable audio ("true" or "false", default: "true")

## Events

Listen for component events:

```javascript
const messaging = document.querySelector('sl-messaging');
messaging.addEventListener('ready', (event) => {
    console.log('Ready!', event.detail);
    // event.detail = { embedId, sessionId }
});
```

## Connect to Your Backend

Edit `sl-messaging-backend.js` to connect to your API:

```javascript
// In MessagingBackend class
async createSession() {
    const response = await fetch('https://your-api.com/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedId: this.config.embedId })
    });
    this.session = await response.json();
    return this.session;
}

async sendMessage(text) {
    await fetch(`https://your-api.com/sessions/${this.session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fromUserId: this.localUserId })
    });
}
```

## Build from Source

```bash
# Install dependencies
npm install

# Build the component
npm run build

# Output will be in public/build/bundle.js
```

## Demo Pages

Open these in your browser:
- `demo.html` - Simple demo
- `javascript-example.html` - JavaScript controls

## Need Help?

See `README.md` for complete documentation including:
- API reference
- Backend integration guide
- Advanced usage examples
- Troubleshooting

## Production Checklist

Before deploying to production:

- [ ] Replace demo backend with your API
- [ ] Add authentication
- [ ] Implement message persistence
- [ ] Set up WebRTC signaling server (for video)
- [ ] Add error handling
- [ ] Enable HTTPS
- [ ] Test on multiple devices
- [ ] Add rate limiting

---

**Ready to use!** The component works out of the box with demo data, making it easy to prototype and test before connecting your real backend.
