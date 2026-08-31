import { useMemo, useState } from "react";
import Calendar, { type CalendarEntry } from "../components/Calendar";
import MissionNotesModal from "../components/MissionNotesModal";
import { loadAllMissionNotes } from "../missions/storage";
import type { MissionNote } from "../missions/types";

export default function WeeklyMissionsPage() {
  const [notes, setNotes] = useState<Record<string, MissionNote>>(() => loadAllMissionNotes());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function reloadAll() {
    setNotes(loadAllMissionNotes());
  }

  function handleSaveNote(date: string, note: MissionNote | null) {
    setNotes((prev) => {
      const next = { ...prev };
      if (note) next[date] = note;
      else delete next[date];
      return next;
    });
  }

  const entries = useMemo<Record<string, CalendarEntry>>(() => {
    const out: Record<string, CalendarEntry> = {};
    for (const note of Object.values(notes)) {
      const names = Array.from(
        new Set(
          note.blocks.filter((b) => b.assignee && b.targetISO === note.date).map((b) => b.assignee as string),
        ),
      );
      const hasContent = note.title.trim() !== "" || note.blocks.some((b) => b.text.trim() !== "");
      out[note.date] = {
        colorId: note.colorId,
        label: names.length > 0 ? names.join(", ") : note.title || "Notes",
        hasContent,
      };
    }
    return out;
  }, [notes]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <p className="mb-4 text-sm text-slate-500">
        Pick a date to record decisions. Mark a note as a parent note to assign tasks to other dates.
      </p>
      <Calendar entries={entries} onSelectDate={setSelectedDate} />

      {selectedDate && (
        <MissionNotesModal
          iso={selectedDate}
          initial={notes[selectedDate]}
          onClose={() => setSelectedDate(null)}
          onSave={handleSaveNote}
          onDistributed={reloadAll}
        />
      )}
    </main>
  );
}
