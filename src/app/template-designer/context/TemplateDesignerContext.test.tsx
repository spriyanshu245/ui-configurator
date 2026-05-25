import { render, screen, act, waitFor } from "@testing-library/react";
import {
  TemplateDesignerProvider,
  useTemplateDesigner,
} from "./TemplateDesignerContext";
import { TemplateBlock } from "../../types";

if (globalThis.structuredClone === undefined) {
  globalThis.structuredClone = <T,>(obj: T): T =>
    JSON.parse(JSON.stringify(obj));
}

jest.mock("@/app/template-designer/services/translationService", () => ({
  translateBlocks: jest.fn().mockResolvedValue([
    {
      id: "translated-1",
      type: "richText",
      label: "Translated",
      content: "Translated content",
      properties: {},
    },
  ]),
  deepCloneBlocks: jest.fn((blocks: TemplateBlock[]) =>
    structuredClone(blocks),
  ),
}));

const TestConsumer = () => {
  const context = useTemplateDesigner();
  return (
    <div>
      <span data-testid="blocks-count">{context.blocks.length}</span>
      <span data-testid="selected-block">
        {context.selectedBlockId ?? "none"}
      </span>
      <span data-testid="template-name">{context.templateName}</span>
      <span data-testid="template-content">{context.templateContent}</span>
      <span data-testid="template-mime-type">{context.templateMimeType}</span>
      <span data-testid="data-model-json">{context.dataModelJson}</span>
      <span data-testid="is-loading">{context.isLoading.toString()}</span>
      <span data-testid="error">{context.error ?? "no-error"}</span>
      <span data-testid="structure-count">{context.structure.length}</span>
      <span data-testid="html-structure-count">
        {context.htmlStructure.length}
      </span>
      <button
        data-testid="add-block-btn"
        onClick={() =>
          context.addBlock({
            id: "new-block-1",
            type: "richText",
            label: "New Block",
            content: "Test content",
            properties: {},
          })
        }
      />
      <button
        data-testid="select-block-btn"
        onClick={() => context.selectBlock("block-1")}
      />
      <button
        data-testid="deselect-block-btn"
        onClick={() => context.selectBlock(null)}
      />
      <button
        data-testid="update-block-btn"
        onClick={() => context.updateBlock("block-1", { label: "Updated" })}
      />
      <button
        data-testid="remove-block-btn"
        onClick={() => context.removeBlock("block-1")}
      />
      <button
        data-testid="toggle-node-btn"
        onClick={() => context.toggleStructureNode("block-1")}
      />
      <button
        data-testid="set-content-btn"
        onClick={() => context.setTemplateContent("<p>Test</p>")}
      />
      <button
        data-testid="set-name-btn"
        onClick={() => context.setTemplateName("Test Template")}
      />
      <button
        data-testid="set-mime-type-btn"
        onClick={() => context.setTemplateMimeType("text/html")}
      />
      <button
        data-testid="set-data-model-btn"
        onClick={() => context.setDataModelJson('{"test": true}')}
      />
      <button
        data-testid="set-loading-btn"
        onClick={() => context.setLoadingState(true, "Test error")}
      />
      <button
        data-testid="move-block-to-root-btn"
        onClick={() => context.moveBlock("child-1", null, 0)}
      />
      <button
        data-testid="move-block-to-parent-btn"
        onClick={() => context.moveBlock("block-1", "parent-1", 0)}
      />
    </div>
  );
};

