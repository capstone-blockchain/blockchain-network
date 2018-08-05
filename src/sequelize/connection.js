const Sequelize = require("sequelize")

global.sequelize = new Sequelize("blockchain", "", "", {
  dialect: "sqlite",
  storage: "blockchain.sqlite",
  define: {
    charset: "utf8",
    timestamps: false
  }
})
