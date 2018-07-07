const mqtt = require("mqtt")
const WebSocket = require("ws")

const BlockChain = require("./src/block-chain")
const server = require("./src/server")
require("./src/mongodb/connection")
const BlockModel = require("./src/mongodb/block")
const topics = require("./mqtt-topics")
global.mqttClient = mqtt.connect(`mqtt://${process.env.MQTT_BROKER_IP}`)

const features = new BlockChain()
const mqttClient = global.mqttClient

// Node list
global.nodes = []
// Blockchain with genesis block
BlockModel.deleteMany({}).then(() => {
  BlockModel.create(features.getGenesisBlock())
})

const wss = new WebSocket.Server({ port: process.env.NODE_PORT })
wss.on("connection", ws => {
  ws.on("message", data => {
    const value = JSON.parse(data)
    if (value.type === features.MESSAGE_TYPE.blockchain) {
      const blockchain = features.replaceBlockChain(value.msg)
      // Receive blockchain
      if (blockchain) {
        BlockModel.deleteMany({}).then(() => {
          BlockModel.create(blockchain)
        })
      }
    } else if (
      value.type === features.MESSAGE_TYPE.block &&
      features.isValidBlock(value.msg)
    ) {
      // Receive block
      BlockModel.create(value.msg)
    }
  })
})

mqttClient.on("connect", () => {
  mqttClient.subscribe(topics.REQUEST_BLOCKCHAIN)
  mqttClient.subscribe(topics.BROADCAST_BLOCKCHAIN)
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
      blockchain = message.toString()
      blockchain = await features.replaceBlockChain(blockchain)
      require("debug")("BROADCAST_BLOCKCHAIN")(blockchain)
      // Receive blockchain
      if (blockchain) {
        BlockModel.deleteMany({}).then(() => {
          BlockModel.create(blockchain)
        })
      }
      break
    default:
      break
  }
})

server()
