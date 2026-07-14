import {
  createDocument,
  getworkspaceDocument,
  getDocumentById,
  updateDocument,
  getDocumentText,
  getDocumentCanvas,
  updateDocumentText,
  updateDocumentCanvas,
  deleteDocument,
} from "./document.services.js";

const mapErrorToResponse = (error, res, defaultMessage) => {
  if (["Access denied", "Insufficient permissions"].includes(error.message)) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || defaultMessage,
  });
};

export const createDocumentController = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title } = req.body;
    const userId = req.user._id;

    const doc = await createDocument({ workspaceId, userId, title });
    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error("Error creating document:", error);
    return mapErrorToResponse(error, res, "Failed to create document");
  }
};

export const getWorkspaceDocumentsController = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    const docs = await getworkspaceDocument({ workspaceId, userId });
    return res.status(200).json({ success: true, data: docs });
  } catch (error) {
    console.error("Error fetching workspace documents:", error);
    return mapErrorToResponse(error, res, "Failed to fetch documents");
  }
};

export const getDocumentByIdController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const doc = await getDocumentById({ documentId, userId });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error("Error fetching document by ID:", error);
    return mapErrorToResponse(error, res, "Failed to fetch document");
  }
};

export const updateDocumentController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title } = req.body;
    const userId = req.user._id;

    const doc = await updateDocument({ documentId, userId, title });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error("Error updating document:", error);
    return mapErrorToResponse(error, res, "Failed to update document");
  }
};

export const getDocumentTextController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const textRecord = await getDocumentText({ documentId, userId });
    return res.status(200).json({ success: true, data: textRecord });
  } catch (error) {
    console.error("Error fetching document text:", error);
    return mapErrorToResponse(error, res, "Failed to fetch document text");
  }
};

export const getDocumentCanvasController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const canvasRecord = await getDocumentCanvas({ documentId, userId });
    return res.status(200).json({ success: true, data: canvasRecord });
  } catch (error) {
    console.error("Error fetching document canvas:", error);
    return mapErrorToResponse(error, res, "Failed to fetch document canvas");
  }
};

export const updateDocumentTextController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const textRecord = await updateDocumentText({ documentId, content, userId });
    return res.status(200).json({ success: true, data: textRecord });
  } catch (error) {
    console.error("Error updating document text:", error);
    return mapErrorToResponse(error, res, "Failed to update document text");
  }
};

export const updateDocumentCanvasController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const canvasRecord = await updateDocumentCanvas({ documentId, content, userId });
    return res.status(200).json({ success: true, data: canvasRecord });
  } catch (error) {
    console.error("Error updating document canvas:", error);
    return mapErrorToResponse(error, res, "Failed to update document canvas");
  }
};

export const deleteDocumentController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const result = await deleteDocument({ documentId, userId });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error deleting document:", error);
    return mapErrorToResponse(error, res, "Failed to delete document");
  }
};
