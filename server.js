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
  console.log("a user connected");
  socket.on("insert-one", (charToInsert) => {
    const kiTu = JSON.parse(charToInsert);
    console.log("insert : ", kiTu);
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
// const http = require("http");
// const app = require("./app");
// const { Server } = require("socket.io");
// const DocumentVersion = require("./api/models/documentVersion");

// const port = process.env.PORT || 5000;
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173", "https://fe-pbl4-ytsx.vercel.app"],
//     credentials: true,
//   },
// });

// let currentVersionContent = "";
// let documentID = "";
// let idUser = "";
// let idDoc = "";
// let fullDocumentContent = "";
// io.on("connection", (socket) => {
//   console.log("a user connected");

//   socket.on("insert-one", (charToInsert) => {
//     const kiTu = JSON.parse(charToInsert);
//     console.log(kiTu);
//     currentVersionContent += kiTu.content; // Lưu những thay đổi nhỏ
//     documentID = kiTu.id;
//     idUser = kiTu.idUser;
//     idDoc = kiTu.id;
//     fullDocumentContent = kiTu.fullContent; // Toàn bộ nội dung tài liệu
//     console.log("insert : ", kiTu);

//     socket.broadcast.emit("update-insert-one", charToInsert);
//   });

//   socket.on("delete-one", (charToDelete) => {
//     console.log("delete : ", JSON.parse(charToDelete));
//     socket.broadcast.emit("update-delete-one", charToDelete);
//   });

//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
// });
// setInterval(async () => {
//   console.log("Running interval check");
//   console.log(documentID, ": ", currentVersionContent, ": ", idUser);
//   if (currentVersionContent && documentID && idUser) {
//     try {
//       const newVersion = new DocumentVersion({
//         documentID: documentID,
//         versionNumber: await getNextVersionNumber(documentID),
//         changedBy: idUser,
//         versionContent: currentVersionContent, // Lưu những thay đổi nhỏ
//         content: fullDocumentContent, // Lưu toàn bộ nội dung tài liệu
//         createdAt: Date.now(),
//       });
//       await newVersion.save();
//       console.log("Document version saved.");
//       currentVersionContent = "";
//     } catch (error) {
//       console.error("Error saving document version:", error);
//     }
//   } else {
//     console.log("Skipping save: Missing content or documentID or idUser");
//   }
// }, 3000);

// server.listen(port, "0.0.0.0", () => {
//   console.log(`Server running on port ${port}`);
// });

// const getNextVersionNumber = async (documentID) => {
//   const latestVersion = await DocumentVersion.findOne({ documentID })
//     .sort({ versionNumber: -1 })
//     .exec();
//   return latestVersion ? latestVersion.versionNumber + 1 : 1;
// };
