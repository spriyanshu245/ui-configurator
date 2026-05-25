import ConfigureTOTP from "./ConfigureTOTP";
import { apiRequest } from "../../services/APIService";
import ToastNotificationService from "../../services/ToastNotificationService";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("../../services/APIService");
jest.mock("../../services/ToastNotificationService");

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedToastShow = ToastNotificationService.show as jest.MockedFunction<
  typeof ToastNotificationService.show
>;

const styles = {
  subtitle: "subtitle-class",
  form: "form-class",
  submitButton: "submit-btn",
};

const defaultProps = {
  userName: "john.doe",
  password: "password123",
  styles,
  setActionRequired: jest.fn(),
};

describe("ConfigureTOTP", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders heading and triggers generateTOTP on mount (success case)", async () => {
    mockedApiRequest.mockResolvedValueOnce({
      qrCodeImage: "data:image/png;base64,abc",
      otpAuthUrl: "otpauth://...",
      secret: "secret123",
    });

    render(<ConfigureTOTP {...defaultProps} />);

    expect(
      screen.getByText("Configure Two-Factor Authentication"),
    ).toBeInTheDocument();

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    });

    const calledArg = mockedApiRequest.mock.calls[0][0];
    expect(calledArg.endpoint).toBe(`/api/v2/auth/generate-totp`);
    expect(calledArg.method).toBe("POST");
    expect(calledArg.body).toEqual({
      userName: defaultProps.userName,
      credential: defaultProps.password,
      credentialType: "password",
    });

    expect(screen.getByAltText("QR Code")).toBeInTheDocument();
  });

  test("does not call generateTOTP if config/userName/password missing", async () => {
    render(<ConfigureTOTP {...defaultProps} userName="" password="" />);

    await waitFor(() => {
      expect(mockedApiRequest).not.toHaveBeenCalled();
    });
  });

  test("shows error toast if QR generation fails", async () => {
    mockedApiRequest.mockRejectedValueOnce(new Error("fail"));

    render(<ConfigureTOTP {...defaultProps} />);

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    });

    expect(mockedToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Failed to generate QR code. Please try again.",
        type: "error",
      }),
    );
  });

  test("OTP input accepts only digits and max length 6", async () => {
    mockedApiRequest.mockResolvedValueOnce({
      qrCodeImage: "img",
      otpAuthUrl: "url",
      secret: "secret123",
    });

    render(<ConfigureTOTP {...defaultProps} />);

    const qrImg = await screen.findByAltText("QR Code");
    expect(qrImg).toBeInTheDocument();

    const input = screen.getByPlaceholderText(
      "Enter 6-digit OTP",
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "12ab3!" } });
    expect(input.value).toBe("123");
  });

  test("verify button disabled until 6 digits entered and during loading", async () => {
    mockedApiRequest.mockResolvedValueOnce({
      qrCodeImage: "img",
      otpAuthUrl: "url",
      secret: "secret123",
    });

    render(<ConfigureTOTP {...defaultProps} />);

    await screen.findByAltText("QR Code");

    const input = screen.getByPlaceholderText(
      "Enter 6-digit OTP",
    ) as HTMLInputElement;
    const button = screen.getByRole("button", { name: "Verify" });

    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: "12345" } });
    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: "123456" } });
    expect(button).not.toBeDisabled();

    mockedApiRequest.mockResolvedValueOnce({ message: "ok" });

    fireEvent.click(button);

    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledTimes(2);
    });
  });

  test("handleVerify success flow calls register endpoint, setActionRequired and success toast", async () => {
    mockedApiRequest.mockResolvedValueOnce({
      qrCodeImage: "img",
      otpAuthUrl: "url",
      secret: "secret123",
    });

    mockedApiRequest.mockResolvedValueOnce({ message: "Registered!" });

    const setActionRequired = jest.fn();

    render(
      <ConfigureTOTP {...defaultProps} setActionRequired={setActionRequired} />,
    );

    await screen.findByAltText("QR Code");

    const input = screen.getByPlaceholderText(
      "Enter 6-digit OTP",
    ) as HTMLInputElement;
    const button = screen.getByRole("button", { name: "Verify" });

    fireEvent.change(input, { target: { value: "654321" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledTimes(2);
    });

    const verifyCall = mockedApiRequest.mock.calls[1][0];
    expect(verifyCall.endpoint).toBe(`/api/v2/auth/register-totp`);
    expect(verifyCall.method).toBe("POST");
    expect(verifyCall.body).toEqual({
      userName: defaultProps.userName,
      credential: defaultProps.password,
      credentialType: "password",
      secret: "secret123",
      code: "654321",
    });

    expect(setActionRequired).toHaveBeenCalledWith(null);
    expect(mockedToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Registered!",
        type: "success",
      }),
    );
  });

  test("handleVerify shows error toast on failure", async () => {
    mockedApiRequest.mockResolvedValueOnce({
      qrCodeImage: "img",
      otpAuthUrl: "url",
      secret: "secret123",
    });

    mockedApiRequest.mockRejectedValueOnce(new Error("verify fail"));

    render(<ConfigureTOTP {...defaultProps} />);

    await screen.findByAltText("QR Code");

    const input = screen.getByPlaceholderText(
      "Enter 6-digit OTP",
    ) as HTMLInputElement;
    const button = screen.getByRole("button", { name: "Verify" });

    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedApiRequest).toHaveBeenCalledTimes(2);
    });

    expect(mockedToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Verification failed. Please check your OTP and try again.",
        type: "error",
      }),
    );
  });
});
