const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");

const port = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://fe-pbl4-ytsx.vercel.app"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Nhận sự kiện chèn từ client
  socket.on("crdt-insert", (data) => {
    console.log(`User ${socket.id} inserted:`, data);
    socket.broadcast.emit("crdt-insert", data); // Phát sự kiện tới các client khác
  });

  // Nhận sự kiện xóa từ client
  socket.on("crdt-delete", (data) => {
    console.log(`User ${socket.id} deleted:`, data);
    socket.broadcast.emit("crdt-delete", data); // Phát sự kiện xóa tới các client khác
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
