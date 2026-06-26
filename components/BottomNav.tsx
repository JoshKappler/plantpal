"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, CameraIcon, GearIcon, HomeIcon, PlusIcon } from "./icons";

// Left of the center +, in order. Scan reuses the add screen (that's where the
// photo-identify flow lives).
const LEFT = [
  { href: "/", label: "Plants", Icon: HomeIcon },
  { href: "/add", label: "Scan", Icon: CameraIcon },
] as const;

// Right of the center +, in order.
const RIGHT = [
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Five equal columns (flex-1 each) so the bar is evenly divided and the + sits dead center. */}
      <div className="pointer-events-auto flex items-center rounded-full bg-moss/95 px-2 py-2.5 text-dew/70 shadow-lg backdrop-blur">
        {LEFT.map((t) => (
          <NavLink key={t.label} {...t} active={pathname === t.href} />
        ))}
        <div className="flex flex-1 justify-center">
          <Link
            href="/add"
            aria-label="Add a plant"
            className="grid h-12 w-12 place-items-center rounded-full bg-leaf text-dew shadow-md ring-4 ring-dew transition active:scale-90"
          >
            <PlusIcon className="h-6 w-6" />
          </Link>
        </div>
        {RIGHT.map((t) => (
          <NavLink key={t.label} {...t} active={pathname === t.href} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-semibold transition ${
        active ? "text-dew" : "text-dew/60"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
