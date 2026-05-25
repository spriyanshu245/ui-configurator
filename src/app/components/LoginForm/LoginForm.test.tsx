
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import LoginForm from "./LoginForm";
import { useRouter } from "next/navigation";
import ToastNotificationService from "../../services/ToastNotificationService";
import { apiRequest } from "../../services/APIService";
import { useConfig } from "../../context/ConfigContext";
import { useMicrosite } from "../../context/MicrositeContext";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../services/ToastNotificationService", () => ({
  show: jest.fn(),
}));

jest.mock("../../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("../../context/ConfigContext", () => ({
  useConfig: jest.fn(),
}));

jest.mock("../../context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("../../../platforms/session/SessionManagerService", () => ({
  onLogin: jest.fn()
}))

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedToast = ToastNotificationService.show as jest.Mock;
const mockPush = jest.fn();
const mockGetMenuAccessControl = jest.fn();

const mockConfig = { NEXT_PUBLIC_BASE_URL: "https://mockapi.com" };

describe("LoginForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useConfig as jest.Mock).mockReturnValue({ config: mockConfig });
    (useMicrosite as jest.Mock).mockReturnValue({
      getMenuAccessControl: mockGetMenuAccessControl,
    });
    sessionStorage.clear();
  });

  it("renders form inputs and button", () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit")).toBeInTheDocument();
  });

  it("updates username and password fields on user input", () => {
    render(<LoginForm />);
    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");

    fireEvent.change(usernameInput, { target: { value: "myuser" } });
    fireEvent.change(passwordInput, { target: { value: "mypassword" } });

    expect(usernameInput).toHaveValue("myuser");
    expect(passwordInput).toHaveValue("mypassword");
  });

  it("disables submit button if username is empty", () => {
    render(<LoginForm />);
    const usernameInput = screen.getByPlaceholderText("Username");
    const submitButton = screen.getByTestId("login-submit");

    fireEvent.change(usernameInput, { target: { value: "" } });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button if username is not empty and no actionRequired", () => {
    render(<LoginForm />);
    const usernameInput = screen.getByPlaceholderText("Username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    const submitButton = screen.getByTestId("login-submit");
    expect(submitButton).not.toBeDisabled();
  });

  it("handles login with no actionRequired successfully", async () => {
    const loginResponse = {
      ACTION_REQUIRED: "",
      username: "user1",
      access_token: "token1",
      loginId: "L-123",
      message: "Success",
    };
    const userInfoResponse = {
      userId: "U-123",
      firstName: "Test",
      loginId: "L-123",
    };

    mockedApiRequest
      .mockResolvedValueOnce(loginResponse)
      .mockResolvedValueOnce(userInfoResponse);

    render(<LoginForm />);

    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(usernameInput, { target: { value: "user1" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByTestId("login-submit");

    act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(sessionStorage.getItem("global.login.userDetails")).toBe(
        JSON.stringify({ userName: "user1", userId: "U-123" })
      );
      expect(mockPush).toHaveBeenCalledWith("/workspaces");
      expect(mockedToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      );
    });
  });

  it("handles login failed as userInfo doesnt have userId", async () => {
    const loginResponse = {
      ACTION_REQUIRED: "",
      username: "user1",
      access_token: "token1",
      loginId: "L-123",
      message: "Success",
    };
    const userInfoResponse = {
      userId: "",
      firstName: "Test",
      loginId: "L-123",
    };

    mockedApiRequest
      .mockResolvedValueOnce(loginResponse)
      .mockResolvedValueOnce(userInfoResponse);

    render(<LoginForm />);

    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(usernameInput, { target: { value: "user1" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByTestId("login-submit");

    act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockedToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
    });
  });

  it("handles login failed as loginResponse doesn't have username", async () => {
    const loginResponse = {
      ACTION_REQUIRED: "",
      username: "",
      access_token: "token1",
      loginId: "L-123",
      message: "Success",
    };

    mockedApiRequest.mockResolvedValueOnce(loginResponse);

    render(<LoginForm />);

    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(usernameInput, { target: { value: "user1" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByTestId("login-submit");

    act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockedToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
    });
  });

  it("shows OTP input and disables submit button without OTP on OTP_REQUIRED", async () => {
    const loginResponse = { ACTION_REQUIRED: "OTP_REQUIRED" };

    mockedApiRequest.mockResolvedValueOnce(loginResponse);

    render(<LoginForm />);

    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(usernameInput, { target: { value: "user1" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByTestId("login-submit");
    act(() => {
      fireEvent.click(submitButton);
    });

    const otpInput = await screen.findByPlaceholderText("Enter OTP");
    expect(otpInput).toBeInTheDocument();

    expect(submitButton).toBeDisabled();

    fireEvent.change(otpInput, { target: { value: "123456" } });
    expect(submitButton).not.toBeDisabled();
  });

  it("shows TOTP input and disables submit button without TOTP on TOTP_REQUIRED", async () => {
    const loginResponse = { ACTION_REQUIRED: "TOTP_REQUIRED" };

    mockedApiRequest.mockResolvedValueOnce(loginResponse);

    render(<LoginForm />);

    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(usernameInput, { target: { value: "user1" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByTestId("login-submit");
    act(() => {
      fireEvent.click(submitButton);
    });

    const otpInput = await screen.findByPlaceholderText("Enter OTP");
    expect(otpInput).toBeInTheDocument();

    expect(submitButton).toBeDisabled();

    fireEvent.change(otpInput, { target: { value: "123456" } });
    expect(submitButton).not.toBeDisabled();
  });

  it("submits with otp when OTP_REQUIRED", async () => {
    const loginResponse1 = { ACTION_REQUIRED: "OTP_REQUIRED" };
    const loginResponse2 = {
      ACTION_REQUIRED: "",
      username: "user2",
      access_token: "token2",
      loginId: "L-124",
    };
    const userInfoResponse = {
      userId: "U-124",
      firstName: "Test2",
      loginId: "L-124",
    };

    mockedApiRequest
      .mockResolvedValueOnce(loginResponse1)
      .mockResolvedValueOnce(loginResponse2)
      .mockResolvedValueOnce(userInfoResponse);

    render(<LoginForm />);

    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(usernameInput, { target: { value: "user2" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByTestId("login-submit");

    act(() => {
      fireEvent.click(submitButton);
    });

    const otpInput = await screen.findByPlaceholderText("Enter OTP");

    fireEvent.change(otpInput, { target: { value: "654321" } });
    expect(otpInput).toHaveValue("654321");

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockedToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      );
      expect(mockPush).toHaveBeenCalledWith("/workspaces");
    });
  });

  it("shows TOTP input when TOTP_REQUIRED", async () => {
    const loginResponse = { ACTION_REQUIRED: "TOTP_REQUIRED" };
    const loginResponse2 = {
      ACTION_REQUIRED: "",
      username: "user2",
      access_token: "token2",
      loginId: "L-124",
    };
    const userInfoResponse = {
      userId: "U-124",
      firstName: "Test2",
      loginId: "L-124",
    };

    mockedApiRequest
      .mockResolvedValueOnce(loginResponse)
      .mockResolvedValueOnce(loginResponse2)
      .mockResolvedValueOnce(userInfoResponse);

    render(<LoginForm />);

    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(usernameInput, { target: { value: "user2" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByTestId("login-submit");

    act(() => {
      fireEvent.click(submitButton);
    });

    const totpInput = await screen.findByPlaceholderText("Enter OTP");
    expect(totpInput).toBeInTheDocument();

    expect(submitButton).toBeDisabled();

    fireEvent.change(totpInput, { target: { value: "987654" } });

    expect(submitButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockedToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      );
      expect(mockPush).toHaveBeenCalledWith("/workspaces");
    });
  });

  it("renders ConfigureTOTP component when CONFIGURE actionRequired", async () => {
    const loginResponse = { ACTION_REQUIRED: "CONFIGURE_TOTP" };
    mockedApiRequest.mockResolvedValueOnce(loginResponse);

    render(<LoginForm />);

    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(usernameInput, { target: { value: "user1" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByTestId("login-submit");
    act(() => {
      fireEvent.click(submitButton);
    });
    await waitFor(() => {
      expect(
        screen.queryByText(/Configure Two-Factor Authentication/i)
      ).toBeInTheDocument();
    });
  });

  it("shows error toast on login failure", async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error("Login failed"));

    render(<LoginForm />);

    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");
    fireEvent.change(usernameInput, { target: { value: "user1" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    const submitButton = screen.getByTestId("login-submit");
    act(() => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockedToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("Invalid username or password"),
        })
      );
    });
  });
});
