# StackLive Device Capability Infrastructure

Complete infrastructure for bridging StackLive embeds with native device capabilities across all supported surfaces.

## 🎯 Overview

This infrastructure enables StackLive embeds to access native device capabilities including:

- **Camera** - Photo/video capture and streaming
- **Microphone** - Audio recording and streaming
- **Motion** - Accelerometer, gyroscope, and motion sensors
- **Bluetooth** - Device scanning and connection
- **NFC** - Contactless communication
- **Wallet** - Apple Pay, Google Pay, Payment Request API
- **Location** - GPS and geolocation services
- **File System** - File reading and writing
- **Screen Capture** - Screen sharing and recording
- **Biometrics** - Face ID, Touch ID, fingerprint
- **Proximity** - Nearby device detection via BLE beacons
- **Push Notifications** - Device notifications
- **Nearby Devices** - P2P device discovery
- **Spatial Audio** - 3D audio processing

## 📁 Architecture

```
src/
├── backend/device-runtime/          # Core device capability runtime
│   ├── DeviceCapabilityManager.ts   # Central orchestrator
│   ├── CapabilityRegistry.ts        # Capability definitions
│   ├── PermissionManager.ts         # Permission handling
│   ├── NativeBridgeAdapter.ts       # Native app bridge
│   ├── WebFallbackAdapter.ts        # Web API fallback
│   ├── DeviceEventBus.ts            # Event system
│   ├── useStackLiveDevice.ts        # Svelte hook
│   ├── types.ts                     # TypeScript types
│   └── index.ts                     # Module exports
│
├── native-bridge/                   # Native communication protocol
│   ├── StackLiveNativeBridge.ts     # Bridge interface
│   ├── CapabilityMessageProtocol.ts # Message types
│   └── index.ts                     # Module exports
│
└── frontend/device-demos/           # Demo web components
    ├── device-capability-tester.upgraded.svelte
    ├── motion-controller-game.upgraded.svelte
    ├── camera-broadcast-demo.upgraded.svelte
    ├── wallet-purchase-demo.upgraded.svelte
    └── proximity-activation-demo.upgraded.svelte
```

## 🚀 Quick Start

### Using in Svelte Components

```typescript
import { useStackLiveDevice } from '$lib/device-runtime/useStackLiveDevice';

const device = useStackLiveDevice({
  embedId: 'my-embed',
  debug: true
});

// Start camera
await device.camera.start();

// Stop camera
await device.camera.stop();

// Check support
const isSupported = device.camera.isSupported();

// Subscribe to events
device.camera.subscribe((data) => {
  console.log('Camera data:', data);
});
```

### Using in Web Components

```html
<sl-device-tester embedid="my-tester" debug="true"></sl-device-tester>
<sl-camera-demo embedid="camera-1"></sl-camera-demo>
<sl-motion-demo embedid="motion-1"></sl-motion-demo>
<sl-wallet-demo embedid="wallet-1"></sl-wallet-demo>
<sl-proximity-demo embedid="proximity-1"></sl-proximity-demo>
```

## 🔌 Supported Surfaces

Each capability declares which surfaces it supports:

- **native-ios** - iOS native app
- **native-android** - Android native app
- **web** - Web browser
- **mini-app** - WeChat/AliPay mini apps
- **extension** - Browser extensions

## 🎮 Available Capabilities

### Camera
```typescript
await device.camera.start();        // Get MediaStream
await device.camera.stop();         // Stop stream
device.camera.isSupported();        // Check support
device.camera.isActive();           // Check if active
device.camera.hasPermission();      // Check permission
```

### Microphone
```typescript
await device.microphone.start();
await device.microphone.stop();
device.microphone.subscribe((audio) => {
  // Handle audio data
});
```

### Motion
```typescript
await device.motion.start();
device.motion.subscribe((data) => {
  console.log(data.x, data.y, data.z);      // Acceleration
  console.log(data.alpha, data.beta, data.gamma);  // Rotation
});
```

### Bluetooth
```typescript
await device.bluetooth.start();
// Uses Web Bluetooth API
```

### Wallet
```typescript
await device.wallet.start();
// Enables Apple Pay / Google Pay
```

### Location
```typescript
const state = await device.location.start();
console.log(state.data.latitude, state.data.longitude);
```

### Screen Capture
```typescript
const state = await device.screen.start();
const stream = state.data.stream;  // MediaStream for screen
```

## 🔐 Permission System

Permissions are managed centrally and persisted:

```typescript
// Scopes
- 'one-time'    // 1 minute
- 'session'     // 24 hours (default)
- 'always'      // Never expires
- 'embed-level' // 7 days
- 'host-level'  // Never expires

// Permission is automatically requested when starting a capability
await device.camera.start();  // Triggers permission request

// Check permission status
const hasPermission = device.camera.hasPermission();

// Revoke permission
device.revokePermission('camera');
```

## 📡 Event System

Subscribe to capability events:

