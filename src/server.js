const bodyParser = require("body-parser")
const app = require("express")()
const BlockModel = require("./sequelize/block")

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

  app.listen(3000, () => console.log("Listening http on port 3000"))
}
