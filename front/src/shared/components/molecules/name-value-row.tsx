interface NameValueRowProps {
  name: string;
  value: string;
}

/** Paire nom / valeur à liseré gauche : la forme de liste de la charte. */
function NameValueRow({ name, value }: NameValueRowProps) {
  return (
    <div className="name-value">
      <span className="font-display text-body tracking-meta text-gold-value">
        {name}
      </span>
      <span className="text-body/[1.65] text-ink-value">{value}</span>
    </div>
  );
}

export { NameValueRow };
