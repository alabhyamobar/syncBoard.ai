import express from "express";
import { requiredAuth } from "../../middleware/auth.middleware.js";
import {
  createDocumentController,
  getWorkspaceDocumentsController,
  getDocumentByIdController,
  updateDocumentController,
  getDocumentTextController,
  getDocumentCanvasController,
  updateDocumentTextController,
  updateDocumentCanvasController,
  deleteDocumentController,
} from "./document.controller.js";

const documentRouter = express.Router();

documentRouter.use(requiredAuth);

documentRouter.get("/:documentId", getDocumentByIdController);
documentRouter.put("/:documentId", updateDocumentController);
documentRouter.delete("/:documentId", deleteDocumentController);

documentRouter.get("/:documentId/text", getDocumentTextController);
documentRouter.put("/:documentId/text", updateDocumentTextController);

documentRouter.get("/:documentId/canvas", getDocumentCanvasController);
documentRouter.put("/:documentId/canvas", updateDocumentCanvasController);

documentRouter.get("/workspace/:workspaceId", getWorkspaceDocumentsController);
documentRouter.post("/workspace/:workspaceId", createDocumentController);

export default documentRouter;
