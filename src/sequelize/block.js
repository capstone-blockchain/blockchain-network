const Sequelize = require("sequelize")
const sequelize = global.sequelize

const Block = sequelize.define("block", {
  index: Sequelize.INTEGER,
  previousHash: Sequelize.STRING,
  timestamp: Sequelize.INTEGER,
  data: Sequelize.STRING,
  hash: Sequelize.STRING,
  nonce: Sequelize.INTEGER
})

module.exports = Block
