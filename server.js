const express = require("express");
const WebSocket = require("ws");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let counter = 1;

// Serve static files
app.use(express.static("public"));

wss.on("connection", function connection(ws) {
  const id = counter++;
  ws.id = id;
  console.log(`📱 Phone ${id} connected`);

  ws.on("message", function incoming(msg) {
    console.log(`📥 hi from phone ${id}:`, msg);

    const messageContent = msg.toString();
    console.log(`🎵 Received selected note: ${messageContent}`);

    // Broadcast to all clients
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`${messageContent}`);
      }
    });
  });
});

app.get("/", (req, res) => res.send("✅ WebSocket server is running."));

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Server started on port ${port}`);
});