```typescript
// Capability-specific events
device.camera.subscribe((data) => {
  console.log('Camera data:', data);
});

// Global events
device.subscribe('capability.activated', (data) => {
  console.log('Capability activated:', data.capability);
});

device.subscribe('capability.error', (data) => {
  console.log('Error:', data.error);
});

// Available events:
- 'capability.activated'
- 'capability.deactivated'
- 'capability.data'
- 'capability.error'
- 'permission.granted'
- 'permission.denied'
- 'proximity.enter'
- 'proximity.exit'
- 'motion.change'
- 'camera.start'
- 'camera.stop'
```

## 🌉 Native Bridge Integration

### For Native iOS Apps (Swift)

```swift
class StackLiveNativeBridge: NSObject, WKScriptMessageHandler {
  func userContentController(_ userContentController: WKUserContentController, 
                           didReceive message: WKScriptMessage) {
    guard let dict = message.body as? [String: Any],
          let type = dict["type"] as? String,
          let capability = dict["capability"] as? String else {
      return
    }
    
    switch type {
    case "REQUEST_CAPABILITY":
      handleCapabilityRequest(capability: capability)
    default:
      break
    }
  }
  
  func handleCapabilityRequest(capability: String) {
    // Grant camera access
    if capability == "camera" {
      AVCaptureDevice.requestAccess(for: .video) { granted in
        let response: [String: Any] = [
          "type": "CAPABILITY_GRANTED",
          "capability": "camera",
          "status": "active"
        ]
        // Send response back to WebView
        self.sendMessage(response)
      }
    }
  }
}
```

### For Native Android Apps (Kotlin)

```kotlin
class StackLiveNativeBridge(private val webView: WebView) {
  @JavascriptInterface
  fun postMessage(message: String) {
    val json = JSONObject(message)
    val type = json.getString("type")
    val capability = json.getString("capability")
    
    when (type) {
      "REQUEST_CAPABILITY" -> handleCapabilityRequest(capability)
    }
  }
  
  fun handleCapabilityRequest(capability: String) {
    when (capability) {
      "camera" -> {
        // Request camera permission
        requestCameraPermission { granted ->
          val response = JSONObject().apply {
            put("type", "CAPABILITY_GRANTED")
            put("capability", "camera")
            put("status", "active")
          }
          sendToWebView(response)
        }
      }
    }
  }
}
```

## 🔧 Configuration

```typescript
const device = useStackLiveDevice({
  embedId: 'my-embed',          // Unique embed identifier
  surface: 'web',               // Override surface detection
  preferNative: true,           // Prefer native bridge over web APIs
  debug: true                   // Enable debug logging
});
```

## 📊 Capability Registry

All capabilities are defined in `CapabilityRegistry.ts` with:

```typescript
{
  name: 'camera',
  displayName: 'Camera',
  requiredPermissions: ['camera'],
  supportedSurfaces: ['native-ios', 'native-android', 'web', 'mini-app'],
  securityClassification: 'high',
  canStream: true,
  crossSurfaceSync: true,
  description: 'Access device camera for photo/video capture and streaming'
}
```

## 🎨 Demo Components

### Device Capability Tester
Complete testing interface for all capabilities:
```html
<sl-device-tester embedid="tester" debug="true"></sl-device-tester>
```

### Motion Controller Game
Tilt-based ball control:
```html
<sl-motion-demo embedid="motion"></sl-motion-demo>
```

### Camera Broadcast
Live camera streaming with snapshot:
```html
<sl-camera-demo embedid="camera"></sl-camera-demo>
```

### Wallet Payment
Payment capability demo:
```html
<sl-wallet-demo embedid="wallet"></sl-wallet-demo>
```

### Proximity Detection
Nearby device scanning:
```html
<sl-proximity-demo embedid="proximity"></sl-proximity-demo>
```

## 🔒 Security

- All capabilities require explicit permission request
- Permissions are scoped and time-limited
- Host apps can enforce allowlists per embed
- No direct native object exposure
- All bridge messages are validated
- Capability-level isolation

## 🧪 Testing

Build the project:
```bash
npm run build
```

Run in development:
```bash
npm run dev
```

Open test page:
```
http://localhost:8080/test-device-capabilities.html
```

## 📝 Future Enhancements

- [ ] Hardware stream optimization for 60fps motion data
- [ ] Cross-surface state synchronization via mem0
- [ ] WebRTC-based capability streaming
- [ ] Advanced biometric authentication flows
- [ ] NFC tag reading/writing
- [ ] Beacon-based proximity triggers
- [ ] Multi-device hardware sync

## 🤝 Contributing

When adding new capabilities:

1. Add capability definition to `CapabilityRegistry.ts`
2. Implement web support in `WebFallbackAdapter.ts`
3. Add native bridge handling in `NativeBridgeAdapter.ts`
4. Update TypeScript types in `types.ts`
5. Create demo component in `src/frontend/device-demos/`
6. Update this documentation

## 📚 Related Documentation

- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [Payment Request API](https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Device Motion API](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent)

---

**Built with ❤️ for StackLive Platform**
