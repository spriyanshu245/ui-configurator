type FtlPlaceholder = {
  placeholder: string;
  original: string;
};

type ListStackEntry = {
  listType: "ul" | "ol";
  indent: number;
  hasOpenLi: boolean;
  listStyleType?: "decimal" | "lower-alpha" | "upper-alpha";
};

const extractFtlExpressions = (
  text: string,
): { text: string; placeholders: FtlPlaceholder[] } => {
  const placeholders: FtlPlaceholder[] = [];
  let counter = 0;

  const ftlPatterns = [
    /\$\{[^}]*(?:\[[^\]]*\][^}]*)*\}/g,
    /<#list\s+[^>]+>/g,
    /<\/#list>/g,
    /<#if\s+[^>]+>/g,
    /<\/#if>/g,
  ];

  let result = text;
  for (const pattern of ftlPatterns) {
    result = result.replaceAll(pattern, (match) => {
      const placeholder = `\u0000FTL${counter++}\u0000`;
      placeholders.push({ placeholder, original: match });
      return placeholder;
    });
  }

  return { text: result, placeholders };
};

const restoreFtlExpressions = (
  text: string,
  placeholders: FtlPlaceholder[],
): string => {
  let result = text;
  for (const { placeholder, original } of placeholders) {
    result = result.replaceAll(placeholder, original);
  }
  return result;
};

