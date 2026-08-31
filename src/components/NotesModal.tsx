import { useEffect, useRef, useState } from "react";
import { blocksToText, emptyBlock, parseTextToBlocks } from "../lib/format";
import { deleteNote, saveNote } from "../lib/storage";
import type { DayNote, ListType, NoteBlock } from "../types";
import ColorPicker from "./ColorPicker";
import ListPopover from "./ListPopover";

interface NotesModalProps {
  iso: string;
  initial: DayNote | undefined;
  onClose: () => void;
  onSave: (date: string, note: DayNote | null) => void;
}

type Mode = "write" | "organize";

function hasContent(note: Pick<DayNote, "title" | "blocks">): boolean {
  return note.title.trim() !== "" || note.blocks.some((b) => b.text.trim() !== "");
}

function dateHeading(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function NotesModal({ iso, initial, onClose, onSave }: NotesModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [colorId, setColorId] = useState<string | null>(initial?.colorId ?? null);
  const [mode, setMode] = useState<Mode>(initial && initial.blocks.length > 0 ? "organize" : "write");
  const [blocks, setBlocks] = useState<NoteBlock[]>(initial?.blocks ?? []);
  const [rawText, setRawText] = useState(initial ? blocksToText(initial.blocks) : "");
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const firstRender = useRef(true);

  useEffect(() => {
    if (pendingFocus) {
      const el = inputRefs.current.get(pendingFocus);
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
      setPendingFocus(null);
    }
  }, [pendingFocus, blocks]);

  function buildNote(): DayNote {
    const blocksToSave = mode === "write" ? parseTextToBlocks(rawText) : blocks;
    return { date: iso, title, colorId, blocks: blocksToSave, updatedAt: new Date().toISOString() };
  }

  function commit() {
    const note = buildNote();
    if (hasContent(note)) {
      saveNote(note);
      onSave(iso, note);
    } else {
      deleteNote(iso);
      onSave(iso, null);
    }
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(commit, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, colorId, blocks, rawText, mode]);

  function handleFormat() {
    setBlocks(parseTextToBlocks(rawText));
    setMode("organize");
  }

  function handleEditAsText() {
    setRawText(blocksToText(blocks));
    setMode("write");
  }

  function updateBlockText(id: string, text: string) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  }

  function updateBlockList(id: string, list: ListType, number: number | null) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, list, number } : b)));
  }

  function insertBlockAfter(id: string) {
    const idx = blocks.findIndex((b) => b.id === id);
    const created = emptyBlock();
    const next = [...blocks];
    next.splice(idx + 1, 0, created);
    setBlocks(next);
    setPendingFocus(created.id);
  }

  function removeBlock(id: string) {
    if (blocks.length <= 1) return;
    const idx = blocks.findIndex((b) => b.id === id);
    const next = blocks.filter((b) => b.id !== id);
    setBlocks(next);
    setPendingFocus(next[Math.max(0, idx - 1)]?.id ?? null);
  }

  function addLine() {
    const created = emptyBlock();
    setBlocks([...blocks, created]);
    setPendingFocus(created.id);
  }

  function handleClose() {
    commit();
    onClose();
  }

  function handleDelete() {
    deleteNote(iso);
    onSave(iso, null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div
          className="flex items-start justify-between border-b border-slate-100 px-6 py-4"
          style={{ borderTopColor: "var(--accent)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{dateHeading(iso)}</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting title (e.g. Board Meeting)"
              className="mt-1 w-full border-none p-0 text-xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Color tag</p>
          <ColorPicker value={colorId} onChange={setColorId} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === "write" ? (
            <textarea
              autoFocus
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Type up the minutes here... then hit Format to tidy everything up."
              className="min-h-[280px] w-full resize-y rounded-xl border border-slate-200 p-3 text-sm leading-relaxed text-slate-700 focus:border-[var(--accent)] focus:outline-none"
            />
          ) : (
            <div className="space-y-0.5">
              {blocks.map((block, idx) => {
                const prev = blocks[idx - 1];
                const suggested = prev?.list === "number" && prev.number ? prev.number + 1 : 1;
                return (
                  <div key={block.id} className="group relative flex items-start gap-2 rounded-lg px-1 py-0.5 hover:bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setActivePopoverId(activePopoverId === block.id ? null : block.id)}
                      className="mt-1.5 w-7 shrink-0 text-right text-sm text-slate-400 hover:text-[var(--accent)]"
                    >
                      {block.list === "bullet" ? "•" : block.list === "number" ? `${block.number}.` : (
                        <span className="opacity-0 group-hover:opacity-100">⋯</span>
                      )}
                    </button>
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(block.id, el);
                        else inputRefs.current.delete(block.id);
                      }}
                      value={block.text}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          insertBlockAfter(block.id);
                        } else if (e.key === "Backspace" && block.text === "") {
                          e.preventDefault();
                          removeBlock(block.id);
                        }
                      }}
                      placeholder="Write a line…"
                      className="min-w-0 flex-1 border-none bg-transparent py-1.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none"
                    />
                    {activePopoverId === block.id && (
                      <ListPopover
                        block={block}
                        suggestedNumber={suggested}
                        onChange={(list, number) => updateBlockList(block.id, list, number)}
                        onClose={() => setActivePopoverId(null)}
                      />
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addLine}
                className="ml-9 mt-1 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                + Add line
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <div>
            {initial && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm font-medium text-slate-400 hover:text-red-600"
              >
                Delete note
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mode === "write" ? (
              <button
                type="button"
                onClick={handleFormat}
                disabled={rawText.trim() === ""}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
              >
                Format
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEditAsText}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Edit as text
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
