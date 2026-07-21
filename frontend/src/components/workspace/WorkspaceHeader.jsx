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
    <header className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b-[4px] border-neon-border bg-panel-bg sticky top-0 z-20 select-none">
      
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          className="md:hidden p-2 -ml-2 text-black dark:text-white hover:text-purple-600 rounded-lg transition-colors"
          onClick={onOpenSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
  
        {activeDoc ? (
          <div className="flex items-center gap-1.5 sm:gap-3">
            <span className="text-base sm:text-lg font-black uppercase">🎨</span>
            <input
              type="text"
              value={activeDocTitle}
              onChange={(e) => setActiveDocTitle(e.target.value)}
              disabled={isViewer}
              className="bg-transparent border-b-[2px] border-transparent hover:border-black/20 focus:border-black dark:focus:border-white focus:outline-none text-xs sm:text-lg font-black uppercase text-black dark:text-white py-0.5 px-1 transition-colors disabled:cursor-not-allowed max-w-[65px] sm:max-w-[150px] md:max-w-none truncate"
              placeholder="Untitled"
            />
            {isSaving ? (
              <span className="text-[9px] font-black bg-blue-200 dark:bg-blue-300 text-black px-1 py-0.5 sm:px-2 border-[2px] border-black shadow-[1px_1px_0px_0px_var(--shadow-white)] uppercase animate-pulse rotate-[-1deg] inline-block select-none" title="Saving changes...">
                <span className="hidden xs:inline">Saving...</span>
                <span className="xs:hidden">⚡</span>
              </span>
            ) : (
              <span className="text-[9px] font-black bg-emerald-300 dark:bg-emerald-400 text-black px-1.5 py-0.5 sm:px-2 border-[2px] border-black shadow-[1.5px_1.5px_0px_0px_var(--shadow-white)] uppercase rotate-[2deg] inline-block select-none" title="All changes saved">
                <span className="hidden xs:inline">Saved ✓</span>
                <span className="xs:hidden">✓</span>
              </span>
            )}
          </div>
        ) : (
          <h1 className="text-sm sm:text-xl font-black uppercase tracking-tight text-black dark:text-white truncate max-w-[120px] sm:max-w-none">
            Workspace Canvas Area
          </h1>
        )}
      </div>
  
      {/* Center: View Mode Segmented Control */}
      {activeDoc && (
        <div className="flex border-[3px] border-neon-border shadow-[2px_2px_0px_0px_var(--shadow-purple)] rounded overflow-hidden shrink-0">
          {[
            { mode: "notes", label: "📝", mediumLabel: "Notes", longLabel: "Notes Only" },
            { mode: "split", label: "🌓", mediumLabel: "Split", longLabel: "Split View" },
            { mode: "canvas", label: "🎨", mediumLabel: "Canvas", longLabel: "Canvas Only" },
          ].map((v) => (
            <button
              key={v.mode}
              onClick={() => setViewMode(v.mode)}
              className={`px-1.5 py-1 sm:px-2 md:px-3 md:py-1.5 text-[10px] md:text-xs font-black uppercase tracking-wider cursor-pointer border-r-2 last:border-r-0 border-neon-border transition-colors ${
                viewMode === v.mode
                  ? "bg-cyan-300 text-black"
                  : "bg-card-bg text-black dark:text-white"
              }`}
            >
              <span className="hidden md:inline">{v.longLabel}</span>
              <span className="hidden sm:inline md:hidden">{v.mediumLabel}</span>
              <span className="inline sm:hidden">{v.label}</span>
            </button>
          ))}
        </div>
      )}
  
      {/* Right: Theme toggle + Dashboard */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 bg-card-bg border-[3px] border-neon-border text-black dark:text-white shadow-[2px_2px_0px_0px_var(--shadow-cyan)] hover:shadow-[4px_4px_0px_0px_var(--shadow-cyan)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
        >
          {theme === "dark" ? (
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="p-1.5 sm:px-4 sm:py-2 border-[3px] border-neon-border bg-cyan-300 text-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_var(--shadow-white)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer flex items-center justify-center"
          title="Go to Dashboard"
        >
          <span className="hidden sm:inline">Dashboard</span>
          <svg className="w-3.5 h-3.5 sm:hidden text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
