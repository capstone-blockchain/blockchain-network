const bodyParser = require("body-parser");
const app = require("express")();
const BlockChain = require("./block-chain");
const BlockModel = require("./mongodb/block");

const features = new BlockChain();

module.exports = () => {
  app.use(bodyParser.json());

  // Get list of blocks in chain.
  app.get("/blocks", async (req, res) => {
    const blockchain = await BlockModel.find({})
      .select("-_id -__v")
      .sort("field index")
      .exec();
    res.json(blockchain);
  });

  // Mine a new block
  app.post("/mineBlock", async (req, res) => {
    const latestBlock = await BlockModel.findOne()
      .sort("field -index")
      .limit(1);
    const newBlock = features.generateNextBlock(req.body.data, latestBlock);
    BlockModel.create(newBlock);
    features.broadcastBlock(newBlock);
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

  app.get("/block/latest", async (req, res) => {
    const latestBlock = await BlockModel.findOne()
      .select("-_id -__v")
      .sort("field -index")
      .limit(1);
    res.json(latestBlock);
  });

  app.listen(3000, () => console.log("Listening http on port 3000"));
};
