const http = require("http");
const app = require("./app");
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const { forEach } = require("lodash");
const fs = require("fs");

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://192.168.1.6:5173",
      "https://fe-pbl4-ytsx.vercel.app",
    ],
    credentials: true,
  },
});
var idRoomAndOwner;
var priority = 1;
idRoomAndOwner = [];
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("register", (data, callback) => {
    const dulieu = JSON.parse(data);
    // console.log("Received registration data: ", dulieu);
    if (dulieu.ownerId != dulieu.userId) {
      // console.log("không phải chủ phòn cg, không tạo thêm phòng");
      callback("không phải chủ phòng");
      return;
    }
    // Kiểm tra dữ liệu đã tồn tại hay chưa
    var exists = false;
    if (idRoomAndOwner.length != 0) {
      idRoomAndOwner.forEach(function (element, index, array) {
        if (
          element.idOwner === dulieu.ownerId &&
          element.idDoc === dulieu.documentId
        ) {
          exists = true;
        }
      });
    } else {
      // console.log("idRoomAndOwner.length = 0");
    }
    if (exists == false) {
      idRoomAndOwner.push({
        idOwner: dulieu.userId,
        idDoc: dulieu.documentId,
        priority: 1,
      });
    } else {
      console.log("Duplicate data. Skipping...");
    }
    console.log("List phòng: ", idRoomAndOwner);
    callback("bạn là chủ phòng");
  });

  socket.on("request-priority", (idUserAndIdDocument) => {
    const UserAndDoc = JSON.parse(idUserAndIdDocument);
    // console.log("request-priority UserAndDoc : ", UserAndDoc);
    idRoomAndOwner.forEach((element) => {
      if (element.idDoc == UserAndDoc.idDoc) {
        socket.emit("give-priority", element.priority);
        // console.log("độ ưu tiên ", element.priority);
        element.priority++;
        if (element.idOwner == UserAndDoc.idUser) {
          console.log("tắt cờ chủ phòng", UserAndDoc.idUser);
          socket.emit("endupdating", JSON.stringify(UserAndDoc.idUser));
        }
      }
    });
  });
  // Lắng nghe sự kiện 'chen 1 chu' từ client
  socket.on("insert-one", (charToInsert) => {
    const kiTu = JSON.parse(charToInsert);
    // console.log("insert : ", kiTu);
    //Gửi sự kiện 'chen 1 chu' tới tất cả các client khác ngoại trừ client hiện tại
    socket.broadcast.emit("update-insert-one", charToInsert);
  });

  socket.on("delete-one", (charToDelete) => {
    // console.log("delete : ", JSON.parse(charToDelete));
    socket.broadcast.emit("update-delete-one", charToDelete);
  });
  socket.on("modify-id", (idupdated) => {
    // // console.log("update : ", JSON.parse(idupdated));
    socket.broadcast.emit("update-modify-id", idupdated);
  });
  socket.on("update-style", (divStyle) => {
    // // console.log("update style : ", JSON.parse(divStyle));
    socket.broadcast.emit("update-modify-style", divStyle);
  });
  socket.on("request-edited-content", (idUserAndRoom) => {
    const obIdRoomAndUser = JSON.parse(idUserAndRoom);
    var checkFlag = false; // Kiểm tra nếu yêu cầu đến từ chủ phòng
    var idCuaChuPhong;
    var checkIsSent = false; // Kiểm tra nếu dữ liệu đã được gửi

    for (let i = 0; i < idRoomAndOwner.length; i++) {
      const element = idRoomAndOwner[i];

      if (
        element.idDoc === obIdRoomAndUser.idDoc &&
        element.idOwner === obIdRoomAndUser.idUser
      ) {
        checkFlag = true; // Đây là chủ phòng
        break; // Thoát vòng lặp, không cần kiểm tra thêm
      }

      if (element.idDoc === obIdRoomAndUser.idDoc && checkIsSent === false) {
        // console.log("element: >>>>>>>>>>>>>>>>>>>>>>>>>: ", element);

        idCuaChuPhong = element.idOwner;
        obIdRoomAndUser.idOwner = idCuaChuPhong;

        // Gửi nội dung tới client mới
        socket.broadcast.emit(
          "send-content-to-new-Client",
          JSON.stringify(obIdRoomAndUser)
        );

        checkIsSent = true; // Đánh dấu đã gửi
        break; // Thoát vòng lặp sau khi gửi
      }
    }
  });
  let addressDetail;
  // Lắng nghe sự kiện "sent-address" để lấy đường dẫn nơi bạn muốn lưu file
  socket.on("sent-address", (addressName) => {
    // Kiểm tra nếu addressName có định dạng đúng
    if (addressName && addressName._rawValue) {
      addressDetail = addressName._rawValue; // Lấy đường dẫn file từ `addressName`
      console.log("Received address:", addressDetail);
    } else {
      console.error("Invalid addressName received.");
    }
  });

  socket.on("send-docx-file", (arrayBuffer) => {
    console.log("Received data type:", typeof arrayBuffer);
    console.log("Received data:", arrayBuffer);

    // Kiểm tra nếu dữ liệu là ArrayBuffer hoặc Buffer
    if (arrayBuffer instanceof ArrayBuffer || Buffer.isBuffer(arrayBuffer)) {
      const buffer = Buffer.isBuffer(arrayBuffer)
        ? arrayBuffer
        : Buffer.from(arrayBuffer);

      // Lưu tệp
      fs.writeFile(addressDetail, buffer, (err) => {
        if (err) {
          console.error("Error saving file:", err);
        } else {
          console.log("File saved successfully.");
        }
      });
    } else {
      console.error("Received data is not a valid ArrayBuffer or Buffer.");
    }
  });
  // gửi cho client biết để bật cờ updatingFlag
  socket.on("is-updating", (idNewClient, callback) => {
    console.log("is updating : ", JSON.parse(idNewClient));
    socket.broadcast.emit("updating", idNewClient, (response) => {
      // Sau khi xử lý xong, gọi callback để thông báo cho client
      callback("Update successful!");
    });
  });
  // gửi cho client biết để tắt cờ updatingFlag
  socket.on("end-updating", (idNewClient) => {
    console.log("end updating : ", JSON.parse(idNewClient));
    socket.broadcast.emit("endupdating", idNewClient);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
