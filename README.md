# LAN IP Webcam (Test Phase)

A minimal, zero-dependency Node.js server to verify LAN connectivity between your PC and Android phone before adding camera streaming.

## 1. Firewall Management (UFW)

Following the LocalSend style, only open the specific TCP port when running the server, and remove it when finished.

### To Open:
```bash
sudo ufw allow 3000/tcp comment 'webcam-test'
```

### To Close (when finished):
```bash
sudo ufw delete allow 3000/tcp
```

---

## 2. Running the Server

Start the server:
```bash
node server.mjs
```
or customize the port:
```bash
PORT=8080 node server.mjs
```

---

## 3. Connecting from Phone

1. Ensure your phone is connected to the same Wi-Fi network (`192.168.0.x`).
2. Scan the QR code printed in your terminal or navigate to:
   ```
   http://192.168.0.102:3000
   ```
3. Tap **"Test Latency (Ping)"** on your phone to verify bidirectional communication.

---

## 4. Next Step: Camera Streaming Preview

Since you are using **Android** to stream the camera to your PC, browsers require a **Secure Context** for camera access (`navigator.mediaDevices.getUserMedia`). When we build the video feature, we can support either:
- **Local HTTPS**: Node server provides a local SSL certificate.
- **Chrome Flag**: Enabling `chrome://flags/#unsafely-treat-insecure-origin-as-secure` in Android Chrome for `http://192.168.0.102:3000`.
