import { Component, type ComponentProps, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { escapeDeepMarkers, limitMarkdownNesting } from "@/shared/utils/markdown-nesting";
import { cn } from "@/shared/utils/utils";

const REMARK_PLUGINS = [remarkGfm, limitMarkdownNesting];
const COMPONENTS: Components = { a: ExternalLink, img: ImageAsLink };
// Un lien du texte n'emporte ni la page ni son adresse (ids de campagne et de personnage).
const EXTERNAL_LINK = { target: "_blank", rel: "noopener noreferrer nofollow" } as const;

/**
 * Rendu Markdown GFM (cases à cocher, tableaux, barré). Sans plugin HTML, une
 * balise écrite dans le texte s'affiche comme du texte et n'est jamais
 * interprétée ; les liens `javascript:` sont neutralisés par le filtre d'URL par
 * défaut. Une image n'est jamais chargée : le lecteur ne fait aucune requête vers
 * un site choisi par l'auteur. L'imbrication est bornée, et un rendu qui échoue
 * montre la source : aucun texte ne fait tomber la page de ses lecteurs.
 */
function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div data-slot="markdown" className={cn("markdown-prose", className)}>
      <MarkdownBoundary key={source} source={source}>
        <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}>
          {escapeDeepMarkers(source)}
        </ReactMarkdown>
      </MarkdownBoundary>
    </div>
  );
}

function ExternalLink({ href, children }: ComponentProps<"a">) {
  return <a href={href} {...EXTERNAL_LINK}>{children}</a>;
}

function ImageAsLink({ src, alt }: ComponentProps<"img">) {
  return <a href={src} {...EXTERNAL_LINK}>{alt || src}</a>;
}

interface MarkdownBoundaryProps {
  source: string;
  children: ReactNode;
}

/** Une barrière d'erreur React ne s'écrit qu'en classe : c'est la seule du projet. */
class MarkdownBoundary extends Component<MarkdownBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <pre className="markdown-source">{this.props.source}</pre>;
    return this.props.children;
  }
}

export { Markdown };
