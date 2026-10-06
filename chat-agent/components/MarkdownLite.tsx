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

type BlockResult = { node: React.ReactNode; next: number };
type BlockParser = (lines: string[], i: number) => BlockResult | null;

const FENCE_OPEN = /^\s*```(\w*)\s*$/;
const FENCE_CLOSE = /^\s*```\s*$/;
const BLOCKQUOTE_LINE = /^\s*>\s?/;
const UL_ITEM = /^\s*[-*+]\s+(.*)$/;
const OL_ITEM = /^\s*\d+[.)]\s+(.*)$/;

function parseFence(lines: string[], start: number): BlockResult | null {
  const fence = FENCE_OPEN.exec(lines[start]);
  if (!fence) return null;
  const lang = fence[1];
  const codeLines: string[] = [];
  let i = start + 1;
  while (i < lines.length && !FENCE_CLOSE.test(lines[i])) {
    codeLines.push(lines[i]);
    i++;
  }
  i++; // skip closing fence
  return {
    next: i,
    node: (
      <pre key={`code${i}`} className={styles.codeBlock}>
        <code data-lang={lang || undefined}>{codeLines.join("\n")}</code>
      </pre>
    ),
  };
}

function renderTable(header: string[], rows: string[][], key: number): React.ReactNode {
  return (
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
  );
}

/** GFM table: current line has a pipe and next line is a separator. */
function parseTable(lines: string[], start: number): BlockResult | null {
  const line = lines[start];
  if (!line.includes("|") || start + 1 >= lines.length || !isTableSeparator(lines[start + 1])) {
    return null;
  }
  const header = splitRow(line);
  let i = start + 2; // skip header + separator
  const rows: string[][] = [];
  while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
    rows.push(splitRow(lines[i]));
    i++;
  }
  return { next: i, node: renderTable(header, rows, i) };
}

function parseHeading(lines: string[], i: number): BlockResult | null {
  const heading = /^(#{1,6})\s+(.*)$/.exec(lines[i]);
  if (!heading) return null;
  const tag = `h${Math.min(heading[1].length + 2, 6)}`;
  return {
    next: i + 1,
    node: React.createElement(
      tag,
      { key: `h${i}`, className: styles.heading },
      renderInline(heading[2], `h${i}`),
    ),
  };
}

function parseRule(lines: string[], i: number): BlockResult | null {
  if (!/^\s*([-*_])(\s*\1){2,}\s*$/.test(lines[i])) return null;
  return { next: i + 1, node: <hr key={`hr${i}`} className={styles.hr} /> };
}

/** Group consecutive blockquote lines. */
function parseBlockquote(lines: string[], start: number): BlockResult | null {
  if (!BLOCKQUOTE_LINE.test(lines[start])) return null;
  const quoteLines: string[] = [];
  let i = start;
  while (i < lines.length && BLOCKQUOTE_LINE.test(lines[i])) {
    quoteLines.push(lines[i].replace(BLOCKQUOTE_LINE, ""));
    i++;
  }
  return {
    next: i,
    node: (
      <blockquote key={`bq${i}`} className={styles.blockquote}>
        {renderInline(quoteLines.join("\n"), `bq${i}`)}
      </blockquote>
    ),
  };
}

/** Group consecutive unordered / ordered item lines. */
function parseList(lines: string[], start: number): BlockResult | null {
  const ordered = OL_ITEM.test(lines[start]);
  if (!ordered && !UL_ITEM.test(lines[start])) return null;
  const itemPattern = ordered ? OL_ITEM : UL_ITEM;
  const items: string[] = [];
  let i = start;
  for (let m = itemPattern.exec(lines[i] ?? ""); m; m = itemPattern.exec(lines[i] ?? "")) {
    items.push(m[1]);
    i++;
  }
  const children = items.map((it, ii) => (
    <li key={ii}>{renderInline(it, `li${i}-${ii}`)}</li>
  ));
  return {
    next: i,
    node: ordered ? (
      <ol key={`ol${i}`} className={styles.list}>{children}</ol>
    ) : (
      <ul key={`ul${i}`} className={styles.list}>{children}</ul>
    ),
  };
}

const BLOCK_PARSERS: BlockParser[] = [
  parseFence,
  parseTable,
  parseHeading,
  parseRule,
  parseBlockquote,
  parseList,
];

function matchBlock(lines: string[], i: number): BlockResult | null {
  for (const parse of BLOCK_PARSERS) {
    const result = parse(lines, i);
    if (result) return result;
  }
  return null;
}

/** Parse the whole message into block-level elements. */
function parseBlocks(src: string): React.ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let paraBuf: string[] = [];
  let paraStart = 0;

  const flushParagraph = () => {
    if (paraBuf.length > 0) {
      const text = paraBuf.join("\n");
      const key = paraStart;
      blocks.push(
        <p key={`p${key}`} className={styles.paragraph}>{renderInline(text, `p${key}`)}</p>,
      );
    }
    paraBuf = [];
  };

  let i = 0;
  while (i < lines.length) {
    const block = matchBlock(lines, i);
    if (block) {
      flushParagraph();
      blocks.push(block.node);
      i = block.next;
    } else if (lines[i].trim() === "") {
      // Blank line ends a paragraph
      flushParagraph();
      i++;
    } else {
      // Accumulate paragraph text
      if (paraBuf.length === 0) paraStart = i;
      paraBuf.push(lines[i]);
      i++;
    }
  }
  flushParagraph();

  return blocks;
}

export function MarkdownLite({ text }: Readonly<{ text: string }>) {
  if (!text) return null;
  return <div className={styles.markdown}>{parseBlocks(text)}</div>;
}
