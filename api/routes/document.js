const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Document = require("../models/document");
const documentController = require("../controller/document/document");
const isAuthenticated = require("../middleware/check-auth");
router.get("/", documentController.get_all_documents);
router.get("/detail/:idDoc", documentController.get_by_document_id);
router.get("/:ownerId", documentController.get_documents_by_owner_id);
router.post("/", isAuthenticated, documentController.create_document);
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
