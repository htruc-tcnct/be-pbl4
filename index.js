const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");

const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Nhận ký tự chèn từ client
  socket.on("crdt-insert", (data) => {
    socket.broadcast.emit("crdt-insert", data);
  });

  // Nhận yêu cầu xóa ký tự từ client
  socket.on("crdt-delete", (data) => {
    socket.broadcast.emit("crdt-delete", data);
  });

  // Lắng nghe sự kiện ngắt kết nối
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
