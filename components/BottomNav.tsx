"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, GearIcon, HomeIcon, PlusIcon } from "./icons";

const TABS = [
  { href: "/", label: "Plants", Icon: HomeIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto relative flex items-center justify-around rounded-full bg-moss/95 px-3 py-2.5 text-dew/70 shadow-lg backdrop-blur">
        {TABS.slice(0, 1).map((t) => (
          <NavLink key={t.href} {...t} active={pathname === t.href} />
        ))}
        <Link
          href="/add"
          aria-label="Add a plant"
          className="grid h-12 w-12 -translate-y-3 place-items-center rounded-full bg-leaf text-dew shadow-md ring-4 ring-dew transition active:scale-90"
        >
          <PlusIcon className="h-6 w-6" />
        </Link>
        {TABS.slice(1).map((t) => (
          <NavLink key={t.href} {...t} active={pathname === t.href} />
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
      className={`flex flex-col items-center gap-0.5 px-3 text-[0.65rem] font-semibold transition ${
        active ? "text-dew" : "text-dew/60"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
