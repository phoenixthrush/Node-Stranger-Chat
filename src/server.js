const express = require('express');
const WebSocket = require('ws');
const app = express();
const port = 8010;

app.use(express.static('public'));

const wss = new WebSocket.Server({ noServer: true });

let waitingClients = [];

wss.on('connection', (ws) => {
  console.log('A new client connected');
  ws.partner = null;

  sendOnlineCount(ws);

  waitingClients.push(ws);

  if (waitingClients.length >= 2) {
    const client1 = waitingClients.shift();
    const client2 = waitingClients.shift();

    client1.partner = client2;
    client2.partner = client1;

    client1.send('You are now paired with a stranger!');
    client2.send('You are now paired with a stranger!');
    console.log('Paired two clients');
  } else {
    ws.send('Waiting for a partner...');
  }

  ws.on('message', (message) => {
    const messageText = message.toString();
    console.log('Message received from client:', messageText);

    if (ws.partner) {
      if (ws.partner.readyState === WebSocket.OPEN) {
        ws.partner.send(`Stranger: ${messageText}`);
        ws.send(`You: ${messageText}`);
      } else {
        ws.send('Your partner is no longer connected.');
        ws.partner = null;
      }
    } else {
      // ws.send('No partner connected. Waiting for a match...');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');

    if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
      ws.partner.send('Your partner has disconnected.');
      ws.partner.partner = null;
    }

    waitingClients = waitingClients.filter(client => client !== ws);

    if (waitingClients.length >= 2) {
      const nextClient1 = waitingClients.shift();
      const nextClient2 = waitingClients.shift();

      nextClient1.partner = nextClient2;
      nextClient2.partner = nextClient1;

      nextClient1.send('You are now paired with a stranger!');
      nextClient2.send('You are now paired with a stranger!');
      console.log('Paired two new clients');
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

function sendOnlineCount(client) {
  const onlineCount = wss.clients.size;
  if (client.readyState === WebSocket.OPEN) {
    client.send(`Currently online: ${onlineCount} users`);
  }
}
