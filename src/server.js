const bodyParser = require("body-parser");
const app = require("express")();

const features = require("./features");

module.exports = () => {
  app.use(bodyParser.json());
  // Get list of blocks in chain.
  app.get("/blocks", (req, res) => res.json(global.blockchain));

  // Mine a new block
  app.post("/mineBlock", (req, res) => {
    const newBlock = features.generateNextBlock(
      req.body.data,
      global.blockchain[global.blockchain.length - 1]
    );
    global.blockchain.push(newBlock);
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
