const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./Config/db");

const app = express();

dotenv.config();

connectDB();

//middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//api
app.use("/api/v1/users", require("./Routes/UserRoute"));
app.use("/api/v1/reward", require("./Routes/DailyRewardRoute"));
app.use("/api/v1/userreward", require("./Routes/UserRewardRoute"));

app.get("/", (req, res) => {
  res.send("Welcome to web");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
