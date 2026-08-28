import type { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";
import { Diamond } from "@/shared/components/molecules/diamond";
import { toInitials } from "../utils/friend-meta";

/**
 * `settled` : un compagnon acquis. `pending` : une demande reçue, mise en avant
 * parce qu'elle attend une réponse. `distant` : quelqu'un qui n'est pas encore
 * un ami, donc un médaillon en retrait.
 */
export type FriendRowTone = "settled" | "pending" | "distant";

const ROW_TONES: Record<FriendRowTone, string> = {
  settled: "border-gold/16 bg-surface hover:border-gold/40",
  pending: "border-gold/28 bg-gold/5",
  distant: "border-gold/16 bg-surface hover:border-gold/40",
};

const MEDALLION_TONES: Record<FriendRowTone, "active" | "idle"> = {
  settled: "active",
  pending: "active",
  distant: "idle",
};

interface FriendRowProps {
  name: string;
  meta: string;
  tone: FriendRowTone;
  children: ReactNode;
}

export function FriendRow({ name, meta, tone, children }: FriendRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-5 border px-[18px] py-3.5 transition-[border-color] duration-[.18s]",
        ROW_TONES[tone],
      )}
    >
      <FriendIdentity name={name} meta={meta} tone={tone} />
      <div className="flex items-center gap-2.5">{children}</div>
    </div>
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
        <span className="meta-line truncate">{meta}</span>
      </div>
    </div>
  );
}
