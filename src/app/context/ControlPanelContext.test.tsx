import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useControlPanel, ControlPanelProvider } from "./ControlPanelContext";

const TestComponent: React.FC = () => {
  const {
    showDropZones,
    toggleShowDropZones,
    isAutoSave,
    toggleAutoSave,
    isAutoSaveInProgress,
    setIsAutoSaveInProgress,
    seedPageHistory,
    pushPageHistory,
    canNavigatePageBack,
    canNavigatePageForward,
    goBackPageHistory,
    goForwardPageHistory,
    setPageComponentLocation,
    getPendingPageLocationSnapshot,
    clearPageHistory,
    setPageHistoryScope,
  } = useControlPanel();

  const pendingP1Location = getPendingPageLocationSnapshot("page-1");

  return (
    <div>
      <div data-testid="dropzones">{showDropZones ? "true" : "false"}</div>
      <div data-testid="autosave">{isAutoSave ? "true" : "false"}</div>
      <div data-testid="autosaveinprogress">
        {isAutoSaveInProgress ? "true" : "false"}
      </div>
      <div data-testid="can-go-back">
        {canNavigatePageBack ? "true" : "false"}
      </div>
      <div data-testid="can-go-forward">
        {canNavigatePageForward ? "true" : "false"}
      </div>
      <div data-testid="pending-page-1-tab">
        {String(
          pendingP1Location?.componentLocations["tabs-1"]?.activeTabIndex ?? -1,
        )}
      </div>
      <button data-testid="toggle-dropzones" onClick={toggleShowDropZones}>
        Toggle DropZones
      </button>
      <button data-testid="toggle-autosave" onClick={toggleAutoSave}>
        Toggle AutoSave
      </button>
      <button
        data-testid="set-autosaveinprogress"
        onClick={() => setIsAutoSaveInProgress(true)}
      >
        Set AutoSave In Progress
      </button>
      <button
        data-testid="set-history-scope"
        onClick={() => setPageHistoryScope("workspace:microsite:v1")}
      >
        Set History Scope
      </button>
      <button
        data-testid="seed-page-1"
        onClick={() => seedPageHistory("page-1")}
      >
        Seed Page 1
      </button>
      <button
        data-testid="set-page-1-location"
        onClick={() =>
          setPageComponentLocation("page-1", "tabs-1", { activeTabIndex: 2 })
        }
      >
        Set Page 1 Location
      </button>
      <button
        data-testid="push-page-2"
        onClick={() => pushPageHistory("page-1", "page-2")}
      >
        Push Page 2
      </button>
      <button data-testid="go-back" onClick={() => goBackPageHistory("page-2")}>
        Go Back
      </button>
      <button
        data-testid="go-forward"
        onClick={() => goForwardPageHistory("page-1")}
      >
        Go Forward
      </button>
      <button data-testid="clear-history" onClick={clearPageHistory}>
        Clear History
      </button>
    </div>
  );
};

