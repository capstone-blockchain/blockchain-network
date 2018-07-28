const CryptoJS = require("crypto-js")

const Block = require("./block")
const WebSocket = require("ws")
const BlockModel = require("./mongodb/block")

class BlockChain {
  constructor() {
    this.MESSAGE_TYPE = {
      blockchain: "blockchain",
      block: "block"
    }
  }

  getGenesisBlock() {
    return new Block(
      0,
      "0",
      new Date().getTime(),
      "my genesis block!!",
      "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7",
      0
    )
  }

  async getBlockchain() {
    return await BlockModel.find({})
      .select("-_id -__v")
      .exec()
  }

  isValidHashDifficulty(hash = "", difficulty) {
    let i
    for (i = 0; i < hash.length; i++) {
      if (hash[i] !== "0") break
    }
    return i >= difficulty
  }

  calculateHash(index, previousHash, timestamp, data) {
    let nonce = 0
    let hash
    while (!this.isValidHashDifficulty(hash, 1)) {
      nonce = nonce + 1
      hash = this.getHashingString({
        index,
        previousHash,
        timestamp,
        data,
        nonce
      })
    }
    return {
      hash,
      nonce
    }
  }

  getHashingString({ index, previousHash, timestamp, data, nonce }) {
    return CryptoJS.SHA256(
      index + previousHash + timestamp + data + nonce
    ).toString()
  }

  generateNextBlock(blockData, latestBlock) {
    const previousBlock = latestBlock
    const nextIndex = previousBlock.index + 1
    const nextTimestamp = new Date().getTime()
    const nextHash = this.calculateHash(
      nextIndex,
      previousBlock.hash,
      nextTimestamp,
      blockData
    )
    return new Block(
      nextIndex,
      previousBlock.hash,
      nextTimestamp,
      blockData,
      nextHash.hash,
      nextHash.nonce
    )
  }

  isValidChain(blockchain) {
    if (blockchain.length < 2) return true
    for (let index = 1; index < blockchain.length; index++) {
      if (
        blockchain[index].index !== index ||
        blockchain[index].previousHash !== blockchain[index - 1].hash
      ) {
        return false
      }
    }

    return true
  }

  async replaceBlockChain(newBlockChain) {
    const currentBlockChain = await BlockModel.find({})
      .select("-_id -__v")
      .sort("field index")
      .exec()
    if (this.isValidChain(newBlockChain) && newBlockChain.length > 1) {
      if (newBlockChain.length >= currentBlockChain.length) {
        console.log(
          "Received blockchain is valid and longer than current one. Replacing current blockchain with received blockchain"
        )
        return newBlockChain
      } else {
        console.log(
          "Received blockchain is valid and shorter than current one. Keeping current blockchain"
        )
        return currentBlockChain
      }
    } else {
      console.log("Received blockchain invalid. No replacement is made")
      return null
    }
  }

  addNewNode(host) {
    const ws = new WebSocket(`ws://${host}`)
    ws.on("open", () => {
      console.log("open socket")
      global.nodes.push(ws)
      this.broadcastChain([ws])
    })
    ws.on("error", () => {
      console.log("connection failed")
    })
  }

  async broadcastChain(nodes) {
    const blockchain = await BlockModel.find({})
      .select("-_id -__v")
      .exec()
    for (const node of nodes) {
      node.send(this.message(this.MESSAGE_TYPE.blockchain, blockchain))
    }
  }

  broadcastBlock(block) {
    for (const node of global.nodes) {
      node.send(this.message(this.MESSAGE_TYPE.block, block))
    }
  }

  async isValidBlock(newBlock) {
    let previousBlock = await BlockModel.find({})
      .select("-_id -__v")
      .sort("field -_id")
      .limit(1)
      .exec()
    previousBlock = previousBlock[0]

    if (previousBlock.index + 1 !== newBlock.index) {
      console.log("invalid index")
      return false
    }

    if (previousBlock.hash !== newBlock.previousHash) {
      console.log("invalid previoushash")
      return false
    }

    if (this.getHashingString(newBlock) !== newBlock.hash) {
      console.log("invalid hash")
      return false
    }

    return true
  }

  async getLatestBlock() {
    return await BlockModel.findOne()
      .sort("field -index")
      .limit(1)
  }

  message(type, msg) {
    return JSON.stringify({
      type,
      msg
    })
  }
}

module.exports = BlockChain
