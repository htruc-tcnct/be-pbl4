const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const Document = require("../models/document");
const documentController = require("../controller/document/document");
const isAuthenticated = require("../middleware/check-auth");
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
  }),
});
router.get("/", documentController.get_all_documents);
router.get("/detail/:idDoc", documentController.get_by_document_id);
router.get("/:ownerId", documentController.get_documents_by_owner_id);
router.post(
  "/",
  upload.single("file"),
  isAuthenticated,
  documentController.create_document
);
router.put("/:id", documentController.update_document);
router.delete("/:id", documentController.delete_document);
router.get(
  "/share/:shareCode",
  isAuthenticated,
  documentController.on_share_code
);

router.post(
  "/share-to-email",

  documentController.share_Document_with_email
);

module.exports = router;
