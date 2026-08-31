import { cleanLines, newBlockId, stripMarker } from "../lib/format";
import { extractTask, looksLikeAssignmentAttempt } from "./extract";
import { isoToReadable } from "./date";
import type { MissionBlock } from "./types";

export interface ParseMissionResult {
  blocks: MissionBlock[];
  warnings: string[];
}

/**
 * Tidies freeform text into blocks like the minutes page, and additionally
 * recognizes lines that assign a task to someone ("Name - Date: Task", or
 * more natural phrasing like "Name will do the thing by Date"), tagging them
 * with an assignee and target date so a parent note can distribute them.
 * A line that isn't recognized is always kept, unmodified, as a plain line —
 * nothing typed into the note is ever dropped.
 */
export function parseMissionText(raw: string, referenceISO: string): ParseMissionResult {
  const warnings: string[] = [];

  const blocks = cleanLines(raw).map((line) => {
    const { list, number, text } = stripMarker(line);
    const base: MissionBlock = {
      id: newBlockId(),
      text,
      list,
      number,
      assignee: null,
      targetISO: null,
      fromParent: null,
      sourceText: null,
    };
    if (text.trim() === "") return base;

    const extracted = extractTask(text, referenceISO);
    if (extracted) {
      return {
        ...base,
        text: extracted.task,
        assignee: extracted.name,
        targetISO: extracted.targetISO,
        sourceText: extracted.task,
        list: base.list === "none" ? "bullet" : base.list,
      };
    }

    if (looksLikeAssignmentAttempt(text)) {
      warnings.push(`Kept as a plain line — couldn't find a date to assign it to: "${text}"`);
    }
    return base;
  });

  return { blocks, warnings };
}

/** Flattens blocks back to plain text, reconstructing "Name - Date: Task" lines. */
export function missionBlocksToText(blocks: MissionBlock[]): string {
  return blocks
    .map((b) => {
      if (b.assignee && b.targetISO) {
        return `${b.assignee} - ${isoToReadable(b.targetISO)}: ${b.text}`;
      }
      if (b.list === "bullet") return `- ${b.text}`;
      if (b.list === "number") return `${b.number ?? 1}. ${b.text}`;
      return b.text;
    })
    .join("\n");
}

export function emptyMissionBlock(): MissionBlock {
  return {
    id: newBlockId(),
    text: "",
    list: "none",
    number: null,
    assignee: null,
    targetISO: null,
    fromParent: null,
    sourceText: null,
  };
}
