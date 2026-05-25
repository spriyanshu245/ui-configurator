import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

// Mock the components used in LoginPage
jest.mock("@/app/components/WelcomePanel/WelcomeBackPanel", () => {
  return function MockWelcomeBackPanel() {
    return <div data-testid="welcome-panel">Welcome Panel</div>;
  };
});

jest.mock("@/app/components/LoginForm/LoginForm", () => {
  return function MockLoginForm() {
    return <div data-testid="login-form">Login Form</div>;
  };
});


describe("LoginPage", () => {
  test("renders login form by default", () => {
    render(<LoginPage />);
    expect(screen.getByTestId("welcome-panel")).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });
});
