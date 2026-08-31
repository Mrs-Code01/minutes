import { newBlockId } from "../lib/format";
import { loadAllMissionNotes, loadMissionNote, saveMissionNote } from "./storage";
import type { MissionBlock, MissionNote } from "./types";

export interface DistributionResult {
  /** Dates (other than the parent's own) that received tasks. */
  updatedDates: string[];
}

function emptyNoteFor(date: string): MissionNote {
  return { date, title: "", colorId: null, isParentNote: null, blocks: [], updatedAt: new Date().toISOString() };
}

/**
 * Pushes a parent note's assigned tasks out to their target dates, and
 * reconciles whatever that parent had previously distributed so re-running
 * Format doesn't pile up stale duplicates.
 *
 * A recipient's edits are never silently overwritten: a distributed task is
 * only refreshed from the parent while its text still matches what was last
 * sent (`sourceText`). The moment someone edits their copy, it's treated as
 * theirs — future re-distributions leave its wording alone and won't delete
 * it even if the parent later removes or changes that line.
 */
export function distributeTasks(parentISO: string, parentBlocks: MissionBlock[]): DistributionResult {
  const freshByTarget = new Map<string, MissionBlock[]>();
  for (const block of parentBlocks) {
    if (!block.assignee || !block.targetISO || block.targetISO === parentISO) continue;
    const list = freshByTarget.get(block.targetISO) ?? [];
    list.push(block);
    freshByTarget.set(block.targetISO, list);
  }

  const all = loadAllMissionNotes();
  const datesToTouch = new Set<string>(freshByTarget.keys());
  for (const note of Object.values(all)) {
    if (note.blocks.some((b) => b.fromParent === parentISO)) datesToTouch.add(note.date);
  }
  datesToTouch.delete(parentISO);

  const updatedDates = new Set<string>();

  for (const date of datesToTouch) {
    const existingNote = loadMissionNote(date) ?? emptyNoteFor(date);
    const freshTasks = freshByTarget.get(date) ?? [];
    const existingFromParent = existingNote.blocks.filter((b) => b.fromParent === parentISO);
    const others = existingNote.blocks.filter((b) => b.fromParent !== parentISO);

    const usedExistingIds = new Set<string>();
    const nextFromParentBlocks: MissionBlock[] = [];

    for (const fresh of freshTasks) {
      const match = existingFromParent.find((b) => b.assignee === fresh.assignee && !usedExistingIds.has(b.id));
      if (match) {
        usedExistingIds.add(match.id);
        const wasEdited = match.text !== match.sourceText;
        nextFromParentBlocks.push({
          ...match,
          targetISO: fresh.targetISO,
          sourceText: fresh.text,
          text: wasEdited ? match.text : fresh.text,
        });
      } else {
        nextFromParentBlocks.push({ ...fresh, id: newBlockId(), fromParent: parentISO, sourceText: fresh.text });
      }
    }

    // A task the parent no longer lists: drop it, unless the recipient edited
    // it — an edited task is "adopted" and stays even if the parent moves on.
    for (const b of existingFromParent) {
      if (usedExistingIds.has(b.id)) continue;
      if (b.text !== b.sourceText) nextFromParentBlocks.push(b);
    }

    const nextBlocks = [...others, ...nextFromParentBlocks];
    if (nextBlocks.length !== existingNote.blocks.length || nextFromParentBlocks.length > 0) {
      saveMissionNote({ ...existingNote, blocks: nextBlocks, updatedAt: new Date().toISOString() });
    }
    if (nextFromParentBlocks.length > 0) updatedDates.add(date);
  }

  return { updatedDates: Array.from(updatedDates) };
}
