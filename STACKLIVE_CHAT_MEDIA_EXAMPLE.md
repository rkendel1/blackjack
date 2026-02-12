# StackLive Chat & Media Interaction Examples

This document demonstrates how to use the StackLive Realtime Text & Media Interaction Infrastructure.

## Overview

The StackLive infrastructure enables:
- **Real-time text messaging** for any embed session
- **Media messages** (images, videos, GIFs) with URLs
- **Reactions, polls, and snaps** integrated into runtime
- **Persistent conversation threads** with history
- **Cross-device, cross-embed synchronization**

## Basic Setup

### Import the Hook

```typescript
import { useStackLiveInteraction } from '$lib/multiplayer';
```

### Create a Session (Host/Publisher)

```typescript
const session = useStackLiveInteraction({
  embedId: "my-embed-id",
  type: "chat", // or "game", "class", "quiz", "poll", "dashboard"
  maxParticipants: 10,
  debug: true
});

// Start the session
await session.start();
```

### Join a Session (Participant/Viewer)

```typescript
const participant = useStackLiveInteraction({
  sessionId: "session-abc123"
});

// Connect to the session
await participant.connect({ role: "viewer" });
```

## Sending Messages

### 1. Text Messages

```typescript
// Send a simple chat message
session.send({ 
  type: "chat", 
  payload: "Hello everyone!" 
});
```

### 2. Media Messages

```typescript
// Send an image
session.send({
  type: "media",
  payload: { caption: "Check out this screenshot" },
  mediaUrl: "https://cdn.example.com/images/screenshot.png",
  mediaType: "image/png"
});

// Send a video
session.send({
  type: "media",
  payload: { caption: "Demo of the new feature" },
  mediaUrl: "https://cdn.example.com/videos/demo.mp4",
  mediaType: "video/mp4"
});

// Send a GIF
session.send({
  type: "media",
  payload: { caption: "Celebration!" },
  mediaUrl: "https://cdn.example.com/gifs/party.gif",
  mediaType: "image/gif"
});
```

### 3. Reactions

```typescript
// Send emoji reactions
session.send({ type: "reaction", payload: "👍" });
session.send({ type: "reaction", payload: "❤️" });
session.send({ type: "reaction", payload: "🎉" });
```

## Receiving Messages

### Listen to All Interactions

```typescript
session.on("interaction", (msg) => {
  console.log("Received interaction:", msg);
  
  // Handle different message types
  switch(msg.type) {
    case "chat":
      displayChatMessage(msg);
      break;
    case "media":
      displayMediaMessage(msg);
      break;
    case "reaction":
      displayReaction(msg);
      break;
    case "poll":
      displayPoll(msg);
      break;
  }
});
```

### Fetch Message History

```typescript
// Get last 50 messages
const messages = session.getMessages({ limit: 50 });

// Display messages
messages.forEach(msg => {
  if ('mediaUrl' in msg) {
    // It's a media message
    console.log(`Media from ${msg.fromUserId}:`, msg.mediaUrl);
    console.log(`Caption: ${msg.payload.caption}`);
    console.log(`Type: ${msg.mediaType}`);
  } else {
    // It's a chat message
    console.log(`${msg.fromUserId}: ${msg.payload}`);
  }
});

// Get all messages (no limit)
const allMessages = session.getMessages();
```

## Complete Examples

### Example 1: Simple Chat Room

```typescript
import { useStackLiveInteraction } from '$lib/multiplayer';

// Host creates a chat room
const chatRoom = useStackLiveInteraction({
  embedId: "team-chat",
  type: "chat",
  maxParticipants: 20
});

await chatRoom.start();
console.log("Chat room created:", chatRoom.session);

// Send welcome message
chatRoom.send({ 
  type: "chat", 
  payload: "Welcome to the team chat!" 
});

// Listen for messages
chatRoom.on("interaction", (msg) => {
  if (msg.type === "chat") {
    console.log(`New message: ${msg.payload}`);
  }
});

// Participants join
const participant = useStackLiveInteraction({
  sessionId: chatRoom.session.id
});

await participant.connect({ role: "player" });

// Send a message
participant.send({ 
  type: "chat", 
  payload: "Hi everyone!" 
});

// Send a reaction
participant.send({ 
  type: "reaction", 
  payload: "👋" 
});
```

### Example 2: Interactive Classroom with Media

```typescript
// Teacher starts a class
const classroom = useStackLiveInteraction({
  embedId: "math-101",
  type: "class",
  video: true,
  audio: true,
  maxParticipants: 30
});

await classroom.start();

// Share lecture materials
classroom.send({
  type: "media",
  payload: { caption: "Today's lecture slides" },
  mediaUrl: "https://cdn.school.com/slides/lesson-1.pdf",
  mediaType: "application/pdf"
});

// Send a quiz
const quiz = classroom.createQuiz(
  "What is 2 + 2?",
  ["3", "4", "5"],
  1, // correct answer index
  60, // 60 second time limit
  10  // 10 points
);

// Students join
const student = useStackLiveInteraction({
  sessionId: "class-session-123"
});

await student.connect({ role: "viewer" });

// Student sends answer
student.send({
  type: "quiz",
  payload: { quizId: quiz.id, answer: 1 }
});

// Student asks a question in chat
student.send({
  type: "chat",
  payload: "Can you explain step 3 again?"
});

// Teacher views results
const results = classroom.getQuizResults(quiz.id);
console.log(`${results.length} students answered`);
```

### Example 3: Collaborative Project with Media Sharing

