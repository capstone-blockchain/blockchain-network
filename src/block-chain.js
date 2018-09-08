const CryptoJS = require("crypto-js")
const moment = require("moment")

const Block = require("./block")
const WebSocket = require("ws")
const BlockModel = require("./sequelize/block")

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
      moment(new Date()).unix() * 1000,
      "my genesis block!!",
      "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7",
      "0"
    )
  }

  async getBlockchain() {
    return await BlockModel.findAll({
      order: [["index", "ASC"]]
    })
  }

  isValidHashDifficulty(hash = "", difficulty) {
    for (var i = 0, b = hash.length; i < b; i++) {
      if (hash[i] !== "0") {
        break
      }
    }
    return i >= difficulty
  }

  calculateHash(index, previousHash, timestamp, data) {
    let nonce = 0
    let hash
    while (!this.isValidHashDifficulty(hash, process.env.DIFFICULTY)) {
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
    const dataString = index + previousHash + timestamp + data + nonce
    return CryptoJS.SHA256(dataString).toString()
  }

  generateNextBlock(blockData, latestBlock) {
    const previousBlock = latestBlock
    const nextIndex = previousBlock.index + 1
    const nextTimestamp = moment(new Date()).unix() * 1000
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
    const currentBlockChain = await this.getBlockchain()
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
    const blockchain = await this.getBlockchain()
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
    let previousBlock = await this.getLatestBlock()

    if (
      (previousBlock.index + 1).toString().padStart(2, 0) !== newBlock.index
    ) {
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

    if (!this.isValidHashDifficulty(newBlock.hash, process.env.DIFFICULTY)) {
      console.log("invalid difficulty")
      return false
    }

    return true
  }

  async newBlock(nonceHashData) {
    const latestBlock = await this.getLatestBlock()
    return new Block(
      (latestBlock.index + 1).toString().padStart(2, 0),
      latestBlock.hash,
      global.latestTimestamp,
      nonceHashData[2],
      nonceHashData[1],
      nonceHashData[0]
    )
  }

  async getLatestBlock() {
    const block = await BlockModel.findAll({
      limit: 1,
      order: [["index", "DESC"]]
    })
    return block[0]
  }

  message(type, msg) {
    return JSON.stringify({
      type,
      msg
    })
  }
}

module.exports = BlockChain
