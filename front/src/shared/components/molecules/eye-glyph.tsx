/**
 * L'œil de la charte : deux losanges emboîtés, tracés à l'équerre comme le reste
 * du système. Aucune courbe — l'iconographie n'en admet pas.
 */
const EYE_OUTLINE = "M2 12 L12 6 L22 12 L12 18 Z";
const EYE_PUPIL = "M12 9.5 L14.5 12 L12 14.5 L9.5 12 Z";
const EYE_STRIKE = "M4 4 L20 20";

function EyeGlyph() {
  return (
    <EyeCanvas>
      <path d={EYE_OUTLINE} />
      <path d={EYE_PUPIL} />
    </EyeCanvas>
  );
}

/** L'œil barré : le mot de passe reste masqué. */
function EyeOffGlyph() {
  return (
    <EyeCanvas>
      <path d={EYE_OUTLINE} />
      <path d={EYE_PUPIL} />
      <path d={EYE_STRIKE} />
    </EyeCanvas>
  );
}

function EyeCanvas({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinejoin="miter"
      strokeLinecap="square"
    >
      {children}
    </svg>
  );
}

export { EyeGlyph, EyeOffGlyph };
