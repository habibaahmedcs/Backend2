const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const dbConnect = require("./config/db-connect");
const restaurantRouter = require("./routes/restaurant-routes");
const authRouter = require("./routes/auth-routes");
const userRouter = require("./routes/user-routes");

const app = express();
const uploadsDir = path.join(__dirname, "uploads");

dbConnect();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/restaurants", restaurantRouter);
app.use("/api/v1/listings", restaurantRouter);

app.use((req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  res.status(err.statusCode).json({
    status: "error",
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});