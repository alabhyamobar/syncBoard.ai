import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks";
import api from "../../api";

/**
 * WorkspaceSidebar
 * Left navigation panel: canvas list, invite form, members list.
 */
const WorkspaceSidebar = ({
  workspace,
  documents,
  members,
  activeDoc,
  isSidebarOpen,
  onCloseSidebar,
  onSelectDoc,
  onOpenCreateModal,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviteSuccess,
  inviteError,
  onInviteMember,
  onDeleteDoc,
  isViewer = false,
  userWorkspaceRole = null,
  onChangeMemberRole,
  onRemoveMember,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav
      className={`
        fixed md:relative z-50 flex flex-col 
        w-[280px] h-full 
        bg-panel-bg border-r-[4px] border-neon-border
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Workspace Brand Head */}
      <div className="p-5 border-b-[4px] border-neon-border bg-cyan-300 flex items-center justify-between relative overflow-hidden shrink-0">
        <div 
          className="absolute inset-0 opacity-[0.08] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#000000 18%, transparent 18%)', 
            backgroundSize: '8px 8px' 
          }}
        />
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-1 border-2 border-black bg-white text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-black text-sm uppercase tracking-tight text-black truncate max-w-[170px]">
            {workspace?.name || "Workspace"}
          </span>
        </div>
        <button
          className="md:hidden text-black hover:text-purple-600 transition-colors cursor-pointer relative z-10"
          onClick={onCloseSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">

        {/* Canvases List */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-black/40 dark:text-zinc-400">
              Canvases
            </span>
            {!isViewer && (
              <button
                onClick={onOpenCreateModal}
                className="px-2.5 py-1 text-[10px] font-black uppercase bg-purple-300 dark:bg-purple-600 border-[2px] border-neon-border shadow-[1px_1px_0px_0px_var(--shadow-white)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2.5px_2.5px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer text-black dark:text-white"
              >
                + New
              </button>
            )}
          </div>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="text-[11px] font-bold text-center text-zinc-400 py-3 uppercase">
                No canvases yet
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc._id}
                  className="group relative flex items-center w-full"
                >
                  <button
                    onClick={() => {
                      onSelectDoc(doc);
                      onCloseSidebar();
                    }}
                    className={`flex-1 text-left px-3.5 pr-10 py-2.5 border-[2px] border-neon-border font-black text-xs uppercase transition-all cursor-pointer truncate ${
                      activeDoc?._id === doc._id
                        ? "bg-cyan-300 dark:bg-cyan-400 text-black shadow-[3px_3px_0px_0px_var(--shadow-purple)]"
                        : "bg-card-bg text-black dark:text-white hover:bg-cyan-50 dark:hover:bg-hover-bg"
                    }`}
                  >
                    🎨 {doc.title}
                  </button>
                  {!isViewer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteDoc) {
                          onDeleteDoc(doc._id, doc.title);
                        }
                      }}
                      className="absolute right-2.5 opacity-0 group-hover:opacity-100 p-1 border-[2px] border-neon-border bg-red-400 dark:bg-red-500 hover:bg-red-500 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[1.5px_1.5px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer text-black dark:text-white"
                      title="Delete canvas"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Members / Invite Section */}
        <div className="pt-4 border-t-2 border-black/10 dark:border-white/10">
          <span className="block text-[10px] font-black uppercase tracking-wider text-black/40 dark:text-zinc-400 mb-3">
            Teammates
          </span>

          {isViewer ? (
            <div className="text-[11px] font-bold text-center text-zinc-400 py-3 uppercase border-[2px] border-dashed border-neon-border border-opacity-10 mb-4 bg-zinc-50 dark:bg-hover-bg/30">
              Only admins can invite
            </div>
          ) : (
            <form onSubmit={onInviteMember} className="space-y-2 mb-4">
              <input
                type="email"
                placeholder="Teammate's email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-card-bg border-[2px] border-neon-border text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-zinc-500 font-bold outline-none"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-card-bg border-[2px] border-neon-border text-black dark:text-white font-bold outline-none cursor-pointer"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                type="submit"
                className="w-full py-2 text-xs font-black uppercase bg-emerald-300 border-[2px] border-neon-border text-black hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
              >
                Send Invite
              </button>
              {inviteSuccess && (
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {inviteSuccess}
                </p>
              )}
              {inviteError && (
                <p className="text-[10px] font-bold text-red-500 uppercase">
                  {inviteError}
                </p>
              )}
            </form>
          )}

          <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-2 p-2 border-[2px] border-neon-border border-opacity-20 bg-zinc-50 dark:bg-card-bg text-xs font-bold truncate text-black dark:text-white"
              >
                <div className="w-6 h-6 bg-purple-300 text-black rounded-full flex items-center justify-center font-black text-[10px] uppercase shrink-0">
                  {member.userId?.username?.slice(0, 2) || member.email?.slice(0, 2) || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[11px] font-black">
                    {member.userId?.username || member.email || "Builder"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {userWorkspaceRole === "OWNER" && member.role !== "OWNER" && member.userId?._id !== user?._id ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => onChangeMemberRole(member._id, e.target.value)}
                          className="text-[9px] uppercase font-black px-1 py-0.5 bg-orange-100 dark:bg-orange-300 text-black border-2 border-neon-border outline-none cursor-pointer"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="EDITOR">Editor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          onClick={() => onRemoveMember(member._id, member.userId?.username || member.userId?.email)}
                          className="p-1 border-2 border-neon-border bg-red-400 text-black hover:bg-red-500 font-bold text-[9px] cursor-pointer transition-colors"
                          title="Remove teammate"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-orange-100 dark:bg-orange-200 text-black border-2 border-neon-border">
                          {member.role}
                        </span>
                        {/* Admins can remove editors/viewers, and members can remove themselves (leave) */}
                        {((userWorkspaceRole === "ADMIN" && member.role !== "OWNER" && member.role !== "ADMIN" && member.userId?._id !== user?._id) ||
                          (member.userId?._id === user?._id && member.role !== "OWNER")) && (
                          <button
                            onClick={() => onRemoveMember(member._id, member.userId?._id === user?._id ? "yourself" : member.userId?.username || member.userId?.email)}
                            className="p-1 border-2 border-neon-border bg-red-400 text-black hover:bg-red-500 font-bold text-[9px] cursor-pointer transition-colors"
                            title={member.userId?._id === user?._id ? "Leave workspace" : "Remove teammate"}
                          >
                            ✕
                          </button>
                        )}
                      </>
                    )}
                    {member.status === "PENDING" && (
                      <span className="text-[8px] uppercase font-black px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border border-orange-400 dark:border-orange-700 rounded animate-pulse shrink-0">
                        Invited
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Workspace Button for Owner */}
      {userWorkspaceRole === "OWNER" && (
        <div className="px-4 pb-4">
          <button
            onClick={async () => {
              if (
                window.confirm(
                  `Are you sure you want to delete the workspace "${workspace?.name || "this workspace"}"? This will soft-delete the workspace and redirect you to the dashboard.`
                )
              ) {
                try {
                  await api.delete(`/workspace/${workspace._id}`);
                  navigate("/dashboard");
                } catch (err) {
                  console.error("Failed to delete workspace:", err);
                  alert(
                    err.response?.data?.message || "Failed to delete workspace"
                  );
                }
              }
            }}
            className="w-full py-2 bg-red-400 border-[2px] border-neon-border text-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_var(--shadow-white)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Workspace
          </button>
        </div>
      )}

      {/* Leave Workspace Button for non-owners */}
      {userWorkspaceRole && userWorkspaceRole !== "OWNER" && (
        <div className="px-4 pb-4">
          <button
            onClick={async () => {
              if (
                window.confirm(
                  `Are you sure you want to leave the workspace "${workspace?.name || "this workspace"}"? You will lose access to all canvases and notes.`
                )
              ) {
                // Find current user's member ID
                const myMemberRecord = members.find(
                  (m) => m.userId?._id === user?._id
                );
                if (!myMemberRecord) {
                  alert("Could not identify your membership record.");
                  return;
                }
                try {
                  await api.delete(
                    `/workspace/${workspace._id}/members/${myMemberRecord._id}`
                  );
                  navigate("/dashboard");
                } catch (err) {
                  console.error("Failed to leave workspace:", err);
                  alert(
                    err.response?.data?.message || "Failed to leave workspace"
                  );
                }
              }
            }}
            className="w-full py-2 bg-orange-300 border-[2px] border-neon-border text-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_var(--shadow-white)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            🚪 Leave Workspace
          </button>
        </div>
      )}

      {/* Footer / User Card */}
      <div className="p-4 border-t-[4px] border-neon-border bg-zinc-50 dark:bg-panel-bg flex items-center gap-3">
        <div className="w-8 h-8 border-[2px] border-neon-border bg-white dark:bg-card-bg flex items-center justify-center shadow-[1px_1px_0px_0px_var(--shadow-white)] overflow-hidden shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-yellow-200 dark:bg-yellow-400 text-black flex items-center justify-center text-xs font-black uppercase">
              {user?.username ? user.username.slice(0, 2) : "U"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black truncate text-black dark:text-white">{user?.username || user?.email || "You"}</p>
          <span className="inline-block text-[9px] uppercase font-black px-1.5 py-0.5 bg-purple-200 text-black border border-black shadow-[1px_1px_0px_0px_#000]">
            {userWorkspaceRole || "MEMBER"}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default WorkspaceSidebar;
