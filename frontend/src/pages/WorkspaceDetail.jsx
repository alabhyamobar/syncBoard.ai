import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import { useWorkspaceDocument } from "../hooks";

import WorkspaceSidebar    from "../components/workspace/WorkspaceSidebar";
import WorkspaceHeader     from "../components/workspace/WorkspaceHeader";
import WorkspaceWelcome    from "../components/workspace/WorkspaceWelcome";
import NotesEditor         from "../components/workspace/NotesEditor";
import TldrawCanvas        from "../components/workspace/TldrawCanvas";
import CreateCanvasModal   from "../components/workspace/CreateCanvasModal";
import "./WorkspaceDetail.css";

/**
 * WorkspaceDetail
 * 
 * Slim orchestrator page (~100 lines). All data logic lives in
 * useWorkspaceDocument; all UI is delegated to focused sub-components.
 *
 * Layout:
 *   ┌──────────┬────────────────────────────────────┐
 *   │ Sidebar  │  Header                            │
 *   │          ├──────────────────────────────────  │
 *   │ (nav,    │  Notes Pane  │  tldraw Canvas      │
 *   │  invite) │  (40%)       │  (60%)              │
 *   └──────────┴────────────────────────────────────┘
 *
 * viewMode controls which panes are visible:
 *   "notes"  → only NotesEditor
 *   "split"  → NotesEditor + TldrawCanvas side by side
 *   "canvas" → only TldrawCanvas
 */
const WorkspaceDetail = () => {
  const { workspaceId } = useParams();

  // ── Layout state ────────────────────────────────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── All data & mutation logic ────────────────────────────────────
  const {
    workspace,
    documents,
    members,
    userWorkspaceRole,
    isViewer,

    activeDoc,
    activeDocTitle,
    setActiveDocTitle,
    notesContent,
    setNotesContent,
    canvasSnapshot,
    isSaving,

    viewMode,
    setViewMode,

    editorRef,

    selectDocument,
    saveDocument,
    handleCreateCanvas,
    handleInviteMember,

    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteSuccess,
    inviteError,

    newCanvasTitle,
    setNewCanvasTitle,
    showCreateModal,
    setShowCreateModal,
    deleteDocument,
    onChangeMemberRole,
    onRemoveMember,
  } = useWorkspaceDocument(workspaceId);

  // ── delete document callback ──────────────────────────────────────
  const handleDeleteDoc = useCallback(
    (docId, docTitle) => {
      if (window.confirm(`Are you sure you want to delete the canvas "${docTitle}"? This cannot be undone.`)) {
        deleteDocument(docId);
      }
    },
    [deleteDocument]
  );

  // ── tldraw save callback ─────────────────────────────────────────
  // Called by TldrawCanvas after its internal debounce fires
  const handleCanvasSave = useCallback(
    (tldrawSnapshot) => {
      saveDocument({ tldrawSnapshot });
    },
    [saveDocument]
  );

  // ── tldraw mount callback ────────────────────────────────────────
  const handleEditorMount = useCallback(
    (editor) => {
      editorRef.current = editor;
    },
    [editorRef]
  );

  return (
    <div className="flex h-screen bg-[#FAF8F5] dark:bg-[#121214] text-black dark:text-white overflow-hidden selection:bg-yellow-300 font-sans relative transition-colors duration-200">

      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <WorkspaceSidebar
        workspace={workspace}
        documents={documents}
        members={members}
        activeDoc={activeDoc}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onSelectDoc={selectDocument}
        onDeleteDoc={handleDeleteDoc}
        onOpenCreateModal={() => setShowCreateModal(true)}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        inviteSuccess={inviteSuccess}
        inviteError={inviteError}
        onInviteMember={handleInviteMember}
        isViewer={isViewer}
        userWorkspaceRole={userWorkspaceRole}
        onChangeMemberRole={onChangeMemberRole}
        onRemoveMember={onRemoveMember}
      />

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">

        {/* Header */}
        <WorkspaceHeader
          activeDoc={activeDoc}
          activeDocTitle={activeDocTitle}
          setActiveDocTitle={setActiveDocTitle}
          isSaving={isSaving}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isViewer={isViewer}
        />

        {/* Dynamic Body */}
        <div className="flex-1 relative overflow-hidden bg-[#FAF8F5] dark:bg-[#0f0a1c]">
          {activeDoc ? (
            <div className="w-full h-full flex flex-col md:flex-row">

              {/* Notes Pane */}
              {(viewMode === "notes" || viewMode === "split") && (
                <div
                  className={`border-black dark:border-[#8b5cf6] transition-all duration-200 overflow-hidden ${
                    viewMode === "split"
                      ? "w-full h-1/2 md:w-[40%] md:h-full border-b-[4px] md:border-b-0 md:border-r-[4px]"
                      : "w-full h-full"
                  }`}
                >
                  <NotesEditor
                    value={notesContent}
                    onChange={setNotesContent}
                    readOnly={isViewer}
                  />
                </div>
              )}

              {/* tldraw Canvas Pane */}
              {(viewMode === "canvas" || viewMode === "split") && (
                <div
                  className={`relative ${
                    viewMode === "split"
                      ? "w-full h-1/2 md:w-[60%] md:h-full"
                      : "w-full h-full"
                  }`}
                >
                  {canvasSnapshot !== undefined ? (
                    <TldrawCanvas
                      key={activeDoc._id}
                      docId={activeDoc._id}
                      snapshot={canvasSnapshot}
                      onSave={handleCanvasSave}
                      onMount={handleEditorMount}
                      readOnly={isViewer}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#FAF8F5] dark:bg-[#0f0a1c] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-t-purple-600 border-black rounded-full animate-spin"></div>
                        <span className="text-xs font-black uppercase tracking-wider text-black/50 dark:text-zinc-500 animate-pulse">
                          Loading Canvas...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <WorkspaceWelcome onOpenCreateModal={() => setShowCreateModal(true)} />
          )}
        </div>
      </main>

      {/* ── Create Canvas Modal ───────────────────────────────────── */}
      <CreateCanvasModal
        isOpen={showCreateModal}
        newCanvasTitle={newCanvasTitle}
        setNewCanvasTitle={setNewCanvasTitle}
        onConfirm={handleCreateCanvas}
        onClose={() => setShowCreateModal(false)}
      />

    </div>
  );
};

export default WorkspaceDetail;
