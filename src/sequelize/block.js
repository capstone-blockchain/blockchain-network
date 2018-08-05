const Sequelize = require("sequelize")
const sequelize = global.sequelize

const Block = sequelize.define("blockchain", {
  index: Sequelize.INTEGER,
  previousHash: Sequelize.STRING,
  timestamp: Sequelize.DATE,
  data: Sequelize.STRING,
  hash: Sequelize.STRING,
  nonce: Sequelize.INTEGER
})

module.exports = Block
