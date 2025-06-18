const express = require("express");
const WebSocket = require("ws");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let counter = 1;

// In-memory project info (for demo/testing)
let projectInfo = {
    bpm: 120,
    players: {
        A: { instrument: "drums", mode: "motion", name: "Alice" },
        B: { instrument: "synth", mode: "orientation-2D", name: "Bob" },
        C: { instrument: "guitar", mode: "orientation-3D", name: "Charlie" },
        D: { instrument: "piano", mode: "tapping", name: "Dana" }
    }
};

app.use(express.static("public"));

wss.on("connection", function connection(ws) {
    const id = counter++;
    ws.id = id;
    console.log(`📱 Device ${id} connected`);

    ws.on("message", function incoming(msg) {
        let data;
        try {
            data = JSON.parse(msg);
        } catch (e) {
            // Not JSON, just relay as-is
            broadcast(msg);
            return;
        }

        // Handle special actions
        if (data.action === "join" && data.playerID) {
            // Assign mode from projectInfo or default to tapping
            const player = projectInfo.players[data.playerID] || {};
            const mode = player.mode || "tapping";
            ws.send(JSON.stringify({ playerID: data.playerID, mode }));
            console.log(`🎮 Sent mode "${mode}" to player ${data.playerID}`);
            return;
        }

        if (data.action === "getProject") {
            ws.send(JSON.stringify({ action: "projectInfo", project: projectInfo }));
            console.log(`📦 Sent project info`);
            return;
        }

        if (data.action === "updateProject" && data.project) {
            // For now, just overwrite with provided data
            projectInfo = data.project;
            ws.send(JSON.stringify({ action: "projectUpdated", success: true }));
            console.log(`📝 Project updated`);
            return;
        }

        // Relay all other messages to all clients except sender
        broadcast(msg, ws);
    });
})

function broadcast(msg, sender) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client !== sender) {
            client.send(msg);
        }
    });
}

app.get("/", (req, res) => res.send("✅ WebSocket server is running."));

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Server started on port ${port}`);
});