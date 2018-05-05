const CryptoJS = require("crypto-js");
const Block = require("./block");
const WebSocket = require("ws");
const BlockModel = require("./mongodb/block");
const MESSAGE_TYPE = {
  blockchain: "blockchain",
  block: "block"
};

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
    hash = getHashingString({ index, previousHash, timestamp, data, nonce });
  }
  return {
    hash,
    nonce
  };
}

function getHashingString({ index, previousHash, timestamp, data, nonce }) {
  return CryptoJS.SHA256(
    index + previousHash + timestamp + data + nonce
  ).toString();
}

function generateNextBlock(blockData, latestBlock) {
  const previousBlock = latestBlock;
  const nextIndex = previousBlock.index + 1;
  const nextTimestamp = new Date().getTime();
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
  if (blockchain.length < 2) return true;
  for (let index = 1; index < blockchain.length; index++) {
    if (
      blockchain[index].index !== index ||
      blockchain[index].previousHash !== blockchain[index - 1].hash
    ) {
      return false;
    }
  }

  return true;
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

async function broadcastChain(nodes) {
  const blockchain = await BlockModel.find({})
    .select("-_id -__v")
    .exec();
  for (const node of nodes) {
    node.send(message(MESSAGE_TYPE.blockchain, blockchain));
  }
}

function broadcastBlock(block) {
  for (const node of global.nodes) {
    node.send(message(MESSAGE_TYPE.block, block));
  }
}

async function isValidBlock(newBlock) {
  const previousBlock = await BlockModel.find({})
    .select("-_id -__v")
    .sort("field -_id")
    .limit(1)
    .exec();
  if (previousBlock.index + 1 !== newBlock.index) {
    console.log("invalid index");
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
    console.log("invalid previoushash");
    return false;
  } else if (getHashingString(newBlock) !== newBlock.hash) {
    console.log("invalid hash");
    return false;
  }

  return true;
}

function message(type, msg) {
  return JSON.stringify({
    type,
    msg
  });
}

module.exports = {
  getGenesisBlock,
  calculateHash,
  generateNextBlock,
  isValidNewBlock,
  replaceBlockChain,
  addNewNode,
  broadcastChain,
  isValidChain,
  broadcastBlock,
  isValidBlock,
  MESSAGE_TYPE
};
