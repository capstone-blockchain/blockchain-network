const BlockChain = require("./block-chain")
const topics = require("./mqtt-topics")
const BlockModel = require("./sequelize/block")

const features = new BlockChain()
const mqttClient = global.mqttClient

module.exports = () => {
  mqttClient.on("connect", () => {
    mqttClient.subscribe(topics.REQUEST_BLOCKCHAIN)
    mqttClient.subscribe(topics.BROADCAST_BLOCKCHAIN)
    mqttClient.subscribe(topics.REQUEST_LATEST_BLOCK)
    mqttClient.subscribe(topics.RESPONSE_NEW_BLOCK)
    mqttClient.publish(topics.REQUEST_BLOCKCHAIN, process.env.NODE_IP)
  })

  mqttClient.on("message", async (topic, message) => {
    let blockchain

    switch (topic) {
      case topics.REQUEST_BLOCKCHAIN:
        if (process.env.NODE_IP === message.toString()) break
        require("debug")("REQUEST_BLOCKCHAIN")(message.toString())
        blockchain = await features.getBlockchain()
        mqttClient.publish(
          topics.BROADCAST_BLOCKCHAIN,
          JSON.stringify(blockchain)
        )
        break

      case topics.BROADCAST_BLOCKCHAIN:
        blockchain = JSON.parse(message.toString())
        require("debug")("BROADCAST_BLOCKCHAIN")(JSON.stringify(blockchain))
        blockchain = await features.replaceBlockChain(blockchain)
        // Receive blockchain
        if (blockchain) {
          BlockModel.destroy({
            where: {},
            truncate: true
          }).then(() => {
            BlockModel.create(blockchain)
          })
        }
        break

      case topics.REQUEST_LATEST_BLOCK:
        let block = await features.getLatestBlock()
        require("debug")("REQUEST_LATEST_BLOCK")(JSON.stringify(block))
        block = {
          i: block.index,
          t: new Date(block.timestamp).getTime(),
          ph: block.hash,
          d: process.env.DIFFICULTY
        }
        mqttClient.publish(topics.RESPONSE_LATEST_BLOCK, JSON.stringify(block))
        break

      case topics.RESPONSE_NEW_BLOCK:
        const newBlock = JSON.parse(message.toString())
        const isBlockValid = await features.isValidBlock(newBlock)
        if (isBlockValid) {
          require("debug")("RESPONSE_NEW_BLOCK")(newBlock)
          BlockModel.create(newBlock)
        }
        break

      default:
        break
    }
  })
}
