const http = require("http");
const app = require("./app");
const DocumentChange = require("./api/models/documentChange");
const port = process.env.PORT || 5000;
const Document = require("./api/models/document");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: ["https://fe-pbl4-ytsx.vercel.app", "http://localhost:5173"],
  },
});

let pendingChanges = {};
let saveTimers = {};

io.on("connection", async (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("get-document", async (documentId) => {
    if (!documentId) return;

    try {
      const document = await findOrCreateDocument(documentId);
      socket.join(documentId);

      socket.emit("load-document", document.data);

      socket.on("send-changes", (delta) => {
        socket.broadcast.to(documentId).emit("receive-changes", delta);
      });

      socket.on("save-document", async (data) => {
        await Document.findByIdAndUpdate(documentId, { data });
      });
    } catch (error) {
      console.error("Error handling document:", error);
      socket.emit("error", "Could not load or save the document.");
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");

    if (saveTimers[socket.id]) {
      clearTimeout(saveTimers[socket.id]);
      delete saveTimers[socket.id];
      delete pendingChanges[socket.id];
    }
  });
});
const defaultValue = "";

async function findOrCreateDocument(id) {
  if (!id) return null;

  let document = await Document.findById(id);
  if (document) return document;

  return await Document.create({ _id: id, data: defaultValue });
}
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
