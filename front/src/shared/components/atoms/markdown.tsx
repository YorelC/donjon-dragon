import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/shared/utils/utils";

const REMARK_PLUGINS = [remarkGfm];

/**
 * Rendu Markdown GFM (cases à cocher, tableaux, barré). Sans plugin HTML, une
 * balise écrite dans le texte s'affiche comme du texte et n'est jamais
 * interprétée ; les liens `javascript:` sont neutralisés par le filtre d'URL par
 * défaut.
 */
function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div data-slot="markdown" className={cn("markdown-prose", className)}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{source}</ReactMarkdown>
    </div>
  );
}

export { Markdown };
