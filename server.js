const http = require("http");
const fs = require("fs");
const path = require("path");
const app = require("./app");
const _ = require("lodash");
const { Document, Packer, Paragraph } = require("docx");
const DocumentVersion = require("./api/models/documentVersion");
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://10.10.29.144:5173",
      "https://fe-pbl4-ytsx.vercel.app",
    ],
    credentials: true,
  },
});

var priority = 1;
let documentContents = {}; // Lưu trữ nội dung của nhiều tài liệu
let saveTimeouts = {}; // Lưu trữ timeout của từng tài liệu

// Hàm lưu tài liệu vào file .doc và cập nhật MongoDB
const saveDocument = async (documentID) => {
  try {
    const fileName = `document_${documentID}.doc`;
    const filePath = path.join("D:\\", fileName);

    const content = documentContents[documentID] || ""; // Lấy nội dung tài liệu hiện tại

    // Tạo tài liệu Word
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: content,
            }),
          ],
        },
      ],
    });

    // Lưu tài liệu vào file .doc
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    console.log(`File saved at: ${filePath}`);

    // Lưu phiên bản tài liệu vào MongoDB
    const newVersion = new DocumentVersion({
      documentID,
      versionPath: filePath,
      isRestored: false,
    });

    await newVersion.save();
    console.log("Document version saved to MongoDB");
  } catch (error) {
    console.error("Error saving document version: ", error);
  }
};

// Reset lại timeout khi có sự kiện chỉnh sửa
const resetSaveTimeout = (documentID) => {
  if (saveTimeouts[documentID]) {
    clearTimeout(saveTimeouts[documentID]);
  }

  saveTimeouts[documentID] = setTimeout(() => {
    saveDocument(documentID); // Lưu file sau 5 giây không chỉnh sửa
  }, 5000);
};

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.emit("give-priority", priority);
  priority++;

  // Lắng nghe sự kiện 'insert-one' từ client
  socket.on("insert-one", (charToInsert) => {
    const { id, content, documentID } = JSON.parse(charToInsert);

    if (!documentContents[documentID]) {
      documentContents[documentID] = ""; // Tạo mới nếu chưa có tài liệu này
    }

    documentContents[documentID] += content; // Cập nhật nội dung tài liệu
    console.log(
      `Insert: id=${id}, content=${content}, documentID=${documentID}`
    );

    resetSaveTimeout(documentID); // Đặt lại thời gian lưu
    socket.broadcast.emit("update-insert-one", charToInsert);
  });

  // Lắng nghe sự kiện 'delete-one' từ client
  socket.on("delete-one", (charToDelete) => {
    const { id, content, documentID } = JSON.parse(charToDelete);

    if (documentContents[documentID]) {
      // Chỉ sửa nội dung của documentID
      documentContents[documentID] = documentContents[documentID].replace(
        content,
        ""
      );
    }

    console.log(
      `Delete: id=${id}, content=${content}, documentID=${documentID}`
    );
    resetSaveTimeout(documentID); // Đặt lại thời gian lưu
    socket.broadcast.emit("update-delete-one", charToDelete);
  });

  socket.on("modify-id", (idupdated) => {
    console.log("Update: ", JSON.parse(idupdated));
    socket.broadcast.emit("update-modify-id", idupdated);
  });

  socket.on("update-style", (divStyle) => {
    console.log("Update style: ", JSON.parse(divStyle));
    socket.broadcast.emit("update-modify-style", divStyle);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
