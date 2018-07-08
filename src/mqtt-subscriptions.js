const BlockChain = require("./block-chain")
const topics = require("./mqtt-topics")
const BlockModel = require("./mongodb/block")

const features = new BlockChain()
const mqttClient = global.mqttClient

module.exports = () => {
  mqttClient.on("connect", () => {
    mqttClient.subscribe(topics.REQUEST_BLOCKCHAIN)
    mqttClient.subscribe(topics.BROADCAST_BLOCKCHAIN)
    mqttClient.subscribe(topics.REQUEST_LATEST_BLOCK)
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
        require("debug")("BROADCAST_BLOCKCHAIN")(blockchain)
        blockchain = await features.replaceBlockChain(blockchain)
        // Receive blockchain
        if (blockchain) {
          BlockModel.deleteMany({}).then(() => {
            BlockModel.create(blockchain)
          })
        }
        break

      case topics.REQUEST_LATEST_BLOCK:
        const block = await features.getLatestBlock()
        require("debug")("REQUEST_LATEST_BLOCK")(block)
        mqttClient.publish(topics.RESPONSE_LATEST_BLOCK, JSON.stringify(block))
        break

      case topics.RESPONSE_NEW_BLOCK:
        const newBlock = JSON.parse(message.toString())
        if (features.isValidBlock(newBlock)) {
          require("debug")("RESPONSE_NEW_BLOCK")(block)
          BlockModel.create(newBlock)
        }
        break

      default:
        break
    }
  })
}