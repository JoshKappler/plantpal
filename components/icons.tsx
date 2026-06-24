type IconProps = { className?: string };

export function Droplet({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.7s-6.5 7-6.5 11.6a6.5 6.5 0 0 0 13 0C18.5 9.7 12 2.7 12 2.7Z" />
    </svg>
  );
}

export function Sprout({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 21v-7m0 0c0-3.5 2.5-6 6.5-6 0 4-2.6 6.3-6.5 6Zm0 0C12 11 9.5 8.5 5.5 8.5c0 4 2.6 6.3 6.5 6Z" />
    </svg>
  );
}

export function LeafGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M5 19c0-7 5.5-13.5 14.5-13.5 0 9.5-6.2 14.5-13.5 14.5h-.4c1.1-3 3.3-5.5 6.4-7.1C8.4 14 6.1 16.3 5 19Z" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronLeft({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

/** Soft botanical placeholder for a plant with no photo. */
export function PlantGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 90" className={className} fill="none" aria-hidden="true">
      <path d="M60 78c0-14 0-22-9-31-7-7-17-8-23-7 0 11 4 20 13 25 6 3 13 4 19 4Z" fill="currentColor" opacity="0.55" />
      <path d="M60 78c0-16 2-25 12-33 7-6 17-6 23-5 0 12-5 22-15 28-6 3-14 6-20 10Z" fill="currentColor" opacity="0.8" />
      <path d="M60 80V52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}
