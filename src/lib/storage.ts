import type { DayNote } from "../types";

const STORAGE_KEY = "spectra-minutes:notes";

type NotesMap = Record<string, DayNote>;

function readAll(): NotesMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotesMap) : {};
  } catch {
    return {};
  }
}

function writeAll(notes: NotesMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function loadAllNotes(): NotesMap {
  return readAll();
}

export function loadNote(date: string): DayNote | undefined {
  return readAll()[date];
}

export function saveNote(note: DayNote): void {
  const all = readAll();
  all[note.date] = note;
  writeAll(all);
}

export function deleteNote(date: string): void {
  const all = readAll();
  delete all[date];
  writeAll(all);
}
