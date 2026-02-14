# Native Bridge Integration Guide

This guide helps native iOS and Android developers integrate the StackLive Device Capability infrastructure into their apps.

## Overview

The StackLive Native Bridge enables WebView-based embeds to access native device capabilities through a standardized message-passing interface.

## Message Protocol

All communication uses JSON messages with this structure:

```typescript
interface NativeBridgeMessage {
  type: 'REQUEST_CAPABILITY' | 'CAPABILITY_GRANTED' | 'CAPABILITY_DENIED' | 'CAPABILITY_DATA' | 'CAPABILITY_ERROR';
  capability: string;  // e.g., 'camera', 'microphone', 'motion'
  requestId?: string;
  data?: any;
  error?: string;
}
```

## iOS Integration (Swift)

### 1. Setup WKWebView with Message Handler

```swift
import WebKit

class ViewController: UIViewController, WKScriptMessageHandler {
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let config = WKWebViewConfiguration()
        let controller = WKUserContentController()
        
        // Register message handler
        controller.add(self, name: "StackLiveNativeBridge")
        config.userContentController = controller
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        view.addSubview(webView)
        
        // Load StackLive embed
        if let url = URL(string: "https://your-stacklive-embed.com") {
            webView.load(URLRequest(url: url))
        }
    }
    
    // Handle messages from WebView
    func userContentController(_ userContentController: WKUserContentController, 
                              didReceive message: WKScriptMessage) {
        guard let dict = message.body as? [String: Any],
              let type = dict["type"] as? String,
              let capability = dict["capability"] as? String else {
            return
        }
        
        let requestId = dict["requestId"] as? String
        
        switch type {
        case "REQUEST_CAPABILITY":
            handleCapabilityRequest(capability: capability, requestId: requestId)
        default:
            break
        }
    }
}
```

### 2. Implement Capability Handlers

```swift
extension ViewController {
    func handleCapabilityRequest(capability: String, requestId: String?) {
        switch capability {
        case "camera":
            requestCameraAccess(requestId: requestId)
        case "microphone":
            requestMicrophoneAccess(requestId: requestId)
        case "location":
            requestLocationAccess(requestId: requestId)
        case "motion":
            requestMotionAccess(requestId: requestId)
        case "bluetooth":
            requestBluetoothAccess(requestId: requestId)
        default:
            sendDenied(capability: capability, 
                      error: "Capability not supported", 
                      requestId: requestId)
        }
    }
    
    func requestCameraAccess(requestId: String?) {
        AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
            DispatchQueue.main.async {
                if granted {
                    self?.sendGranted(capability: "camera", requestId: requestId)
                } else {
                    self?.sendDenied(capability: "camera", 
                                    error: "Camera permission denied",
                                    requestId: requestId)
                }
            }
        }
    }
    
    func requestMicrophoneAccess(requestId: String?) {
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            DispatchQueue.main.async {
                if granted {
                    self?.sendGranted(capability: "microphone", requestId: requestId)
                } else {
                    self?.sendDenied(capability: "microphone",
                                    error: "Microphone permission denied",
                                    requestId: requestId)
                }
            }
        }
    }
    
    func requestLocationAccess(requestId: String?) {
        let manager = CLLocationManager()
        manager.requestWhenInUseAuthorization()
        
        // Check authorization status
        let status = manager.authorizationStatus
        if status == .authorizedWhenInUse || status == .authorizedAlways {
            sendGranted(capability: "location", requestId: requestId)
        } else {
            sendDenied(capability: "location",
                      error: "Location permission denied",
                      requestId: requestId)
        }
    }
    
    func requestMotionAccess(requestId: String?) {
        // Motion data is available without explicit permission on iOS
        sendGranted(capability: "motion", requestId: requestId)
    }
    
    func requestBluetoothAccess(requestId: String?) {
        // Bluetooth requires CBCentralManager
        let manager = CBCentralManager()
        
        if manager.state == .poweredOn {
            sendGranted(capability: "bluetooth", requestId: requestId)
        } else {
            sendDenied(capability: "bluetooth",
                      error: "Bluetooth not available",
                      requestId: requestId)
        }
    }
}
```

### 3. Send Responses to WebView

