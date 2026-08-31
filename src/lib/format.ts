import type { ListType, NoteBlock } from "../types";

let counter = 0;
export function newBlockId(): string {
  counter += 1;
  return `b${Date.now().toString(36)}${counter}`;
}

const BULLET_RE = /^[-*•]\s+/;
const NUMBER_RE = /^(\d+)[.)]\s+/;

/** Trims stray whitespace and collapses runs of blank lines to one. */
export function cleanLines(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const cleaned: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" && cleaned[cleaned.length - 1] === "") continue;
    cleaned.push(trimmed);
  }
  while (cleaned[0] === "") cleaned.shift();
  while (cleaned[cleaned.length - 1] === "") cleaned.pop();
  return cleaned;
}

/** Recognizes a "- " / "1. " marker already typed at the start of a line. */
export function stripMarker(line: string): { list: ListType; number: number | null; text: string } {
  const numberMatch = line.match(NUMBER_RE);
  if (numberMatch) {
    return { list: "number", number: Number(numberMatch[1]), text: line.slice(numberMatch[0].length) };
  }
  const bulletMatch = line.match(BULLET_RE);
  if (bulletMatch) {
    return { list: "bullet", number: null, text: line.slice(bulletMatch[0].length) };
  }
  return { list: "none", number: null, text: line };
}

/**
 * Turns freeform notepad text into tidy, orderly blocks: trims stray
 * whitespace, collapses runs of blank lines to one, and recognizes any
 * "- " / "1. " markers already typed so re-formatting doesn't lose them.
 */
export function parseTextToBlocks(raw: string): NoteBlock[] {
  return cleanLines(raw).map((line) => {
    const { list, number, text } = stripMarker(line);
    return { id: newBlockId(), text, list, number };
  });
}

/** Flattens blocks back to plain text, embedding markers so nothing is lost. */
export function blocksToText(blocks: NoteBlock[]): string {
  return blocks
    .map((b) => {
      if (b.list === "bullet") return `- ${b.text}`;
      if (b.list === "number") return `${b.number ?? 1}. ${b.text}`;
      return b.text;
    })
    .join("\n");
}

export function emptyBlock(): NoteBlock {
  return { id: newBlockId(), text: "", list: "none", number: null };
}
