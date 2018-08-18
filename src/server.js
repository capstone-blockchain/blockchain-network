const bodyParser = require("body-parser")
const app = require("express")()
const BlockModel = require("./sequelize/block")
let features = require("./block-chain")
features = new features()

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
    res.json(newBlock)
  })

  app.listen(3000, () => console.log("Listening http on port 3000"))
}
