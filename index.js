const http = require("http");
const app = require("./app");
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://10.10.1.129:5173",
      "https://fe-pbl4-ytsx.vercel.app",
    ],
    credentials: true,
  },
});
var idRoomAndOwner;
var priority = 1;
io.on("connection", (socket) => {
  idRoomAndOwner = [];
  console.log("a user connected");
  socket.emit("give-priority", priority);
  priority++;
  socket.on("register", (data) => {
    console.log("Received registration data: ", data);

    // Kiểm tra dữ liệu đã tồn tại hay chưa
    const exists = idRoomAndOwner.some(
      (item) => item.idOwner === data.userId && item.idDoc === data.documentId
    );

    if (!exists) {
      idRoomAndOwner.push({
        idOwner: data.userId,
        idDoc: data.documentId,
        priority: 1,
      });
    } else {
      console.log("Duplicate data. Skipping...");
    }
    console.log("Updated List: ", idRoomAndOwner);
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
    // console.log("request edited content : ", JSON.parse(idUserAndRoom));
    const obIdRoomAndUser = JSON.parse(idUserAndRoom);
    // // console.log(">>>>>>>>>>>>>>>>>>>>: ", obIdRoomAndUser);
    var checkFlag = false;
    var idCuaChuPhong;
    idRoomAndOwner.idDoc =
      // kiểm tra nếu là yêu cầu của client khách thì mới gửi đi, còn nếu là của chủ phòng thì không
      idRoomAndOwner.forEach((element) => {
        if (
          element.idDoc == obIdRoomAndUser.idDoc &&
          element.idOwner == obIdRoomAndUser.idUser
        ) {
          checkFlag = true;
        } else {
          if (element.idDoc == obIdRoomAndUser.idDoc) {
            idCuaChuPhong = element.idOwner;
          }
        }
      });
    if (checkFlag == false) {
      // console.log("gửi yêu cầu cập nhật");
      obIdRoomAndUser.idOwner = Number(idCuaChuPhong);
      // console.log("id chủ phòng ", obIdRoomAndUser);
      socket.broadcast.emit(
        "send-content-to-new-Client",
        JSON.stringify(obIdRoomAndUser)
      );
    }
  });
  socket.on("disconnect", () => {
    // console.log("user disconnected");
  });
});
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
