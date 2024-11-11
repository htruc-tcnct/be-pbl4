const http = require("http");
const app = require("./app");
const _ = require("lodash");
const DocumentVersion = require("./api/models/documentVersion");
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const { json } = require("body-parser");
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://fe-pbl4-ytsx.vercel.app"],
    credentials: true,
  },
});
async function saveDocumentVersion(
  documentId,
  versionNumber,
  changedBy,
  versionContent,
  content
) {
  try {
    const newVersion = new DocumentVersion({
      documentID,
      versionNumber,
      versionContent,
      content,
      changedBy,
      isRestored: true,
    });
    await newVersion.save();
    console.log("Document version saved to MongoDB");
  } catch (err) {
    console.error("Error saving document version: ", err);
  }
}
const doubouncedSave = _.debounce(saveDocumentVersion, 5000);

var priority = "A";

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.emit("give-priority", priority);
  priority = String.fromCharCode(priority.charCodeAt(0) + 1);
  socket.on("insert-one", (charToInsert) => {
    const kiTu = JSON.parse(charToInsert);
    console.log("insert : ", kiTu);
    socket.broadcast.emit("update-insert-one", charToInsert);
  });
  socket.on("delete-one", (charToDelete) => {
    console.log("delete : ", JSON.parse(charToDelete));
    socket.broadcast.emit("update-delete-one", charToDelete);
  });
  socket.on("modify-id", (idupdated) => {
    console.log("update : ", JSON.parse(idupdated));
    socket.broadcast.emit("update-modify-id", idupdated);
  });
  socket.on("update-style", (divStyle) => {
    console.log("update style : ", JSON.parse(divStyle));
    socket.broadcast.emit("update-modify-style", divStyle);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
