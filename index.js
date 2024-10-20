const http = require("http");
const app = require("./app");

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const { json } = require("body-parser");
const io = new Server(server, {
  cors: {
    origin: "*", // cho phép all để test
  },
});
io.on("connection", (socket) => {
  console.log("a user connected");
  // Lắng nghe sự kiện 'text change' từ client
  socket.on("insert-one", (charToInsert) => {
    const kiTu = JSON.parse(charToInsert);
    console.log("insert : ", kiTu);
    //Gửi sự kiện 'text change' tới tất cả các client khác ngoại trừ client hiện tại
    socket.broadcast.emit("update-insert-one", charToInsert);
  });
  socket.on("delete-one", (charToDelete) => {
    console.log("delete : ", JSON.parse(charToDelete));
    socket.broadcast.emit("update-delete-one", charToDelete);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
