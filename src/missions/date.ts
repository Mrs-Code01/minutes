const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toISO(year: number, month: number, day: number): string | null {
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  const y = String(d.getFullYear()).padStart(4, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function referenceYear(referenceISO: string): number {
  return Number(referenceISO.slice(0, 4));
}

/** If a year-less date already fell before the reference date, assume next year. */
function rollYearIfPast(iso: string, referenceISO: string): string {
  if (iso >= referenceISO) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  return toISO(y + 1, m - 1, d) ?? iso;
}

/**
 * Parses loosely-written date text ("Sept 1", "1st of September", "1/9",
 * "2026-09-01"...) relative to a reference date, used to infer the year
 * when none is given. Returns an ISO date string, or null if unrecognized.
 */
export function parseDateText(raw: string, referenceISO: string): string | null {
  const text = raw
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/\s+/g, " ");
  if (!text) return null;

  let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return toISO(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  m = text.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/);
  if (m && MONTHS[m[1]] !== undefined) {
    const month = MONTHS[m[1]];
    const day = Number(m[2]);
    const year = m[3] ? Number(m[3]) : referenceYear(referenceISO);
    const iso = toISO(year, month, day);
    if (iso) return m[3] ? iso : rollYearIfPast(iso, referenceISO);
  }

  m = text.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)\.?(?:,?\s+(\d{4}))?$/);
  if (m && MONTHS[m[2]] !== undefined) {
    const day = Number(m[1]);
    const month = MONTHS[m[2]];
    const year = m[3] ? Number(m[3]) : referenceYear(referenceISO);
    const iso = toISO(year, month, day);
    if (iso) return m[3] ? iso : rollYearIfPast(iso, referenceISO);
  }

  m = text.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    if (month >= 0 && month <= 11) {
      let year: number;
      if (m[3]) {
        year = Number(m[3]);
        if (year < 100) year += 2000;
      } else {
        year = referenceYear(referenceISO);
      }
      const iso = toISO(year, month, day);
      if (iso) return m[3] ? iso : rollYearIfPast(iso, referenceISO);
    }
  }

  return null;
}

/** "2026-09-01" -> "September 1" (re-parseable by parseDateText). */
export function isoToReadable(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}`;
}

/** "2026-09-01" -> "Sep 1" */
export function isoToShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
}
