export interface SwatchColor {
  id: string;
  name: string;
  hex: string;
}

/** 12 professional swatches used to color-tag a day's minutes. */
export const PALETTE: SwatchColor[] = [
  { id: "indigo", name: "Indigo", hex: "#4F46E5" },
  { id: "blue", name: "Blue", hex: "#2563EB" },
  { id: "sky", name: "Sky", hex: "#0EA5E9" },
  { id: "teal", name: "Teal", hex: "#0D9488" },
  { id: "emerald", name: "Emerald", hex: "#059669" },
  { id: "green", name: "Green", hex: "#65A30D" },
  { id: "amber", name: "Amber", hex: "#D97706" },
  { id: "orange", name: "Orange", hex: "#EA580C" },
  { id: "red", name: "Red", hex: "#DC2626" },
  { id: "rose", name: "Rose", hex: "#E11D48" },
  { id: "purple", name: "Purple", hex: "#7C3AED" },
  { id: "slate", name: "Slate", hex: "#475569" },
];

export function swatchById(id: string | null): SwatchColor | undefined {
  if (!id) return undefined;
  return PALETTE.find((c) => c.id === id);
}
