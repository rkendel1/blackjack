# Bluetooth Web Component

A reusable Bluetooth utility embed component that provides a complete Bluetooth device management interface. Built with Svelte 4 and the Web Bluetooth API.

## Overview

The Bluetooth component (`sl-bluetooth`) provides a full-featured interface for:
- Scanning for Bluetooth devices
- Connecting to devices
- Managing paired devices
- Device status tracking
- Persistent device pairing

## Architecture

The component follows the same pattern as other web components in this repository:

### Backend (`src/backend/bluetooth/`)
- **BluetoothBackend.ts** - Core backend with Svelte stores and actions
- **bluetooth.d.ts** - TypeScript type definitions for Web Bluetooth API
- **index.ts** - Module exports

### Frontend (`src/frontend/bluetooth/`)
- **sl-bluetooth.upgraded.svelte** - Main web component wrapper
- **BluetoothControl.svelte** - Toggle and scan controls
- **DeviceList.svelte** - List of devices
- **DeviceItem.svelte** - Individual device display

## Usage

### Basic Usage

```html
<sl-bluetooth
    embedId="bluetooth-embed"
    deviceName="My Device"
    autoScan="false"
    persistDevices="true"
    theme="light"
></sl-bluetooth>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `embedId` | string | `'bluetooth-embed'` | Unique identifier for the component |
| `deviceName` | string | `'This Device'` | Display name for this device |
| `autoScan` | string | `'false'` | Automatically scan for devices on mount |
| `persistDevices` | string | `'true'` | Remember paired devices in localStorage |
| `theme` | string | `'light'` | UI theme (`'light'` or `'dark'`) |

### Events

The component emits custom events that you can listen for:

```javascript
const bluetooth = document.querySelector('sl-bluetooth');

bluetooth.addEventListener('ready', (e) => {
    console.log('Component ready:', e.detail);
    // { embedId: string, supported: boolean }
});

bluetooth.addEventListener('deviceconnected', (e) => {
    console.log('Device connected:', e.detail);
    // { id: string, name: string, connected: boolean, paired: boolean }
});

bluetooth.addEventListener('devicedisconnected', (e) => {
    console.log('Device disconnected:', e.detail);
});

bluetooth.addEventListener('error', (e) => {
    console.error('Bluetooth error:', e.detail.error);
});
```

## Backend API

### Creating a Bluetooth Backend

```typescript
import { createBluetoothBackend } from '$lib/backend/bluetooth';

const backend = createBluetoothBackend({
    embedId: 'my-bluetooth',
    autoScan: false,
    persistDevices: true,
    debug: true
});
```

### Stores

The backend exposes the following Svelte stores:

- `isEnabled` - Whether Bluetooth is enabled
- `isScanning` - Whether currently scanning for devices
- `availableDevices` - Array of all discovered devices
- `connectedDevices` - Array of currently connected devices
- `pairedDevices` - Array of paired devices
- `error` - Current error message (null if no error)
- `isSupported` - Whether Web Bluetooth API is supported

### Actions

- `enable()` - Enable Bluetooth
- `disable()` - Disable Bluetooth and disconnect all devices
- `scan()` - Scan for nearby Bluetooth devices
- `stopScan()` - Stop scanning
- `connect(deviceId)` - Connect to a device
- `disconnect(deviceId)` - Disconnect from a device
- `forget(deviceId)` - Forget a paired device
- `getDeviceInfo(deviceId)` - Get information about a device
- `on(event, callback)` - Listen for events
- `destroy()` - Clean up and destroy the backend

## Browser Support

The Web Bluetooth API is supported in:
- Chrome/Edge (desktop and Android)
- Opera (desktop and Android)

**Requirements:**
- HTTPS or localhost
- User gesture (button click) to initiate pairing

**Not supported:**
- Firefox
- Safari/iOS
- WebView components

## Example Integration

### Adding to Another Component

To make any component Bluetooth-enabled, you can embed the Bluetooth component:

```svelte
<script>
    import { createBluetoothBackend } from '$lib/backend/bluetooth';
    
    const bluetooth = createBluetoothBackend({
        embedId: 'my-app-bluetooth'
    });
    
    const { connectedDevices, connect, disconnect } = bluetooth;
</script>

<div class="my-app">
    <!-- Your app content -->
    
    <!-- Bluetooth controls -->
    <sl-bluetooth embedId="my-app-bluetooth"></sl-bluetooth>
    
    {#if $connectedDevices.length > 0}
        <p>Connected to {$connectedDevices.length} device(s)</p>
    {/if}
</div>
```

## Features

### Device Management
- **Scan**: Discover nearby Bluetooth devices
- **Connect**: Pair and connect to devices
- **Disconnect**: Disconnect from devices while keeping them paired
- **Forget**: Remove devices from paired list

### Persistence
- Paired devices are stored in localStorage
- Devices persist across page reloads
- Can be disabled with `persistDevices="false"`

### iOS-Style Design
- Follows iOS Bluetooth settings design
- Clean, modern interface
- Responsive layout
- Dark mode support

## Demo

A demo page is available at `public/bluetooth-demo.html` showing the component in action with event logging.

## Technical Details

### Type Definitions

The component includes comprehensive TypeScript type definitions for the Web Bluetooth API in `src/backend/bluetooth/bluetooth.d.ts`.

### Error Handling

The component handles common errors:
- Browser not supported
- User cancelled pairing
- Device not found
- Connection failed

All errors are exposed through the `error` store and `error` event.

### Security

- Requires secure context (HTTPS or localhost)
- Requires user interaction to pair devices
- No automatic connections without user consent

## Future Enhancements

Potential improvements:
- GATT service interactions
- Battery level monitoring
- Signal strength (RSSI) display
- Device filtering by service UUID
- Custom pairing UI

## Related Components

- **Messaging** (`sl-messaging`) - Real-time messaging with WebRTC
- **AR/VR** (`sl-arvr-*`) - AR/VR experiences
- **Games** (`sl-tictactoe`) - Multiplayer games

## License

Part of the blackjack-svelte-4 project.
