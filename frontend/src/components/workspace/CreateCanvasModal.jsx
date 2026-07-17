import React from "react";

/**
 * CreateCanvasModal
 * Modal dialog for creating a new canvas document.
 */
const CreateCanvasModal = ({
  isOpen,
  newCanvasTitle,
  setNewCanvasTitle,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-card-bg border-[4px] border-neon-border p-8 shadow-[10px_10px_0px_0px_var(--shadow-pink)] w-full max-w-md">
        <h2 className="text-2xl font-black uppercase mb-1 text-black dark:text-white">
          New Canvas
        </h2>
        <p className="text-black/60 dark:text-zinc-400 font-bold text-xs uppercase tracking-wide mb-6">
          Create a collaborative infinite board
        </p>

        <div className="mb-8">
          <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
            Canvas Title
          </label>
          <input
            value={newCanvasTitle}
            onChange={(e) => setNewCanvasTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
            autoFocus
            className="w-full px-5 py-4 bg-card-bg border-[3px] border-neon-border text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-zinc-500 font-bold shadow-[3px_3px_0px_0px_var(--shadow-pink)] focus:shadow-[5px_5px_0px_0px_var(--shadow-pink)] focus:-translate-x-0.5 focus:-translate-y-0.5 outline-none transition-all"
            placeholder="e.g. Brainstorming Phase 1"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-4 font-black uppercase border-[3px] border-neon-border bg-card-bg text-black dark:text-white shadow-[4px_4px_0px_0px_var(--shadow-pink)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-4 font-black uppercase border-[3px] border-neon-border bg-cyan-300 text-black shadow-[4px_4px_0px_0px_var(--shadow-purple)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
          >
            Create Now ✦
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCanvasModal;
