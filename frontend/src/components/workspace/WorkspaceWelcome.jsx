import React from "react";

/**
 * WorkspaceWelcome
 * Empty state shown when no canvas document is selected.
 */
const WorkspaceWelcome = ({ onOpenCreateModal }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center select-none">
      <div className="border-[4px] border-neon-border bg-cyan-300 dark:bg-cyan-400 p-8 max-w-xl shadow-[8px_8px_0px_0px_var(--shadow-pink)] text-black relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.08] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#000000 18%, transparent 18%)', 
            backgroundSize: '10px 10px' 
          }}
        />
        <div className="relative z-10">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-black">
            Select or Create a Canvas
          </h2>
          <p className="font-bold text-sm text-black/85 mb-6 uppercase">
            Co-create visual boards with your team. Select an active project from
            the sidebar or build a brand-new canvas workspace right now!
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-6 py-3 bg-white border-[3px] border-neon-border font-black uppercase text-black shadow-[4px_4px_0px_0px_var(--shadow-white)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer inline-flex items-center gap-2"
          >
            ✦ Create New Canvas
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceWelcome;
