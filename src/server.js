const bodyParser = require("body-parser");
const app = require("express")();

const features = require("./features");
const BlockModel = require("./mongodb/block");

module.exports = () => {
  app.use(bodyParser.json());

  // Get list of blocks in chain.
  app.get("/blocks", async (req, res) => {
    const blockchain = await BlockModel.find({})
      .select("-_id -__v")
      .exec();
    res.json(blockchain);
  });

  // Mine a new block
  app.post("/mineBlock", async (req, res) => {
    const latestBlock = await BlockModel.findOne()
      .sort("field -_id")
      .limit(1);
    const newBlock = features.generateNextBlock(req.body.data, latestBlock);
    BlockModel.create(newBlock);
    features.broadcastChain(global.nodes);
    res.json(newBlock);
  });

  // Add new node
  app.post("/register/node", (req, res) => {
    if (Array.isArray(req.body.node_urls)) {
      for (const i of req.body.node_urls) {
        features.addNewNode(i);
      }
      res.json(req.body.node_urls);
    } else {
      res.status(500).json("Must add array of nodes");
    }
  });

  // Get all nodes
  app.get("/nodes", (req, res) => {
    res.json(global.nodes.length);
  });

  app.listen(3000, () => console.log("Listening http on port 3000"));
};
