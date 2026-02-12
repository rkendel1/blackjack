import { d as derived, w as writable } from "./index.js";
import { S as StackLiveMultiplayerRuntime } from "./StackLiveMultiplayerRuntime.js";
function useStackLiveMultiplayer(config) {
  let runtime = null;
  const session = writable(null);
  const participants = writable([]);
  const connectionQuality = writable({
    latency: 0,
    jitter: 0,
    packetLoss: 0,
    quality: "excellent"
  });
  const sessionState = writable("IDLE");
  const isHost = writable(false);
  const isConnected = writable(false);
  const playerCount = derived(
    participants,
    ($participants) => $participants.filter((p) => p.role === "player").length
  );
  const spectatorCount = derived(
    participants,
    ($participants) => $participants.filter((p) => p.role === "spectator").length
  );
  function initialize(userId) {
    if (runtime) {
      runtime.destroy();
    }
    runtime = new StackLiveMultiplayerRuntime(config, userId);
    runtime.on("playerJoined", (data) => {
      updateSession();
    });
    runtime.on("playerLeft", (data) => {
      updateSession();
    });
    runtime.on("connectionLost", () => {
      isConnected.set(false);
    });
    runtime.on("reconnected", () => {
      isConnected.set(true);
    });
    runtime.on("gameStart", () => {
      updateSession();
    });
    runtime.on("gameEnd", () => {
      session.set(null);
      participants.set([]);
      sessionState.set("ENDED");
    });
    runtime.on("stateChanged", (data) => {
      updateSession();
    });
    setInterval(() => {
      if (runtime) {
        connectionQuality.set(runtime.getConnectionQuality());
      }
    }, 2e3);
  }
  async function createSession() {
    if (!runtime) {
      initialize();
    }
    try {
      const newSession = await runtime.createSession();
      session.set(newSession);
      isHost.set(true);
      sessionState.set(newSession.status);
      participants.set(newSession.participants);
      return newSession;
    } catch (error) {
      console.error("Failed to create session:", error);
      return null;
    }
  }
  async function joinSession(sessionId) {
    if (!runtime) {
      initialize();
    }
    try {
      const participant = await runtime.joinSession(sessionId);
      if (participant) {
        updateSession();
        isHost.set(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to join session:", error);
      return false;
    }
  }
  function leaveSession() {
    if (runtime) {
      runtime.leaveSession();
      session.set(null);
      participants.set([]);
      sessionState.set("IDLE");
      isHost.set(false);
    }
  }
  function sendInput(input) {
    if (runtime) {
      runtime.sendInput(input);
    }
  }
  function sendState(state) {
    if (runtime) {
      runtime.sendState(state);
    }
  }
  function requestStateSync() {
    if (runtime) {
      runtime.requestStateSync();
    }
  }
  function onInput(callback) {
    if (runtime) {
      runtime.onInput(callback);
    }
  }
  function onStateSync(callback) {
    if (runtime) {
      runtime.onStateSync(callback);
    }
  }
  function getLatency() {
    return runtime?.getLatency() ?? 0;
  }
  function updateSession() {
    if (runtime) {
      const currentSession = runtime.getSession();
      if (currentSession) {
        session.set(currentSession);
        participants.set(currentSession.participants);
        sessionState.set(currentSession.status);
        isHost.set(runtime.isHost());
      }
    }
  }
  function destroy() {
    if (runtime) {
      runtime.destroy();
      runtime = null;
    }
  }
  initialize();
  return {
    // Stores
    session,
    participants,
    connectionQuality,
    sessionState,
    isHost,
    isConnected,
    playerCount,
    spectatorCount,
    // Actions
    createSession,
    joinSession,
    leaveSession,
    sendInput,
    sendState,
    requestStateSync,
    onInput,
    onStateSync,
    getLatency,
    destroy
  };
}
export {
  useStackLiveMultiplayer as u
};
