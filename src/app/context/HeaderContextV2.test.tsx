import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useHeaderV2, HeaderProviderV2 } from "./HeaderContextV2";

const TestComponent = () => {
  useHeaderV2();
  return <div>Test</div>;
};

describe("HeaderContextV2", () => {
  it("throws error if useHeaderV2 is used outside of HeaderProviderV2", () => {
    const originalError = console.error;
    console.error = jest.fn();
    let caught: unknown = undefined;
    try {
      render(<TestComponent />);
    } catch (e) {
      caught = e;
    }
    console.error = originalError;
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe(
      "useHeaderV2 must be used within a HeaderProviderV2",
    );
  });

  it("provides default values and allows updating all fields", () => {
    const Consumer = () => {
      const {
        userNotification,
        setUserNotification,
        pageTitle,
        setPageTitle,
        pageSubTitle,
        setPageSubTitle,
        resourceCode,
        setResourceCode,
        resourceMetadata,
        setResourceMetadata,
        resourceStatus,
        setResourceStatus,
        resourceVersion,
        setResourceVersion,
        backRoute,
        setBackRoute,
        showCloseIcon,
        setShowCloseIcon,
        resetResourceData,
      } = useHeaderV2();
      return (
        <div>
          <div data-testid="notification">
            {userNotification?.text ?? "none"}
          </div>
          <div data-testid="title">{pageTitle}</div>
          <div data-testid="subtitle">{pageSubTitle}</div>
          <div data-testid="code">{resourceCode}</div>
          <div data-testid="metadata">{resourceMetadata}</div>
          <div data-testid="status">{resourceStatus}</div>
          <div data-testid="version">{resourceVersion}</div>
          <div data-testid="backroute">{backRoute}</div>
          <div data-testid="closeicon">{String(showCloseIcon)}</div>
          <button
            onClick={() =>
              setUserNotification({
                type: "success",
                text: "saved",
                time: 1000,
              })
            }
          >
            Set Notification
          </button>
          <button onClick={() => setPageTitle("My Page")}>Set Title</button>
          <button onClick={() => setPageSubTitle("Sub Title")}>
            Set Subtitle
          </button>
          <button onClick={() => setResourceCode("CODE-1")}>Set Code</button>
          <button onClick={() => setResourceMetadata("meta")}>
            Set Metadata
          </button>
          <button onClick={() => setResourceStatus("active")}>
            Set Status
          </button>
          <button onClick={() => setResourceVersion("v2")}>Set Version</button>
          <button onClick={() => setBackRoute("/home")}>Set BackRoute</button>
          <button onClick={() => setShowCloseIcon(true)}>Show Close</button>
          <button onClick={resetResourceData}>Reset Resource</button>
        </div>
      );
    };
    render(
      <HeaderProviderV2>
        <Consumer />
      </HeaderProviderV2>,
    );
    expect(screen.getByTestId("title")).toHaveTextContent("");
    expect(screen.getByTestId("backroute")).toHaveTextContent("/");
    expect(screen.getByTestId("closeicon")).toHaveTextContent("false");

    fireEvent.click(screen.getByText("Set Notification"));
    expect(screen.getByTestId("notification")).toHaveTextContent("saved");

    fireEvent.click(screen.getByText("Set Title"));
    expect(screen.getByTestId("title")).toHaveTextContent("My Page");

    fireEvent.click(screen.getByText("Set Subtitle"));
    expect(screen.getByTestId("subtitle")).toHaveTextContent("Sub Title");

    fireEvent.click(screen.getByText("Set Code"));
    expect(screen.getByTestId("code")).toHaveTextContent("CODE-1");

    fireEvent.click(screen.getByText("Set Metadata"));
    expect(screen.getByTestId("metadata")).toHaveTextContent("meta");

    fireEvent.click(screen.getByText("Set Status"));
    expect(screen.getByTestId("status")).toHaveTextContent("active");

    fireEvent.click(screen.getByText("Set Version"));
    expect(screen.getByTestId("version")).toHaveTextContent("v2");

    fireEvent.click(screen.getByText("Set BackRoute"));
    expect(screen.getByTestId("backroute")).toHaveTextContent("/home");

    fireEvent.click(screen.getByText("Show Close"));
    expect(screen.getByTestId("closeicon")).toHaveTextContent("true");

    fireEvent.click(screen.getByText("Reset Resource"));
    expect(screen.getByTestId("code")).toHaveTextContent("");
    expect(screen.getByTestId("metadata")).toHaveTextContent("");
    expect(screen.getByTestId("status")).toHaveTextContent("");
    expect(screen.getByTestId("version")).toHaveTextContent("");
  });
});
