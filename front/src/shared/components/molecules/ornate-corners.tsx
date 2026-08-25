const CORNERS = [
  { id: "top-left", className: "top-[7px] left-[7px] border-t border-l" },
  { id: "top-right", className: "top-[7px] right-[7px] border-t border-r" },
  { id: "bottom-left", className: "bottom-[7px] left-[7px] border-b border-l" },
  {
    id: "bottom-right",
    className: "bottom-[7px] right-[7px] border-b border-r",
  },
] as const;

/** Quatre équerres dorées : marque un panneau de premier plan. */
function OrnateCorners() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {CORNERS.map((corner) => (
        <CornerBracket key={corner.id} className={corner.className} />
      ))}
    </div>
  );
}

function CornerBracket({ className }: { className: string }) {
  return (
    <div className={`absolute size-[22px] border-gold/55 ${className}`} />
  );
}

export { OrnateCorners };
