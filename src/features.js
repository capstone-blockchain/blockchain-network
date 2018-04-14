const CryptoJS = require("crypto-js");
const Block = require("./block");
const WebSocket = require("ws");

function getGenesisBlock() {
  return new Block(
    0,
    "0",
    1465154705,
    "my genesis block!!",
    "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7",
    0
  );
}

function isValidHashDifficulty(hash = "", difficulty) {
  let i;
  for (i = 0; i < hash.length; i++) {
    if (hash[i] !== "0") break;
  }
  return i >= difficulty;
}

function calculateHash(index, previousHash, timestamp, data) {
  let nonce = 0;
  let hash;
  while (!isValidHashDifficulty(hash, 1)) {
    nonce = nonce + 1;
    hash = CryptoJS.SHA256(
      index + previousHash + timestamp + data + nonce
    ).toString();
  }
  return {
    hash,
    nonce
  };
}

function generateNextBlock(blockData, latestBlock) {
  const previousBlock = latestBlock;
  const nextIndex = previousBlock.index + 1;
  const nextTimestamp = new Date().getTime() / 1000;
  const nextHash = calculateHash(
    nextIndex,
    previousBlock.hash,
    nextTimestamp,
    blockData
  );
  return new Block(
    nextIndex,
    previousBlock.hash,
    nextTimestamp,
    blockData,
    nextHash.hash,
    nextHash.nonce
  );
}

function isValidNewBlock(newBlock, previousBlock) {
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log("invalid index");
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log("invalid previoushash");
    return false;
  }
  return true;
}

function isValidChain(blockchain) {
  if (blockchain.length < 2) return;
  for (let index = 1; index < blockchain.length; index++) {
    if (
      blockchain[index].index !== index ||
      blockchain[index].previousHash !== blockchain[index - 1].hash
    ) {
      return false;
    } else {
      return true;
    }
  }
}

function replaceBlockChain(newBlockChain, currentBlockChain) {
  if (
    isValidChain(newBlockChain) &&
    newBlockChain.length > currentBlockChain.length
  ) {
    console.log(
      "Received blockchain is valid. Replacing current blockchain with received blockchain"
    );
    return newBlockChain;
  } else {
    console.log("Received blockchain invalid. No replacement is made");
    return null;
  }
}

/**
 * Add list of new nodes
 * @param  {String} hosts
 */
function addNewNode(host) {
  const ws = new WebSocket(`ws://${host}`);
  ws.on("open", () => {
    console.log("open socket");
    global.nodes.push(ws);
    broadcastChain([ws]);
  });
  ws.on("error", () => {
    console.log("connection failed");
  });
}

function broadcastChain(nodes) {
  for (const node of nodes) {
    node.send(
      JSON.stringify({
        id: "blockchain",
        blockchain: global.blockchain
      })
    );
  }
}

module.exports = {
  getGenesisBlock,
  calculateHash,
  generateNextBlock,
  isValidNewBlock,
  replaceBlockChain,
  addNewNode,
  broadcastChain,
  isValidChain
};
