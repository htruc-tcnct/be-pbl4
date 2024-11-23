const Document = require("../../models/document");
const DocumentVersion = require("../../models/documentVersion");
const Permission = require("../../models/permissionSchema");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const passport = require("passport");
const mammoth = require("mammoth");
const multer = require("multer");
const OAuth2 = google.auth.OAuth2;
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
// Lấy tất cả tài liệu
exports.get_all_documents = (req, res, next) => {
  Document.find()
    .select(
      "documentTitle documentContent documentOwnerID isShared shareCode accessLevel currentVersionID createdAt updatedAt"
    )
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        documents: docs.map((doc) => {
          return {
            documentTitle: doc.documentTitle,
            documentContent: doc.documentContent,
            documentOwnerID: doc.documentOwnerID,
            isShared: doc.isShared,
            shareCode: doc.shareCode,
            accessLevel: doc.accessLevel,
            currentVersionID: doc.currentVersionID,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            request: {
              type: "GET",
              url: "http://localhost:8000/documents/" + doc._id,
            },
          };
        }),
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};
exports.get_by_document_id = async (req, res) => {
  const idDoc = req.params.idDoc;

  try {
    const doc = await Document.findById(idDoc).select(
      "documentTitle documentPath documentOwnerID isShared shareCode accessLevel currentVersionID createdAt updatedAt"
    );

    if (!doc) {
      return res
        .status(404)
        .json({ message: "No document found with this ID" });
    }

    const documentPath = doc.documentPath;
    if (!fs.existsSync(documentPath)) {
      return res
        .status(404)
        .json({ message: `File not found at path: ${documentPath}` });
    }

    const fileBuffer = fs.readFileSync(documentPath);
    const result = await mammoth.convertToHtml({ buffer: fileBuffer });

    res.status(200).json({
      document: {
        title: doc.documentTitle,
        owner: doc.documentOwnerID,
        isShared: doc.isShared,
        content: result.value,
        metadata: {
          shareCode: doc.shareCode,
          accessLevel: doc.accessLevel,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({
      message: "An error occurred while fetching the document",
      error,
    });
  }
};
exports.get_documents_by_owner_id = (req, res, next) => {
  const ownerId = req.params.ownerId; // Lấy documentOwnerID từ params
  Document.find({ documentOwnerID: ownerId }) // Tìm tất cả tài liệu theo documentOwnerID
    .select(
      "documentTitle documentContent documentOwnerID isShared shareCode accessLevel currentVersionID createdAt updatedAt"
    )
    .exec()
    .then((docs) => {
      if (docs.length > 0) {
        res.status(200).json({
          documents: docs,
          request: docs.map((doc) => ({
            type: "GET",
            url: `http://localhost:8000/documents/${doc._id}`, // Provide URL for each document
          })),
        });
      } else {
        res.status(404).json({
          id: ownerId || "haha", // If ownerId is missing, return a fallback value
          message: "No documents found for this owner",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: "An error occurred while fetching documents",
        error: err,
      });
    });
};

exports.create_document = async (req, res) => {
  try {
    // Kiểm tra nếu `documentTitle` không tồn tại
    if (!req.body.documentTitle) {
      return res.status(400).json({ message: "Document title is required." });
    }

    const documentTitle = req.body.documentTitle.replace(/\s+/g, "_");
    const documentId = new mongoose.Types.ObjectId();
    const newDocumentPath = path.join(
      "D:\\",
      `${documentTitle}_${documentId}.docx`
    );

    // Xử lý file tải lên
    if (req.file) {
      const uploadedFilePath = req.file.path;
      fs.copyFileSync(uploadedFilePath, newDocumentPath);
      fs.unlinkSync(uploadedFilePath);
    } else {
      fs.writeFileSync(newDocumentPath, "", "utf-8");
    }

    const document = new Document({
      _id: documentId,
      documentTitle: req.body.documentTitle,
      documentPath: newDocumentPath,
      documentOwnerID: req.body.documentOwnerID,
      isShared: req.body.isShared || false,
      shareCode: req.body.shareCode || generateShareCode(),
      accessLevel: req.body.accessLevel || "Restricted",
    });

    const savedDocument = await document.save();

    res.status(201).json({
      message: "Document created successfully",
      document: savedDocument,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ message: "Error creating document", error });
  }
};

const generateShareCode = () => {
  return Math.random().toString(36).substr(2, 8); // Tạo mã ngẫu nhiên 8 ký tự
};
exports.update_document = (req, res, next) => {
  const id = req.params.id;
  const updateOps = {};

  // Cập nhật từng trường nếu có
  for (const key in req.body) {
    if (req.body[key] !== undefined) {
      updateOps[key] = req.body[key];
    }
  }

  if (Object.keys(updateOps).length === 0) {
    return res.status(400).json({ message: "No update data provided" });
  }

  Document.updateOne({ _id: id }, { $set: updateOps })
    .exec()
    .then((result) => {
      if (result.nModified === 0) {
        return res.status(404).json({ message: "No document found to update" });
      }

      return Document.findById(id);
    })
    .then((updatedDocument) => {
      if (!updatedDocument) {
        return res.status(404).json({ message: "Updated document not found" });
      }
      res.status(200).json({
        message: "Document updated successfully",
        updatedDocument,
        request: {
          type: "GET",
          url: "http://localhost:8000/documents/" + id,
        },
      });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
};

// Xóa tài liệu
exports.delete_document = (req, res, next) => {
  const id = req.params.id;
  Document.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Document deleted",
        request: {
          type: "POST",
          url: "http://localhost:8000/documents",
          body: {
            documentTitle: "String",
            documentContent: "String",
            documentOwnerID: "ObjectId",
          },
        },
      });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
};
exports.checkDocumentPermission = async (req, res, next) => {
  const { documentID } = req.params;
  // const userID = req.user._id; // ID người dùng từ JWT hoặc session
  try {
    const document = await Document.findById(documentID);

    if (!document) {
      return res.status(404).json({ message: "Không tìm thấy tài liệu." });
    }

    if (
      document.documentOwnerID.toString() === userID.toString() ||
      (document.isShared && document.accessLevel === "Edit")
    ) {
      req.document = document;
      next();
    } else if (document.isShared && document.accessLevel === "View") {
      return res
        .status(403)
        .json({ message: "Bạn chỉ có quyền xem tài liệu này." });
    } else {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền truy cập tài liệu này." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi kiểm tra quyền truy cập.", error });
  }
};
exports.update_everytime = async (req, res) => {
  try {
    const documentId = req.params.id;
    const { documentContent } = req.body;

    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      { documentContent, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({
      message: "Document updated successfully",
      document: updatedDocument,
    });
  } catch (error) {
    res.status(500).json({ message: "Error saving document", error });
  }
};
exports.on_share_code = async (req, res) => {
  const { shareCode } = req.params;

  if (!req.user || !req.user._id) {
    return res.status(401).json({
      message: "You need to be logged in to access this document.rr",
    });
  }

  const userId = req.user._id;

  try {
    const document = await Document.findOne({ shareCode });

    if (!document) {
      return res.status(404).json({
        message: "Document not found or not shared.",
      });
    }

    if (document.documentOwnerID.toString() === userId.toString()) {
      return res.status(200).json({
        message: "Document found.",
        document,
        request: {
          type: "GET",
          url: `http://localhost:8000/documents/detail/${document._id}`,
        },
      });
    }

    if (
      document.accessLevel === "Restricted" &&
      document.documentOwnerID.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        message: "You do not have access to this document.",
      });
    }

    res.status(200).json({
      message: "Document found.",
      document,
      request: {
        type: "GET",
        url: `http://localhost:8000/documents/detail/${document._id}`,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while fetching the document.",
      error,
    });
  }
};

exports.share_Document_with_email = async (req, res) => {
  const { email, id } = req.body;

  // Kiểm tra xem email có hợp lệ không
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const link = `${process.env.CLIENT_URL}/documents/share/${id}`;

  try {
    const accessToken = await oAuth2Client.getAccessToken();
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "docsync9@gmail.com", // Lấy email từ biến môi trường
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    var mailOptions = {
      from: "DOCSYNC <thông qua Google Tài liệu>",
      to: email,
      subject: "[DOCSYNC] Document Shared",
      html: `
    <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #4CAF50;">Tài liệu đã được chia sẻ!</h2>
      <p>Chào bạn,</p>
      <p>Doc Sync đã chia sẻ một tài liệu với bạn. Bạn có thể truy cập tài liệu bằng cách nhấp vào liên kết dưới đây:</p>
      <p>
        <a href="${link}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Mở Tài Liệu</a>
      </p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      <footer style="margin-top: 20px; font-size: 12px; color: #777;">
        <p>Nếu bạn không mong muốn nhận email này, vui lòng liên hệ với chúng tôi.</p>
      </footer>
    </div>
  `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.status(500).json({ error: "Failed to send email" });
      } else {
        return res.status(200).json({ message: "Email sent successfully" });
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
