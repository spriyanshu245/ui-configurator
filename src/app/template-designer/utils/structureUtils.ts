import { TemplateBlock, TemplateStructureNode } from "@/app/template-designer/types";
import { getElementType } from "@/app/template-designer/utils";

export const generateStructureFromBlocks = (
  blocks: TemplateBlock[],
  expandedNodes: Set<string>
): TemplateStructureNode[] => {
  return blocks.map((block) => ({
    id: block.id,
    label: block.label,
    type: block.type,
    isExpanded: expandedNodes.has(block.id),
    children: block.children
      ? generateStructureFromBlocks(block.children, expandedNodes)
      : undefined,
  }));
};

export const parseHtmlToStructure = (
  html: string,
  expandedNodes: Set<string>
): TemplateStructureNode[] => {
  if (!html || globalThis.window === undefined) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const getElementLabel = (el: Element): string => {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const className =
      el.className && typeof el.className === "string"
        ? `.${el.className.split(" ").filter(Boolean).join(".")}`
        : "";
    return `${tag}${id}${className}`.substring(0, 40);
  };

  let nodeId = 0;
  const parseElement = (
    el: Element,
    depth: number = 0
  ): TemplateStructureNode | null => {
    if (depth > 10) return null;

    const children: TemplateStructureNode[] = [];
    for (const child of Array.from(el.children)) {
      const parsed = parseElement(child, depth + 1);
      if (parsed) children.push(parsed);
    }

    const id = `node-${nodeId++}`;
    return {
      id,
      label: getElementLabel(el),
      type: getElementType(el.tagName.toLowerCase()),
      isExpanded: expandedNodes.has(id),
      children: children.length > 0 ? children : undefined,
    };
  };

  const body = doc.body;
  if (!body) return [];

  const rootChildren: TemplateStructureNode[] = [];
  for (const child of Array.from(body.children)) {
    const parsed = parseElement(child);
    if (parsed) rootChildren.push(parsed);
  }

  return rootChildren;
};
