import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-neutral-50">{children}</strong>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-neutral-200 underline">
      {children}
    </a>
  ),
};

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
