const http = require("http");
const app = require("./app"); // Giả sử app.js tồn tại
const { Server } = require("socket.io");

const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép mọi nguồn để tiện testing
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // Nhận ký tự được chèn từ client và phát lại cho các client khác
  socket.on("crdt-insert", (data) => {
    console.log("Insert:", data);
    socket.broadcast.emit("crdt-insert", data); // Phát lại sự kiện chèn
  });

  // Nhận ký tự bị xóa từ client và phát lại cho các client khác
  socket.on("crdt-delete", (data) => {
    console.log("Delete:", data);
    socket.broadcast.emit("crdt-delete", data); // Phát lại sự kiện xóa
  });

  // Lắng nghe sự kiện ngắt kết nối
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Chạy server
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
