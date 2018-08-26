/////////// INLUDE LIB ///////////
const bodyParser = require("body-parser")
const app = require("express")()
const Client = require("node-rest-client").Client
/////////// INLUDE LIB ///////////

const BlockModel = require("./sequelize/block")
let features = new (require("./block-chain"))()
const client = new Client()

module.exports = () => {
  app.use(bodyParser.json())

  // Get list of blocks in chain.
  app.get("/blocks", async (req, res) => {
    const blockchain = await BlockModel.findAll()
    res.json(blockchain)
  })

  app.get("/block/latest", async (req, res) => {
    const latestBlock = await BlockModel.findAll({
      limit: 1,
      order: [["index", "DESC"]]
    })
    res.json(latestBlock)
  })

  // This DO NOT store new block, just PoC
  app.post("/mineBlock", async (req, res) => {
    const latestBlock = await BlockModel.findAll({
      limit: 1,
      order: [["index", "DESC"]]
    })
    const newBlock = features.generateNextBlock(req.body.data, latestBlock[0])
    BlockModel.create(newBlock)

    // Inform rest service of new block
    const args = {
      data: newBlock,
      headers: { "Content-Type": "application/json" }
    }
    client.post(
      `http://${process.env.REST_SERVICE_IP}:5000/block`,
      args,
      () => {
        res.json(newBlock)
      }
    )
  })

  app.listen(3000, "0.0.0.0", () => console.log("Listening http on port 3000"))
}
