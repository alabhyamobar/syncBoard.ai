import documentModel from "./document.model.js";
import documentTextModel from "./documentText.model.js";
import documentCanvasModel from "./documentCanvas.model.js";
import { checkWorkspaceAccess } from "../workspace/workspace.service.js";

export const createDocument = async ({ workspaceId, userId, title }) => {
  await checkWorkspaceAccess({
    workspaceId,
    userId,
    roles: ["OWNER", "ADMIN", "EDITOR"],
  });

  return documentModel.create({
    workspaceId,
    title: title || "Untitled Document",
    createdBy: userId,
  });
};

export const getworkspaceDocument = async ({ workspaceId, userId }) => {
  await checkWorkspaceAccess({ workspaceId, userId });

  return documentModel
    .find({ workspaceId })
    .select("title updatedAt createdBy version")
    .sort({ updatedAt: -1 });
};

export const getDocumentById = async ({ documentId, userId }) => {
  const doc = await documentModel.findById(documentId);

  if (!doc) {
    throw { status: 404, message: "Document not found" };
  }

  await checkWorkspaceAccess({
    workspaceId: doc.workspaceId,
    userId,
  });

  return doc;
};

export const updateDocument = async ({ documentId, userId, title }) => {
  const doc = await documentModel.findById(documentId);

  if (!doc) {
    throw { status: 404, message: "Document not found" };
  }

  await checkWorkspaceAccess({
    workspaceId: doc.workspaceId,
    userId,
    roles: ["OWNER", "ADMIN", "EDITOR"],
  });

  if (title !== undefined) doc.title = title;
  doc.lastEditedBy = userId;
  doc.version = (doc.version || 1) + 1;

  return doc.save();
};

export const getDocumentText = async ({ documentId, userId }) => {
  const doc = await documentModel.findById(documentId);
  if (!doc) {
    throw { status: 404, message: "Document not found" };
  }

  await checkWorkspaceAccess({
    workspaceId: doc.workspaceId,
    userId,
  });

  let textRecord = await documentTextModel.findOne({ documentId });
  if (!textRecord) {
    textRecord = { documentId, content: "" };
  }
  return textRecord;
};

export const getDocumentCanvas = async ({ documentId, userId }) => {
  const doc = await documentModel.findById(documentId);
  if (!doc) {
    throw { status: 404, message: "Document not found" };
  }

  await checkWorkspaceAccess({
    workspaceId: doc.workspaceId,
    userId,
  });

  let canvasRecord = await documentCanvasModel.findOne({ documentId });
  if (!canvasRecord) {
    canvasRecord = { documentId, content: null };
  }
  return canvasRecord;
};

export const updateDocumentText = async ({ documentId, content, userId }) => {
  const doc = await documentModel.findById(documentId);
  if (!doc) {
    throw { status: 404, message: "Document not found" };
  }

  await checkWorkspaceAccess({
    workspaceId: doc.workspaceId,
    userId,
    roles: ["OWNER", "ADMIN", "EDITOR"],
  });

  const textRecord = await documentTextModel.findOneAndUpdate(
    { documentId },
    { content },
    { upsert: true, new: true }
  );

  doc.lastEditedBy = userId;
  doc.version = (doc.version || 1) + 1;
  await doc.save();

  return textRecord;
};

export const updateDocumentCanvas = async ({ documentId, content, userId }) => {
  const doc = await documentModel.findById(documentId);
  if (!doc) {
    throw { status: 404, message: "Document not found" };
  }

  await checkWorkspaceAccess({
    workspaceId: doc.workspaceId,
    userId,
    roles: ["OWNER", "ADMIN", "EDITOR"],
  });

  const canvasRecord = await documentCanvasModel.findOneAndUpdate(
    { documentId },
    { content },
    { upsert: true, new: true }
  );

  doc.lastEditedBy = userId;
  doc.version = (doc.version || 1) + 1;
  await doc.save();

  return canvasRecord;
};

export const deleteDocument = async ({ documentId, userId }) => {
  const doc = await documentModel.findById(documentId);
  if (!doc) {
    throw { status: 404, message: "Document not found" };
  }

  await checkWorkspaceAccess({
    workspaceId: doc.workspaceId,
    userId,
    roles: ["OWNER", "ADMIN", "EDITOR"],
  });

  // Delete metadata, text, and canvas records concurrently
  await Promise.all([
    documentModel.findByIdAndDelete(documentId),
    documentTextModel.deleteOne({ documentId }),
    documentCanvasModel.deleteOne({ documentId }),
  ]);

  return { documentId };
};