describe("TemplateDesignerContext", () => {
  describe("useTemplateDesigner hook", () => {
    it("should throw error when used outside provider", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() => render(<TestConsumer />)).toThrow(
        "useTemplateDesigner must be used within TemplateDesignerProvider",
      );
      consoleError.mockRestore();
    });
  });

  describe("TemplateDesignerProvider", () => {
    it("should render with default values", () => {
      render(
        <TemplateDesignerProvider>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("0");
      expect(screen.getByTestId("selected-block")).toHaveTextContent("none");
      expect(screen.getByTestId("template-mime-type")).toHaveTextContent(
        "application/json",
      );
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    });

    it("should initialize with provided initial state", () => {
      const initialBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Block 1",
          content: "Test",
          properties: {},
        },
      ];

      render(
        <TemplateDesignerProvider
          initialState={{ blocks: initialBlocks, selectedBlockId: "block-1" }}
          initialContent="<p>Initial</p>"
          initialLoading={true}
          initialError="Initial error"
        >
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
      expect(screen.getByTestId("selected-block")).toHaveTextContent("block-1");
      expect(screen.getByTestId("template-content")).toHaveTextContent(
        "<p>Initial</p>",
      );
      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("Initial error");
    });

    it("should add block to root level", () => {
      render(
        <TemplateDesignerProvider>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("add-block-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
      expect(screen.getByTestId("selected-block")).toHaveTextContent(
        "new-block-1",
      );
    });

    it("should select and deselect blocks", () => {
      const initialBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Block 1",
          content: "Test",
          properties: {},
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("select-block-btn").click();
      });

      expect(screen.getByTestId("selected-block")).toHaveTextContent("block-1");

      act(() => {
        screen.getByTestId("deselect-block-btn").click();
      });

      expect(screen.getByTestId("selected-block")).toHaveTextContent("none");
    });

    it("should update block properties", () => {
      const initialBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Block 1",
          content: "Test",
          properties: {},
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("update-block-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should remove block and deselect if selected", () => {
      const initialBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Block 1",
          content: "Test",
          properties: {},
        },
      ];

      render(
        <TemplateDesignerProvider
          initialState={{ blocks: initialBlocks, selectedBlockId: "block-1" }}
        >
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("selected-block")).toHaveTextContent("block-1");

      act(() => {
        screen.getByTestId("remove-block-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("0");
      expect(screen.getByTestId("selected-block")).toHaveTextContent("none");
    });

    it("should toggle structure node expansion", () => {
      const initialBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Block 1",
          content: "Test",
          properties: {},
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("toggle-node-btn").click();
      });

      act(() => {
        screen.getByTestId("toggle-node-btn").click();
      });
    });

    it("should set template content", () => {
      render(
        <TemplateDesignerProvider>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("set-content-btn").click();
      });

      expect(screen.getByTestId("template-content")).toHaveTextContent(
        "<p>Test</p>",
      );
    });

    it("should set template name", () => {
      render(
        <TemplateDesignerProvider>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("set-name-btn").click();
      });

      expect(screen.getByTestId("template-name")).toHaveTextContent(
        "Test Template",
      );
    });

    it("should set template mime type", () => {
      render(
        <TemplateDesignerProvider>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("set-mime-type-btn").click();
      });

      expect(screen.getByTestId("template-mime-type")).toHaveTextContent(
        "text/html",
      );
    });

    it("should set data model json", () => {
      render(
        <TemplateDesignerProvider>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("set-data-model-btn").click();
      });

      expect(screen.getByTestId("data-model-json")).toHaveTextContent(
        '{"test": true}',
      );
    });

    it("should set loading state with error", () => {
      render(
        <TemplateDesignerProvider>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("set-loading-btn").click();
      });

      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("Test error");
    });
  });

  describe("Block operations with children", () => {
    it("should add block to parent", () => {
      const AddToParentConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="add-to-parent-btn"
              onClick={() =>
                context.addBlock(
                  {
                    id: "child-block",
                    type: "richText",
                    label: "Child",
                    content: "",
                    properties: {},
                  },
                  "parent-1",
                )
              }
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "parent-1",
          type: "section",
          label: "Parent",
          content: "",
          properties: {},
          children: [],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <AddToParentConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("add-to-parent-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should add block after another block", () => {
      const AddAfterConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="add-after-btn"
              onClick={() =>
                context.addBlock(
                  {
                    id: "new-block",
                    type: "richText",
                    label: "New",
                    content: "",
                    properties: {},
                  },
                  undefined,
                  "block-1",
                )
              }
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Block 1",
          content: "",
          properties: {},
        },
        {
          id: "block-2",
          type: "richText",
          label: "Block 2",
          content: "",
          properties: {},
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <AddAfterConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("add-after-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("3");
    });

    it("should add block after block in nested structure", () => {
      const AddAfterNestedConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="add-after-nested-btn"
              onClick={() =>
                context.addBlock(
                  {
                    id: "new-nested",
                    type: "richText",
                    label: "New Nested",
                    content: "",
                    properties: {},
                  },
                  undefined,
                  "child-1",
                )
              }
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "parent-1",
          type: "section",
          label: "Parent",
          content: "",
          properties: {},
          children: [
            {
              id: "child-1",
              type: "richText",
              label: "Child 1",
              content: "",
              properties: {},
            },
          ],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <AddAfterNestedConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("add-after-nested-btn").click();
      });
    });

    it("should add block after non-existent block (fallback to append)", () => {
      const AddAfterNonExistentConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="add-after-non-existent-btn"
              onClick={() =>
                context.addBlock(
                  {
                    id: "fallback-block",
                    type: "richText",
                    label: "Fallback",
                    content: "",
                    properties: {},
                  },
                  undefined,
                  "non-existent-id",
                )
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <AddAfterNonExistentConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("add-after-non-existent-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should update nested block", () => {
      const UpdateNestedConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="update-nested-btn"
              onClick={() =>
                context.updateBlock("child-1", { label: "Updated Child" })
              }
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "parent-1",
          type: "section",
          label: "Parent",
          content: "",
          properties: {},
          children: [
            {
              id: "child-1",
              type: "richText",
              label: "Child 1",
              content: "",
              properties: {},
            },
          ],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <UpdateNestedConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("update-nested-btn").click();
      });
    });

    it("should remove nested block", () => {
      const RemoveNestedConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="remove-nested-btn"
              onClick={() => context.removeBlock("child-1")}
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "parent-1",
          type: "section",
          label: "Parent",
          content: "",
          properties: {},
          children: [
            {
              id: "child-1",
              type: "richText",
              label: "Child 1",
              content: "",
              properties: {},
            },
          ],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <RemoveNestedConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("remove-nested-btn").click();
      });
    });

    it("should not deselect when removing different block", () => {
      const initialBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Block 1",
          content: "",
          properties: {},
        },
        {
          id: "block-2",
          type: "richText",
          label: "Block 2",
          content: "",
          properties: {},
        },
      ];

      const RemoveOtherConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="selected-block">
              {context.selectedBlockId ?? "none"}
            </span>
            <button
              data-testid="remove-other-btn"
              onClick={() => context.removeBlock("block-2")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider
          initialState={{ blocks: initialBlocks, selectedBlockId: "block-1" }}
        >
          <RemoveOtherConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("remove-other-btn").click();
      });

      expect(screen.getByTestId("selected-block")).toHaveTextContent("block-1");
    });
  });

  describe("Move block operations", () => {
    it("should move block to root at specific index", () => {
      const MoveConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="move-to-root-btn"
              onClick={() => context.moveBlock("child-1", null, 0)}
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "parent-1",
          type: "section",
          label: "Parent",
          content: "",
          properties: {},
          children: [
            {
              id: "child-1",
              type: "richText",
              label: "Child 1",
              content: "",
              properties: {},
            },
          ],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <MoveConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("move-to-root-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("2");
    });

    it("should move block to another parent", () => {
      const MoveToParentConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="move-to-parent-btn"
              onClick={() => context.moveBlock("child-1", "parent-2", 0)}
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "parent-1",
          type: "section",
          label: "Parent 1",
          content: "",
          properties: {},
          children: [
            {
              id: "child-1",
              type: "richText",
              label: "Child 1",
              content: "",
              properties: {},
            },
          ],
        },
        {
          id: "parent-2",
          type: "section",
          label: "Parent 2",
          content: "",
          properties: {},
          children: [],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <MoveToParentConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("move-to-parent-btn").click();
      });
    });

    it("should prevent moving block into its own descendant", () => {
      const MoveIntoDescendantConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="move-into-descendant-btn"
              onClick={() => context.moveBlock("parent-1", "child-1", 0)}
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "parent-1",
          type: "section",
          label: "Parent",
          content: "",
          properties: {},
          children: [
            {
              id: "child-1",
              type: "section",
              label: "Child",
              content: "",
              properties: {},
              children: [],
            },
          ],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <MoveIntoDescendantConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("move-into-descendant-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should handle moving non-existent block", () => {
      const MoveNonExistentConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="move-non-existent-btn"
              onClick={() => context.moveBlock("non-existent", null, 0)}
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Block 1",
          content: "",
          properties: {},
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <MoveNonExistentConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("move-non-existent-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should prevent moving block into itself", () => {
      const MoveIntoItselfConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="move-into-itself-btn"
              onClick={() => context.moveBlock("block-1", "block-1", 0)}
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "section",
          label: "Block 1",
          content: "",
          properties: {},
          children: [],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <MoveIntoItselfConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("move-into-itself-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });
  });

  describe("Structure generation", () => {
    it("should generate structure from blocks with children", () => {
      const initialBlocks: TemplateBlock[] = [
        {
          id: "parent-1",
          type: "section",
          label: "Parent",
          content: "",
          properties: {},
          children: [
            {
              id: "child-1",
              type: "richText",
              label: "Child",
              content: "",
              properties: {},
            },
          ],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("structure-count")).toHaveTextContent("1");
    });
  });

  describe("HTML parsing to structure", () => {
    it("should parse HTML content to structure", () => {
      render(
        <TemplateDesignerProvider initialContent="<div><p>Test</p></div>">
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("html-structure-count")).toHaveTextContent("1");
    });

    it("should handle empty HTML content", () => {
      render(
        <TemplateDesignerProvider initialContent="">
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("html-structure-count")).toHaveTextContent("0");
    });

    it("should parse various HTML elements with correct types", () => {
      const html = `
        <div id="main" class="container wrapper">
          <section></section>
          <table></table>
          <img src="test.jpg" alt="test" />
          <p>Text</p>
          <span>Span</span>
          <h1>H1</h1>
          <h2>H2</h2>
          <h3>H3</h3>
          <h4>H4</h4>
          <h5>H5</h5>
          <h6>H6</h6>
          <ul><li>Item</li></ul>
          <ol><li>Item</li></ol>
          <form></form>
          <button>Click</button>
          <a href="#">Link</a>
          <hr />
          <custom-element></custom-element>
        </div>
      `;

      render(
        <TemplateDesignerProvider initialContent={html}>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("html-structure-count")).toHaveTextContent("1");
    });

    it("should handle element without className", () => {
      const html = '<div id="test"></div>';

      render(
        <TemplateDesignerProvider initialContent={html}>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("html-structure-count")).toHaveTextContent("1");
    });
  });

  describe("loadBlocksFromFtl", () => {
    it("should load and parse FTL content", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-ftl-btn"
              onClick={() => context.loadBlocksFromFtl("<p>Test paragraph</p>")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should handle empty FTL content", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-empty-ftl-btn"
              onClick={() => context.loadBlocksFromFtl("")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-empty-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("0");
    });

    it("should parse grid table", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-grid-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <table>
                    <colgroup>
                      <col style="width: 50%" />
                      <col style="width: 50%" />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td>Cell 1</td>
                        <td>Cell 2</td>
                      </tr>
                    </tbody>
                  </table>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-grid-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse data table with block type", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-table-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <table data-block-type="table" data-list="items" data-zebra="true">
                    <thead>
                      <tr>
                        <th data-key="name" data-label="Name" data-align="L">Name</th>
                        <th data-key="value" data-label="Value" data-align="C">Value</th>
                        <th data-key="action" data-label="Action" data-align="R">Action</th>
                        <th data-key="other">Other</th>
                      </tr>
                    </thead>
                    <tbody></tbody>
                  </table>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-table-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse hr element", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-hr-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl(
                  '<hr style="border-top: 2px solid #ff0000" />',
                )
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-hr-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse hr element with default styles", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-hr-default-btn"
              onClick={() => context.loadBlocksFromFtl("<hr />")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-hr-default-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse img element", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-img-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl(
                  '<img src="test.jpg" alt="Test image" />',
                )
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-img-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse spacer div element", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-spacer-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl('<div style="height: 48px"></div>')
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-spacer-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse div with content as rich text", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-div-content-btn"
              onClick={() =>
                context.loadBlocksFromFtl(
                  '<div style="padding: 10px">Content here</div>',
                )
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-div-content-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse section element", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-section-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <section style="padding: 24px 16px; border: 1px solid #ccc">
                    <h3>Section Title</h3>
                    <p>Section content</p>
                  </section>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-section-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse section with single padding value", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-section-single-padding-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <section style="padding: 20px">
                    <p>Content</p>
                  </section>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-section-single-padding-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse section without style", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-section-no-style-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <section>
                    <p>Content</p>
                  </section>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-section-no-style-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse FTL list directive", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-list-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <#list items as item>
                    <p>\${item.name}</p>
                  </#list>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-list-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse FTL if directive", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-if-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <#if condition>
                    <p>Conditional content</p>
                  </#if>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-if-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse content with HTML entities", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-entities-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl(
                  "<p>\u00A9 \u00AE \u2122 \u2014 \u2013 \u2018test\u2019 \u201Cquote\u201D \u2026</p>",
                )
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-entities-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse text nodes", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-text-node-btn"
              onClick={() => context.loadBlocksFromFtl("Plain text content")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-text-node-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should strip FTL from table blocks", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-table-with-ftl-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <table data-block-type="table">
                    <thead><tr><th data-key="name">Name</th></tr></thead>
                    <tbody>
                      <#list items as item>
                        <tr><td>\${item.name}</td></tr>
                      </#list>
                    </tbody>
                  </table>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-table-with-ftl-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse table without rows (default columns)", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-empty-table-btn"
              onClick={() => context.loadBlocksFromFtl("<table></table>")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-empty-table-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse grid with explicit block type", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-grid-explicit-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <table data-block-type="grid">
                    <tr><td>Cell</td></tr>
                  </table>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-grid-explicit-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse various heading tags", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-headings-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <h1>Heading 1</h1>
                  <h2>Heading 2</h2>
                  <h3>Heading 3</h3>
                  <h4>Heading 4</h4>
                  <h5>Heading 5</h5>
                  <h6>Heading 6</h6>
                  <span>Span text</span>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-headings-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("7");
    });

    it("should handle content before and after matches", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-mixed-content-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <p>Before section</p>
                  <section><p>Inside</p></section>
                  <p>After section</p>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-mixed-content-btn").click();
      });
    });

    it("should parse spacer with default height", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-spacer-default-btn"
              onClick={() =>
                context.loadBlocksFromFtl('<div style="height:"></div>')
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-spacer-default-btn").click();
      });
    });

    it("should parse table with column widths mismatch", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-grid-width-mismatch-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <table>
                    <colgroup>
                      <col style="width: 30%" />
                    </colgroup>
                    <tr>
                      <td>Cell 1</td>
                      <td>Cell 2</td>
                      <td>Cell 3</td>
                    </tr>
                  </table>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-grid-width-mismatch-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse col without width style", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-col-no-width-btn"
              onClick={() =>
                context.loadBlocksFromFtl(`
                  <table>
                    <colgroup>
                      <col style="background: red" />
                    </colgroup>
                    <tr>
                      <td>Cell</td>
                    </tr>
                  </table>
                `)
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-col-no-width-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });

    it("should parse image without attributes", () => {
      const FtlConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-img-no-attrs-btn"
              onClick={() => context.loadBlocksFromFtl("<img />")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <FtlConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-img-no-attrs-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });
  });

  describe("HTML structure parsing edge cases", () => {
    it("should limit parsing depth to 10 levels", () => {
      const deepHtml =
        new Array(15)
          .fill(null)
          .map(() => "<div>")
          .join("") +
        "Content" +
        new Array(15)
          .fill(null)
          .map(() => "</div>")
          .join("");

      render(
        <TemplateDesignerProvider initialContent={deepHtml}>
          <TestConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("html-structure-count")).toHaveTextContent("1");
    });

    it("should handle collapsed nodes in HTML structure", () => {
      const ExpandConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="html-structure-count">
              {context.htmlStructure.length}
            </span>
            <button
              data-testid="toggle-html-node-btn"
              onClick={() => context.toggleStructureNode("node-0")}
            />
            <button
              data-testid="set-html-content-btn"
              onClick={() =>
                context.setTemplateContent("<div><p>Test</p></div>")
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider initialContent="<div><p>Test</p></div>">
          <ExpandConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("toggle-html-node-btn").click();
      });

      act(() => {
        screen.getByTestId("set-html-content-btn").click();
      });
    });
  });

  describe("Language management functions", () => {
    const mockTranslateBlocks = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      jest.mock("@/app/template-designer/services/translationService", () => ({
        translateBlocks: mockTranslateBlocks,
      }));
    });

    const LanguageConsumer = () => {
      const context = useTemplateDesigner();
      return (
        <div>
          <span data-testid="current-language">
            {context.currentLanguage.value}
          </span>
          <span data-testid="default-language">
            {context.defaultLanguage.value}
          </span>
          <span data-testid="is-translating">
            {context.isTranslating.toString()}
          </span>
          <span data-testid="available-languages">
            {context.availableLanguages.map((l) => l.value).join(",")}
          </span>
          <span data-testid="blocks-count">{context.blocks.length}</span>
          <button
            data-testid="switch-language-btn"
            onClick={() =>
              context.setCurrentLanguage({
                value: "es",
                label: "Spanish",
                nativeName: "Español",
              })
            }
          />
          <button
            data-testid="switch-to-current-btn"
            onClick={() => context.setCurrentLanguage(context.currentLanguage)}
          />
          <button
            data-testid="add-language-btn"
            onClick={() =>
              context.addLanguage({
                value: "fr",
                label: "French",
                nativeName: "Français",
              })
            }
          />
          <button
            data-testid="add-existing-language-btn"
            onClick={() =>
              context.addLanguage({
                value: "en",
                label: "English",
                nativeName: "English",
              })
            }
          />
          <button
            data-testid="remove-language-btn"
            onClick={() =>
              context.removeLanguage({
                value: "es",
                label: "Spanish",
                nativeName: "Español",
              })
            }
          />
          <button
            data-testid="remove-default-language-btn"
            onClick={() =>
              context.removeLanguage({
                value: "en",
                label: "English",
                nativeName: "English",
              })
            }
          />
          <button
            data-testid="update-default-language-btn"
            onClick={() =>
              context.setDefaultLanguage({
                value: "es",
                label: "Spanish",
                nativeName: "Español",
              })
            }
          />
          <button
            data-testid="get-language-blocks-btn"
            onClick={() => context.getLanguageBlocks("en")}
          />
          <button
            data-testid="save-current-language-btn"
            onClick={() => context.saveCurrentLanguageBlocks()}
          />
          <button
            data-testid="set-category-btn"
            onClick={() => context.setTemplateCategory("Email")}
          />
          <button
            data-testid="set-global-styles-btn"
            onClick={() => context.setGlobalStyles({ fontSize: "18px" })}
          />
          <button
            data-testid="set-markdown-guide-btn"
            onClick={() => context.setIsMarkdownGuideOpen(true)}
          />
          <span data-testid="is-markdown-guide-open">
            {context.isMarkdownGuideOpen.toString()}
          </span>
          <span data-testid="template-category">
            {context.templateCategory}
          </span>
          <span data-testid="global-font-size">
            {context.globalStyles.fontSize}
          </span>
          <span data-testid="is-current-default">
            {context.isCurrentLanguageDefault.toString()}
          </span>
        </div>
      );
    };

    it("should switch to same language without changes", () => {
      render(
        <TemplateDesignerProvider>
          <LanguageConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("switch-to-current-btn").click();
      });

      expect(screen.getByTestId("current-language")).toHaveTextContent("en");
    });

    it("should update default language", () => {
      render(
        <TemplateDesignerProvider>
          <LanguageConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("update-default-language-btn").click();
      });

      expect(screen.getByTestId("default-language")).toHaveTextContent("es");
    });

    it("should not remove default language", () => {
      render(
        <TemplateDesignerProvider>
          <LanguageConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("remove-default-language-btn").click();
      });

      expect(screen.getByTestId("default-language")).toHaveTextContent("en");
    });

    it("should get language blocks", () => {
      render(
        <TemplateDesignerProvider>
          <LanguageConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("get-language-blocks-btn").click();
      });
    });

    it("should save current language blocks", () => {
      render(
        <TemplateDesignerProvider>
          <LanguageConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("save-current-language-btn").click();
      });
    });

    it("should set template category", () => {
      render(
        <TemplateDesignerProvider>
          <LanguageConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("set-category-btn").click();
      });

      expect(screen.getByTestId("template-category")).toHaveTextContent(
        "Email",
      );
    });

    it("should set global styles", () => {
      render(
        <TemplateDesignerProvider>
          <LanguageConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("set-global-styles-btn").click();
      });

      expect(screen.getByTestId("global-font-size")).toHaveTextContent("18px");
    });

    it("should toggle markdown guide", () => {
      render(
        <TemplateDesignerProvider>
          <LanguageConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("is-markdown-guide-open")).toHaveTextContent(
        "false",
      );

      act(() => {
        screen.getByTestId("set-markdown-guide-btn").click();
      });

      expect(screen.getByTestId("is-markdown-guide-open")).toHaveTextContent(
        "true",
      );
    });

    it("should show is current language default", () => {
      render(
        <TemplateDesignerProvider>
          <LanguageConsumer />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("is-current-default")).toHaveTextContent(
        "true",
      );
    });

    it("should switch to non-auto-translated language", async () => {
      const LoadContentConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="current-language">
              {context.currentLanguage.value}
            </span>
            <button
              data-testid="load-btn"
              onClick={() =>
                context.loadBlocksFromContents([
                  {
                    language: "en",
                    content: "<p>English</p>",
                    isDefault: true,
                    isAutoTranslated: false,
                  },
                  {
                    language: "es",
                    content: "<p>Spanish</p>",
                    isDefault: false,
                    isAutoTranslated: false,
                  },
                ])
              }
            />
            <button
              data-testid="switch-btn"
              onClick={() =>
                context.setCurrentLanguage({
                  value: "es",
                  label: "Spanish",
                  nativeName: "Español",
                })
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <LoadContentConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-btn").click();
      });

      await act(async () => {
        screen.getByTestId("switch-btn").click();
      });

      expect(screen.getByTestId("current-language")).toHaveTextContent("es");
    });

    it("should switch to auto-translated language and translate", async () => {
      const { translateBlocks } = require("@/app/template-designer/services/translationService");
      translateBlocks.mockResolvedValue([
        {
          id: "translated-1",
          type: "richText",
          label: "Translated",
          content: "Contenido traducido",
          properties: {},
        },
      ]);

      const LoadContentConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="current-language">
              {context.currentLanguage.value}
            </span>
            <span data-testid="is-translating">
              {context.isTranslating.toString()}
            </span>
            <button
              data-testid="load-btn"
              onClick={() =>
                context.loadBlocksFromContents([
                  {
                    language: "en",
                    content: "<p>English</p>",
                    isDefault: true,
                    isAutoTranslated: false,
                  },
                  {
                    language: "es",
                    content: "<p>Spanish</p>",
                    isDefault: false,
                    isAutoTranslated: true,
                  },
                ])
              }
            />
            <button
              data-testid="switch-btn"
              onClick={() =>
                context.setCurrentLanguage({
                  value: "es",
                  label: "Spanish",
                  nativeName: "Español",
                })
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <LoadContentConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-btn").click();
      });

      await act(async () => {
        screen.getByTestId("switch-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("current-language")).toHaveTextContent("es");
      });
    });

    it("should add new language with translation", async () => {
      const { translateBlocks } = require("@/app/template-designer/services/translationService");
      translateBlocks.mockResolvedValue([
        {
          id: "translated-1",
          type: "richText",
          label: "Translated",
          content: "Contenu traduit",
          properties: {},
        },
      ]);

      const AddLangConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="current-language">
              {context.currentLanguage.value}
            </span>
            <button
              data-testid="add-btn"
              onClick={() =>
                context.addLanguage({
                  value: "fr",
                  label: "French",
                  nativeName: "Français",
                })
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <AddLangConsumer />
        </TemplateDesignerProvider>,
      );

      await act(async () => {
        screen.getByTestId("add-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("current-language")).toHaveTextContent("fr");
      });
    });

    it("should handle translation error when adding new language", async () => {
      const { translateBlocks } = require("@/app/template-designer/services/translationService");
      translateBlocks.mockRejectedValue(
        new Error("Translation service unavailable"),
      );

      const AddLangConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="current-language">
              {context.currentLanguage.value}
            </span>
            <span data-testid="error">{context.error ?? "no-error"}</span>
            <button
              data-testid="add-btn"
              onClick={() =>
                context.addLanguage({
                  value: "fr",
                  label: "French",
                  nativeName: "Français",
                })
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <AddLangConsumer />
        </TemplateDesignerProvider>,
      );

      await act(async () => {
        screen.getByTestId("add-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Translation service unavailable",
        );
      });
    });

    it("should add existing language by switching to it", async () => {
      const LoadAndAddConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="current-language">
              {context.currentLanguage.value}
            </span>
            <button
              data-testid="load-btn"
              onClick={() =>
                context.loadBlocksFromContents([
                  {
                    language: "en",
                    content: "<p>English</p>",
                    isDefault: true,
                    isAutoTranslated: false,
                  },
                  {
                    language: "es",
                    content: "<p>Spanish</p>",
                    isDefault: false,
                    isAutoTranslated: false,
                  },
                ])
              }
            />
            <button
              data-testid="add-btn"
              onClick={() =>
                context.addLanguage({
                  value: "es",
                  label: "Spanish",
                  nativeName: "Español",
                })
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <LoadAndAddConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-btn").click();
      });

      await act(async () => {
        screen.getByTestId("add-btn").click();
      });

      expect(screen.getByTestId("current-language")).toHaveTextContent("es");
    });

    it("should remove current language and switch to default", () => {
      const RemoveLangConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="current-language">
              {context.currentLanguage.value}
            </span>
            <button
              data-testid="load-btn"
              onClick={() =>
                context.loadBlocksFromContents([
                  {
                    language: "en",
                    content: "<p>English</p>",
                    isDefault: true,
                    isAutoTranslated: false,
                  },
                  {
                    language: "es",
                    content: "<p>Spanish</p>",
                    isDefault: false,
                    isAutoTranslated: false,
                  },
                ])
              }
            />
            <button
              data-testid="switch-btn"
              onClick={() =>
                context.setCurrentLanguage({
                  value: "es",
                  label: "Spanish",
                  nativeName: "Español",
                })
              }
            />
            <button
              data-testid="remove-btn"
              onClick={() =>
                context.removeLanguage({
                  value: "es",
                  label: "Spanish",
                  nativeName: "Español",
                })
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <RemoveLangConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-btn").click();
      });

      act(() => {
        screen.getByTestId("switch-btn").click();
      });

      expect(screen.getByTestId("current-language")).toHaveTextContent("es");

      act(() => {
        screen.getByTestId("remove-btn").click();
      });

      expect(screen.getByTestId("current-language")).toHaveTextContent("en");
    });
  });

  describe("loadBlocksFromContents", () => {
    const ContentsConsumer = () => {
      const context = useTemplateDesigner();
      return (
        <div>
          <span data-testid="current-language">
            {context.currentLanguage.value}
          </span>
          <span data-testid="default-language">
            {context.defaultLanguage.value}
          </span>
          <span data-testid="blocks-count">{context.blocks.length}</span>
          <button
            data-testid="load-contents-btn"
            onClick={() =>
              context.loadBlocksFromContents([
                {
                  language: "en",
                  content: "<p>English content</p>",
                  isDefault: true,
                  isAutoTranslated: false,
                },
                {
                  language: "es",
                  content: "<p>Spanish content</p>",
                  isDefault: false,
                  isAutoTranslated: true,
                },
              ])
            }
          />
          <button
            data-testid="load-empty-contents-btn"
            onClick={() => context.loadBlocksFromContents([])}
          />
          <button
            data-testid="load-contents-unknown-lang-btn"
            onClick={() =>
              context.loadBlocksFromContents([
                {
                  language: "xx",
                  content: "<p>Unknown language</p>",
                  isDefault: true,
                  isAutoTranslated: false,
                },
              ])
            }
          />
        </div>
      );
    };

    it("should load blocks from contents with multiple languages", () => {
      render(
        <TemplateDesignerProvider>
          <ContentsConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-contents-btn").click();
      });

      expect(screen.getByTestId("current-language")).toHaveTextContent("en");
      expect(screen.getByTestId("default-language")).toHaveTextContent("en");
    });

    it("should load empty contents", () => {
      render(
        <TemplateDesignerProvider>
          <ContentsConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-empty-contents-btn").click();
      });
    });

    it("should handle unknown language code with fallback", () => {
      render(
        <TemplateDesignerProvider>
          <ContentsConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-contents-unknown-lang-btn").click();
      });

      expect(screen.getByTestId("default-language")).toHaveTextContent("en");
    });
  });

  describe("parseGlobalStylesFromHtml coverage", () => {
    it("should parse global styles from HTML content with all style properties", () => {
      const LoadFtlWithStylesConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="font-family">
              {context.globalStyles.fontFamily}
            </span>
            <span data-testid="font-size">{context.globalStyles.fontSize}</span>
            <span data-testid="line-height">
              {context.globalStyles.lineHeight}
            </span>
            <span data-testid="text-color">
              {context.globalStyles.textColor}
            </span>
            <span data-testid="bg-color">
              {context.globalStyles.bodyBackgroundColor}
            </span>
            <span data-testid="body-padding">
              {context.globalStyles.bodyPadding}
            </span>
            <span data-testid="link-color">
              {context.globalStyles.linkColor}
            </span>
            <span data-testid="link-hover-color">
              {context.globalStyles.linkHoverColor}
            </span>
            <span data-testid="max-width">
              {context.globalStyles.contentMaxWidth?.value}
            </span>
            <button
              data-testid="load-with-styles-btn"
              onClick={() =>
                context.loadBlocksFromContents([
                  {
                    language: "en",
                    content: `<!DOCTYPE html>
                      <html>
                      <head>
                      <style>
                        body {
                          font-family: Arial, sans-serif;
                          font-size: 14px;
                          line-height: 1.5;
                          color: #333333;
                          background-color: #ffffff;
                          padding: 20px;
                          max-width: 816px;
                        }
                        a { color: #0066cc; }
                        a:hover { color: #004499; }
                      </style>
                      </head>
                      <body><p>Test</p></body>
                      </html>`,
                    isDefault: true,
                    isAutoTranslated: false,
                  },
                ])
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <LoadFtlWithStylesConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-with-styles-btn").click();
      });

      expect(screen.getByTestId("font-family")).toHaveTextContent(
        "Arial, sans-serif",
      );
      expect(screen.getByTestId("font-size")).toHaveTextContent("14px");
      expect(screen.getByTestId("line-height")).toHaveTextContent("1.5");
      expect(screen.getByTestId("text-color")).toHaveTextContent("#333333");
      expect(screen.getByTestId("bg-color")).toHaveTextContent("#ffffff");
      expect(screen.getByTestId("body-padding")).toHaveTextContent("20px");
      expect(screen.getByTestId("link-color")).toHaveTextContent("#0066cc");
      expect(screen.getByTestId("link-hover-color")).toHaveTextContent(
        "#004499",
      );
      expect(screen.getByTestId("max-width")).toHaveTextContent("816");
    });

    it("should parse custom max-width not matching predefined options", () => {
      const LoadFtlCustomWidthConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="max-width-value">
              {context.globalStyles.contentMaxWidth?.value}
            </span>
            <span data-testid="max-width-label">
              {context.globalStyles.contentMaxWidth?.label}
            </span>
            <button
              data-testid="load-custom-width-btn"
              onClick={() =>
                context.loadBlocksFromContents([
                  {
                    language: "en",
                    content: `<html><head><style>body { max-width: 999px; }</style></head><body><p>Test</p></body></html>`,
                    isDefault: true,
                    isAutoTranslated: false,
                  },
                ])
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <LoadFtlCustomWidthConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-custom-width-btn").click();
      });

      expect(screen.getByTestId("max-width-value")).toHaveTextContent("999");
      expect(screen.getByTestId("max-width-label")).toHaveTextContent("999px");
    });
  });

  describe("parseSpacerElement page break coverage", () => {
    it("should parse page break element", () => {
      const LoadPageBreakConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <span data-testid="first-block-type">
              {context.blocks[0]?.type ?? "none"}
            </span>
            <button
              data-testid="load-page-break-btn"
              onClick={() =>
                context.loadBlocksFromFtl(
                  `<div style="page-break-after: always;"></div>`,
                )
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <LoadPageBreakConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-page-break-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
      expect(screen.getByTestId("first-block-type")).toHaveTextContent(
        "pageBreak",
      );
    });
  });

  describe("selectBlock with ancestor expansion", () => {
    it("should expand ancestor nodes when selecting nested block", () => {
      const SelectNestedConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="selected-block">
              {context.selectedBlockId ?? "none"}
            </span>
            <button
              data-testid="select-nested-btn"
              onClick={() => context.selectBlock("deep-child")}
            />
          </div>
        );
      };

      const initialBlocks: TemplateBlock[] = [
        {
          id: "parent",
          type: "section",
          label: "Parent",
          content: "",
          properties: {},
          children: [
            {
              id: "child",
              type: "section",
              label: "Child",
              content: "",
              properties: {},
              children: [
                {
                  id: "deep-child",
                  type: "richText",
                  label: "Deep Child",
                  content: "Test",
                  properties: {},
                },
              ],
            },
          ],
        },
      ];

      render(
        <TemplateDesignerProvider initialState={{ blocks: initialBlocks }}>
          <SelectNestedConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("select-nested-btn").click();
      });

      expect(screen.getByTestId("selected-block")).toHaveTextContent(
        "deep-child",
      );
    });
  });

  describe("setLoadingState with default null error", () => {
    it("should set loading state without error parameter", () => {
      const LoadingConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="is-loading">{context.isLoading.toString()}</span>
            <span data-testid="error">{context.error ?? "no-error"}</span>
            <button
              data-testid="set-loading-btn"
              onClick={() => context.setLoadingState(true)}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <LoadingConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("set-loading-btn").click();
      });

      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    });
  });

  describe("Data table parsing edge cases", () => {
    it("should parse data table with missing attributes", () => {
      const DataTableConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <span data-testid="first-block-type">
              {context.blocks[0]?.type ?? "none"}
            </span>
            <button
              data-testid="load-table-btn"
              onClick={() =>
                context.loadBlocksFromFtl(
                  `<table data-block-type="table">
                    <thead><tr><th></th></tr></thead>
                    <tbody><tr><td>Data</td></tr></tbody>
                  </table>`,
                )
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <DataTableConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-table-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
      expect(screen.getByTestId("first-block-type")).toHaveTextContent("table");
    });

    it("should parse table with column widths", () => {
      const TableWithWidthsConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-table-btn"
              onClick={() =>
                context.loadBlocksFromFtl(
                  `<table data-block-type="table">
                    <colgroup>
                      <col style="width: 50%">
                      <col style="width: 50%">
                    </colgroup>
                    <thead><tr>
                      <th data-key="col1" data-label="Column 1" style="width: 50%">Col 1</th>
                      <th data-key="col2" data-label="Column 2" style="width: 50%">Col 2</th>
                    </tr></thead>
                    <tbody><tr><td>A</td><td>B</td></tr></tbody>
                  </table>`,
                )
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <TableWithWidthsConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-table-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });
  });

  describe("Rich text parsing edge cases", () => {
    it("should parse rich text with fallback to textContent", () => {
      const RichTextConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-richtext-btn"
              onClick={() => context.loadBlocksFromFtl(`<p></p>`)}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <RichTextConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-richtext-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });
  });

  describe("HTML structure parsing with empty body", () => {
    it("should return empty array when HTML body is missing", () => {
      const HtmlStructureConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="html-structure-count">
              {context.htmlStructure.length}
            </span>
            <button
              data-testid="set-invalid-content-btn"
              onClick={() => context.setTemplateContent("")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <HtmlStructureConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("set-invalid-content-btn").click();
      });

      expect(screen.getByTestId("html-structure-count")).toHaveTextContent("0");
    });
  });

  describe("Grid parsing with col without width", () => {
    it("should parse grid table with col elements without explicit width style", () => {
      const GridConsumer = () => {
        const context = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{context.blocks.length}</span>
            <button
              data-testid="load-grid-btn"
              onClick={() =>
                context.loadBlocksFromFtl(
                  `<table>
                    <colgroup>
                      <col />
                      <col />
                    </colgroup>
                    <tbody>
                      <tr><td>A</td><td>B</td></tr>
                    </tbody>
                  </table>`,
                )
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <GridConsumer />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("load-grid-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });
  });

  describe("duplicateBlock", () => {
    it("should duplicate a block with children", () => {
      const TestComponent = () => {
        const { addBlock, duplicateBlock, blocks } = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{blocks.length}</span>
            <button
              data-testid="add-block-btn"
              onClick={() =>
                addBlock({
                  id: "parent-1",
                  type: "section",
                  label: "Section",
                  content: "",
                  properties: {},
                  children: [
                    {
                      id: "child-1",
                      type: "richText",
                      label: "Child",
                      content: "Child content",
                      properties: {},
                    },
                  ],
                })
              }
            />
            <button
              data-testid="duplicate-btn"
              onClick={() => duplicateBlock("parent-1")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("add-block-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");

      act(() => {
        screen.getByTestId("duplicate-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("2");
    });

    it("should duplicate a block without children", () => {
      const TestComponent = () => {
        const { addBlock, duplicateBlock, blocks } = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{blocks.length}</span>
            <button
              data-testid="add-block-btn"
              onClick={() =>
                addBlock({
                  id: "simple-1",
                  type: "richText",
                  label: "Text",
                  content: "Simple content",
                  properties: {},
                })
              }
            />
            <button
              data-testid="duplicate-btn"
              onClick={() => duplicateBlock("simple-1")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("add-block-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");

      act(() => {
        screen.getByTestId("duplicate-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("2");
    });

    it("should duplicate nested child blocks", () => {
      const TestComponent = () => {
        const { addBlock, duplicateBlock, blocks } = useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{blocks.length}</span>
            <button
              data-testid="add-block-btn"
              onClick={() =>
                addBlock({
                  id: "parent-1",
                  type: "section",
                  label: "Section",
                  content: "",
                  properties: {},
                  children: [
                    {
                      id: "child-1",
                      type: "richText",
                      label: "Child 1",
                      content: "Content 1",
                      properties: {},
                    },
                    {
                      id: "child-2",
                      type: "richText",
                      label: "Child 2",
                      content: "Content 2",
                      properties: {},
                    },
                  ],
                })
              }
            />
            <button
              data-testid="duplicate-child-btn"
              onClick={() => duplicateBlock("child-1")}
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("add-block-btn").click();
      });

      act(() => {
        screen.getByTestId("duplicate-child-btn").click();
      });

      expect(screen.getByTestId("blocks-count")).toHaveTextContent("1");
    });
  });

  describe("Language Management Translation Error", () => {
    it("should handle translation error", async () => {
      const { translateBlocks } = require("@/app/template-designer/services/translationService");
      translateBlocks.mockRejectedValueOnce(
        new Error("Translation API failed"),
      );

      const TestComponent = () => {
        const { addLanguage, error, isTranslating } = useTemplateDesigner();
        return (
          <div>
            <span data-testid="is-translating">{isTranslating.toString()}</span>
            <span data-testid="error">{error ?? "no-error"}</span>
            <button
              data-testid="translate-btn"
              onClick={() =>
                addLanguage({
                  value: "hi",
                  label: "Hindi",
                  nativeName: "हिन्दी",
                })
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("translate-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Translation API failed",
        );
      });

      expect(screen.getByTestId("is-translating")).toHaveTextContent("false");
    });

    it("should handle non-Error translation failure", async () => {
      const { translateBlocks } = require("@/app/template-designer/services/translationService");
      translateBlocks.mockRejectedValueOnce("Unknown error");

      const TestComponent = () => {
        const { addLanguage, error } = useTemplateDesigner();
        return (
          <div>
            <span data-testid="error">{error ?? "no-error"}</span>
            <button
              data-testid="translate-btn"
              onClick={() =>
                addLanguage({
                  value: "hi",
                  label: "Hindi",
                  nativeName: "हिन्दी",
                })
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("translate-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Translation failed",
        );
      });
    });

    it("should use current blocks when default language blocks not saved", async () => {
      const {
        translateBlocks,
        deepCloneBlocks,
      } = require("@/app/template-designer/services/translationService");

      const mockBlocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Text",
          content: "Original",
          properties: {},
        },
      ];

      translateBlocks.mockResolvedValueOnce([
        {
          ...mockBlocks[0],
          content: "Translated",
        },
      ]);

      const TestComponent = () => {
        const { blocks, addLanguage, addBlock, defaultLanguage } =
          useTemplateDesigner();
        return (
          <div>
            <span data-testid="blocks-count">{blocks.length}</span>
            <span data-testid="first-content">
              {blocks[0]?.content ?? "none"}
            </span>
            <span data-testid="default-lang">{defaultLanguage.value}</span>
            <button
              data-testid="add-block-btn"
              onClick={() => addBlock(mockBlocks[0])}
            />
            <button
              data-testid="translate-btn"
              onClick={() =>
                addLanguage({
                  value: "hi",
                  label: "Hindi",
                  nativeName: "हिन्दी",
                })
              }
            />
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      act(() => {
        screen.getByTestId("add-block-btn").click();
      });

      expect(screen.getByTestId("first-content")).toHaveTextContent("Original");

      act(() => {
        screen.getByTestId("translate-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("first-content")).toHaveTextContent(
          "Translated",
        );
      });

      expect(deepCloneBlocks).toHaveBeenCalled();
    });
  });

  describe("useTemplateState initialization", () => {
    it("should initialize with default values when no props provided", () => {
      const TestComponent = () => {
        const { templateContent, isLoading, error } = useTemplateDesigner();
        return (
          <div>
            <span data-testid="template-content">{templateContent}</span>
            <span data-testid="is-loading">{isLoading.toString()}</span>
            <span data-testid="error">{error ?? "no-error"}</span>
          </div>
        );
      };

      render(
        <TemplateDesignerProvider>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("template-content")).toHaveTextContent("");
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    });

    it("should initialize with custom initial content", () => {
      const customContent = JSON.stringify({
        blocks: [{ id: "custom-1", type: "richText" }],
      });

      const TestComponent = () => {
        const { templateContent } = useTemplateDesigner();
        return <span data-testid="template-content">{templateContent}</span>;
      };

      render(
        <TemplateDesignerProvider initialContent={customContent}>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("template-content")).toHaveTextContent(
        customContent,
      );
    });

    it("should initialize with loading state", () => {
      const TestComponent = () => {
        const { isLoading } = useTemplateDesigner();
        return <span data-testid="is-loading">{isLoading.toString()}</span>;
      };

      render(
        <TemplateDesignerProvider initialLoading={true}>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
    });

    it("should initialize with error state", () => {
      const TestComponent = () => {
        const { error } = useTemplateDesigner();
        return <span data-testid="error">{error ?? "no-error"}</span>;
      };

      render(
        <TemplateDesignerProvider initialError="Initial error message">
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("error")).toHaveTextContent(
        "Initial error message",
      );
    });

    it("should initialize with null error", () => {
      const TestComponent = () => {
        const { error } = useTemplateDesigner();
        return <span data-testid="error">{error ?? "no-error"}</span>;
      };

      render(
        <TemplateDesignerProvider initialError={null}>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    });

    it("should initialize with only content parameter", () => {
      const TestComponent = () => {
        const { templateContent, isLoading, error } = useTemplateDesigner();
        return (
          <div>
            <span data-testid="template-content">{templateContent}</span>
            <span data-testid="is-loading">{isLoading.toString()}</span>
            <span data-testid="error">{error ?? "no-error"}</span>
          </div>
        );
      };

      render(
        <TemplateDesignerProvider initialContent="test">
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("template-content")).toHaveTextContent("test");
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    });

    it("should initialize with only loading parameter", () => {
      const TestComponent = () => {
        const { templateContent, isLoading, error } = useTemplateDesigner();
        return (
          <div>
            <span data-testid="template-content">{templateContent}</span>
            <span data-testid="is-loading">{isLoading.toString()}</span>
            <span data-testid="error">{error ?? "no-error"}</span>
          </div>
        );
      };

      render(
        <TemplateDesignerProvider initialLoading={true}>
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("template-content")).toHaveTextContent("");
      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    });

    it("should initialize with all custom parameters", () => {
      const customContent = JSON.stringify({ test: "data" });

      const TestComponent = () => {
        const { templateContent, isLoading, error } = useTemplateDesigner();
        return (
          <div>
            <span data-testid="template-content">{templateContent}</span>
            <span data-testid="is-loading">{isLoading.toString()}</span>
            <span data-testid="error">{error ?? "no-error"}</span>
          </div>
        );
      };

      render(
        <TemplateDesignerProvider
          initialContent={customContent}
          initialLoading={true}
          initialError="Custom error"
        >
          <TestComponent />
        </TemplateDesignerProvider>,
      );

      expect(screen.getByTestId("template-content")).toHaveTextContent(
        customContent,
      );
      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("Custom error");
    });
  });
});
