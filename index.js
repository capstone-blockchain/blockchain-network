const features = require("./features");

let blockchain = [features.getGenesisBlock()];

const block1 = features.generateNextBlock(
  "Block 1",
  blockchain[blockchain.length - 1]
);
blockchain.push(block1);

const block2 = features.generateNextBlock(
  "Block 2",
  blockchain[blockchain.length - 1]
);
blockchain.push(block2);

console.log(blockchain);
