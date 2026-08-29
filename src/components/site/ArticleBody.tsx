import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

/**
 * GistPlugWealth simple formatting — WhatsApp style.
 *
 *   *bold*  (or **bold**)      _italic_       ~strike~
 *   `code`  ==highlight==      # Heading      ## Sub-heading
 *   - bullet   1. numbered     > quote        --- divider
 *   !! tip callout             https://link (auto)   [text](url)
 *   image: paste an image URL on its own line
 */

const IMAGE_RE = /^(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif)(?:\?\S*)?|\/api\/public\/media\/\S+)$/i;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|==[^=\n]+==|`[^`\n]+`|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  const link = (href: string, label: string, key: string) => {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        key={key}
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow sponsored" } : {})}
      >
        {label}
      </a>
    );
  };

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<strong key={key}>{token.slice(1, -1)}</strong>);
    } else if (token.startsWith("_")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("~")) {
      nodes.push(<del key={key}>{token.slice(1, -1)}</del>);
    } else if (token.startsWith("==")) {
      nodes.push(<mark key={key}>{token.slice(2, -2)}</mark>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const label = token.slice(1, token.indexOf("]"));
      const href = token.slice(token.indexOf("(") + 1, -1);
      nodes.push(link(href, label, key));
    } else {
      nodes.push(link(token, token.replace(/^https?:\/\//, ""), key));
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

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

    // Images: bare image URL on its own line
    if (IMAGE_RE.test(line)) {
      flushAll();
      blocks.push(
        <img key={`img-${key++}`} src={line} alt="" loading="lazy" className="rounded-xl" />,
      );
      continue;
    }

    // Tip callout: !! text
    if (line.startsWith("!!")) {
      flushAll();
      blocks.push(
        <div key={`c-${key++}`} className="callout">
          <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-emerald" aria-hidden="true" />
          <p className="m-0">{inline(line.replace(/^!!\s*/, ""), `c${key}`)}</p>
        </div>,
      );
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const body = inline(heading[2], `h${key}`);
      blocks.push(
        level === 1 ? (
          <h2 key={`h-${key++}`}>{body}</h2>
        ) : level === 2 ? (
          <h2 key={`h-${key++}`}>{body}</h2>
        ) : (
          <h3 key={`h-${key++}`}>{body}</h3>
        ),
      );
      continue;
    }

    if (/^-{3,}$/.test(line)) {
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

    if (/^[-•]\s+/.test(line)) {
      flushParagraph();
      flushQuote();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(line.replace(/^[-•]\s+/, ""));
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      flushParagraph();
      flushQuote();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(line.replace(/^\d+[.)]\s+/, ""));
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line);
  }

  flushAll();

  return <div className="prose-article">{blocks}</div>;
}
