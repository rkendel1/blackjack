<svelte:head>
	<title>StackLive Messenger - Voice, Video & Text Chat</title>
	<meta name="description" content="Real-time messaging app with voice, video calls, media sharing, and reactions" />
</svelte:head>

<script lang="ts">
import ConversationList from '$lib/Components/messaging/ConversationList.svelte';
import ChatView from '$lib/Components/messaging/ChatView.svelte';
import VideoCallPanel from '$lib/Components/messaging/VideoCallPanel.svelte';
import type { Participant, Session, ChatMessage, MediaMessage } from '$lib/multiplayer/types';

// Mock data - Realistic messaging app data
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
user: { id: 'user-1', name: 'You', avatar: 'https://i.pravatar.cc/150?img=33' }
},
{
id: 'p2',
userId: 'user-2',
role: 'player',
connectionStatus: 'connected',
user: { id: 'user-2', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?img=47' }
},
{
id: 'p3',
userId: 'user-3',
role: 'player',
connectionStatus: 'connected',
user: { id: 'user-3', name: 'Bob Smith', avatar: 'https://i.pravatar.cc/150?img=12' }
},
{
id: 'p4',
userId: 'user-4',
role: 'player',
connectionStatus: 'connected',
user: { id: 'user-4', name: 'Sarah Williams', avatar: 'https://i.pravatar.cc/150?img=25' }
},
{
id: 'p5',
userId: 'user-5',
role: 'player',
connectionStatus: 'disconnected',
user: { id: 'user-5', name: 'Mike Chen', avatar: 'https://i.pravatar.cc/150?img=8' }
}
];

const mockMessages: (ChatMessage | MediaMessage)[] = [
{
id: '1',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: 'Hey! How are you doing?',
timestamp: Date.now() - 500000
},
{
id: '2',
sessionId: 'demo-session',
fromUserId: 'user-1',
payload: "I'm doing great! Just working on this new messaging feature.",
timestamp: Date.now() - 480000
},
{
id: '3',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: 'That sounds exciting! Can you share a screenshot?',
timestamp: Date.now() - 450000
},
{
id: '4',
sessionId: 'demo-session',
fromUserId: 'user-1',
payload: { caption: 'Here is what it looks like!' },
mediaUrl: 'https://picsum.photos/400/300',
mediaType: 'image/png',
timestamp: Date.now() - 420000
} as MediaMessage,
{
id: '5',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: 'Wow, that looks amazing! 🎉',
timestamp: Date.now() - 400000
},
{
id: '6',
sessionId: 'demo-session',
fromUserId: 'user-1',
payload: 'Thanks! Let me send you a quick demo video',
timestamp: Date.now() - 360000
},
{
id: '7',
sessionId: 'demo-session',
fromUserId: 'user-1',
payload: { caption: 'Video demo of the messaging features' },
mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
mediaType: 'video/mp4',
timestamp: Date.now() - 340000
} as MediaMessage,
{
id: '8',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: 'Great video! The features look comprehensive.',
timestamp: Date.now() - 300000
},
{
id: '9',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: { caption: 'Voice message' },
mediaUrl: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
mediaType: 'audio/wav',
timestamp: Date.now() - 260000
} as MediaMessage,
{
id: '10',
sessionId: 'demo-session',
fromUserId: 'user-1',
payload: 'Nice! Audio messages work perfectly too.',
timestamp: Date.now() - 240000
},
{
id: '11',
sessionId: 'demo-session',
fromUserId: 'user-1',
payload: { caption: 'Another screenshot showing the UI' },
mediaUrl: 'https://picsum.photos/500/350',
mediaType: 'image/jpeg',
timestamp: Date.now() - 200000
} as MediaMessage,
{
id: '12',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: 'Perfect! All media types are working great. 🎊',
timestamp: Date.now() - 160000
},
{
id: '13',
sessionId: 'demo-session',
fromUserId: 'user-1',
payload: 'Should we try a video call?',
timestamp: Date.now() - 120000
},
{
id: '14',
sessionId: 'demo-session',
fromUserId: 'user-2',
payload: 'Absolutely! Let me know when you are ready.',
timestamp: Date.now() - 60000
}
];

let currentView: 'inbox' | 'chat' | 'video' = 'inbox';
let selectedConversation = mockParticipants[1]; // Alice Johnson by default

function handleSelectConversation(userId: string) {
const participant = mockParticipants.find(p => p.userId === userId);
if (participant) {
selectedConversation = participant;
currentView = 'chat';
}
}

function handleBack() {
currentView = 'inbox';
}

</script>

<!-- Full screen messaging app - like WhatsApp/iMessage -->
<div class="messaging-app">
{#if currentView === 'inbox'}
<ConversationList
participants={mockParticipants}
sessionInfo={mockSession}
onSelectConversation={handleSelectConversation}
/>
{:else if currentView === 'chat'}
<ChatView
messages={mockMessages}
conversationName={selectedConversation.user?.name || 'Unknown'}
currentUserId="user-1"
onBack={handleBack}
onSendMessage={() => {}}
onSendMedia={() => {}}
onStartVideoCall={() => currentView = 'video'}
/>
{:else if currentView === 'video'}
<VideoCallPanel
conversationName={selectedConversation.user?.name || 'Unknown'}
localStream={null}
remoteStreams={new Map()}
onEndCall={() => currentView = 'chat'}
/>
{/if}
</div>

<style>
.messaging-app {
width: 100vw;
height: 100vh;
background: #ffffff;
overflow: hidden;
display: flex;
flex-direction: column;
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Override global styles to make it look like a real app */
:global(body) {
margin: 0;
padding: 0;
overflow: hidden;
}
</style>
