import type { ReactNode } from "react";

/** Renders inline **bold**, *italic* and [links](url) safely as React nodes. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[")) {
      const label = token.slice(1, token.indexOf("]"));
      const href = token.slice(token.indexOf("(") + 1, -1);
      const external = /^https?:\/\//.test(href);
      nodes.push(
        <a
          key={key}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow sponsored" } : {})}
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** Minimal, safe markdown renderer for article content. */
export function ArticleBody({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ");
    blocks.push(<p key={`p-${key++}`}>{inline(text, `p${key}`)}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item, i) => <li key={i}>{inline(item, `li${key}-${i}`)}</li>);
    blocks.push(
      list.ordered ? <ol key={`l-${key++}`}>{items}</ol> : <ul key={`l-${key++}`}>{items}</ul>,
    );
    list = null;
  };

  const flushQuote = () => {
    if (quote.length === 0) return;
    blocks.push(
      <blockquote key={`q-${key++}`}>
        <p>{inline(quote.join(" "), `q${key}`)}</p>
      </blockquote>,
    );
    quote = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line === "") {
      flushAll();
      continue;
    }

    if (line.startsWith("### ")) {
      flushAll();
      blocks.push(<h3 key={`h-${key++}`}>{inline(line.slice(4), `h${key}`)}</h3>);
      continue;
    }
    if (line.startsWith("## ")) {
      flushAll();
      blocks.push(<h2 key={`h-${key++}`}>{inline(line.slice(3), `h${key}`)}</h2>);
      continue;
    }
    if (line === "---") {
      flushAll();
      blocks.push(<hr key={`hr-${key++}`} />);
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      quote.push(line.slice(2));
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      flushQuote();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      flushQuote();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(line.replace(/^\d+\.\s+/, ""));
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line);
  }

  flushAll();

  return <div className="prose-article">{blocks}</div>;
}
