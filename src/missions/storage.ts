import type { MissionNote } from "./types";

const STORAGE_KEY = "spectra-minutes:missions";

type MissionsMap = Record<string, MissionNote>;

function readAll(): MissionsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MissionsMap) : {};
  } catch {
    return {};
  }
}

function writeAll(notes: MissionsMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function loadAllMissionNotes(): MissionsMap {
  return readAll();
}

export function loadMissionNote(date: string): MissionNote | undefined {
  return readAll()[date];
}

export function saveMissionNote(note: MissionNote): void {
  const all = readAll();
  all[note.date] = note;
  writeAll(all);
}

export function deleteMissionNote(date: string): void {
  const all = readAll();
  delete all[date];
  writeAll(all);
}
