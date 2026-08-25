import type { ReactNode } from "react";
import { SocialAuthView } from "./social-auth.view";

export interface AuthTabCopy {
  title: string;
  subtitle: string;
  footNote: string;
}

interface AuthTabBodyProps {
  copy: AuthTabCopy;
  children: ReactNode;
}

/** L'ossature commune aux deux onglets : chapeau, formulaire, accès externes. */
export function AuthTabBody({ copy, children }: AuthTabBodyProps) {
  return (
    <div className="flex flex-col">
      <AuthTabIntro copy={copy} />
      {children}
      <SocialAuthView />
      <p className="mt-[22px] fine-print">{copy.footNote}</p>
    </div>
  );
}

function AuthTabIntro({ copy }: { copy: AuthTabCopy }) {
  return (
    <>
      <h2 className="mt-[26px] section-title">{copy.title}</h2>
      <p className="prose-block">{copy.subtitle}</p>
    </>
  );
}
