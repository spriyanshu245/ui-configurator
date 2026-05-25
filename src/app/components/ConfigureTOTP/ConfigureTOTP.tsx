"use client";
import { apiRequest } from "@/app/services/APIService";
import ToastNotificationService from "@/app/services/ToastNotificationService";
import { IRequestData } from "@/app/types/types";
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import Input from "../Input/Input";

interface QrCodeTOTPAuth {
  qrCodeImage: string;
  otpAuthUrl: string;
  secret: string;
}

const ConfigureTOTP = ({
  userName,
  password,
  styles,
  setActionRequired,
}: {
  userName: string;
  password: string;
  styles: Record<string, any>;
  setActionRequired: Dispatch<SetStateAction<string | null>>;
}) => {
  const [qrCode, setQrCode] = useState<QrCodeTOTPAuth | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [loading, setLoading] = useState(false);

  const generateTOTP = useCallback(async () => {
    if (!userName || !password) return;
    setLoading(true);
    try {
      const generateToptpRequest: IRequestData = {
        endpoint: `/api/v2/auth/generate-totp`,
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          userName,
          credential: password,
          credentialType: "password",
        },
      };
      const generateTotpResponse: QrCodeTOTPAuth =
        await apiRequest(generateToptpRequest);
      setQrCode(generateTotpResponse);
    } catch (error) {
      console.log("QR generation Error:", error);
      ToastNotificationService.show({
        message: "Failed to generate QR code. Please try again.",
        type: "error",
        autoClose: true,
        duration: 2000,
      });
    }
    setLoading(false);
  }, [userName, password]);

  useEffect(() => {
    generateTOTP();
  }, [generateTOTP]);

  const handleVerify = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!qrCode || !otpValue) return;
    setLoading(true);
    try {
      const req: IRequestData = {
        endpoint: `/api/v2/auth/register-totp`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          userName,
          credential: password,
          credentialType: "password",
          secret: qrCode.secret,
          code: otpValue,
        },
      };
      const res: { message: string } = await apiRequest(req);
      if (res) {
        setActionRequired(null);
        ToastNotificationService.show({
          message: res?.message || "Authenticator registered successfully",
          type: "success",
          autoClose: true,
          duration: 2000,
        });
      }
    } catch (error) {
      console.log("Verification Error:", error);
      ToastNotificationService.show({
        message: "Verification failed. Please check your OTP and try again.",
        type: "error",
        autoClose: true,
        duration: 2000,
      });
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Configure Two-Factor Authentication</h2>
      {loading && <p>Loading...</p>}

      {qrCode && (
        <div>
          <div className={styles.subtitle}>
            Scan the QR code below in Google Authenticator, then enter the
            6-digit code:
          </div>
          <img
            src={qrCode.qrCodeImage}
            alt="QR Code"
            style={{ width: 200, height: 200 }}
          />

          <form onSubmit={handleVerify} className={styles.form}>
            <Input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              value={otpValue}
              maxLength={6}
              icon="loginId"
              label="Enter T-OTP"
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit OTP"
              required
            />
            <button
              className={styles.submitButton}
              type="submit"
              disabled={loading || otpValue.length !== 6}
            >
              Verify
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ConfigureTOTP;
