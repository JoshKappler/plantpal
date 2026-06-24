import type { DueState } from "@/lib/dueDate";
import { dueLabel, TONE_DOT } from "@/lib/labels";
import { Droplet, Sprout } from "./icons";

/** Small specimen-label status chip with the dewdrop (or sprout) meter. */
export function StatusMeter({
  state,
  days,
  kind = "water",
}: {
  state: DueState;
  days: number;
  kind?: "water" | "fert";
}) {
  const Icon = kind === "water" ? Droplet : Sprout;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ring-moss/5 backdrop-blur">
      <Icon className={`h-3.5 w-3.5 ${TONE_DOT[state]}`} />
      <span className="text-moss/75">{dueLabel(state, days)}</span>
    </span>
  );
}
