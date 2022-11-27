// const mongoose = require("mongoose");
// const dotenv = require("dotenv");

// dotenv.config({ path: "./config.env" });

// const DB = process.env.DATABASE;

// mongoose
//   .connect(DB)
//   .then(() => {
//     console.log("Success");
//   })
//   .catch(() => console.log("Failed"));
const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb+srv://Sahil:Sahil@cluster0.cwcbzq3.mongodb.net/?retryWrites=true&w=majority",
    // "mongodb+srv://Admin:DJE5xvKbEnspCZ8s@cluster0.rgtgrks.mongodb.net/?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Success");
  })
  .catch(() => console.log("Failed"));
