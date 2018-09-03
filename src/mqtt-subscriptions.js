const BlockChain = require("./block-chain")
const topics = require("./mqtt-topics")
const BlockModel = require("./sequelize/block")
const Client = require("node-rest-client").Client

const features = new BlockChain()
const client = new Client()
const mqttClient = global.mqttClient

module.exports = () => {
  mqttClient.on("connect", () => {
    mqttClient.subscribe(topics.REQUEST_BLOCKCHAIN)
    mqttClient.subscribe(topics.BROADCAST_BLOCKCHAIN)
    mqttClient.subscribe(topics.REQUEST_BLOCKCHAIN_WEBAPP)
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

      case topics.REQUEST_BLOCKCHAIN_WEBAPP:
        require("debug")("REQUEST_BLOCKCHAIN_WEBAPP")(message.toString())
        blockchain = await features.getBlockchain()
        mqttClient.publish(
          topics.BROADCAST_BLOCKCHAIN_WEBAPP,
          JSON.stringify(blockchain)
        )
        break

      case topics.REQUEST_LATEST_BLOCK:
        const block = await features.getLatestBlock()
        require("debug")("REQUEST_LATEST_BLOCK")(JSON.stringify(block))
        global.latestTimestamp = new Date().getTime()
        const newBlockData = block.index + block.hash + global.latestTimestamp
        setTimeout(() => {
          mqttClient.publish(topics.RESPONSE_LATEST_BLOCK, newBlockData, {
            qos: 1
          })
        }, 2000)
        break

      case topics.RESPONSE_NEW_BLOCK:
        let newBlock = JSON.parse(message.toString())
        newBlock = newBlockData.split("-")
        newBlock = await features.newBlock(newBlock)
        const isBlockValid = await features.isValidBlock(newBlock)
        if (isBlockValid) {
          require("debug")("RESPONSE_NEW_BLOCK")(newBlock)
          BlockModel.create(newBlock)

          const args = {
            data: newBlock,
            headers: { "Content-Type": "application/json" }
          }
          client.post(`http://${process.env.REST_SERVICE_IP}:5000/block`, args)
        }
        break

      default:
        break
    }
  })
}
