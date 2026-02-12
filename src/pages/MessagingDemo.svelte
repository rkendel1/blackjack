<script lang="ts">
import ConversationList from '$lib/Components/messaging/ConversationList.svelte';
import ChatView from '$lib/Components/messaging/ChatView.svelte';
import VideoCallPanel from '$lib/Components/messaging/VideoCallPanel.svelte';
import type { Participant, Session, ChatMessage, MediaMessage } from '$lib/multiplayer/types';

// Mock data
const mockSession: Session = {
id: 'demo-session-12345',
hostId: 'user-1',
mode: 'host-authoritative',
status: 'IN_GAME',
type: 'collaborative',
config: {
mode: 'host-authoritative',
maxPlayers: 10,
allowSpectators: false,
visibility: 'private',
video: true,
audio: true
},
participants: [],
createdAt: Date.now()
};

const mockParticipants: Participant[] = [
{
id: 'p1',
userId: 'user-1',
role: 'host',
connectionStatus: 'connected',
user: { id: 'user-1', name: 'You' }
},
{
id: 'p2',
userId: 'user-2',
role: 'player',
connectionStatus: 'connected',
user: { id: 'user-2', name: 'Alice Johnson' }
},
{
id: 'p3',
userId: 'user-3',
role: 'player',
connectionStatus: 'connected',
user: { id: 'user-3', name: 'Bob Smith' }
}
];

const mockMessages: (ChatMessage | MediaMessage)[] = [
{
id: '1',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: 'Hey! How are you doing?',
timestamp: Date.now() - 300000
},
{
id: '2',
sessionId: 'demo-session',
fromUserId: 'user-1',
payload: "I'm doing great! Just working on this new messaging feature.",
timestamp: Date.now() - 240000
},
{
id: '3',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: 'That sounds exciting! Can you share a screenshot?',
timestamp: Date.now() - 180000
},
{
id: '4',
sessionId: 'demo-session',
fromUserId: 'user-1',
payload: { caption: 'Here is what it looks like!' },
mediaUrl: 'https://via.placeholder.com/300x200/667eea/ffffff?text=Demo+Screenshot',
mediaType: 'image/png',
timestamp: Date.now() - 120000
} as MediaMessage,
{
id: '5',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: 'Wow, that looks amazing! 🎉',
timestamp: Date.now() - 60000
}
];

let currentView: 'inbox' | 'chat' | 'video' = 'chat';
</script>

<div class="demo-container">
<h1>💬 Messaging Embed Demo</h1>

<div class="view-controls">
<button class:active={currentView === 'inbox'} on:click={() => (currentView = 'inbox')}>
Inbox
</button>
<button class:active={currentView === 'chat'} on:click={() => (currentView = 'chat')}>
Chat
</button>
<button class:active={currentView === 'video'} on:click={() => (currentView = 'video')}>
Video
</button>
</div>

<div class="embed-wrapper">
<div class="messaging-embed">
{#if currentView === 'inbox'}
<ConversationList
participants={mockParticipants}
sessionInfo={mockSession}
onSelectConversation={() => {}}
/>
{:else if currentView === 'chat'}
<ChatView
messages={mockMessages}
conversationName="Alice Johnson"
currentUserId="user-1"
localStream={null}
remoteStreams={new Map()}
onBack={() => {}}
onSendMessage={() => {}}
onSendMedia={() => {}}
onStartVideoCall={() => currentView = 'video'}
/>
{:else}
<VideoCallPanel
conversationName="Alice Johnson"
localStream={null}
remoteStreams={new Map()}
onEndCall={() => currentView = 'chat'}
/>
{/if}
</div>
</div>
</div>

<style>
.demo-container {
min-height: 100vh;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
padding: 2rem;
}

h1 {
text-align: center;
color: white;
margin-bottom: 2rem;
}

.view-controls {
display: flex;
justify-content: center;
gap: 1rem;
margin-bottom: 2rem;
}

.view-controls button {
padding: 0.75rem 1.5rem;
background: rgba(255, 255, 255, 0.2);
color: white;
border: 2px solid transparent;
border-radius: 8px;
cursor: pointer;
font-weight: 500;
transition: all 0.2s;
}

.view-controls button.active {
background: white;
color: #667eea;
}

.embed-wrapper {
display: flex;
justify-content: center;
}

.messaging-embed {
width: 100%;
max-width: 500px;
height: 600px;
background: #ffffff;
border-radius: 12px;
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
overflow: hidden;
display: flex;
flex-direction: column;
}
</style>
