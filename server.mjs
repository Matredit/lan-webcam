import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ iface: name, address: net.address, netmask: net.netmask });
      }
    }
  }
  return addresses;
}

function calculateSubnet(ip, netmask) {
  if (!ip || !netmask) return '192.168.0.0/24';
  const ipParts = ip.split('.').map(Number);
  const maskParts = netmask.split('.').map(Number);
  if (ipParts.length !== 4 || maskParts.length !== 4) return '192.168.0.0/24';
  const netParts = ipParts.map((part, i) => part & maskParts[i]);
  const prefix = maskParts.reduce((acc, octet) => acc + (octet.toString(2).match(/1/g) || []).length, 0);
  return `${netParts.join('.')}/${prefix}`;
}

const localIps = getLocalIpAddresses();
const primaryLan = localIps.find(i => i.iface === 'enp34s0') || localIps[0] || { iface: 'local', address: '127.0.0.1', netmask: '255.255.255.0' };
const lanSubnet = calculateSubnet(primaryLan.address, primaryLan.netmask);
const phoneUrl = `http://${primaryLan.address}:${PORT}/phone`;

function printTerminalQr(url) {
  try {
    const qr = execSync(`qrencode -t ansiutf8 "${url}"`, { encoding: 'utf-8' });
    console.log(qr);
  } catch {
    // qrencode not installed or failed
  }
}

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Specific route for phone client
app.get('/phone', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'phone.html'));
});

// Dynamic QR code endpoint for web UI
app.get('/api/qr', (req, res) => {
  try {
    const svg = execSync(`qrencode -t SVG -m 2 -o - "${phoneUrl}"`, { encoding: 'utf-8' });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(svg);
  } catch (err) {
    res.status(500).send('QR generation error');
  }
});

// Network info API
app.get('/api/info', (req, res) => {
  res.json({
    phoneUrl,
    lanIp: primaryLan.address,
    port: PORT,
  });
});

// WebRTC Signaling via Socket.io
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id} from ${socket.handshake.address}`);

  socket.on('register', ({ role }) => {
    socket.role = role;
    socket.join(role);
    console.log(`[Socket] Client ${socket.id} registered as '${role}'`);

    const oppositeRole = role === 'sender' ? 'receiver' : 'sender';
    const oppositeRoom = io.sockets.adapter.rooms.get(oppositeRole);
    const hasOppositePeer = oppositeRoom && oppositeRoom.size > 0;

    // Notify this socket if the opposite peer is already in the room
    if (hasOppositePeer) {
      socket.emit('peer-joined', { role: oppositeRole });
    }

    // Notify opposite peer(s) that this socket has joined
    socket.to(oppositeRole).emit('peer-joined', { role });
  });

  socket.on('request-offer', () => {
    socket.to('sender').emit('request-offer');
  });

  socket.on('signal', (data) => {
    // Forward WebRTC signals (offer, answer, ice-candidate) to the opposite peer
    if (socket.role === 'sender') {
      socket.to('receiver').emit('signal', data);
    } else if (socket.role === 'receiver') {
      socket.to('sender').emit('signal', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id} (${socket.role || 'unregistered'})`);
    if (socket.role) {
      const opposite = socket.role === 'sender' ? 'receiver' : 'sender';
      socket.to(opposite).emit('peer-left', { role: socket.role });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 WebRTC IP Webcam Server Running on port ${PORT}`);
  console.log(`------------------------------------------------------`);
  console.log(`💻 PC Viewer:  http://localhost:${PORT}`);
  console.log(`📱 Phone URL:  ${phoneUrl}`);
  console.log(`------------------------------------------------------`);
  console.log(`📱 Scan QR code on your phone to open camera:`);
  printTerminalQr(phoneUrl);
  console.log(`🔒 Firewall rules (LAN-only restricted to ${lanSubnet}):`);
  console.log(`   Open:  sudo ufw allow from ${lanSubnet} to any port ${PORT} proto tcp comment 'webcam'`);
  console.log(`   Close: sudo ufw delete allow from ${lanSubnet} to any port ${PORT} proto tcp`);
  console.log(`======================================================\n`);
});
