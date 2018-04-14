const features = require("./src/features");
const server = require("./src/server");
const WebSocket = require("ws");

// Node list
global.nodes = [];
// Blockchain with genesis block
global.blockchain = [features.getGenesisBlock()];

const wss = new WebSocket.Server({ port: process.env.NODE_PORT });
wss.on("connection", ws => {
  global.nodes.push(ws);
  ws.on("message", data => {
    const value = JSON.parse(data);
    if (value.id === "blockchain" && features.isValidChain(value.blockchain)) {
      global.blockchain = value.blockchain;
      console.log(JSON.stringify(value.blockchain));
    } else {
      global.nodes = value.nodes;
    }
  });
});

server();