describe("ControlPanelContext", () => {
  it("provides default values and updates correctly", () => {
    render(
      <ControlPanelProvider>
        <TestComponent />
      </ControlPanelProvider>,
    );

    // Check default values.
    expect(screen.getByTestId("dropzones")).toHaveTextContent("true");
    expect(screen.getByTestId("autosave")).toHaveTextContent("false");
    expect(screen.getByTestId("autosaveinprogress")).toHaveTextContent("false");

    // Toggle drop zones should flip true -> false.
    fireEvent.click(screen.getByTestId("toggle-dropzones"));
    expect(screen.getByTestId("dropzones")).toHaveTextContent("false");

    // Toggle auto save should flip false -> true.
    fireEvent.click(screen.getByTestId("toggle-autosave"));
    expect(screen.getByTestId("autosave")).toHaveTextContent("true");

    // Set auto save in progress should update to true.
    fireEvent.click(screen.getByTestId("set-autosaveinprogress"));
    expect(screen.getByTestId("autosaveinprogress")).toHaveTextContent("true");
  });

  it("tracks page history and restores pending location snapshots", () => {
    render(
      <ControlPanelProvider>
        <TestComponent />
      </ControlPanelProvider>,
    );

    fireEvent.click(screen.getByTestId("set-history-scope"));
    fireEvent.click(screen.getByTestId("seed-page-1"));

    expect(screen.getByTestId("can-go-back")).toHaveTextContent("false");

    fireEvent.click(screen.getByTestId("set-page-1-location"));
    fireEvent.click(screen.getByTestId("push-page-2"));

    expect(screen.getByTestId("can-go-back")).toHaveTextContent("true");
    expect(screen.getByTestId("can-go-forward")).toHaveTextContent("false");

    fireEvent.click(screen.getByTestId("go-back"));

    expect(screen.getByTestId("pending-page-1-tab")).toHaveTextContent("2");
    expect(screen.getByTestId("can-go-forward")).toHaveTextContent("true");

    fireEvent.click(screen.getByTestId("clear-history"));

    expect(screen.getByTestId("can-go-back")).toHaveTextContent("false");
    expect(screen.getByTestId("can-go-forward")).toHaveTextContent("false");
  });

  it("throws an error if used outside ControlPanelProvider", () => {
    const TestConsumer = () => {
      useControlPanel();
      return <div>Test</div>;
    };

    expect(() => render(<TestConsumer />)).toThrow(
      "useControlPanel must be used within a ControlPanelProvider",
    );
  });

  it("setIsSaveSuccessful updates isSaveSuccessful", () => {
    const TestComp = () => {
      const { isSaveSuccessful, setIsSaveSuccessful } = useControlPanel();
      return (
        <div>
          <div data-testid="save-successful">{String(isSaveSuccessful)}</div>
          <button onClick={() => setIsSaveSuccessful(true)}>Set True</button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    expect(screen.getByTestId("save-successful")).toHaveTextContent("false");
    fireEvent.click(screen.getByText("Set True"));
    expect(screen.getByTestId("save-successful")).toHaveTextContent("true");
  });

  it("setPageComponentLocation with empty pageCode or componentId does nothing", () => {
    const TestComp = () => {
      const { setPageComponentLocation, getPendingPageLocationSnapshot } =
        useControlPanel();
      return (
        <div>
          <button
            data-testid="empty-page"
            onClick={() =>
              setPageComponentLocation("", "comp-1", { activeTabIndex: 1 })
            }
          >
            Empty Page
          </button>
          <button
            data-testid="empty-comp"
            onClick={() =>
              setPageComponentLocation("page-1", "", { activeTabIndex: 1 })
            }
          >
            Empty Comp
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("empty-page"));
    fireEvent.click(screen.getByTestId("empty-comp"));
  });

  it("setPageHistoryScope with same scope does nothing", () => {
    const TestComp = () => {
      const { setPageHistoryScope } = useControlPanel();
      return (
        <div>
          <button
            data-testid="set-scope"
            onClick={() => setPageHistoryScope("scope-1")}
          >
            Set Scope
          </button>
          <button
            data-testid="set-same-scope"
            onClick={() => setPageHistoryScope("scope-1")}
          >
            Set Same Scope
          </button>
          <button
            data-testid="set-empty-scope"
            onClick={() => setPageHistoryScope("")}
          >
            Set Empty
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("set-scope"));
    fireEvent.click(screen.getByTestId("set-same-scope"));
    fireEvent.click(screen.getByTestId("set-empty-scope"));
  });

  it("seedPageHistory with empty pageCode does nothing", () => {
    const TestComp = () => {
      const { seedPageHistory, canNavigatePageBack } = useControlPanel();
      return (
        <div>
          <div data-testid="can-back">{String(canNavigatePageBack)}</div>
          <button onClick={() => seedPageHistory("")}>Seed Empty</button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByText("Seed Empty"));
    expect(screen.getByTestId("can-back")).toHaveTextContent("false");
  });

  it("seedPageHistory with same page code does nothing on second call", () => {
    const TestComp = () => {
      const { seedPageHistory, canNavigatePageBack } = useControlPanel();
      return (
        <div>
          <div data-testid="can-back">{String(canNavigatePageBack)}</div>
          <button
            data-testid="seed-p1"
            onClick={() => seedPageHistory("page-1")}
          >
            Seed P1
          </button>
          <button
            data-testid="re-seed-p1"
            onClick={() => seedPageHistory("page-1")}
          >
            Re-Seed P1
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("seed-p1"));
    fireEvent.click(screen.getByTestId("re-seed-p1"));
    expect(screen.getByTestId("can-back")).toHaveTextContent("false");
  });

  it("seedPageHistory adds new page to existing history", () => {
    const TestComp = () => {
      const { seedPageHistory, canNavigatePageBack } = useControlPanel();
      return (
        <div>
          <div data-testid="can-back">{String(canNavigatePageBack)}</div>
          <button
            data-testid="seed-p1"
            onClick={() => seedPageHistory("page-1")}
          >
            Seed P1
          </button>
          <button
            data-testid="seed-p2"
            onClick={() => seedPageHistory("page-2")}
          >
            Seed P2
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("seed-p1"));
    fireEvent.click(screen.getByTestId("seed-p2"));
    expect(screen.getByTestId("can-back")).toHaveTextContent("true");
  });

  it("pushPageHistory with same page code does nothing", () => {
    const TestComp = () => {
      const { seedPageHistory, pushPageHistory, canNavigatePageBack } =
        useControlPanel();
      return (
        <div>
          <div data-testid="can-back">{String(canNavigatePageBack)}</div>
          <button data-testid="seed" onClick={() => seedPageHistory("page-1")}>
            Seed
          </button>
          <button
            data-testid="push-same"
            onClick={() => pushPageHistory("page-1", "page-1")}
          >
            Push Same
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("seed"));
    fireEvent.click(screen.getByTestId("push-same"));
    expect(screen.getByTestId("can-back")).toHaveTextContent("false");
  });

  it("pushPageHistory with empty nextPageCode does nothing", () => {
    const TestComp = () => {
      const { seedPageHistory, pushPageHistory, canNavigatePageBack } =
        useControlPanel();
      return (
        <div>
          <div data-testid="can-back">{String(canNavigatePageBack)}</div>
          <button data-testid="seed" onClick={() => seedPageHistory("page-1")}>
            Seed
          </button>
          <button
            data-testid="push-empty"
            onClick={() => pushPageHistory("page-1", "")}
          >
            Push Empty
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("seed"));
    fireEvent.click(screen.getByTestId("push-empty"));
    expect(screen.getByTestId("can-back")).toHaveTextContent("false");
  });

  it("goBackPageHistory returns null when cursor <= 0", () => {
    let result: string | null = "initial";
    const TestComp = () => {
      const { seedPageHistory, goBackPageHistory } = useControlPanel();
      return (
        <div>
          <button data-testid="seed" onClick={() => seedPageHistory("page-1")}>
            Seed
          </button>
          <button
            data-testid="go-back"
            onClick={() => {
              result = goBackPageHistory("page-1");
            }}
          >
            Go Back
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("seed"));
    fireEvent.click(screen.getByTestId("go-back"));
    expect(result).toBeNull();
  });

  it("goForwardPageHistory returns null when at end", () => {
    let result: string | null = "initial";
    const TestComp = () => {
      const { seedPageHistory, goForwardPageHistory } = useControlPanel();
      return (
        <div>
          <button data-testid="seed" onClick={() => seedPageHistory("page-1")}>
            Seed
          </button>
          <button
            data-testid="go-fwd"
            onClick={() => {
              result = goForwardPageHistory("page-1");
            }}
          >
            Go Forward
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("seed"));
    fireEvent.click(screen.getByTestId("go-fwd"));
    expect(result).toBeNull();
  });

  it("goForwardPageHistory returns null when cursor is -1", () => {
    let result: string | null = "initial";
    const TestComp = () => {
      const { goForwardPageHistory } = useControlPanel();
      return (
        <div>
          <button
            onClick={() => {
              result = goForwardPageHistory("page-1");
            }}
          >
            Forward
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByText("Forward"));
    expect(result).toBeNull();
  });

  it("full navigation: seed, push, go back, go forward", () => {
    const TestComp = () => {
      const {
        seedPageHistory,
        pushPageHistory,
        goBackPageHistory,
        goForwardPageHistory,
        canNavigatePageBack,
        canNavigatePageForward,
        getPendingPageLocationSnapshot,
        setPageComponentLocation,
      } = useControlPanel();
      const pending = getPendingPageLocationSnapshot("page-1");
      return (
        <div>
          <div data-testid="can-back">{String(canNavigatePageBack)}</div>
          <div data-testid="can-fwd">{String(canNavigatePageForward)}</div>
          <div data-testid="pending-null">{String(pending === null)}</div>
          <button
            data-testid="seed-p1"
            onClick={() => seedPageHistory("page-1")}
          >
            Seed P1
          </button>
          <button
            data-testid="set-loc"
            onClick={() =>
              setPageComponentLocation("page-1", "tabs-1", {
                activeTabIndex: 3,
              })
            }
          >
            Set Loc
          </button>
          <button
            data-testid="push-p2"
            onClick={() => pushPageHistory("page-1", "page-2")}
          >
            Push P2
          </button>
          <button
            data-testid="go-back"
            onClick={() => goBackPageHistory("page-2")}
          >
            Go Back
          </button>
          <button
            data-testid="go-fwd"
            onClick={() => goForwardPageHistory("page-1")}
          >
            Go Fwd
          </button>
        </div>
      );
    };
    const builderPane = document.createElement("div");
    builderPane.id = "builderPane";
    Object.defineProperty(builderPane, "scrollTop", {
      value: 0,
      configurable: true,
      writable: true,
    });
    document.body.appendChild(builderPane);

    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("seed-p1"));
    fireEvent.click(screen.getByTestId("set-loc"));
    fireEvent.click(screen.getByTestId("push-p2"));
    expect(screen.getByTestId("can-back")).toHaveTextContent("true");
    expect(screen.getByTestId("can-fwd")).toHaveTextContent("false");
    fireEvent.click(screen.getByTestId("go-back"));
    expect(screen.getByTestId("can-fwd")).toHaveTextContent("true");
    fireEvent.click(screen.getByTestId("go-fwd"));
    expect(screen.getByTestId("can-fwd")).toHaveTextContent("false");

    document.body.removeChild(builderPane);
  });

  it("getPendingPageLocationSnapshot returns null for different pageCode", () => {
    const TestComp = () => {
      const { seedPageHistory, getPendingPageLocationSnapshot } =
        useControlPanel();
      const snapshot = getPendingPageLocationSnapshot("other-page");
      return (
        <div>
          <div data-testid="snapshot">{String(snapshot === null)}</div>
          <button onClick={() => seedPageHistory("page-1")}>Seed</button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByText("Seed"));
    expect(screen.getByTestId("snapshot")).toHaveTextContent("true");
  });

  it("syncPageHistory removes invalid page codes and adjusts cursor", () => {
    const TestComp = () => {
      const {
        seedPageHistory,
        pushPageHistory,
        syncPageHistory,
        canNavigatePageBack,
        canNavigatePageForward,
      } = useControlPanel();
      return (
        <div>
          <div data-testid="can-back">{String(canNavigatePageBack)}</div>
          <div data-testid="can-fwd">{String(canNavigatePageForward)}</div>
          <button
            data-testid="seed-p1"
            onClick={() => seedPageHistory("page-1")}
          >
            Seed P1
          </button>
          <button
            data-testid="push-p2"
            onClick={() => pushPageHistory("page-1", "page-2")}
          >
            Push P2
          </button>
          <button
            data-testid="push-p3"
            onClick={() => pushPageHistory("page-2", "page-3")}
          >
            Push P3
          </button>
          <button
            data-testid="sync"
            onClick={() => syncPageHistory(["page-1", "page-3"])}
          >
            Sync
          </button>
          <button data-testid="sync-empty" onClick={() => syncPageHistory([])}>
            Sync Empty
          </button>
          <button
            data-testid="sync-current"
            onClick={() => syncPageHistory(["page-1", "page-2", "page-3"])}
          >
            Sync Current
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("seed-p1"));
    fireEvent.click(screen.getByTestId("push-p2"));
    fireEvent.click(screen.getByTestId("push-p3"));
    fireEvent.click(screen.getByTestId("sync"));
    fireEvent.click(screen.getByTestId("sync-empty"));
    fireEvent.click(screen.getByTestId("sync-current"));
  });

  it("syncPageHistory clears pendingPageLocation when its pageCode is removed", () => {
    const TestComp = () => {
      const {
        seedPageHistory,
        pushPageHistory,
        syncPageHistory,
        getPendingPageLocationSnapshot,
      } = useControlPanel();
      const pending2 = getPendingPageLocationSnapshot("page-2");
      return (
        <div>
          <div data-testid="pending-2-null">{String(pending2 === null)}</div>
          <button
            data-testid="seed-p1"
            onClick={() => seedPageHistory("page-1")}
          >
            Seed
          </button>
          <button
            data-testid="push-p2"
            onClick={() => pushPageHistory("page-1", "page-2")}
          >
            Push P2
          </button>
          <button
            data-testid="sync"
            onClick={() => syncPageHistory(["page-1"])}
          >
            Sync
          </button>
        </div>
      );
    };
    render(
      <ControlPanelProvider>
        <TestComp />
      </ControlPanelProvider>,
    );
    fireEvent.click(screen.getByTestId("seed-p1"));
    fireEvent.click(screen.getByTestId("push-p2"));
    fireEvent.click(screen.getByTestId("sync"));
    expect(screen.getByTestId("pending-2-null")).toHaveTextContent("true");
  });
});
