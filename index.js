const http = require("http");
const app = require("./app");

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require("socket.io");
var ot_toy = require("./ot_toy");
const { json } = require("body-parser");
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://fe-pbl4-ytsx.vercel.app"],
    credentials: true,
  },
});
var docState = new ot_toy.DocState();

var rev = 0;
function broadcast() {
  if (rev < docState.ops.length) {
    io.emit("update", docState.ops.slice(rev));
    rev = docState.ops.length;
  }
}
io.on("connection", function (socket) {
  var peer = new ot_toy.Peer();
  console.log("client connected");
  socket.on("update", function (ops) {
    for (var i = 0; i < ops.length; i++) {
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
