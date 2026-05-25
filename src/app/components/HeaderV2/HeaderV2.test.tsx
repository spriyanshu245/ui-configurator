import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import HeaderV2 from "./HeaderV2";
import { HeaderProviderV2, useHeaderV2 } from "@/app/context/HeaderContextV2";
import React, { useEffect } from "react";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("./UserNotificationV2", () => {
  const MockUserNotificationV2 = () => (
    <div data-testid="user-notification-v2" />
  );
  MockUserNotificationV2.displayName = "MockUserNotificationV2";
  return MockUserNotificationV2;
});

const TestHarness = ({
  pageTitle,
  resourceCode,
  backRoute,
  showCloseIcon,
}: {
  pageTitle: string;
  resourceCode: string;
  backRoute: string;
  showCloseIcon: boolean;
}) => {
  const { setPageTitle, setResourceCode, setBackRoute, setShowCloseIcon } =
    useHeaderV2();
  useEffect(() => {
    setPageTitle(pageTitle);
    setResourceCode(resourceCode);
    setBackRoute(backRoute);
    setShowCloseIcon(showCloseIcon);
  }, [
    pageTitle,
    resourceCode,
    backRoute,
    showCloseIcon,
    setPageTitle,
    setResourceCode,
    setBackRoute,
    setShowCloseIcon,
  ]);
  return <HeaderV2 />;
};

describe("HeaderV2", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  test("renders title, name and close button when showCloseIcon is true", () => {
    render(
      <HeaderProviderV2>
        <TestHarness
          pageTitle="Access Configurations"
          resourceCode="config-001"
          backRoute="/access-controls"
          showCloseIcon={true}
        />
      </HeaderProviderV2>
    );
    expect(screen.getByText("Access Configurations")).toBeInTheDocument();
    expect(screen.getByText("config-001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  test("does not render close button when showCloseIcon is false", () => {
    render(
      <HeaderProviderV2>
        <TestHarness
          pageTitle="Home"
          resourceCode="Home"
          backRoute="/"
          showCloseIcon={false}
        />
      </HeaderProviderV2>
    );
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  test("clicking logo navigates to home", () => {
    render(
      <HeaderProviderV2>
        <TestHarness
          pageTitle="Test"
          resourceCode="Test"
          backRoute="/back"
          showCloseIcon={true}
        />
      </HeaderProviderV2>
    );
    const logo = screen.getByRole("button", { name: "Home" });
    fireEvent.click(logo);
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  test("clicking close navigates to provided backRoute", () => {
    render(
      <HeaderProviderV2>
        <TestHarness
          pageTitle="Test"
          resourceCode="Test"
          backRoute="/access-controls"
          showCloseIcon={true}
        />
      </HeaderProviderV2>
    );
    const close = screen.getByRole("button", { name: "Close" });
    fireEvent.click(close);
    expect(pushMock).toHaveBeenCalledWith("/access-controls");
  });

  test("renders user notification component", () => {
    render(
      <HeaderProviderV2>
        <TestHarness
          pageTitle="Test"
          resourceCode="Test"
          backRoute="/"
          showCloseIcon={false}
        />
      </HeaderProviderV2>
    );
    expect(screen.getByTestId("user-notification-v2")).toBeInTheDocument();
  });
});
