import React from "react";
import styles from "./MarkdownLite.module.scss";

/**
 * A tiny, dependency-free Markdown renderer for assistant chat messages.
 *
 * Supports the subset the agent actually emits: GFM tables, fenced code blocks,
 * inline code, bold/italic, links, unordered/ordered lists, blockquotes,
 * headings and horizontal rules. Everything is rendered to React elements
 * (never dangerouslySetInnerHTML), and link hrefs are restricted to safe
 * schemes, so there is no XSS surface.
 */

type InlineKey = string | number;

const SAFE_HREF = /^(https?:|mailto:)/i;

/** Render inline markdown (code, bold, italic, links) within a single string. */
function renderInline(text: string, keyPrefix: InlineKey): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on inline code first — its contents must not be further parsed.
  const codeParts = text.split(/(`[^`]+`)/g);
  codeParts.forEach((part, i) => {
    if (!part) return;
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      nodes.push(
        <code key={`${keyPrefix}-c${i}`} className={styles.inlineCode}>
          {part.slice(1, -1)}
        </code>,
      );
      return;
    }
    nodes.push(...renderEmphasis(part, `${keyPrefix}-t${i}`));
  });
  return nodes;
}

/** Handle links, then bold, then italic, in that precedence. */
function renderEmphasis(text: string, keyPrefix: InlineKey): React.ReactNode[] {
  // Links: [label](href)
  const linkParts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  const out: React.ReactNode[] = [];
  linkParts.forEach((part, i) => {
    if (!part) return;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, rawHref] = link;
      const href = rawHref.trim();
      if (SAFE_HREF.test(href)) {
        out.push(
          <a
            key={`${keyPrefix}-l${i}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {label}
          </a>,
        );
      } else {
        out.push(label);
      }
      return;
    }
    out.push(...renderBoldItalic(part, `${keyPrefix}-e${i}`));
  });
  return out;
}

function renderBoldItalic(text: string, keyPrefix: InlineKey): React.ReactNode[] {
  // Bold (**x** / __x__) first, then italic (*x* / _x_) inside the remainder.
  const boldParts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
  const out: React.ReactNode[] = [];
  boldParts.forEach((part, i) => {
    if (!part) return;
    const bold = part.match(/^(?:\*\*|__)([\s\S]+)(?:\*\*|__)$/);
    if (bold) {
      out.push(<strong key={`${keyPrefix}-b${i}`}>{bold[1]}</strong>);
      return;
    }
    const italicParts = part.split(/(\*[^*]+\*|_[^_]+_)/g);
    italicParts.forEach((ip, j) => {
      if (!ip) return;
      const italic = ip.match(/^(?:\*|_)([\s\S]+)(?:\*|_)$/);
      if (italic) {
        out.push(<em key={`${keyPrefix}-i${i}-${j}`}>{italic[1]}</em>);
      } else {
        out.push(<React.Fragment key={`${keyPrefix}-s${i}-${j}`}>{ip}</React.Fragment>);
      }
    });
  });
  return out;
}

function isTableSeparator(line: string): boolean {
  // e.g. | --- | :--: | ---: |
  return /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/.test(line);
}

function splitRow(line: string): string[] {
  let cells = line.trim();
  if (cells.startsWith("|")) cells = cells.slice(1);
  if (cells.endsWith("|")) cells = cells.slice(0, -1);
  return cells.split("|").map((c) => c.trim());
}

interface Block {
  render: () => React.ReactNode;
}

/** Parse the whole message into block-level elements. */
function parseBlocks(src: string): React.ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const pushParagraph = (buf: string[], key: number) => {
    if (buf.length === 0) return;
    const text = buf.join("\n");
    blocks.push({
      render: () => <p key={`p${key}`} className={styles.paragraph}>{renderInline(text, `p${key}`)}</p>,
    });
  };

  let paraBuf: string[] = [];
  let paraStart = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      pushParagraph(paraBuf, paraStart); paraBuf = [];
      const lang = fence[1];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const key = i;
      blocks.push({
        render: () => (
          <pre key={`code${key}`} className={styles.codeBlock}>
            <code data-lang={lang || undefined}>{codeLines.join("\n")}</code>
          </pre>
        ),
      });
      continue;
    }

    // GFM table: current line has a pipe and next line is a separator
    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      pushParagraph(paraBuf, paraStart); paraBuf = [];
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const key = i;
      blocks.push({
        render: () => (
          <div key={`tbl${key}`} className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {header.map((h, hi) => (
                    <th key={hi}>{renderInline(h, `th${key}-${hi}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri}>
                    {header.map((_, ci) => (
                      <td key={ci}>{renderInline(r[ci] ?? "", `td${key}-${ri}-${ci}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      });
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      pushParagraph(paraBuf, paraStart); paraBuf = [];
      const level = heading[1].length;
      const content = heading[2];
      const key = i;
      const tag = `h${Math.min(level + 2, 6)}`;
      blocks.push({
        render: () =>
          React.createElement(
            tag,
            { key: `h${key}`, className: styles.heading },
            renderInline(content, `h${key}`),
          ),
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      pushParagraph(paraBuf, paraStart); paraBuf = [];
      const key = i;
      blocks.push({ render: () => <hr key={`hr${key}`} className={styles.hr} /> });
      i++;
      continue;
    }

    // Blockquote (group consecutive)
    if (/^\s*>\s?/.test(line)) {
      pushParagraph(paraBuf, paraStart); paraBuf = [];
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      const key = i;
      blocks.push({
        render: () => (
          <blockquote key={`bq${key}`} className={styles.blockquote}>
            {renderInline(quoteLines.join("\n"), `bq${key}`)}
          </blockquote>
        ),
      });
      continue;
    }

    // Lists (unordered / ordered), group consecutive item lines
    const ulItem = line.match(/^\s*[-*+]\s+(.*)$/);
    const olItem = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ulItem || olItem) {
      pushParagraph(paraBuf, paraStart); paraBuf = [];
      const ordered = Boolean(olItem);
      const items: string[] = [];
      while (i < lines.length) {
        const u = lines[i].match(/^\s*[-*+]\s+(.*)$/);
        const o = lines[i].match(/^\s*\d+[.)]\s+(.*)$/);
        if (ordered && o) items.push(o[1]);
        else if (!ordered && u) items.push(u[1]);
        else break;
        i++;
      }
      const key = i;
      blocks.push({
        render: () => {
          const children = items.map((it, ii) => (
            <li key={ii}>{renderInline(it, `li${key}-${ii}`)}</li>
          ));
          return ordered ? (
            <ol key={`ol${key}`} className={styles.list}>{children}</ol>
          ) : (
            <ul key={`ul${key}`} className={styles.list}>{children}</ul>
          );
        },
      });
      continue;
    }

    // Blank line ends a paragraph
    if (line.trim() === "") {
      pushParagraph(paraBuf, paraStart); paraBuf = [];
      i++;
      continue;
    }

    // Accumulate paragraph text
    if (paraBuf.length === 0) paraStart = i;
    paraBuf.push(line);
    i++;
  }
  pushParagraph(paraBuf, paraStart);

  return blocks.map((b) => b.render());
}

export function MarkdownLite({ text }: { text: string }) {
  if (!text) return null;
  return <div className={styles.markdown}>{parseBlocks(text)}</div>;
}
