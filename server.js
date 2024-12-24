const express = require('express');
const WebSocket = require('ws');
const app = express();
const port = 3000;

app.use(express.static('public'));

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  let paired = false;
  let partner = null;

  ws.on('message', (message) => {
    if (!paired) {
      paired = true;
      ws.send('Searching for a partner...');
    } else if (partner) {
      partner.send(message);
    }
  });

  ws.on('close', () => {
    if (partner) {
      partner.close();
    }
  });

  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      partner = client;
      ws.send('You are now paired with a stranger!');
      partner.send('You are now paired with a stranger!');
    }
  });
});

app.server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
