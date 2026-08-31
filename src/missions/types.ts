import type { ListType } from "../types";

export interface MissionBlock {
  id: string;
  /** Task text (no assignee prefix) when `assignee` is set; otherwise the plain line text. */
  text: string;
  list: ListType;
  number: number | null;
  /** Person's name, if this line assigns a task to someone. */
  assignee: string | null;
  /** ISO date this task was written for, if it names one. */
  targetISO: string | null;
  /** ISO date of the parent note this task was distributed from, if any. */
  fromParent: string | null;
  /**
   * The task text as last generated from the parent note. When `text` no
   * longer matches this, the recipient has edited their copy — redistributing
   * the parent note again must not clobber that edit.
   */
  sourceText: string | null;
}

export interface MissionNote {
  date: string;
  title: string;
  colorId: string | null;
  /** null = not asked yet. */
  isParentNote: boolean | null;
  blocks: MissionBlock[];
  updatedAt: string;
}
