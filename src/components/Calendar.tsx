import { useMemo, useState } from "react";
import { getMonthGrid, isSameDay, monthLabel, toISODate, weekdayLabels } from "../lib/date";
import { swatchById } from "../lib/palette";

export interface CalendarEntry {
  colorId: string | null;
  /** Small preview text shown on the day card, e.g. a title or assignee names. */
  label: string;
  hasContent: boolean;
}

interface CalendarProps {
  entries: Record<string, CalendarEntry>;
  onSelectDate: (iso: string) => void;
}

export default function Calendar({ entries, onSelectDate }: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  function goToMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1));
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-800">{monthLabel(year, month)}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="mr-2 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-tint)]"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => goToMonth(-1)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => goToMonth(1)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 px-4 pt-3 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
        {weekdayLabels().map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-4">
        {grid.map((date) => {
          const iso = toISODate(date);
          const entry = entries[iso];
          const inMonth = date.getMonth() === month;
          const isToday = isSameDay(date, today);
          const swatch = swatchById(entry?.colorId ?? null);
          const hasContent = !!entry?.hasContent;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={[
                "relative flex h-16 flex-col items-start rounded-xl border p-2 text-left transition-colors",
                inMonth ? "text-slate-700" : "text-slate-300",
                isToday ? "border-[var(--accent)]" : "border-transparent hover:border-slate-200",
                "hover:bg-slate-50",
              ].join(" ")}
              style={hasContent ? { backgroundColor: `${swatch?.hex ?? "#94a3b8"}14` } : undefined}
            >
              <span
                className={[
                  "grid h-6 w-6 place-items-center rounded-full text-sm",
                  isToday ? "bg-[var(--accent)] font-semibold text-white" : "",
                ].join(" ")}
              >
                {date.getDate()}
              </span>
              {hasContent && (
                <span className="mt-1 flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: swatch?.hex ?? "#94a3b8" }}
                  />
                  <span className="max-w-[70px] truncate text-[10px] text-slate-500">{entry?.label}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
