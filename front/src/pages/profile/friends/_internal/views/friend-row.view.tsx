import type { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";
import { Diamond } from "@/shared/components/molecules/diamond";
import { toInitials } from "@/shared/utils/display-meta";

/**
 * `settled` : un compagnon acquis. `pending` : une demande reçue, mise en avant
 * parce qu'elle attend une réponse. `distant` : quelqu'un qui n'est pas encore
 * un ami, donc un médaillon en retrait.
 */
export type FriendRowTone = "settled" | "pending" | "distant";

/** Seule la demande recue s'ecarte de la ligne au repos : elle attend un geste. */
const ROW_TONES: Record<FriendRowTone, string> = {
  settled: "",
  pending: "border-gold/28 bg-gold/5 hover:border-gold/28",
  distant: "",
};

const MEDALLION_TONES: Record<FriendRowTone, "active" | "idle"> = {
  settled: "active",
  pending: "active",
  distant: "idle",
};

interface FriendRowProps {
  name: string;
  tone: FriendRowTone;
  /** Absente quand il n'y a rien de vrai à dire : un ami n'est qu'un pseudo. */
  meta?: string;
  children: ReactNode;
}

export function FriendRow({ name, meta, tone, children }: FriendRowProps) {
  return (
    <li className={cn("list-row", ROW_TONES[tone])}>
      <FriendIdentity name={name} tone={tone} meta={meta} />
      <div className="flex items-center gap-2.5">{children}</div>
    </li>
  );
}

function FriendIdentity({ name, meta, tone }: Omit<FriendRowProps, "children">) {
  return (
    <div className="flex min-w-0 items-center gap-[18px]">
      <Diamond size="badge" tone={MEDALLION_TONES[tone]}>
        {toInitials(name)}
      </Diamond>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-[15px] tracking-name text-foreground">
          {name}
        </span>
        {meta ? <span className="meta-line truncate">{meta}</span> : null}
      </div>
    </div>
  );
}
