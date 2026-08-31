import { PALETTE } from "../lib/palette";

interface ColorPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        title="No color"
        onClick={() => onChange(null)}
        className={[
          "grid h-7 w-7 place-items-center rounded-full border-2 text-slate-400",
          value === null ? "border-slate-400" : "border-slate-200 hover:border-slate-300",
        ].join(" ")}
      >
        <span className="text-xs">×</span>
      </button>
      {PALETTE.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.name}
          onClick={() => onChange(c.id)}
          className={[
            "h-7 w-7 rounded-full border-2 transition-transform",
            value === c.id ? "scale-110 border-slate-700" : "border-white hover:scale-105",
          ].join(" ")}
          style={{ backgroundColor: c.hex, boxShadow: "0 0 0 1px rgba(0,0,0,0.06)" }}
        />
      ))}
    </div>
  );
}
