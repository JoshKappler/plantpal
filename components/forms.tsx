"use client";

export const inputClass =
  "w-full rounded-2xl bg-card px-4 py-3 text-base ring-1 ring-moss/10 placeholder:text-moss/35 focus:outline-none focus:ring-2 focus:ring-leaf";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold text-moss/80">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-moss/45">{hint}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-mist p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            value === o.value ? "bg-card text-moss shadow-sm" : "text-moss/55"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-2xl px-3 py-2.5 text-sm font-semibold ring-1 transition ${
            value === o.value
              ? "bg-leaf text-dew ring-leaf"
              : "bg-card text-moss/70 ring-moss/10"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 120,
  suffix = "days",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className="flex items-center justify-between rounded-2xl bg-card px-3 py-2 ring-1 ring-moss/10">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => set(value - 1)}
        className="grid h-9 w-9 place-items-center rounded-full bg-mist text-lg font-bold text-moss/70 active:scale-90"
      >
        −
      </button>
      <span className="font-semibold">
        every {value} {suffix}
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => set(value + 1)}
        className="grid h-9 w-9 place-items-center rounded-full bg-mist text-lg font-bold text-moss/70 active:scale-90"
      >
        +
      </button>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3 ring-1 ring-moss/10"
    >
      <span className="text-sm font-semibold text-moss/80">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-leaf" : "bg-moss/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-dew transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
