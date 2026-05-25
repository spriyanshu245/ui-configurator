import { render, screen } from "@testing-library/react";
import React from "react";
import Workspaces from "./page";

jest.mock("@/app/components/HeaderV2/UserNotificationV2", () => ({
  __esModule: true,
  default: () => <div data-testid="user-notification">UserNotification</div>,
}));

jest.mock("@/app/workspaces/components/ConfigStudioHub", () => ({
  __esModule: true,
  default: () => <div data-testid="config-studio-hub">ConfigStudioHub</div>,
}));

describe("Workspaces page", () => {
  it("renders the ConfigStudioHub component", () => {
    render(<Workspaces />);
    expect(screen.getByTestId("config-studio-hub")).toBeInTheDocument();
  });

  it("renders UserNotificationV2", () => {
    render(<Workspaces />);
    expect(screen.getByTestId("user-notification")).toBeInTheDocument();
  });
});
