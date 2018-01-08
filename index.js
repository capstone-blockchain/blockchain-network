const features = require("./src/features");
const server = require("./src/server");

global.blockchain = [features.getGenesisBlock()];

const block1 = features.generateNextBlock(
  "Block 1",
  global.blockchain[global.blockchain.length - 1]
);
global.blockchain.push(block1);
server();
