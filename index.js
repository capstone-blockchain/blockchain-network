const mqtt = require("mqtt")
global.mqttClient = mqtt.connect(`mqtt://${process.env.MQTT_BROKER_IP}`)

// const WebSocket = require("ws")
const BlockChain = require("./src/block-chain")
const features = new BlockChain()
const server = require("./src/server")
require("./src/mongodb/connection")
require("./src/sequelize/connection")
const BlockModel = require("./src/sequelize/block")
const mqttSubcription = require("./src/mqtt-subscriptions")

// Node list
global.nodes = []
// Blockchain with genesis block
BlockModel.destroy({
  where: {},
  truncate: true
}).then(() => {
  BlockModel.create(features.getGenesisBlock())
})

// const wss = new WebSocket.Server({ port: process.env.NODE_PORT })
// wss.on("connection", ws => {
//   ws.on("message", data => {
//     const value = JSON.parse(data)
//     if (value.type === features.MESSAGE_TYPE.blockchain) {
//       const blockchain = features.replaceBlockChain(value.msg)
//       // Receive blockchain
//       if (blockchain) {
//         BlockModel.deleteMany({}).then(() => {
//           BlockModel.create(blockchain)
//         })
//       }
//     } else if (
//       value.type === features.MESSAGE_TYPE.block &&
//       features.isValidBlock(value.msg)
//     ) {
//       // Receive block
//       BlockModel.create(value.msg)
//     }
//   })
// })

mqttSubcription()
server()