```typescript
// Project lead creates a collaborative session
const project = useStackLiveInteraction({
  embedId: "project-alpha",
  type: "collaborative",
  maxParticipants: 15
});

await project.start();

// Share project updates
project.send({ 
  type: "chat", 
  payload: "Sprint planning meeting started" 
});

// Share design mockup
project.send({
  type: "media",
  payload: { caption: "New UI design v2" },
  mediaUrl: "https://cdn.design.com/mockup-v2.png",
  mediaType: "image/png"
});

// Create a poll for team decision
const poll = project.createPoll(
  "Which color scheme should we use?",
  ["Blue & White", "Green & Gray", "Purple & Orange"],
  false, // single choice
  Date.now() + 3600000 // expires in 1 hour
);

// Team member joins
const teamMember = useStackLiveInteraction({
  sessionId: "project-session-456"
});

await teamMember.connect({ role: "player" });

// Vote on poll
teamMember.send({
  type: "poll",
  payload: { pollId: poll.id, answers: [0] } // vote for option 0
});

// Share progress screenshot
teamMember.send({
  type: "media",
  payload: { caption: "Current implementation" },
  mediaUrl: "https://cdn.example.com/progress.png",
  mediaType: "image/png"
});

// View all shared media
const messages = teamMember.getMessages();
const mediaMessages = messages.filter(msg => 'mediaUrl' in msg);
console.log(`${mediaMessages.length} media items shared`);
```

### Example 4: Live Event with Reactions & Media

```typescript
// Event host starts a live session
const liveEvent = useStackLiveInteraction({
  embedId: "product-launch",
  type: "class",
  video: true,
  audio: true,
  maxParticipants: 500
});

await liveEvent.start();

// Broadcast announcement
liveEvent.send({ 
  type: "chat", 
  payload: "Product launch event starting now!" 
});

// Share product demo video
liveEvent.send({
  type: "media",
  payload: { caption: "Product Demo - Full Feature Set" },
  mediaUrl: "https://cdn.company.com/demo-full.mp4",
  mediaType: "video/mp4"
});

// Viewers join
const viewer = useStackLiveInteraction({
  sessionId: "launch-event-789"
});

await viewer.connect({ role: "viewer" });

// React to the demo
viewer.send({ type: "reaction", payload: "🔥" });
viewer.send({ type: "reaction", payload: "💯" });

// Ask a question
viewer.send({ 
  type: "chat", 
  payload: "Will this feature be available in the free tier?" 
});

// Host monitors engagement
liveEvent.on("interaction", (msg) => {
  if (msg.type === "reaction") {
    console.log("Reaction received:", msg.payload);
  } else if (msg.type === "chat") {
    console.log("Question:", msg.payload);
  }
});
```

## Message Types Reference

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  sessionId: string;
  fromUserId: string;
  payload: string;        // text content
  timestamp: number;
}
```

### MediaMessage

```typescript
interface MediaMessage {
  id: string;
  sessionId: string;
  fromUserId: string;
  payload: {
    caption?: string;
    [key: string]: unknown;
  };
  mediaUrl: string;       // URL to media file
  mediaType: string;      // MIME type (e.g., "image/jpeg", "video/mp4")
  timestamp: number;
}
```

## Best Practices

1. **Always validate media URLs** before sending to prevent XSS attacks
2. **Set appropriate limits** on message history retrieval
3. **Handle different message types** in your interaction callback
4. **Use meaningful captions** for media messages
5. **Clean up sessions** when done with `session.stop()`
6. **Monitor connection quality** using the `connectionQuality` store
7. **Implement retry logic** for failed message sends
8. **Consider rate limiting** to prevent spam

## Svelte Component Example

```svelte
<script lang="ts">
  import { useStackLiveInteraction } from '$lib/multiplayer';
  import { onMount } from 'svelte';
  
  let sessionId = '';
  let messageInput = '';
  let session: ReturnType<typeof useStackLiveInteraction>;
  
  onMount(() => {
    session = useStackLiveInteraction({
      embedId: "my-chat",
      type: "chat",
      maxParticipants: 20
    });
    
    session.on("interaction", (msg) => {
      console.log("New message:", msg);
      // Update UI
    });
  });
  
  async function createSession() {
    const newSession = await session.start();
    sessionId = newSession?.id || '';
  }
  
  function sendMessage() {
    if (messageInput.trim()) {
      session.send({ type: "chat", payload: messageInput });
      messageInput = '';
    }
  }
  
  function sendReaction(emoji: string) {
    session.send({ type: "reaction", payload: emoji });
  }
</script>

<div class="chat-container">
  {#if !sessionId}
    <button on:click={createSession}>Start Chat</button>
  {:else}
    <div class="messages">
      {#each $session.messages as msg}
        <div class="message">
          {#if 'mediaUrl' in msg}
            <img src={msg.mediaUrl} alt={msg.payload.caption} />
          {:else}
            <p>{msg.payload}</p>
          {/if}
        </div>
      {/each}
    </div>
    
    <div class="input-area">
      <input 
        bind:value={messageInput} 
        on:keydown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message..."
      />
      <button on:click={sendMessage}>Send</button>
      
      <div class="reactions">
        <button on:click={() => sendReaction('👍')}>👍</button>
        <button on:click={() => sendReaction('❤️')}>❤️</button>
        <button on:click={() => sendReaction('🎉')}>🎉</button>
      </div>
    </div>
  {/if}
</div>
```

## Next Steps

- Explore the [full API documentation](./MULTIPLAYER.md)
- Check the [Convex schema](./src/lib/multiplayer/convex/schema.ts) for backend integration
- Review [type definitions](./src/lib/multiplayer/types.ts) for all message types
- See [InteractionManager](./src/lib/multiplayer/InteractionManager.ts) for implementation details
