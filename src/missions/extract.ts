import { parseDateText } from "./date";

export interface ExtractedTask {
  name: string;
  task: string;
  targetISO: string;
}

/** A date phrase we can recognize inside a longer sentence. */
const DATE_PHRASE =
  "[A-Za-z]+\\.?\\s*\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?" + // "September 1st, 2026"
  "|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?[A-Za-z]+\\.?(?:,?\\s*\\d{4})?" + // "1st of September"
  "|\\d{4}-\\d{1,2}-\\d{1,2}" + // ISO
  "|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?"; // "1/9" or "1/9/2026"

/** Leading words that are almost never a person's name, to cut down false positives. */
const NON_NAME_WORDS = new Set([
  "the", "this", "that", "these", "those", "it", "we", "they", "i", "you", "he", "she",
  "everyone", "someone", "all", "please", "note", "reminder", "action", "task", "decision",
  "update", "next", "also", "additionally", "meeting", "team", "there", "here", "no", "yes",
]);

function looksLikeName(candidate: string): boolean {
  const firstWord = candidate.trim().split(/\s+/)[0]?.toLowerCase();
  return !!firstWord && !NON_NAME_WORDS.has(firstWord);
}

const STRICT_RE = /^(.+?)\s*-\s*(.+?)\s*:\s*(.+)$/;
const NAME_COLON_RE = /^([A-Z][\w'’.-]*(?:\s[A-Za-z][\w'’.-]*){0,2}?)\s*:\s*(.+)$/;
const NAME_PAREN_DATE_RE = /^(.*?)\s*\(([^)]+)\)\s*$/;
const TRAILING_DATE_RE = new RegExp(`^(.*?)(?:\\s*[-–—]\\s*|,\\s*|\\s+by\\s+|\\s+on\\s+|\\s+before\\s+|\\s+due\\s+)(${DATE_PHRASE})\\.?$`, "i");
const SENTENCE_RE = /^([A-Z][\w'’.-]*(?:\s[A-Za-z][\w'’.-]*){0,2}?)\s+(?:needs? to|has to|have to|is to|are to|will|should|must|to)\s+(.+)$/i;
const SENTENCE_DATE_RE = new RegExp(`^(.*?)\\s+(?:by|on|before|due)\\s+(${DATE_PHRASE})\\.?$`, "i");

/**
 * Pulls a "someone owes a task by some date" assignment out of a line of
 * text, trying the most explicit form first and falling back to looser,
 * more natural phrasing. Returns null (never throws or guesses wildly) when
 * nothing confident is found, so the caller can keep the line as plain text.
 */
export function extractTask(text: string, referenceISO: string): ExtractedTask | null {
  // 1. "Name - Date: Task" (the documented, most reliable syntax)
  let m = text.match(STRICT_RE);
  if (m) {
    const name = m[1].trim();
    const task = m[3].trim();
    const targetISO = parseDateText(m[2].trim(), referenceISO);
    if (name && task && targetISO) return { name, task, targetISO };
  }

  // 2. "Name: Task (Date)" / "Name: Task - Date" / "Name: Task by Date"
  m = text.match(NAME_COLON_RE);
  if (m && looksLikeName(m[1])) {
    const name = m[1].trim();
    const rest = m[2].trim();

    const paren = rest.match(NAME_PAREN_DATE_RE);
    if (paren) {
      const task = paren[1].trim();
      const targetISO = parseDateText(paren[2].trim(), referenceISO);
      if (task && targetISO) return { name, task, targetISO };
    }

    const trailing = rest.match(TRAILING_DATE_RE);
    if (trailing) {
      const task = trailing[1].trim();
      const targetISO = parseDateText(trailing[2].trim(), referenceISO);
      if (task && targetISO) return { name, task, targetISO };
    }
  }

  // 3. "Name will/needs to/should ... by/on/before/due Date."
  m = text.match(SENTENCE_RE);
  if (m && looksLikeName(m[1])) {
    const name = m[1].trim();
    const rest = m[2].trim();
    const trailing = rest.match(SENTENCE_DATE_RE);
    if (trailing) {
      const task = trailing[1].trim();
      const targetISO = parseDateText(trailing[2].trim(), referenceISO);
      if (task && targetISO) return { name, task, targetISO };
    }
  }

  return null;
}

/** True if a line looks like it was trying to assign a task, even if we couldn't parse it. */
export function looksLikeAssignmentAttempt(text: string): boolean {
  return /^[A-Za-z][\w'’.-]*\s*[:-]/.test(text.trim());
}
