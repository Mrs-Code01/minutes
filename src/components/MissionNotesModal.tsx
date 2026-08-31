import { useEffect, useRef, useState } from "react";
import { isoToShort } from "../missions/date";
import { distributeTasks } from "../missions/distribute";
import { emptyMissionBlock, missionBlocksToText, parseMissionText } from "../missions/format";
import { deleteMissionNote, saveMissionNote } from "../missions/storage";
import type { MissionBlock, MissionNote } from "../missions/types";
import type { ListType } from "../types";
import ColorPicker from "./ColorPicker";
import ListPopover from "./ListPopover";

interface MissionNotesModalProps {
  iso: string;
  initial: MissionNote | undefined;
  onClose: () => void;
  onSave: (date: string, note: MissionNote | null) => void;
  /** Called after Format pushes tasks to other dates, so the page can refresh them. */
  onDistributed: () => void;
}

type Mode = "write" | "organize";

function hasContent(note: Pick<MissionNote, "title" | "blocks">): boolean {
  return note.title.trim() !== "" || note.blocks.some((b) => b.text.trim() !== "");
}

function dateHeading(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function MissionNotesModal({ iso, initial, onClose, onSave, onDistributed }: MissionNotesModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [colorId, setColorId] = useState<string | null>(initial?.colorId ?? null);
  const [mode, setMode] = useState<Mode>(initial && initial.blocks.length > 0 ? "organize" : "write");
  const [blocks, setBlocks] = useState<MissionBlock[]>(initial?.blocks ?? []);
  const [rawText, setRawText] = useState(initial ? missionBlocksToText(initial.blocks) : "");
  const [isParentNote, setIsParentNoteState] = useState<boolean | null>(initial?.isParentNote ?? null);
  const [askingParent, setAskingParent] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "warning"; lines: string[] } | null>(null);
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

  function maybeAskParent(nextTitle: string, nextRawText: string) {
    if (isParentNote === null && !askingParent && (nextTitle.trim() !== "" || nextRawText.trim() !== "")) {
      setAskingParent(true);
    }
  }

  function buildNote(): MissionNote {
    const blocksToSave = mode === "write" ? parseMissionText(rawText, iso).blocks : blocks;
    return { date: iso, title, colorId, isParentNote, blocks: blocksToSave, updatedAt: new Date().toISOString() };
  }

  function commit() {
    const note = buildNote();
    if (hasContent(note)) {
      saveMissionNote(note);
      onSave(iso, note);
    } else {
      deleteMissionNote(iso);
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
  }, [title, colorId, blocks, rawText, mode, isParentNote]);

  function handleFormat() {
    const { blocks: parsed, warnings } = parseMissionText(rawText, iso);
    setBlocks(parsed);
    setMode("organize");

    if (isParentNote) {
      const distributed = parsed.filter((b) => b.assignee && b.targetISO && b.targetISO !== iso);
      const { updatedDates } = distributeTasks(iso, parsed);
      const lines: string[] = [];
      if (distributed.length > 0) {
        lines.push(
          `Sent ${distributed.length} task${distributed.length > 1 ? "s" : ""} to ${updatedDates.length} date${updatedDates.length > 1 ? "s" : ""}: ${updatedDates
            .map(isoToShort)
            .join(", ")}.`,
        );
        onDistributed();
      }
      if (lines.length > 0 || warnings.length > 0) {
        setNotice({ kind: warnings.length > 0 && lines.length === 0 ? "warning" : "success", lines: [...lines, ...warnings] });
      } else {
        setNotice(null);
      }
    } else {
      setNotice(warnings.length > 0 ? { kind: "warning", lines: warnings } : null);
    }
  }

  function handleEditAsText() {
    setRawText(missionBlocksToText(blocks));
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
    const created = emptyMissionBlock();
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
    const created = emptyMissionBlock();
    setBlocks([...blocks, created]);
    setPendingFocus(created.id);
  }

  function setParentFlag(value: boolean) {
    setIsParentNoteState(value);
    setAskingParent(false);
    if (!value) {
      const { updatedDates } = distributeTasks(iso, []);
      if (updatedDates.length > 0) onDistributed();
    }
  }

  function handleClose() {
    commit();
    onClose();
  }

  function handleDelete() {
    if (isParentNote) distributeTasks(iso, []);
    deleteMissionNote(iso);
    onSave(iso, null);
    onDistributed();
    onClose();
  }

  const actionBlocks = blocks.filter((b) => b.assignee);
  const noteBlocks = blocks.filter((b) => !b.assignee);

  function renderRow(block: MissionBlock, group: MissionBlock[], idx: number) {
    const prev = group[idx - 1];
    const suggested = prev?.list === "number" && prev.number ? prev.number + 1 : 1;
    const wasEdited = !!block.fromParent && block.text !== block.sourceText;
    return (
      <div
        key={block.id}
        className={[
          "group relative flex items-start gap-2 rounded-lg px-1 py-0.5 hover:bg-slate-50",
          block.assignee ? "bg-[var(--accent-tint)]/40" : "",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setActivePopoverId(activePopoverId === block.id ? null : block.id)}
          className="mt-1.5 w-7 shrink-0 text-right text-sm text-slate-400 hover:text-[var(--accent)]"
        >
          {block.list === "bullet" ? "•" : block.list === "number" ? `${block.number}.` : (
            <span className="opacity-0 group-hover:opacity-100">⋯</span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          {block.assignee && (
            <div className="flex items-center gap-1.5 pt-1.5 text-xs font-semibold text-[var(--accent)]">
              <span>{block.assignee}</span>
              {block.targetISO && (
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                  {isoToShort(block.targetISO)}
                </span>
              )}
              {block.fromParent && (
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                  from {isoToShort(block.fromParent)}
                </span>
              )}
              {wasEdited && (
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                  edited
                </span>
              )}
            </div>
          )}
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
            className="w-full border-none bg-transparent py-1.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none"
          />
        </div>
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{dateHeading(iso)}</p>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                maybeAskParent(e.target.value, rawText);
              }}
              placeholder="Meeting title (e.g. Weekly Sync)"
              className="mt-1 w-full border-none p-0 text-xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none"
            />
          </div>
          {isParentNote !== null && (
            <button
              type="button"
              onClick={() => setAskingParent(true)}
              className={[
                "ml-2 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                isParentNote ? "bg-[var(--accent-tint)] text-[var(--accent)]" : "bg-slate-100 text-slate-400",
              ].join(" ")}
            >
              {isParentNote ? "Parent note" : "Single date"}
            </button>
          )}
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

        {askingParent && (
          <div className="border-b border-slate-100 bg-[var(--accent-tint)] px-6 py-3">
            <p className="text-sm font-medium text-slate-700">Is this a parent note?</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Write things like <code className="rounded bg-white/70 px-1 py-0.5">John will prepare the report by Sept 1</code> or{" "}
              <code className="rounded bg-white/70 px-1 py-0.5">Name - Sept 1: Prepare report</code> — on a parent note, Format
              understands either and pushes each task to that date automatically.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setParentFlag(true)}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Yes, parent note
              </button>
              <button
                type="button"
                onClick={() => setParentFlag(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                No, just this date
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {notice && (
            <div
              className={[
                "mb-3 rounded-lg px-3 py-2 text-xs",
                notice.kind === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              {notice.lines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}

          {mode === "write" ? (
            <textarea
              autoFocus
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                maybeAskParent(title, e.target.value);
              }}
              placeholder={
                "Type up the decisions here, in your own words.\n\nTo assign a task to a date, either write it plainly:\nJohn will prepare the quarterly report by September 1st.\nMary needs to submit the budget draft before Sept 3.\n\n...or use the shorthand, which is always understood:\nJohn - Sept 1: Prepare the quarterly report\n\nThen hit Format — one task per line works best."
              }
              className="min-h-[280px] w-full resize-y rounded-xl border border-slate-200 p-3 text-sm leading-relaxed text-slate-700 focus:border-[var(--accent)] focus:outline-none"
            />
          ) : (
            <div className="space-y-4">
              {actionBlocks.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Action items</p>
                  <div className="space-y-0.5">
                    {actionBlocks.map((block, idx) => renderRow(block, actionBlocks, idx))}
                  </div>
                </div>
              )}
              <div>
                {actionBlocks.length > 0 && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                )}
                <div className="space-y-0.5">
                  {noteBlocks.map((block, idx) => renderRow(block, noteBlocks, idx))}
                  <button
                    type="button"
                    onClick={addLine}
                    className="ml-9 mt-1 text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    + Add line
                  </button>
                </div>
              </div>
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
