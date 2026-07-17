import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks";

/**
 * WorkspaceHeader
 * Top bar: hamburger, canvas title + save badge, view mode toggle, theme + nav.
 */
const WorkspaceHeader = ({
  activeDoc,
  activeDocTitle,
  setActiveDocTitle,
  isSaving,
  viewMode,
  setViewMode,
  onOpenSidebar,
  isViewer = false,
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b-[4px] border-neon-border bg-panel-bg sticky top-0 z-20">
      
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 -ml-2 text-black dark:text-white hover:text-purple-600 rounded-lg transition-colors"
          onClick={onOpenSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
 
        {activeDoc ? (
          <div className="flex items-center gap-3">
            <span className="text-lg font-black uppercase">🎨</span>
            <input
              type="text"
              value={activeDocTitle}
              onChange={(e) => setActiveDocTitle(e.target.value)}
              disabled={isViewer}
              className="bg-transparent border-b-[2px] border-transparent hover:border-black/20 focus:border-black dark:focus:border-white focus:outline-none text-sm sm:text-lg font-black uppercase text-black dark:text-white py-0.5 px-1 transition-colors disabled:cursor-not-allowed max-w-[80px] sm:max-w-[150px] md:max-w-none truncate"
              placeholder="Untitled Canvas"
            />
            {isSaving ? (
              <span className="text-[9px] font-black bg-blue-200 dark:bg-blue-300 text-black px-2 py-0.5 border-[2px] border-black shadow-[1px_1px_0px_0px_var(--shadow-white)] uppercase animate-pulse rotate-[-1deg] inline-block select-none">
                Saving...
              </span>
            ) : (
              <span className="text-[9px] font-black bg-emerald-300 dark:bg-emerald-400 text-black px-2 py-0.5 border-[2px] border-black shadow-[1.5px_1.5px_0px_0px_var(--shadow-white)] uppercase rotate-[2deg] inline-block select-none">
                Saved ✓
              </span>
            )}
          </div>
        ) : (
          <h1 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">
            Workspace Canvas Area
          </h1>
        )}
      </div>
 
      {/* Center: View Mode Segmented Control */}
      {activeDoc && (
        <div className="flex border-[3px] border-neon-border shadow-[2px_2px_0px_0px_var(--shadow-purple)] rounded overflow-hidden">
          {[
            { mode: "notes", label: "Notes", longLabel: "Notes Only" },
            { mode: "split", label: "Split", longLabel: "Split View" },
            { mode: "canvas", label: "Canvas", longLabel: "Canvas Only" },
          ].map((v) => (
            <button
              key={v.mode}
              onClick={() => setViewMode(v.mode)}
              className={`px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-black uppercase tracking-wider cursor-pointer border-r-2 last:border-r-0 border-neon-border transition-colors ${
                viewMode === v.mode
                  ? "bg-cyan-300 text-black"
                  : "bg-card-bg text-black dark:text-white"
              }`}
            >
              <span className="hidden sm:inline">{v.longLabel}</span>
              <span className="inline sm:hidden">{v.label}</span>
            </button>
          ))}
        </div>
      )}
 
      {/* Right: Theme toggle + Dashboard */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 bg-card-bg border-[3px] border-neon-border text-black dark:text-white shadow-[3px_3px_0px_0px_var(--shadow-cyan)] hover:shadow-[5px_5px_0px_0px_var(--shadow-cyan)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 border-[3px] border-neon-border bg-cyan-300 text-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_var(--shadow-white)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
        >
          Dashboard
        </button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
