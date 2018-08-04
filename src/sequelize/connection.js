const Sequelize = require("sequelize")

global.sequelize = new Sequelize("blockchain", "", "", {
  dialect: "sqlite",
  storage: "blockchain.sqlite"
})