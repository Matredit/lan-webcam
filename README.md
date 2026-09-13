# Ultra-Low Latency LAN WebRTC IP Webcam

Stream live video from your Android phone's camera directly to your PC browser over your local network using peer-to-peer WebRTC.

## Highlights
- **Ultra-Low Latency**: Direct WebRTC peer-to-peer streaming over LAN (< 50ms latency).
- **Maximum Battery Saving on Phone**:
  - **Zero preview rendering**: Camera frames are piped directly to WebRTC tracks without canvas or video rendering on the phone.
  - **AMOLED Pitch-Black Theme**: Pixels are unlit.
  - **Blackout Mode**: Enters fullscreen to hide browser UI and blanks the screen completely to pure black pixels; tapping 5 times within 1 second exits back to normal controls.
  - **Screen Wake Lock**: Prevents phone from sleeping while streaming.
- **PC Dashboard**:
  - Full-resolution live playback.
  - Real-time WebRTC telemetry (resolution, FPS, bitrate, network RTT).
  - Snapshot capture and Picture-in-Picture support.
- **Quick Connection**: Terminal & web QR codes via `qrencode`.

---

## 1. Firewall (Host Terminal)

Restricted to your local LAN subnet (`192.168.0.0/24`):

```bash
# Open for LAN only:
sudo ufw allow from 192.168.0.0/24 to any port 3000 proto tcp comment 'webcam'

# Close when finished:
sudo ufw delete allow from 192.168.0.0/24 to any port 3000 proto tcp
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
