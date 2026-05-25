import React from "react";
import { render, screen } from "@testing-library/react";
import WelcomeBackPanel from "./WelcomeBackPanel";

// Mock the SVG components
jest.mock("@/app/components/SVGIcons/Background", () => {
  return function MockBackground({
    className,
    type,
  }: {
    className: string;
    type: string;
  }) {
    return (
      <div data-testid="background" className={className} data-type={type} />
    );
  };
});

jest.mock("@/app/components/SVGIcons/RahiLogo", () => {
  return function MockRahiLogo({ className }: { className: string }) {
    return <div data-testid="rahi-logo" className={className} />;
  };
});

describe("WelcomeBackPanel", () => {
  it("renders welcome message", () => {
    render(<WelcomeBackPanel />);
    expect(screen.getByText("Welcome back!")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<WelcomeBackPanel />);
    expect(
      screen.getByText(
        "Simplify your workflow and streamline loan processing with just a few clicks!"
      )
    ).toBeInTheDocument();
  });

  it("renders copyright with current year", () => {
    const currentYear = new Date().getFullYear();
    render(<WelcomeBackPanel />);
    expect(
      screen.getByText(
        `© ${currentYear} Rahi Platform Technologies. All Rights Reserved.`
      )
    ).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    const { container } = render(<WelcomeBackPanel className="customClass" />);
    const panelElement = container.firstChild as HTMLElement;
    expect(panelElement.classList.contains("customClass")).toBe(true);
  });

  it("renders background with correct props", () => {
    render(<WelcomeBackPanel />);
    const background = screen.getByTestId("background");
    expect(background).toBeInTheDocument();
    expect(background.getAttribute("data-type")).toBe("welcomeBackPanel");
  });

  it("renders Rahi logo", () => {
    render(<WelcomeBackPanel />);
    expect(screen.getByTestId("rahi-logo")).toBeInTheDocument();
  });
});
