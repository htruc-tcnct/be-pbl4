const http = require("http");
const app = require("./app");
const DocumentChange = require("./api/models/documentChange");
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    //   [
    //   "http://localhost:5173",
    //   "http://192.168.1.38:5173",
    //   "https://5b69-2405-4802-95c1-5e90-f02f-2c02-4429-f0d1.ngrok-free.app",
    // ],
  },
});

let pendingChanges = {};
let saveTimers = {};

const saveChangeToDatabase = async (versionID, delta) => {
  const newChange = new DocumentChange({
    versionID: versionID,
    changedContent: JSON.stringify(delta),
  });
  await newChange.save();
  console.log("Change saved to database:", newChange);
};

io.on("connection", async (socket) => {
  console.log("a user connected");

  socket.on("send-change", async (delta, versionID, storedIdUser) => {
    if (!versionID) {
      console.error("Error: versionID is missing");
      return;
    }

    if (!pendingChanges[socket.id]) {
      pendingChanges[socket.id] = [];
    }
    pendingChanges[socket.id].push(delta);

    if (saveTimers[socket.id]) {
      clearTimeout(saveTimers[socket.id]);
    }

    saveTimers[socket.id] = setTimeout(async () => {
      const combinedDelta = pendingChanges[socket.id];
      await saveChangeToDatabase(versionID, combinedDelta);

      // Sau khi lưu, xóa các thay đổi tạm thời và hẹn giờ
      delete pendingChanges[socket.id];
      delete saveTimers[socket.id];
    }, 7000);

    // Phát lại delta tới các client khác
    socket.broadcast.emit("receive-change", delta);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");

    // Nếu người dùng ngắt kết nối và còn hẹn giờ lưu, hủy hẹn giờ
    if (saveTimers[socket.id]) {
      clearTimeout(saveTimers[socket.id]);
      delete saveTimers[socket.id];
      delete pendingChanges[socket.id];
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
