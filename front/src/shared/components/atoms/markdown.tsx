import type { ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/shared/utils/utils";

const REMARK_PLUGINS = [remarkGfm];
const COMPONENTS: Components = { img: ImageAsLink };

/**
 * Rendu Markdown GFM (cases à cocher, tableaux, barré). Sans plugin HTML, une
 * balise écrite dans le texte s'affiche comme du texte et n'est jamais
 * interprétée ; les liens `javascript:` sont neutralisés par le filtre d'URL par
 * défaut. Une image n'est jamais chargée : le lecteur ne fait aucune requête vers
 * un site choisi par l'auteur.
 */
function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div data-slot="markdown" className={cn("markdown-prose", className)}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}>
        {source}
      </ReactMarkdown>
    </div>
  );
}

function ImageAsLink({ src, alt }: ComponentProps<"img">) {
  return <a href={src}>{alt || src}</a>;
}

export { Markdown };
