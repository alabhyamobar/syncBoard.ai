import React, { useRef } from "react";

/**
 * NotesEditor
 * Left-pane collaborative notes textarea with markdown helper buttons.
 *
 * Props:
 *   value       {string}   - current notes content
 *   onChange    {function} - (newValue: string) => void
 */
const NotesEditor = ({ value, onChange, readOnly = false }) => {
  const textareaRef = useRef(null);

  /** Insert markdown syntax at the cursor position */
  const insertSyntax = (syntax) => {
    if (readOnly || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    const newValue = before + syntax + after;
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntax.length, start + syntax.length);
    }, 50);
  };

  const helpers = [
    { label: "H1", syntax: "# " },
    { label: "H2", syntax: "## " },
    { label: "B",  syntax: "**Text**" },
    { label: "Code", syntax: "```javascript\n\n```" },
    { label: "List", syntax: "- " },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#110e23] border-r-[3px] border-black dark:border-[#8b5cf6]">
      {/* Toolbar */}
      <div className="p-3 border-b-[3px] border-black dark:border-[#8b5cf6] flex flex-wrap justify-between items-center bg-zinc-50 dark:bg-[#1a1435] gap-2 shrink-0">
        <span className="text-[10px] font-black uppercase text-black dark:text-zinc-300 bg-white dark:bg-zinc-800 px-2 py-0.5 border-2 border-black dark:border-white/20 shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#fff]">
          Notes Spec
        </span>
        <div className="flex gap-1.5 items-center">
          {readOnly ? (
            <span className="text-[9px] font-black bg-red-300 border-[2px] border-black text-black px-2.5 py-1 shadow-[1.5px_1.5px_0px_0px_#000] uppercase select-none rotate-[-2deg]">
              Read Only
            </span>
          ) : (
            helpers.map((h) => {
              const buttonColors = {
                H1: "bg-violet-300 hover:bg-violet-400",
                H2: "bg-cyan-300 hover:bg-cyan-400",
                B: "bg-pink-300 hover:bg-pink-400",
                Code: "bg-emerald-300 hover:bg-emerald-400",
                List: "bg-orange-300 hover:bg-orange-400"
              };
              const colorClass = buttonColors[h.label] || "bg-white hover:bg-zinc-100";
              return (
                <button
                  key={h.label}
                  type="button"
                  onClick={() => insertSyntax(h.syntax)}
                  className={`px-2.5 py-1 border-[2px] border-black text-black font-black text-[10px] uppercase shadow-[1.5px_1.5px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer ${colorClass}`}
                >
                  {h.label}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={readOnly ? "No notes in this document." : "Type notes or engineering specs here… (Supports Markdown)"}
        className="flex-1 w-full p-6 bg-transparent text-sm font-semibold outline-none resize-none leading-relaxed text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-zinc-500 custom-scrollbar overflow-y-auto"
        spellCheck={false}
      />
    </div>
  );
};

export default NotesEditor;
