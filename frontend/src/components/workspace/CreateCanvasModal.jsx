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
      <div className="relative bg-white dark:bg-[#1a1435] border-[4px] border-black dark:border-[#8b5cf6] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#ec4899] w-full max-w-md">
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
            className="w-full px-5 py-4 bg-white dark:bg-[#221a48] border-[3px] border-black dark:border-[#8b5cf6] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-zinc-500 font-bold shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#ec4899] focus:shadow-[5px_5px_0px_0px_#000] dark:focus:shadow-[5px_5px_0px_0px_#ec4899] focus:-translate-x-0.5 focus:-translate-y-0.5 outline-none transition-all"
            placeholder="e.g. Brainstorming Phase 1"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-4 font-black uppercase border-[3px] border-black dark:border-white bg-white dark:bg-[#1a1435] text-black dark:text-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#ec4899] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-4 font-black uppercase border-[3px] border-black bg-cyan-300 text-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#8b5cf6] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
          >
            Create Now ✦
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCanvasModal;
