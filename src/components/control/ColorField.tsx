"use client";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm">
      <span className="text-zinc-300">{label}</span>
      <input
        type="color"
        value={value.startsWith("rgba") ? "#222222" : value.slice(0, 7)}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
      />
    </label>
  );
}
