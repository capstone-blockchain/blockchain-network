const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  index: "number",
  previousHash: "string",
  timestamp: "number",
  data: "string",
  hash: "string",
  nonce: "number"
});
module.exports = mongoose.model("Block", schema);
