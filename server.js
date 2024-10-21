const http = require("http");
const app = require("./app");

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});
io.on("connection", (socket) => {
  console.log("a user connected");
  // Lắng nghe sự kiện 'text change' từ client
  socket.on("send-change", (delta) => {
    //Gửi sự kiện 'text change' tới tất cả các client khác ngoại trừ client hiện tại
    socket.broadcast.emit("receive-change", delta);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
