const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  index: "number",
  previousHash: "string",
  timestamp: "string",
  data: "string",
  hash: "string",
  nonce: "string"
});
module.exports = mongoose.model("Block", schema);
