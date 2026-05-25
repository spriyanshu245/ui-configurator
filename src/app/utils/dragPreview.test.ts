import { applyCustomDragPreview } from "./dragPreview";

describe("applyCustomDragPreview", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("appends the custom preview before calling setDragImage", () => {
    const sourceEl = document.createElement("div");
    const previewEl = document.createElement("div");
    previewEl.className = "preview";
    document.body.appendChild(sourceEl);

    const setDragImage = jest.fn((dragPreview: HTMLElement) => {
      expect(document.body.contains(dragPreview)).toBe(true);
    });

    const dragPreview = applyCustomDragPreview({
      event: {
        dataTransfer: {
          setDragImage,
        },
      } as any,
      sourceEl,
      createPreview: () => previewEl,
    });

    expect(dragPreview).toBe(previewEl);
    expect(previewEl.id).toBe("ghostEl");
    expect(setDragImage).toHaveBeenCalledWith(previewEl, 0, 0);
  });

  it("uses the fallback clone when no custom preview is provided", () => {
    const sourceEl = document.createElement("div");
    sourceEl.textContent = "Fallback preview";
    sourceEl.className = "source";
    document.body.appendChild(sourceEl);

    const setDragImage = jest.fn();

    const dragPreview = applyCustomDragPreview({
      event: {
        dataTransfer: {
          setDragImage,
        },
      } as any,
      sourceEl,
      fallbackCloneClassName: "ghost",
    });

    expect(dragPreview).not.toBeNull();
    expect(dragPreview).not.toBe(sourceEl);
    expect(dragPreview).toHaveClass("source");
    expect(dragPreview).toHaveClass("ghost");
    expect(dragPreview).toHaveTextContent("Fallback preview");
  });

  it("removes the preview when setDragImage throws", () => {
    const sourceEl = document.createElement("div");
    document.body.appendChild(sourceEl);

    const dragPreview = applyCustomDragPreview({
      event: {
        dataTransfer: {
          setDragImage: () => {
            throw new Error("setDragImage failed");
          },
        },
      } as any,
      sourceEl,
      createPreview: () => document.createElement("div"),
    });

    expect(dragPreview).toBeNull();
    expect(document.getElementById("ghostEl")).toBeNull();
  });
});
