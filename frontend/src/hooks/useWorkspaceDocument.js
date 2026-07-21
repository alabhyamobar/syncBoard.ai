import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "./useAuth.js";

/**
 * useWorkspaceDocument
 * Encapsulates all data-fetching, document selection, autosave, and
 * workspace mutation logic for WorkspaceDetail.
 *
 * @param {string} workspaceId - from useParams()
 */
export const useWorkspaceDocument = (workspaceId) => {
  const { user } = useAuth();
  const userId = user?._id;
  const navigate = useNavigate();

  // ── Workspace meta ───────────────────────────────────────────────
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);

  // ── Active document ──────────────────────────────────────────────
  const [activeDoc, setActiveDoc] = useState(null);
  const [activeDocTitle, setActiveDocTitle] = useState("");
  const [notesContent, setNotesContent] = useState("");

  // tldraw snapshot loaded from DB (plain JSON object, undefined means loading)
  const [canvasSnapshot, setCanvasSnapshot] = useState(undefined);

  // Saving status
  const [isSaving, setIsSaving] = useState(false);

  // Layout viewMode (managed here to drive lazy loading)
  const [viewMode, setViewMode] = useState("split");

  // Lazy loading flags
  const [isTextLoaded, setIsTextLoaded] = useState(false);
  const [isCanvasLoaded, setIsCanvasLoaded] = useState(false);

  // Ref to latest tldraw editor instance (set by TldrawCanvas via callback)
  const editorRef = useRef(null);

  // ── Invite member ────────────────────────────────────────────────
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VIEWER");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  // ── Create canvas modal ──────────────────────────────────────────
  const [newCanvasTitle, setNewCanvasTitle] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Select / load a document ─────────────────────────────────────
  const selectDocument = useCallback(async (doc) => {
    setActiveDoc(doc);
    setActiveDocTitle(doc.title);
    if (workspaceId) {
      const key = userId ? `last_active_doc_${userId}_${workspaceId}` : `last_active_doc_${workspaceId}`;
      localStorage.setItem(key, doc._id);
    }

    try {
      const res = await api.get(`/document/${doc._id}`);
      if (res.data?.data) {
        setActiveDoc(res.data.data);
        setActiveDocTitle(res.data.data.title);
      }
    } catch (err) {
      console.error("Error fetching document metadata:", err);
    }
  }, [workspaceId, userId]);

  // ── Fetch workspace meta ─────────────────────────────────────────
  const fetchWorkspaceMeta = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [wsRes, docsRes, memRes] = await Promise.all([
        api.get(`/workspace/${workspaceId}`),
        api.get(`/document/workspace/${workspaceId}`),
        api.get(`/workspace/${workspaceId}/members`),
      ]);

      if (wsRes.data?.workspace) setWorkspace(wsRes.data.workspace);
      if (docsRes.data?.data) {
        const docs = docsRes.data.data;
        setDocuments(docs);

        // Restore previously active document if one is stored in localStorage (user partitioned)
        const savedDocId = userId
          ? localStorage.getItem(`last_active_doc_${userId}_${workspaceId}`)
          : localStorage.getItem(`last_active_doc_${workspaceId}`);
        const savedDoc = docs.find((d) => d._id === savedDocId);
        if (savedDoc) {
          selectDocument(savedDoc);
        } else if (docs.length > 0) {
          // If no stored active document, default to the first document in the list
          selectDocument(docs[0]);
        }
      }
      if (memRes.data?.members) setMembers(memRes.data.members);
    } catch (err) {
      console.error("Error loading workspace data:", err);
      if (err.response?.status === 403 || err.response?.status === 401 || err.response?.status === 404) {
        navigate("/dashboard");
      }
    }
  }, [workspaceId, selectDocument, userId, navigate]);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMeta();
      setActiveDoc(null);
      setCanvasSnapshot(undefined);
      setNotesContent("");
      setIsTextLoaded(false);
      setIsCanvasLoaded(false);
    }
  }, [workspaceId, fetchWorkspaceMeta]);

  // Reset loaded states when active document changes
  useEffect(() => {
    setIsTextLoaded(false);
    setIsCanvasLoaded(false);
    setNotesContent("");
    setCanvasSnapshot(undefined);
  }, [activeDoc?._id]);

  // ── Lazy load content as required by the viewMode ────────────────
  useEffect(() => {
    if (!activeDoc) return;

    const loadText = async () => {
      if (isTextLoaded) return;
      if (viewMode === "notes" || viewMode === "split") {
        try {
          const res = await api.get(`/document/${activeDoc._id}/text`);
          if (res.data?.data) {
            setNotesContent(res.data.data.content || "");
            setIsTextLoaded(true);
          }
        } catch (err) {
          console.error("Error lazy loading document text:", err);
        }
      }
    };

    const loadCanvas = async () => {
      if (isCanvasLoaded) return;
      if (viewMode === "canvas" || viewMode === "split") {
        try {
          const res = await api.get(`/document/${activeDoc._id}/canvas`);
          if (res.data?.data) {
            setCanvasSnapshot(res.data.data.content || null);
            setIsCanvasLoaded(true);
          }
        } catch (err) {
          console.error("Error lazy loading document canvas:", err);
        }
      }
    };

    loadText();
    loadCanvas();
  }, [activeDoc?._id, viewMode, isTextLoaded, isCanvasLoaded]);

  // ── Autosave ─────────────────────────────────────────────────────
  // Called by TldrawCanvas whenever the tldraw store changes (debounced).
  const saveDocument = useCallback(
    async ({ notes, tldrawSnapshot }) => {
      if (!activeDoc) return;
      setIsSaving(true);
      try {
        const promises = [];
        if (tldrawSnapshot !== undefined) {
          promises.push(api.put(`/document/${activeDoc._id}/canvas`, { content: tldrawSnapshot }));
        }
        if (notes !== undefined) {
          promises.push(api.put(`/document/${activeDoc._id}/text`, { content: notes }));
        }
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } catch (err) {
        console.error("Autosave error:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [activeDoc]
  );

  // Autosave notes whenever notesContent changes (debounced 1500ms)
  useEffect(() => {
    if (!activeDoc || !isTextLoaded) return;
    const timer = setTimeout(() => {
      saveDocument({ notes: notesContent });
    }, 1500);
    return () => clearTimeout(timer);
  }, [notesContent, isTextLoaded, activeDoc?._id, saveDocument]);

  // Autosave title whenever activeDocTitle changes (debounced 1500ms)
  useEffect(() => {
    if (!activeDoc) return;
    // Skip if activeDocTitle matches the current doc title
    if (activeDocTitle === activeDoc.title) return;
    const timer = setTimeout(() => {
      api.put(`/document/${activeDoc._id}`, { title: activeDocTitle }).catch((err) => {
        console.error("Failed to save title:", err);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeDocTitle, activeDoc]);

  // ── Create canvas ────────────────────────────────────────────────
  const handleCreateCanvas = useCallback(async () => {
    if (!newCanvasTitle.trim()) return;
    try {
      const res = await api.post(`/document/workspace/${workspaceId}`, {
        title: newCanvasTitle,
      });
      if (res.data?.data) {
        const newDoc = res.data.data;
        setDocuments((prev) => [newDoc, ...prev]);
        setNewCanvasTitle("");
        setShowCreateModal(false);
        selectDocument(newDoc);
      }
    } catch (err) {
      console.error("Failed to create document:", err);
    }
  }, [newCanvasTitle, workspaceId, selectDocument]);

  // ── Invite member ────────────────────────────────────────────────
  const handleInviteMember = useCallback(
    async (e) => {
      e.preventDefault();
      if (!inviteEmail.trim()) return;
      setInviteError("");
      setInviteSuccess("");
      try {
        const res = await api.post(`/workspace/${workspaceId}/members/invite`, {
          email: inviteEmail,
          role: inviteRole,
        });
        if (res.data?.emailSent === false && res.data?.inviteLink) {
          setInviteSuccess(`Invite created! Email delivery failed. Copy link: ${res.data.inviteLink}`);
          setTimeout(() => setInviteSuccess(""), 20000);
        } else {
          setInviteSuccess("Invite successfully sent!");
          setTimeout(() => setInviteSuccess(""), 5000);
        }
        setInviteEmail("");
        setInviteRole("VIEWER");
        const memRes = await api.get(`/workspace/${workspaceId}/members`);
        if (memRes.data?.members) setMembers(memRes.data.members);
      } catch (err) {
        setInviteError(
          err.response?.data?.message || "Failed to invite member"
        );
      }
    },
    [inviteEmail, inviteRole, workspaceId]
  );

  // ── Delete document ──────────────────────────────────────────────
  const deleteDocument = useCallback(
    async (docId) => {
      try {
        await api.delete(`/document/${docId}`);
        
        // Remove from list
        const remaining = documents.filter((d) => d._id !== docId);
        setDocuments(remaining);

        // If the active document was deleted, switch activeDoc
        if (activeDoc?._id === docId) {
          if (remaining.length > 0) {
            selectDocument(remaining[0]);
          } else {
            setActiveDoc(null);
            setActiveDocTitle("");
            if (userId) {
              localStorage.removeItem(`last_active_doc_${userId}_${workspaceId}`);
            } else {
              localStorage.removeItem(`last_active_doc_${workspaceId}`);
            }
          }
        }
      } catch (err) {
        console.error("Error deleting document:", err);
      }
    },
    [documents, activeDoc, selectDocument, userId, workspaceId]
  );

  // ── Compute current user's role ─────────────────────────────────
  const currentMember = members.find((m) => m.userId?._id === userId);
  const userWorkspaceRole = currentMember ? currentMember.role : null;
  const isViewer = userWorkspaceRole === "VIEWER";

  // ── Update teammate role ─────────────────────────────────────────
  const onChangeMemberRole = useCallback(
    async (memberId, newRole) => {
      try {
        await api.patch(`/workspace/${workspaceId}/members/${memberId}/role`, {
          role: newRole,
        });
        const memRes = await api.get(`/workspace/${workspaceId}/members`);
        if (memRes.data?.members) setMembers(memRes.data.members);
      } catch (err) {
        console.error("Failed to update member role:", err);
        alert(err.response?.data?.message || "Failed to update member role");
      }
    },
    [workspaceId]
  );

  // ── Remove teammate from workspace ──────────────────────────────
  const onRemoveMember = useCallback(
    async (memberId, username) => {
      if (!window.confirm(`Are you sure you want to remove ${username || "this user"} from the workspace?`)) {
        return;
      }
      try {
        await api.delete(`/workspace/${workspaceId}/members/${memberId}`);
        const memRes = await api.get(`/workspace/${workspaceId}/members`);
        if (memRes.data?.members) setMembers(memRes.data.members);
      } catch (err) {
        console.error("Failed to remove member:", err);
        alert(err.response?.data?.message || "Failed to remove member");
      }
    },
    [workspaceId]
  );

  return {
    // Workspace
    workspace,
    documents,
    members,
    userWorkspaceRole,
    isViewer,

    // Active document
    activeDoc,
    activeDocTitle,
    setActiveDocTitle,
    notesContent,
    setNotesContent,
    canvasSnapshot,
    isSaving,

    // Layout
    viewMode,
    setViewMode,

    // Editor ref (set externally by TldrawCanvas)
    editorRef,

    // Callbacks
    selectDocument,
    saveDocument,
    handleCreateCanvas,
    handleInviteMember,
    deleteDocument,
    onChangeMemberRole,
    onRemoveMember,

    // Invite form
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteSuccess,
    inviteError,

    // Create modal
    newCanvasTitle,
    setNewCanvasTitle,
    showCreateModal,
    setShowCreateModal,
  };
};
