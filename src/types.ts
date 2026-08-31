export type ListType = "none" | "bullet" | "number";

export interface NoteBlock {
  id: string;
  text: string;
  list: ListType;
  number: number | null;
}

export interface DayNote {
  /** ISO date string, e.g. 2026-08-31 */
  date: string;
  title: string;
  colorId: string | null;
  blocks: NoteBlock[];
  updatedAt: string;
}