```swift
extension ViewController {
    func sendGranted(capability: String, requestId: String?, data: [String: Any]? = nil) {
        var message: [String: Any] = [
            "type": "CAPABILITY_GRANTED",
            "capability": capability,
            "status": "active"
        ]
        
        if let requestId = requestId {
            message["requestId"] = requestId
        }
        
        if let data = data {
            message["data"] = data
        }
        
        sendMessage(message)
    }
    
    func sendDenied(capability: String, error: String, requestId: String?) {
        var message: [String: Any] = [
            "type": "CAPABILITY_DENIED",
            "capability": capability,
            "error": error
        ]
        
        if let requestId = requestId {
            message["requestId"] = requestId
        }
        
        sendMessage(message)
    }
    
    func sendData(capability: String, data: Any) {
        let message: [String: Any] = [
            "type": "CAPABILITY_DATA",
            "capability": capability,
            "data": data,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        
        sendMessage(message)
    }
    
    func sendMessage(_ message: [String: Any]) {
        if let jsonData = try? JSONSerialization.data(withJSONObject: message),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            let script = "window.postMessage(\(jsonString), '*');"
            webView.evaluateJavaScript(script)
        }
    }
}
```

### 4. Stream Motion Data

```swift
import CoreMotion

class MotionManager {
    let motionManager = CMMotionManager()
    weak var viewController: ViewController?
    
    func startMotionUpdates() {
        guard motionManager.isDeviceMotionAvailable else { return }
        
        motionManager.deviceMotionUpdateInterval = 1.0 / 60.0  // 60 FPS
        motionManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
            guard let motion = motion, let vc = self?.viewController else { return }
            
            let data: [String: Any] = [
                "acceleration": [
                    "x": motion.userAcceleration.x,
                    "y": motion.userAcceleration.y,
                    "z": motion.userAcceleration.z
                ],
                "rotation": [
                    "alpha": motion.attitude.roll,
                    "beta": motion.attitude.pitch,
                    "gamma": motion.attitude.yaw
                ]
            ]
            
            vc.sendData(capability: "motion", data: data)
        }
    }
}
```

## Android Integration (Kotlin)

### 1. Setup WebView with JavaScript Interface

```kotlin
import android.webkit.WebView
import android.webkit.JavascriptInterface
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        setContentView(webView)
        
        // Enable JavaScript
        webView.settings.javaScriptEnabled = true
        
        // Add JavaScript interface
        webView.addJavascriptInterface(
            StackLiveNativeBridge(this, webView),
            "StackLiveNativeBridge"
        )
        
        // Load StackLive embed
        webView.loadUrl("https://your-stacklive-embed.com")
    }
}
```

### 2. Implement Native Bridge

```kotlin
class StackLiveNativeBridge(
    private val context: Context,
    private val webView: WebView
) {
    private val permissionManager = PermissionManager(context)
    
    @JavascriptInterface
    fun postMessage(message: String) {
        try {
            val json = JSONObject(message)
            val type = json.getString("type")
            val capability = json.getString("capability")
            val requestId = json.optString("requestId", null)
            
            when (type) {
                "REQUEST_CAPABILITY" -> handleCapabilityRequest(capability, requestId)
            }
        } catch (e: Exception) {
            Log.e("NativeBridge", "Error processing message", e)
        }
    }
    
    private fun handleCapabilityRequest(capability: String, requestId: String?) {
        when (capability) {
            "camera" -> requestCamera(requestId)
            "microphone" -> requestMicrophone(requestId)
            "location" -> requestLocation(requestId)
            "motion" -> requestMotion(requestId)
            "bluetooth" -> requestBluetooth(requestId)
            else -> sendDenied(capability, "Capability not supported", requestId)
        }
    }
}
```

### 3. Implement Permission Handlers

