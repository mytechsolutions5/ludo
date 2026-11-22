# 🎲 Ludo Mobile Ultimate

A modern, responsive, touch-optimized **Ludo Mobile Game** built for mobile smartphones and tablets. It can be played immediately in any mobile browser, installed as an offline Progressive Web App (PWA) to the iOS/Android Home Screen, or compiled into native Android (`.apk` / `.aab`) and iOS (`.ipa` / Xcode) apps via Capacitor.

---

## 🌐 Live Deployments & Repository

- **GitHub Repository**: [https://github.com/mytechsolutions5/ludo](https://github.com/mytechsolutions5/ludo)
- **Live Cloudflare Deployment**: [https://ludo-mobile.arpitkanotra.workers.dev](https://ludo-mobile.arpitkanotra.workers.dev)
- **GitHub Pages Deployment**: [https://mytechsolutions5.github.io/ludo/](https://mytechsolutions5.github.io/ludo/)

---

## ✨ Features

- **Standard 15x15 International Ludo Board**: Authentic layout with 4 colored quadrants, bases, starting squares, center home triangles, and 8 safe star squares.
- **Full Game Rules & Engine**:
  - Roll a 6 to bring a piece out of your yard.
  - Rolling a 6 grants a bonus turn.
  - Capturing opponent tokens sends them back to base and awards a bonus turn.
  - Reaching Center Home awards a bonus turn.
  - Standard Three 6s Penalty (turn forfeited if rolled 3 times in a row).
  - Exact roll required to reach Home.
- **Smart AI Bots**: Heuristics for prioritizing captures, protecting tokens, unlocking new pieces, and rushing home.
- **Game Modes**:
  - 👤 **Single Player vs Bots** (1 Human vs 1–3 AI bots)
  - 👥 **Local Pass & Play** (2 to 4 Players on one phone/tablet)
- **📱 QR Code Sharing**: In-app QR code button next to Settings generates an instant scannable QR code and native share sheet link for friends.
- **3D Animated Dice**: Realistic tumbling 3D dice with dots and tactile tap-to-roll feedback.
- **Synthesized Web Audio API**: Crisp zero-latency sound effects generated on-the-fly (dice roll rattle, hop steps, captures, safe zone chimes, celebration fanfare).
- **Haptic Vibration**: Native tactile vibration on rolls and captures via `navigator.vibrate`.
- **Installable PWA**: Add to Home Screen for fullscreen native app experience with offline support (`sw.js`). Includes distinct `any` and `maskable` high-resolution icons (192x192 & 512x512) and store preview screenshots for 100% PWABuilder compliance.
- **Capacitor Ready**: Pre-configured `capacitor.config.json` for wrapping into native iOS/Android binaries.

---

## 🚀 Quick Start (Play in Browser)

To preview and play locally:

```bash
# Serve locally on port 3000
npx serve -p 3000 .
# or with Python
python3 -m http.server 3000
```

Then open `http://localhost:3000` in your browser (or use Chrome DevTools Mobile View `Cmd + Shift + M` to test mobile touch).

---

## 📱 Installing on Mobile Devices (PWA)

### iPhone / iPad (Safari)
1. Open the game URL in **Safari**.
2. Tap the **Share** button (box with upward arrow).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top right. Launch directly from your home screen for a fullscreen native experience!

### Android (Chrome / Brave / Edge)
1. Open the game URL in **Chrome**.
2. Tap the **"📲 Install"** banner at the top (or tap the 3 dots menu `⋮` and select **"Add to Home Screen"** / **"Install App"**).
3. Tap **Install** to add the icon to your app drawer and home screen.

---

## 🛠️ Project Structure

```
├── .github/workflows/deploy.yml # GitHub Actions auto-deployment to Pages
├── css/
│   └── style.css              # Mobile glassmorphism theme, safe areas, 3D dice
├── js/
│   ├── app.js                 # UI controller, event bindings, modal logic
│   ├── audio.js               # Zero-dependency Web Audio API procedural sound engine
│   ├── board-renderer.js      # Dynamic 15x15 SVG board renderer & token animations
│   ├── dice-controller.js     # 3D tumbling CSS cube dice controller
│   ├── ludo-engine.js         # Core international Ludo engine with AI bots
│   └── qr-generator.js        # Lightweight pure JS QR Code generator
├── icons/
│   ├── icon-192.png           # Standard 192x192 PNG (purpose: any)
│   ├── icon-512.png           # Standard 512x512 PNG (purpose: any)
│   ├── maskable-icon-192.png  # Adaptive 192x192 PNG (purpose: maskable)
│   ├── maskable-icon-512.png  # Adaptive 512x512 PNG (purpose: maskable)
│   ├── screenshot-mobile.png  # Store screenshot (narrow)
│   ├── screenshot-wide.png    # Store screenshot (wide)
│   └── icon.svg               # Vector icon
├── index.html                 # Mobile PWA shell, modals, viewport config
├── manifest.json              # W3C Web App Manifest (PWABuilder compliant)
├── sw.js                      # Service Worker for offline play and asset caching
├── worker.js                  # Cloudflare Workers edge server bundle
└── capacitor.config.json      # Native build configuration
```

---

## 📄 License

MIT License. Free for personal and educational use.
