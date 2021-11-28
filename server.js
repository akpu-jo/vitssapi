import mongoose from "mongoose";
import app from "./app.js";
import dotenv from "dotenv";

process.on("uncaughtException", (err, promise) => {
  console.log(`Logged error (uncaughtException): ${err}`);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("db connection successful");
  })
  .catch(() => {
    console.log("db connection unsuccessful");
  });

app.get("/api", (req, res) => {
  res
    .status(200)
    .json({
      message: "welcome to Vitamin Sussie API",
      time: Date().toString(),
    });
});

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`app api listening at http://localhost:${port}`);
});

process.on("unhandledRejection", (err, promise) => {
  console.log(`Logged error(unhandledRejection): ${err}`);
  server.close(() => process.exit(1));
});


