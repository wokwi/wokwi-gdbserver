/**
 * Wokwi gdbserver bridge
 *
 * Copyright (C) 2020, Uri Shaked
 */

const { createServer } = require('net');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

const WS_PORT = 2442;
const GDB_PORT = 3555;
const DEBUG = false;

const gdbserver = createServer();
gdbserver.listen(GDB_PORT);

const options = {
  key: fs.readFileSync('ssl/key.pem'),
  cert: fs.readFileSync('ssl/cert.pem'),
};

const server = https
  .createServer(options, function (req, res) {
    res.writeHead(200);
    res.end(`Wokwi gdbserver listening on local port ${GDB_PORT}.\n`);
  })
  .listen(WS_PORT);

const wss = new WebSocket.Server({ server });

let gdbSocket = null;
let wokwiSocket = null;

wss.on('connection', function connection(socket) {
  wokwiSocket = socket;
  console.log('Wokwi Simulator connected');
  socket.on('message', (data) => {
    const msg = JSON.parse(data);
    switch (msg.cmd) {
      case 'aloha':
        console.log(`* Protocol version: ${msg.version}`);
        break;

      case 'gdbResponse':
        if (gdbSocket) {
          if (DEBUG) {
            console.log('<', msg.response);
          }
          gdbSocket.write(msg.response);
        }
    }
  });

  socket.on('error', (err) => {
    console.error('Wokwi socket error', err);
  });

  socket.on('close', () => {
    console.log('Wowki Simulator disconnected');
    wokwiSocket = null;
  });
});

function gdbChecksum(text) {
  const value =
    text
      .split('')
      .map((c) => c.charCodeAt(0))
      .reduce((a, b) => a + b, 0) & 0xff;
  return (value >> 4).toString(16) + (value & 0xf).toString(16);
}

gdbserver.on('connection', (socket) => {
  console.log('GDB connected\n');

  gdbSocket = socket;

  // Auto pause the simulation on connect
  if (wokwiSocket) {
    wokwiSocket.send(JSON.stringify({ cmd: 'pause' }));
  }

  let buf = '';
  socket.on('data', (data) => {
    if (data[0] === 3) {
      console.log('BREAK');
      if (wokwiSocket) {
        wokwiSocket.send(JSON.stringify({ cmd: 'pause' }));
      }
      data = data.slice(1);
    }

    buf += data.toString('utf-8');
    for (;;) {
      const dolla = buf.indexOf('$');
      const hash = buf.indexOf('#');
      if (dolla < 0 || hash < 0 || hash < dolla || hash + 2 > buf.length) {
        return;
      }
      const cmd = buf.substr(dolla + 1, hash - dolla - 1);
      const cksum = buf.substr(hash + 1, 2);
      buf = buf.substr(hash + 2);
      if (gdbChecksum(cmd) !== cksum) {
        console.warn('Warning: GDB checksum error in message:', cmd);
        socket.write('-');
      } else if (wokwiSocket) {
        socket.write('+');
        if (DEBUG) {
          console.log('>', cmd);
        }
        wokwiSocket.send(JSON.stringify({ cmd: 'gdb', message: cmd }));
      } else {
        console.error('Warning: Wokwi Simulator is not connected; ignoring GDB message');
      }
    }
  });

  socket.on('error', (err) => {
    console.error('GDB socket error', err);
  });

  socket.on('close', () => {
    console.log('GDB disconnected');
    gdbSocket = null;
  });
});
