const express = require("express");
const WebSocket = require("ws");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let counter = 1;

// In-memory project info (for demo/testing)
let projectInfo = {
    projectName: "My First Project",
    bpm: 120,
    players: {
        A: {
            name: "Alice",
            instrument: "Instrument A",
            mode: "tapping",
            tappingNote: 11,
            loopStartNote: 11,
            loopStopNote: 12,
            motionCC: 11,
            orientationAxis: "alpha",
            orientationAxes2D: "alpha-beta",
            orientationCC1: 11,
            orientationCC2: 12,
            orientationCC3: 13
        },
        B: {
            name: "Bob",
            instrument: "Instrument B",
            mode: "looping",
            tappingNote: 21,
            loopStartNote: 21,
            loopStopNote: 22,
            motionCC: 21,
            orientationAxis: "alpha",
            orientationAxes2D: "alpha-beta",
            orientationCC1: 21,
            orientationCC2: 22,
            orientationCC3: 23
        },
        C: {
            name: "Charlie",
            instrument: "Instrument C",
            mode: "motion",
            tappingNote: 31,
            loopStartNote: 31,
            loopStopNote: 32,
            motionCC: 31,
            orientationAxis: "alpha",
            orientationAxes2D: "alpha-beta",
            orientationCC1: 31,
            orientationCC2: 32,
            orientationCC3: 33
        },
        D: {
            name: "Dana",
            instrument: "Instrument D",
            mode: "orientation-1D",
            tappingNote: 41,
            loopStartNote: 41,
            loopStopNote: 42,
            motionCC: 41,
            orientationAxis: "alpha",
            orientationAxes2D: "alpha-beta",
            orientationCC1: 41,
            orientationCC2: 42,
            orientationCC3: 43
        },
        E: {
            name: "Eve",
            instrument: "Instrument E",
            mode: "orientation-2D",
            tappingNote: 51,
            loopStartNote: 51,
            loopStopNote: 52,
            motionCC: 51,
            orientationAxis: "alpha",
            orientationAxes2D: "alpha-beta",
            orientationCC1: 51,
            orientationCC2: 52,
            orientationCC3: 53
        },
        F: {
            name: "Frank",
            instrument: "Instrument F",
            mode: "orientation-3D",
            tappingNote: 61,
            loopStartNote: 61,
            loopStopNote: 62,
            motionCC: 61,
            orientationAxis: "alpha",
            orientationAxes2D: "alpha-beta",
            orientationCC1: 61,
            orientationCC2: 62,
            orientationCC3: 63
        }
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

        if (data.action === "ping") {
            // Handle ping action
            ws.send(JSON.stringify({ action: "pong" }));
            console.log(`🔄 Ping received, sent pong`);
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
            // Overwrite with provided data
            projectInfo = data.project;
            ws.send(JSON.stringify({ action: "projectUpdated", success: true }));
            // Notify all clients (except sender) that a new version is available
            broadcast(JSON.stringify({ action: "projectNeedsRefresh" }), ws);
            console.log(`📝 Project updated and refresh notification sent`);
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