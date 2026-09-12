# Ultra-Low Latency LAN WebRTC IP Webcam

Stream live video from your Android phone's camera directly to your PC browser over your local network using peer-to-peer WebRTC.

## Highlights
- **Ultra-Low Latency**: Direct WebRTC peer-to-peer streaming over LAN (< 50ms latency).
- **Maximum Battery Saving on Phone**:
  - **Zero preview rendering**: Camera frames are piped directly to WebRTC tracks without canvas or video rendering on the phone.
  - **AMOLED Pitch-Black Theme**: Pixels are unlit.
  - **Blackout Mode**: Turns off UI completely to a pure black screen with a discreet live indicator; double-tap wakes controls.
  - **Screen Wake Lock**: Prevents phone from sleeping while streaming.
- **PC Dashboard**:
  - Full-resolution live playback.
  - Real-time WebRTC telemetry (resolution, FPS, bitrate, network RTT).
  - Snapshot capture and Picture-in-Picture support.
- **Quick Connection**: Terminal & web QR codes via `qrencode`.

---

## 1. Firewall (Host Terminal)

Open port `3000/tcp` (LocalSend style):
```bash
sudo ufw allow 3000/tcp comment 'webcam'
```

When finished:
```bash
sudo ufw delete allow 3000/tcp
```

---

## 2. Start the Server

```bash
npm start
```
*(or `node server.mjs`, or `PORT=8080 node server.mjs`)*

---

## 3. Usage

1. **PC Viewer**: Open `http://localhost:3000` in your PC browser.
2. **Phone Camera**:
   - Point your Android phone camera at the QR code printed in the terminal or on the PC screen.
   - Or navigate directly to `http://192.168.0.102:3000/phone`.
3. Tap **"Start Streaming"** on the phone.
4. Video will appear on the PC immediately with sub-50ms latency.
5. Tap **"Blackout Mode"** on the phone to turn off display elements and conserve maximum battery.
