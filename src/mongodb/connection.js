const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL);
mongoose.Promise = global.Promise;
mongoose.set("debug", true);
