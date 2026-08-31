import { useMemo, useState } from "react";
import Calendar, { type CalendarEntry } from "../components/Calendar";
import NotesModal from "../components/NotesModal";
import { loadAllNotes } from "../lib/storage";
import type { DayNote } from "../types";

export default function MinutesPage() {
  const [notes, setNotes] = useState<Record<string, DayNote>>(() => loadAllNotes());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function handleSaveNote(date: string, note: DayNote | null) {
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
      const hasContent = note.title.trim() !== "" || note.blocks.some((b) => b.text.trim() !== "");
      out[note.date] = { colorId: note.colorId, label: note.title || "Minutes", hasContent };
    }
    return out;
  }, [notes]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <p className="mb-4 text-sm text-slate-500">Pick a date to take or review meeting minutes.</p>
      <Calendar entries={entries} onSelectDate={setSelectedDate} />

      {selectedDate && (
        <NotesModal
          iso={selectedDate}
          initial={notes[selectedDate]}
          onClose={() => setSelectedDate(null)}
          onSave={handleSaveNote}
        />
      )}
    </main>
  );
}
