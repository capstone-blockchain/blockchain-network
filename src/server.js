const bodyParser = require("body-parser");
const app = require("express")();

const features = require("./features");

module.exports = () => {
  app.use(bodyParser.json());

  app.get("/blocks", (req, res) => res.json(global.blockchain));

  app.post("/mineBlock", (req, res) => {
    const newBlock = features.generateNextBlock(
      req.body.data,
      global.blockchain[global.blockchain.length - 1]
    );
    global.blockchain.push(newBlock);
    console.log("block added");
    res.json(newBlock);
  });

  app.listen(3000, () => console.log("Listening http on port: 3000"));
};
