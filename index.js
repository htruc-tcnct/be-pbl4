const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const ot_toy = require("./ot_toy");
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const docState = new ot_toy.DocState();

let rev = 0;

function broadcast() {
  if (rev < docState.ops.length) {
    io.emit("update", docState.ops.slice(rev));
    rev = docState.ops.length;
  }
}

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://fe-pbl4-ytsx.vercel.app",
      "http://192.168.1.4:5173", // Thêm địa chỉ IP nội bộ
    ],
    credentials: true, // Cho phép gửi cookies nếu cần
  },
});

io.on("connection", function (socket) {
  const peer = new ot_toy.Peer(); // Tạo peer mới cho mỗi kết nối client
  console.log("client connected");

  socket.on("update", function (ops) {
    for (let i = 0; i < ops.length; i++) {
      peer.merge_op(docState, ops[i]);
    }
    broadcast();
    console.log("update: " + JSON.stringify(ops) + ": " + docState.get_str());
  });

  socket.emit("update", docState.ops);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