```kotlin
class StackLiveNativeBridge(/*...*/) {
    private fun requestCamera(requestId: String?) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED) {
            sendGranted("camera", requestId)
        } else {
            permissionManager.requestPermission(
                Manifest.permission.CAMERA,
                onGranted = { sendGranted("camera", requestId) },
                onDenied = { sendDenied("camera", "Permission denied", requestId) }
            )
        }
    }
    
    private fun requestMicrophone(requestId: String?) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
            == PackageManager.PERMISSION_GRANTED) {
            sendGranted("microphone", requestId)
        } else {
            permissionManager.requestPermission(
                Manifest.permission.RECORD_AUDIO,
                onGranted = { sendGranted("microphone", requestId) },
                onDenied = { sendDenied("microphone", "Permission denied", requestId) }
            )
        }
    }
    
    private fun requestLocation(requestId: String?) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
            sendGranted("location", requestId)
        } else {
            permissionManager.requestPermission(
                Manifest.permission.ACCESS_FINE_LOCATION,
                onGranted = { sendGranted("location", requestId) },
                onDenied = { sendDenied("location", "Permission denied", requestId) }
            )
        }
    }
}
```

### 4. Send Messages to WebView

```kotlin
class StackLiveNativeBridge(/*...*/) {
    private fun sendGranted(capability: String, requestId: String?, data: JSONObject? = null) {
        val message = JSONObject().apply {
            put("type", "CAPABILITY_GRANTED")
            put("capability", capability)
            put("status", "active")
            requestId?.let { put("requestId", it) }
            data?.let { put("data", it) }
        }
        
        sendToWebView(message)
    }
    
    private fun sendDenied(capability: String, error: String, requestId: String?) {
        val message = JSONObject().apply {
            put("type", "CAPABILITY_DENIED")
            put("capability", capability)
            put("error", error)
            requestId?.let { put("requestId", it) }
        }
        
        sendToWebView(message)
    }
    
    private fun sendData(capability: String, data: JSONObject) {
        val message = JSONObject().apply {
            put("type", "CAPABILITY_DATA")
            put("capability", capability)
            put("data", data)
            put("timestamp", System.currentTimeMillis())
        }
        
        sendToWebView(message)
    }
    
    private fun sendToWebView(message: JSONObject) {
        webView.post {
            val script = "window.postMessage(${message}, '*');"
            webView.evaluateJavascript(script, null)
        }
    }
}
```

## Testing the Integration

### 1. Test from Browser Console

```javascript
// Send test message
window.StackLiveNativeBridge.postMessage(JSON.stringify({
  type: 'REQUEST_CAPABILITY',
  capability: 'camera',
  requestId: 'test-123'
}));

// Listen for responses
window.addEventListener('message', (event) => {
  console.log('Received:', event.data);
});
```

### 2. Use Device Capability Tester Component

```html
<sl-device-tester embedid="test" debug="true"></sl-device-tester>
```

## Security Considerations

1. **Validate all messages** - Check message format and capability names
2. **Implement allowlists** - Only grant capabilities the embed is authorized to use
3. **Rate limiting** - Prevent excessive permission requests
4. **User consent** - Always show native permission dialogs
5. **Audit logging** - Log all capability requests and grants

## Supported Capabilities

| Capability | iOS Permission | Android Permission |
|------------|----------------|-------------------|
| camera | `NSCameraUsageDescription` | `CAMERA` |
| microphone | `NSMicrophoneUsageDescription` | `RECORD_AUDIO` |
| location | `NSLocationWhenInUseUsageDescription` | `ACCESS_FINE_LOCATION` |
| motion | None required | None required |
| bluetooth | `NSBluetoothAlwaysUsageDescription` | `BLUETOOTH_SCAN` |
| nfc | `NFCReaderUsageDescription` | `NFC` |
| push_notifications | Push Notification entitlement | None required |

## Troubleshooting

### iOS: Messages not received
- Check `info.plist` for required permission descriptions
- Verify message handler name matches: `StackLiveNativeBridge`
- Check console for JavaScript errors

### Android: Permission requests fail
- Verify `AndroidManifest.xml` includes required permissions
- Check runtime permission handling for Android 6.0+
- Ensure WebView has JavaScript enabled

## Next Steps

1. Implement handlers for all required capabilities
2. Add error handling and logging
3. Test on physical devices
4. Implement capability streaming for real-time data
5. Add native-specific optimizations

---

**Need Help?** Check the main [Device Capability Infrastructure documentation](../DEVICE_CAPABILITY_INFRASTRUCTURE.md)
