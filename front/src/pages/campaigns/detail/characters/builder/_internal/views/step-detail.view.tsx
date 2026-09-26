import { NameValueRow } from "@/shared/components/molecules/name-value-row";
import { RecordBlock } from "@/shared/components/molecules/record-block";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import type {
  DetailBadge,
  DetailBlock,
  DetailItem,
  StepDetail,
} from "../types/step-detail-parts";

/**
 * La fiche détaillée : l'option survolée, ou ce qui est retenu. Tout ce qu'il
 * faut pour choisir se lit ici, sans quitter la liste de gauche des yeux.
 */
export function StepDetailView({ detail }: { detail: StepDetail }) {
  return (
    <div aria-live="polite" className="builder-detail">
      <RecordBlock header={{ overline: detail.kicker, title: detail.title, lede: detail.lede }}>
        <DetailBadges badges={detail.badges} />
        <div className="mt-6 flex flex-col gap-[22px]">
          {detail.blocks.map((block) => (
            <DetailSection key={block.heading} block={block} />
          ))}
        </div>
      </RecordBlock>
    </div>
  );
}

function DetailBadges({ badges }: { badges: DetailBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {badges.map((badge) => (
        <DetailPill key={badge.label} badge={badge} />
      ))}
    </div>
  );
}

function DetailPill({ badge }: { badge: DetailBadge }) {
  return (
    <span className="pill">
      {badge.label}
      <em className="font-display text-[13px] text-gold-value not-italic">{badge.value}</em>
    </span>
  );
}

function DetailSection({ block }: { block: DetailBlock }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading label={block.heading} />
      {block.body ? <p className="prose-block whitespace-pre-line">{block.body}</p> : null}
      <div className="flex flex-col gap-[11px]">
        {block.items.map((item) => (
          <DetailEntry key={item.name} item={item} />
        ))}
      </div>
    </section>
  );
}

function DetailEntry({ item }: { item: DetailItem }) {
  return <NameValueRow name={item.name} value={item.text} />;
}