const convertHeaders = (html: string): string => {
  return html.replaceAll(
    /^(#{1,6})\s+(.+)$/gm,
    (_match, hashes: string, content: string) => {
      const level = hashes.length;
      return `<h${level}>${content}</h${level}>`;
    },
  );
};

const convertBoldAndItalic = (html: string): string => {
  let result = html;
  result = result.replaceAll(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replaceAll(/__(.+?)__/g, "<strong>$1</strong>");
  result = result.replaceAll(
    /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,
    "<em>$1</em>",
  );
  result = result.replaceAll(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "<em>$1</em>");
  result = result.replaceAll(/\+\+(.+?)\+\+/g, "<u>$1</u>");
  return result;
};

const convertLinks = (html: string): string => {
  return html.replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
};

const convertLists = (html: string): string => {
  const lines = html.split("\n");
  const processedLines: string[] = [];
  const stack: ListStackEntry[] = [];

  const drainStack = () => {
    while (stack.length > 0) {
      const entry = stack.pop()!;
      if (entry.hasOpenLi) processedLines.push("</li>");
      processedLines.push(`</${entry.listType}>`);
    }
  };

  const popUntilIndent = (targetIndent: number) => {
    while (stack.length > 0 && stack[stack.length - 1].indent > targetIndent) {
      const entry = stack.pop()!;
      if (entry.hasOpenLi) processedLines.push("</li>");
      processedLines.push(`</${entry.listType}>`);
    }
  };

  for (const line of lines) {
    const unorderedMatch = /^(\s*)[-*]\s+(.+)$/.exec(line);
    const orderedMatch = /^(\s*)\d+\.\s+(.+)$/.exec(line);
    const lowerAlphaMatch = /^(\s*)([a-z])\.\s+(.+)$/.exec(line);
    const upperAlphaMatch = /^(\s*)([A-Z])\.\s+(.+)$/.exec(line);
    const match =
      unorderedMatch ?? orderedMatch ?? lowerAlphaMatch ?? upperAlphaMatch;

    if (match) {
      const indentStr = match[1];
      let content: string;
      if (lowerAlphaMatch || upperAlphaMatch) {
        content = match[3];
      } else {
        content = match[2];
      }
      let listType: "ul" | "ol" = unorderedMatch ? "ul" : "ol";
      let listStyleType: "decimal" | "lower-alpha" | "upper-alpha" | undefined;

      if (lowerAlphaMatch) {
        listStyleType = "lower-alpha";
      } else if (upperAlphaMatch) {
        listStyleType = "upper-alpha";
      } else if (orderedMatch) {
        listStyleType = "decimal";
      }

      const indentLevel = Math.floor(indentStr.length / 2);

      popUntilIndent(indentLevel);

      const top = stack.length > 0 ? stack[stack.length - 1] : null;

      if (top?.indent === indentLevel) {
        if (top.hasOpenLi) {
          processedLines.push("</li>");
          top.hasOpenLi = false;
        }
        if (top.listType !== listType || top.listStyleType !== listStyleType) {
          stack.pop();
          processedLines.push(`</${top.listType}>`);
          const styleAttr = listStyleType
            ? ` style="list-style-type: ${listStyleType}"`
            : "";
          processedLines.push(`<${listType}${styleAttr}>`);
          stack.push({
            listType,
            indent: indentLevel,
            hasOpenLi: false,
            listStyleType,
          });
        }
      } else {
        const styleAttr = listStyleType
          ? ` style="list-style-type: ${listStyleType}"`
          : "";
        processedLines.push(`<${listType}${styleAttr}>`);
        stack.push({
          listType,
          indent: indentLevel,
          hasOpenLi: false,
          listStyleType,
        });
      }

      processedLines.push(`<li>${content}`);
      stack[stack.length - 1].hasOpenLi = true;
    } else {
      drainStack();
      processedLines.push(line);
    }
  }

  drainStack();
  return processedLines.join("\n");
};

const convertHtmlListToMarkdown = (
  listHtml: string,
  indent: number,
): string => {
  const isOrdered = /^<ol[\s>]/i.test(listHtml.trimStart());
  const listType = isOrdered ? "ol" : "ul";

  let listStyleType: "decimal" | "lower-alpha" | "upper-alpha" = "decimal";
  if (isOrdered) {
    const styleMatch =
      /style="list-style-type:\s*(decimal|lower-alpha|upper-alpha)"/.exec(
        listHtml,
      );
    if (styleMatch) {
      listStyleType = styleMatch[1] as
        | "decimal"
        | "lower-alpha"
        | "upper-alpha";
    }
  }

  const openEnd = listHtml.indexOf(">") + 1;
  const closeTag = `</${listType}>`;
  const innerEnd = listHtml.lastIndexOf(closeTag);
  const inner = listHtml.substring(openEnd, innerEnd);

  const lines: string[] = [];
  const prefix = "  ".repeat(indent);
  let counter = 1;
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let pos = 0;

  while (pos < inner.length) {
    const liStart = inner.indexOf("<li", pos);
    if (liStart === -1) break;

    const liOpenEnd = inner.indexOf(">", liStart) + 1;
    let listDepth = 0;
    let liEnd = -1;
    let j = liOpenEnd;

    while (j < inner.length) {
      const slice = inner.slice(j);
      if (/^<(?:ul|ol)[\s>]/i.test(slice)) {
        listDepth++;
        j++;
      } else if (/^<\/(?:ul|ol)>/i.test(slice)) {
        listDepth--;
        j++;
      } else if (listDepth === 0 && slice.startsWith("</li>")) {
        liEnd = j;
        break;
      } else {
        j++;
      }
    }

    if (liEnd === -1) break;

    const liContent = inner.substring(liOpenEnd, liEnd);
    pos = liEnd + 5;

    const nestedMatch = /(<(?:ul|ol)[\s>])/i.exec(liContent);
    let textPart = liContent;
    let nestedMarkdown = "";

    if (nestedMatch) {
      const nestedStart = nestedMatch.index;
      const nestedTypeMatch = /^<(ul|ol)[\s>]/i.exec(nestedMatch[0]);
      const nestedTagName = nestedTypeMatch
        ? nestedTypeMatch[1].toLowerCase()
        : "ul";
      const nestedOpenTag = `<${nestedTagName}`;
      const nestedCloseTag = `</${nestedTagName}>`;
      let nDepth = 0;
      let nEnd = nestedStart;

      for (let k = nestedStart; k < liContent.length; k++) {
        const s = liContent.slice(k);
        if (
          s.startsWith(nestedOpenTag) &&
          (s[nestedOpenTag.length] === ">" || s[nestedOpenTag.length] === " ")
        ) {
          nDepth++;
        } else if (s.startsWith(nestedCloseTag)) {
          nDepth--;
          if (nDepth === 0) {
            nEnd = k + nestedCloseTag.length;
            break;
          }
        }
      }

      const nestedHtml = liContent.substring(nestedStart, nEnd);
      textPart =
        liContent.substring(0, nestedStart) + liContent.substring(nEnd);
      nestedMarkdown = convertHtmlListToMarkdown(nestedHtml, indent + 1);
    }

    textPart = textPart.replaceAll(/<[^>]+>/g, "").trim();
    let bullet: string;
    if (isOrdered) {
      if (listStyleType === "lower-alpha") {
        const letterIndex = (counter - 1) % 26;
        bullet = `${alphabet[letterIndex]}.`;
      } else if (listStyleType === "upper-alpha") {
        const letterIndex = (counter - 1) % 26;
        bullet = `${alphabet[letterIndex].toUpperCase()}.`;
      } else {
        bullet = `${counter}.`;
      }
      counter++;
    } else {
      bullet = "-";
    }
    lines.push(`${prefix}${bullet} ${textPart}`);
    if (nestedMarkdown) lines.push(nestedMarkdown);
  }

  return lines.join("\n");
};

const replaceTopLevelLists = (html: string): string => {
  const result: string[] = [];
  let i = 0;

  while (i < html.length) {
    const ulPos = html.indexOf("<ul", i);
    const olPos = html.indexOf("<ol", i);

    let listPos = -1;
    let listType = "";

    if (ulPos === -1 && olPos === -1) {
      result.push(html.substring(i));
      break;
    } else if (olPos === -1 || (ulPos !== -1 && ulPos < olPos)) {
      listPos = ulPos;
      listType = "ul";
    } else {
      listPos = olPos;
      listType = "ol";
    }

    const charAfter = html[listPos + listType.length + 1];
    if (charAfter !== ">" && charAfter !== " " && charAfter !== "\n") {
      result.push(html.substring(i, listPos + 1));
      i = listPos + 1;
      continue;
    }

    result.push(html.substring(i, listPos));

    const openTag = `<${listType}`;
    const closeTag = `</${listType}>`;
    let depth = 0;
    let j = listPos;
    let listEnd = -1;

    while (j < html.length) {
      if (
        html.startsWith(openTag, j) &&
        (html[j + openTag.length] === ">" || html[j + openTag.length] === " ")
      ) {
        depth++;
        j++;
      } else if (html.startsWith(closeTag, j)) {
        depth--;
        if (depth === 0) {
          listEnd = j + closeTag.length;
          break;
        }
        j++;
      } else {
        j++;
      }
    }

    if (listEnd === -1) {
      result.push(html.substring(listPos));
      break;
    }

    result.push(convertHtmlListToMarkdown(html.substring(listPos, listEnd), 0));
    i = listEnd;
  }

  return result.join("");
};

const isHtmlBlock = (trimmed: string): boolean => {
  if (
    /^<(h[1-6]|ul|ol|li|p|div|section|table|tr|td|th|thead|tbody)[\s>]/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  return trimmed.startsWith("<") && trimmed.endsWith(">");
};

const wrapParagraphs = (html: string): string => {
  const paragraphs = html.split(/\n{2,}/);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (isHtmlBlock(trimmed)) return trimmed;
      return `<p>${trimmed.replaceAll("\n", "<br />")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
};

export const markdownToHtml = (markdown: string): string => {
  if (!markdown) return "";

  const { text, placeholders } = extractFtlExpressions(markdown);
  let html = text;

  html = convertHeaders(html);
  html = convertBoldAndItalic(html);
  html = convertLinks(html);
  html = convertLists(html);
  html = wrapParagraphs(html);

  return restoreFtlExpressions(html, placeholders);
};

export const htmlToMarkdown = (html: string): string => {
  if (!html) return "";

  const { text, placeholders } = extractFtlExpressions(html);
  let markdown = text;

  markdown = markdown.replaceAll(
    /<h([1-6])[^>]*>(.+?)<\/h\1>/gi,
    (_match, level: string, content: string) => {
      const hashes = "#".repeat(Number(level));
      return `${hashes} ${content.trim()}`;
    },
  );

  markdown = markdown.replaceAll(/<strong>(.+?)<\/strong>/gi, "**$1**");
  markdown = markdown.replaceAll(/<b>(.+?)<\/b>/gi, "**$1**");

  markdown = markdown.replaceAll(/<em>(.+?)<\/em>/gi, "*$1*");
  markdown = markdown.replaceAll(/<i>(.+?)<\/i>/gi, "*$1*");

  markdown = markdown.replaceAll(/<u>(.+?)<\/u>/gi, "++$1++");

  markdown = markdown.replaceAll(
    /<a\s+href=["']([^"']+)["'][^>]*>(.+?)<\/a>/gi,
    "[$2]($1)",
  );

  markdown = replaceTopLevelLists(markdown);

  markdown = markdown.replaceAll(/<br\s*\/?>/gi, "\n");

  markdown = markdown.replaceAll(
    /<p[^>]*>([\s\S]*?)<\/p>/gi,
    (_match, content: string) => `${content.trim()}\n\n`,
  );

  markdown = markdown.replaceAll(/<div[^>]*>([\s\S]*?)<\/div>/gi, "$1");
  markdown = markdown.replaceAll(/<span[^>]*>([\s\S]*?)<\/span>/gi, "$1");

  markdown = markdown.replaceAll(/<[^>]+>/g, "");

  markdown = markdown.replaceAll(/\n{3,}/g, "\n\n");
  markdown = markdown.trim();

  return restoreFtlExpressions(markdown, placeholders);
};
