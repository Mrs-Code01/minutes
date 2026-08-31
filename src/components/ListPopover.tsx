import { useRef, useState } from "react";
import { useOutsideClick } from "../lib/useOutsideClick";
import type { NoteBlock } from "../types";

interface ListPopoverProps {
  block: NoteBlock;
  suggestedNumber: number;
  onChange: (list: NoteBlock["list"], number: number | null) => void;
  onClose: () => void;
}

export default function ListPopover({ block, suggestedNumber, onChange, onClose }: ListPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [num, setNum] = useState(block.number ?? suggestedNumber);
  useOutsideClick(ref, onClose);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
    >
      <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        Format this line
      </p>
      <button
        type="button"
        onClick={() => {
          onChange("none", null);
          onClose();
        }}
        className={[
          "flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50",
          block.list === "none" ? "font-semibold text-[var(--accent)]" : "text-slate-700",
        ].join(" ")}
      >
        Plain text
      </button>
      <button
        type="button"
        onClick={() => {
          onChange("bullet", null);
          onClose();
        }}
        className={[
          "flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50",
          block.list === "bullet" ? "font-semibold text-[var(--accent)]" : "text-slate-700",
        ].join(" ")}
      >
        • Bullet point
      </button>
      <div
        className={[
          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
          block.list === "number" ? "bg-[var(--accent-tint)]" : "",
        ].join(" ")}
      >
        <span className="text-slate-700">Number</span>
        <input
          type="number"
          min={1}
          value={num}
          onChange={(e) => {
            const next = Math.max(1, Number(e.target.value) || 1);
            setNum(next);
            onChange("number", next);
          }}
          className="ml-auto h-7 w-14 rounded-md border border-slate-200 px-1 text-right text-sm focus:border-[var(--accent)] focus:outline-none"
        />
      </div>
    </div>
  );
}
