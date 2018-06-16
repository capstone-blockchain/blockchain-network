const BlockChain = require("./src/block-chain");
const server = require("./src/server");
const WebSocket = require("ws");
require("./src/mongodb/connection");
const BlockModel = require("./src/mongodb/block");

const features = new BlockChain();

// Node list
global.nodes = [];
// Blockchain with genesis block
BlockModel.deleteMany({}).then(() => {
  BlockModel.create(features.getGenesisBlock());
});

const wss = new WebSocket.Server({ port: process.env.NODE_PORT });
wss.on("connection", ws => {
  ws.on("message", data => {
    const value = JSON.parse(data);
    if (
      value.type === features.MESSAGE_TYPE.blockchain &&
      features.replaceBlockChain(value.msg)
    ) {
      // Receive blockchain
      BlockModel.deleteMany({}).then(() => {
        BlockModel.create(value.msg);
      });
    } else if (
      value.type === features.MESSAGE_TYPE.block &&
      features.isValidBlock(value.msg)
    ) {
      // Receive block
      BlockModel.create(value.msg);
    }
  });
});

server();
