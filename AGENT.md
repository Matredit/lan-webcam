# AGENT.md - Project Context & Rules

This document provides essential context and rules for AI agents working on this codebase.

## 1. Project Overview
A low-latency (< 50ms) LAN-only IP webcam application that streams live camera video from an Android phone to a PC browser using peer-to-peer WebRTC over local Wi-Fi.

## 2. Tech Stack & Architecture
- **Runtime**: Node.js (ESM by default, `"type": "module"`).
- **Backend**: Express (`server.js`) + Socket.IO for WebRTC signaling + `qrencode` for ASCII/SVG QR codes.
- **Frontend**: Vanilla HTML/CSS/JS in `public/` (zero build tools, zero external CDNs, Socket.IO client served from `/socket.io/socket.io.js`).
- **Files**:
  - `server.js`: Static server, Socket.IO signaling (`sender` & `receiver` rooms), `/api/qr`, `/api/info`.
  - `public/phone.html`: Mobile camera sender (WebRTC offerer, audio disabled).
  - `public/index.html`: PC receiver dashboard (WebRTC answerer, telemetry HUD, freeze watchdog).

## 3. Critical Ground Rules (Do Not Violate)

### A. Phone Sender (`public/phone.html`) — Battery & Performance
1. **Never render a video preview on the phone**: No `<video>` or `<canvas>` playback of the camera. The `MediaStream` goes directly to `peerConnection.addTrack()`.
2. **Preserve OLED battery savings**: Maintain the pure-black AMOLED theme (`#000000`), Wake Lock API handling, and "Blackout Mode".
3. **Signal on Stop**: When user taps "Stop Streaming", emit `socket.emit('stream-stopped')` so the PC resets cleanly to standby.

### B. PC Receiver (`public/index.html`) — Freeze Watchdog Integrity
1. **Watchdog mechanism**: Uses `HTMLVideoElement.requestVideoFrameCallback()` with a 600ms threshold (`FREEZE_THRESHOLD_SEC = 0.6`).
2. **Gated on `firstFrameRendered`**: The watchdog must NOT trigger during startup/handshake before the very first keyframe is rendered.
3. **Never overwrite timer in telemetry**: Do NOT let `startStatsTelemetry()` or `framesDecoded` touch `lastFramePresentedTime`. The frame callback is the sole ground truth.
4. **Frame deduplication**: `metadata.presentedFrames` prevents compositor repaints from falsely resetting the timer.
5. **Freeze styling**: Use the pulsing red alert banner (`#freeze-alert`) and red border (`#viewport-container.frozen`). **Do not apply grayscale, blur, or dimming filters to the video element**.

### C. Environment & Tooling
1. **bwrap Sandbox**: The parent environment has a read-only filesystem except this project folder.
2. **npm Cache**: `.npmrc` is set to `cache=.npm-cache` so `npm install` works without permission errors. Keep external packages to an absolute minimum.
3. **Firewall**: Runs on host port `3000/tcp` (managed via UFW on the host).
