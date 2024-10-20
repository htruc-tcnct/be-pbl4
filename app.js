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
  origin: ["https://fe-pbl4-ytsx.vercel.app", "http://localhost:5173"], // Các địa chỉ frontend được phép truy cập
  credentials: true, // Cho phép gửi cookie, token, v.v.
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin); // Đảm bảo chỉ định rõ ràng origin của client
  res.header("Access-Control-Allow-Credentials", "true"); // Cho phép credentials như cookie hoặc token
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); // Các phương thức HTTP được phép
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Các header được phép
  next();
});
app.options("*", cors(corsOptions)); // Đảm bảo xử lý các yêu cầu OPTIONS

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }), // Đảm bảo session được lưu trữ
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Chỉ bật nếu bạn đang chạy HTTPS
      sameSite: "none", // Cho phép cookie cross-site nếu frontend và backend ở các domain khác nhau
      maxAge: 24 * 60 * 60 * 1000, // 24 giờ
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
app.use(express.json());
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Mongoose disconnected on app termination");
  process.exit(0);
});

module.exports = app;
