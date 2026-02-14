# Repository Structure - Before and After

## Before Reorganization

```
src/
├── frontend/
│   ├── arvr/
│   │   ├── sl-arvr-scene.svelte       ❌ Web component in subdirectory
│   │   ├── sl-arvr-avatar.svelte      ❌ Web component in subdirectory
│   │   ├── sl-arvr-filter.svelte      ❌ Web component in subdirectory
│   │   ├── sl-arvr-spatial.svelte     ❌ Web component in subdirectory
│   │   ├── ARVRControlPanel.svelte    ✅ Supporting component
│   │   ├── AvatarEmbed.svelte         ✅ Supporting component
│   │   └── FilterSelector.svelte      ✅ Supporting component
│   │
│   ├── messaging/
│   │   ├── sl-messaging.svelte        ❌ Web component in subdirectory
│   │   ├── sl-room.svelte             ❌ Web component in subdirectory
│   │   ├── ChatView.svelte            ✅ Supporting component
│   │   ├── ConversationList.svelte    ✅ Supporting component
│   │   └── ...                        ✅ More supporting components
│   │
│   ├── games/
│   │   ├── sl-tictactoe.svelte        ❌ Web component in subdirectory
│   │   ├── Card.svelte                ✅ Supporting component
│   │   └── ...                        ✅ More supporting components
│   │
│   ├── rss/
│   │   └── sl-rss-reader.svelte       ❌ Web component in subdirectory
│   │
│   └── sl-bluetooth.upgraded.svelte   ✅ Web component at root (reference)
│
└── backend/
    ├── bluetooth/                     ✅ Backend directory
    ├── messaging/                     ✅ Backend directory
    └── games/                         ✅ Backend directory
```

## After Reorganization

```
src/
├── frontend/
│   ├── sl-arvr-scene.upgraded.svelte     ✅ Web component at root
│   ├── sl-arvr-avatar.upgraded.svelte    ✅ Web component at root
│   ├── sl-arvr-filter.upgraded.svelte    ✅ Web component at root
│   ├── sl-arvr-spatial.upgraded.svelte   ✅ Web component at root
│   ├── sl-messaging.upgraded.svelte      ✅ Web component at root
│   ├── sl-room.upgraded.svelte           ✅ Web component at root
│   ├── sl-tictactoe.upgraded.svelte      ✅ Web component at root
│   ├── sl-rss-reader.upgraded.svelte     ✅ Web component at root
│   ├── sl-bluetooth.upgraded.svelte      ✅ Web component at root
│   │
│   ├── arvr/                             ✅ Supporting components only
│   │   ├── ARVRControlPanel.svelte
│   │   ├── AvatarEmbed.svelte
│   │   └── FilterSelector.svelte
│   │
│   ├── bluetooth/                        ✅ Supporting components only
│   │   ├── BluetoothControl.svelte
│   │   ├── DeviceItem.svelte
│   │   └── DeviceList.svelte
│   │
│   ├── messaging/                        ✅ Supporting components only
│   │   ├── ChatView.svelte
│   │   ├── ConversationList.svelte
│   │   ├── MessageBubble.svelte
│   │   └── ...
│   │
│   └── games/                            ✅ Supporting components only
│       ├── Card.svelte
│       ├── Deck.svelte
│       └── ...
│
└── backend/
    ├── arvr/                             ✅ Backend directory (new)
    ├── bluetooth/                        ✅ Backend directory
    ├── games/                            ✅ Backend directory
    ├── messaging/                        ✅ Backend directory
    └── rss/                              ✅ Backend directory (new)
```

## Key Improvements

### 1. Consistency
- **Before:** Mixed patterns - Bluetooth at root, others in subdirectories
- **After:** All 9 web components follow the same pattern

### 2. Naming Convention
- **Before:** Mixed extensions - some `.svelte`, one `.upgraded.svelte`
- **After:** All use `.upgraded.svelte` extension for clarity

### 3. Discoverability
- **Before:** Web components scattered across feature directories
- **After:** All web components easily found at `src/frontend/sl-*.upgraded.svelte`

### 4. Backend Structure
- **Before:** Incomplete - missing arvr and rss backend directories
- **After:** Complete - all features have corresponding backend directories

### 5. Separation of Concerns
- **Before:** Web components mixed with supporting components
- **After:** Clear separation - web components at root, supporting components in subdirectories

## Pattern Rules

### Main Web Component Files (at root)
- Location: `src/frontend/sl-{name}.upgraded.svelte`
- Purpose: Entry point for web component registration
- Naming: Must use `.upgraded.svelte` extension
- Contains: Component configuration, backend integration, supporting component imports

### Supporting UI Components (in subdirectories)
- Location: `src/frontend/{feature}/ComponentName.svelte`
- Purpose: Reusable UI components used by main web component
- Naming: PascalCase with `.svelte` extension
- Contains: UI logic, styling, component-specific functionality

### Backend Logic (in backend subdirectories)
- Location: `src/backend/{feature}/`
- Purpose: Business logic, API integration, state management
- Files: Backend.ts, index.ts, types.d.ts, etc.
- Contains: Backend implementation separate from UI

## Migration Summary

| Component | Old Location | New Location | Status |
|-----------|-------------|--------------|--------|
| sl-arvr-scene | arvr/ | root | ✅ Moved |
| sl-arvr-avatar | arvr/ | root | ✅ Moved |
| sl-arvr-filter | arvr/ | root | ✅ Moved |
| sl-arvr-spatial | arvr/ | root | ✅ Moved |
| sl-messaging | messaging/ | root | ✅ Moved |
| sl-room | messaging/ | root | ✅ Moved |
| sl-tictactoe | games/ | root | ✅ Moved |
| sl-rss-reader | rss/ | root | ✅ Moved |
| sl-bluetooth | root | root | ✅ Already correct |

**Total Moved:** 8 web components
**Total Renamed:** 8 files (added `.upgraded` to naming)
**Backend Directories Added:** 2 (arvr, rss)
