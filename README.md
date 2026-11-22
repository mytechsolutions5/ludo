# 🎲 Ludo Mobile Ultimate

A modern, responsive, touch-optimized **Ludo Mobile Game** built for mobile smartphones and tablets. It can be played immediately in any mobile browser, installed as an offline Progressive Web App (PWA) to the iOS/Android Home Screen, or compiled into native Android (`.apk` / `.aab`) and iOS (`.ipa` / Xcode) apps via Capacitor.

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
- **3D Animated Dice**: Realistic tumbling 3D dice with dots and tactile tap-to-roll feedback.
- **Synthesized Web Audio API**: Crisp zero-latency sound effects generated on-the-fly (dice roll rattle, hop steps, captures, safe zone chimes, celebration fanfare).
- **Haptic Vibration**: Native tactile vibration on rolls and captures via `navigator.vibrate`.
- **Installable PWA**: Add to Home Screen for fullscreen native app experience with offline support (`sw.js`).
- **Capacitor Ready**: Pre-configured `capacitor.config.json` for wrapping into native iOS/Android binaries.

---

## 🌐 Live Cloudflare Deployment

Your mobile Ludo game is live on Cloudflare Workers:

👉 **[https://ludo-mobile.arpitkanotra.workers.dev](https://ludo-mobile.arpitkanotra.workers.dev)**

- **Global Edge Delivery**: High-speed edge routing across 330+ Cloudflare data centers worldwide.
- **PWA Ready**: Open on your iPhone or Android phone to install directly to your home screen.
- **Instant Updates**: Deployed as an edge Worker with pre-cached static assets and SPA routing.

---

## 🚀 Quick Start (Play in Browser)

To preview and play locally:

```bash
# Serve locally on port 3000
serve -p 3000 .
# or with Python
python3 -m http.server 3000
```

Then open `http://localhost:3000` in your browser (or use Chrome DevTools Mobile View `Cmd + Shift + M` to test mobile touch).

---

## 📱 Installing on Mobile Devices (PWA)

### iPhone / iPad (Safari)
1. Open the game URL in **Safari**.
2. Tap the **Share** button (box with upward arrow).
3. Tap **"Add to Home Screen"**.
4. Launch from your home screen as a fullscreen native-style app!

### Android (Chrome)
1. Open the game URL in **Google Chrome**.
2. Tap the banner or menu (three dots) -> **"Install app"** or **"Add to Home screen"**.
3. Launch from your launcher/home screen!

---

## 🛠️ Building Native Android & iOS Apps (Capacitor)

If you want to create native app packages for the Google Play Store or Apple App Store:

1. **Initialize Capacitor**:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
   npx cap init
   ```
2. **Add Platforms**:
   ```bash
   npx cap add android
   npx cap add ios
   ```
3. **Open in Android Studio / Xcode**:
   ```bash
   npx cap open android
   npx cap open ios
   ```
4. Build your `.apk` / `.aab` in Android Studio or archive your `.ipa` in Xcode!

---

## 📂 Project Architecture

```
mobile games/
├── index.html            # Main mobile HTML shell
├── manifest.json         # PWA Manifest configuration
├── sw.js                 # Offline service worker
├── css/
│   └── style.css         # Mobile app styles, glassmorphism, 3D dice, animations
├── js/
│   ├── audio.js          # Procedural Web Audio synthesizer & haptics
│   ├── ludo-engine.js    # International Ludo rules, coordinate tracks & AI logic
│   ├── board-renderer.js # Scalable SVG 15x15 board & token clustering renderer
│   ├── dice-controller.js# 3D tumbling dice controller
│   └── app.js            # Main turn loop & game controller
├── icons/
│   └── icon.svg          # App icon
├── capacitor.config.json # Native build configuration
└── package.json          # Node scripts & dependencies
```
