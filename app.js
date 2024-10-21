const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
require("./api/controller/user/passport");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const connectDB = require("./api/config/db");
const userRoutes = require("./api/routes/user");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const authRouter = require("./api/controller/user/auth");
const documentRoutes = require("./api/routes/document");
connectDB();

const corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.options("*", cors(corsOptions));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/user", userRoutes);
app.use("/documents", documentRoutes);
app.use("/", authRouter);

app.use((req, res, next) => {
  const err = new Error("Not found!");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
    },
  });
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Mongoose disconnected on app termination");
  process.exit(0);
});

module.exports = app;
