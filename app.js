const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
require("./api/controller/user/passport");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const connectDB = require("./api/config/db");
const userRoutes = require("./api/routes/user");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const cookieParser = require("cookie-parser");
app.use(cookieParser());

const authRouter = require("./api/controller/user/auth");
const documentRoutes = require("./api/routes/document");
connectDB();
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://10.10.29.144:5173",
    "https://fe-pbl4-ytsx.vercel.app",
  ],
  credentials: true,
  exposedHeaders: ["Set-cookie"],
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      httpOnly: true,
      priority: "high",
      secure: false, //chay local
      // secure: true, //chay deploy
      // sameSite: "none", //chay deploy
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

//deploy
app.set("trust proxy", true);
app.use(passport.initialize());
app.use(passport.session());
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
  }),
});

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
