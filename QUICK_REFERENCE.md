# StackLive Integration Quick Reference

## 🚀 Quick Start

### For StackLive Platform Integration

**Option 1: Use Drop-In Configuration (Recommended)**
```bash
# Copy the drop-in config to your StackLive platform
cp rollup.config.stacklive.js /path/to/stacklive/rollup.config.js

# Build components
npm install
npm run build  # or: rollup -c rollup.config.stacklive.js
```

**Option 2: Merge Plugins**
Add these plugins from `rollup.config.js` to your existing StackLive config:
- `guardCustomElementsDefine()` (lines 55-73)
- `injectProcessEnvPolyfill()` (lines 82-112)

## 📦 What You Get

### 6 Production-Ready Web Components
```html
<!-- AR/VR Components -->
<sl-arvr-scene userId="123" sessionId="abc" mode="ar"></sl-arvr-scene>
<sl-arvr-avatar userId="123" modelUrl="/models/avatar.glb"></sl-arvr-avatar>
<sl-arvr-filter filterType="color" filterName="vintage"></sl-arvr-filter>
<sl-arvr-spatial objectId="obj1" objectType="model"></sl-arvr-spatial>

<!-- Communication -->
<sl-messaging embedId="msg1" sessionId="abc" enableVideo="true"></sl-messaging>

<!-- Games -->
<sl-tictactoe sessionId="abc" enableBot="true" botDifficulty="hard"></sl-tictactoe>
```

### Build Outputs (StackLive Config)
```
dist/components/
├── arvr-scene.js     (~55 KB)
├── arvr-avatar.js    (~6 KB)
├── arvr-filter.js    (~11 KB)
├── arvr-spatial.js   (~10 KB)
├── messaging.js      (~92 KB)
├── tictactoe.js      (~58 KB)
├── components.css    (~11 KB)
└── chunks/           (shared code)
```

## ✅ Features

- **Guard Protection**: All components can be safely loaded multiple times
- **Browser Compatible**: process.env polyfill ready (if needed)
- **Modular Loading**: Load only the components you need
- **TypeScript Support**: Full type definitions included
- **Source Maps**: Debugging-friendly builds
- **Zero Vulnerabilities**: Passed security scan

## 📚 Documentation

| File | Purpose |
|------|---------|
| `STACKLIVE_DROPIN_GUIDE.md` | Complete integration guide with examples |
| `STACKLIVE_INTEGRATION.md` | Technical implementation details |
| `IMPLEMENTATION_SUMMARY.md` | Overview of changes and verification |
| `rollup.config.stacklive.js` | Drop-in configuration for StackLive |

## 🔧 Build Commands

```bash
# Original build (creates public/build/bundle.js)
npm run build

# StackLive build (creates dist/components/*.js)
npx rollup -c rollup.config.stacklive.js

# Watch mode
npx rollup -c rollup.config.stacklive.js -w
```

## 🛡️ Verified

- ✅ Production build working
- ✅ Development build working  
- ✅ All 6 components protected with guards
- ✅ Code review passed
- ✅ Security scan clean (0 vulnerabilities)
- ✅ Backward compatible
- ✅ No breaking changes

## 🎯 Integration Checklist

- [ ] Copy component files to StackLive platform
- [ ] Choose integration approach (drop-in or merge)
- [ ] Install dependencies: `npm install`
- [ ] Build components
- [ ] Verify output in `dist/components/`
- [ ] Test components in browser
- [ ] Check for no "already registered" errors
- [ ] Deploy to production

## 💡 Key Points

1. **Guards prevent errors**: Components can be loaded multiple times safely
2. **Two configurations**: Original (app bundle) + StackLive (individual components)
3. **Selective loading**: Load only the components you need
4. **Production ready**: All testing and security scans passed

## 📞 Need Help?

- Check `STACKLIVE_DROPIN_GUIDE.md` for detailed instructions
- Review `STACKLIVE_INTEGRATION.md` for technical details
- See component source in `src/lib/Components/webcomponents/`

---

**Summary**: This repo is ready to drop into the StackLive platform. Use `rollup.config.stacklive.js` for the best integration experience.
