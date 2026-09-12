import http from 'node:http';
import os from 'node:os';
import { execSync } from 'node:child_process';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Skip over non-IPv4, loopback, and docker/tailscale virtual interfaces if possible
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ iface: name, address: net.address });
      }
    }
  }
  return addresses;
}

function printQrCode(url) {
  try {
    const qr = execSync(`qrencode -t ansiutf8 "${url}"`, { encoding: 'utf-8' });
    console.log(qr);
  } catch {
    // qrencode not installed or failed; ignore silently
  }
}

const server = http.createServer((req, res) => {
  const rawIp = req.socket.remoteAddress || '';
  const clientIp = rawIp.replace(/^.*:/, '') || rawIp; // clean up IPv4-mapped IPv6 (::ffff:192.168...)
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} (from ${clientIp})`);

  if (req.url === '/api/ping') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({
      status: 'ok',
      clientIp,
      serverTime: new Date().toISOString(),
      timestamp: Date.now(),
    }));
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>LAN Connection Test</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --success: #22c55e;
      --accent: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(34, 197, 94, 0.15);
      color: var(--success);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--success);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 0.925rem;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .info-group {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.4rem 0;
      border-bottom: 1px solid rgba(51, 65, 85, 0.5);
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      color: var(--text-muted);
    }
    .value {
      font-family: monospace;
      font-weight: 600;
      word-break: break-all;
    }
    .btn {
      width: 100%;
      background: var(--accent);
      color: white;
      border: none;
      padding: 0.875rem 1.25rem;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }
    .btn:active {
      transform: scale(0.98);
      opacity: 0.9;
    }
    #ping-result {
      margin-top: 1rem;
      font-size: 0.875rem;
      text-align: center;
      color: var(--text-muted);
      min-height: 1.5em;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="status-badge">
      <span class="status-dot"></span>
      Connected to PC
    </div>
    <h1>LAN Test Successful!</h1>
    <p class="subtitle">Your phone successfully reached the local Node.js server.</p>

    <div class="info-group">
      <div class="info-row">
        <span class="label">Your Phone IP:</span>
        <span class="value">${clientIp}</span>
      </div>
      <div class="info-row">
        <span class="label">Server Port:</span>
        <span class="value">${PORT}</span>
      </div>
      <div class="info-row">
        <span class="label">Connection:</span>
        <span class="value">HTTP / 1.1</span>
      </div>
    </div>

    <button class="btn" id="ping-btn" onclick="testPing()">Test Latency (Ping)</button>
    <div id="ping-result">Tap button to ping server</div>
  </div>

  <script>
    async function testPing() {
      const resultEl = document.getElementById('ping-result');
      const btn = document.getElementById('ping-btn');
      btn.disabled = true;
      resultEl.textContent = 'Pinging...';
      const start = performance.now();
      try {
        const res = await fetch('/api/ping');
        const data = await res.json();
        const duration = Math.round(performance.now() - start);
        resultEl.innerHTML = '⚡ Roundtrip: <strong style="color: #22c55e;">' + duration + ' ms</strong>';
      } catch (err) {
        resultEl.innerHTML = '<span style="color: #ef4444;">Ping failed: ' + err.message + '</span>';
      } finally {
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  const localIps = getLocalIpAddresses();
  const primaryLan = localIps.find(i => i.iface === 'enp34s0') || localIps[0];
  const primaryUrl = primaryLan ? `http://${primaryLan.address}:${PORT}` : `http://localhost:${PORT}`;

  console.log(`\n======================================================`);
  console.log(`🚀 LAN Test Server is running on port ${PORT}!`);
  console.log(`------------------------------------------------------`);
  if (primaryLan) {
    console.log(`📱 Scan QR code or open on your phone:\n`);
    printQrCode(primaryUrl);
    console.log(`   URL: ${primaryUrl}`);
  }
  console.log(`------------------------------------------------------`);
  console.log(`🔒 Firewall management (run in your host terminal):`);
  console.log(`   Open port:   sudo ufw allow ${PORT}/tcp comment 'webcam-test'`);
  console.log(`   Close port:  sudo ufw delete allow ${PORT}/tcp`);
  console.log(`======================================================\n`);
  console.log(`Listening for incoming connections... (Ctrl+C to stop)`);
});
