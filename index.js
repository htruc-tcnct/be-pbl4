const http = require("http");
const app = require("./app"); // Assume app.js exists
const { Server } = require("socket.io");

const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép mọi nguồn để tiện testing
  },
});

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Nhận ký tự chèn từ client
  socket.on("crdt-insert", (data) => {
    console.log("Insert:", data);
    // Phát lại sự kiện này cho tất cả các client khác (ngoại trừ người gửi)
    socket.broadcast.emit("crdt-insert", data);
  });

  // Nhận yêu cầu xóa ký tự từ client
  socket.on("crdt-delete", (data) => {
    console.log("Delete:", data);
    // Phát lại sự kiện xóa cho tất cả các client khác
    socket.broadcast.emit("crdt-delete", data);
  });

  // Lắng nghe sự kiện ngắt kết nối
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

// Chạy server
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
