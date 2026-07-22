"use client";
import { Fragment, useState } from "react";
import styles from "./LoginForm.module.scss";
import Input from "../Input/Input";
import { useRouter } from "next/navigation";
import ToastNotificationService from "@/app/services/ToastNotificationService";
import { apiRequest } from "@/app/services/APIService";
import { IRequestData } from "@/app/types/types";
import ConfigureTOTP from "../ConfigureTOTP/ConfigureTOTP";
import sessionManager from "@/platforms/session/SessionManagerService";
import { appEnv } from "@/app/utils/utils";

interface FormData {
  userName: string;
  password: string;
  otp?: string;
  t_otp?: string;
}

enum LoginResponseMessage {
  TOTP_REQUIRED = "TOTP_REQUIRED",
  OTP_REQUIRED = "OTP_REQUIRED",
  CONFIGURE = "CONFIGURE_TOTP",
}
interface LoginResponse {
  ACTION_REQUIRED: string;
  loginId: string;
  username: string;
  message: string;
  access_token: string;
}

interface UserInfoResponse {
  lastName?: string;
  loginId: string;
  partnerCode?: string;
  mobileNumber?: string;
  systemUser?: boolean;
  emailId?: string;
  userId: string;
  isLoginIdActive?: boolean;
  firstName: string;
  userCompanyId?: string;
  isActiveInCompany?: boolean;
  designation?: string;
  department?: string;
}

const LoginForm = () => {
  const router = useRouter();

  const [actionRequired, setActionRequired] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    userName: "",
    password: "",
    otp: "",
    t_otp: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getUserInfo = async (loginResponse: LoginResponse) => {
    try {
      const userInfoRequest: IRequestData = {
        endpoint: `/api/v1/userinfo?userName=${loginResponse.username}`,
        method: "GET",
        credentials: "include",
      };

      const userInfoResponse: UserInfoResponse =
        await apiRequest(userInfoRequest);
      if (!userInfoResponse.userId) {
        throw new Error("Login failed: Missing UserId in userInfo response");
      }
      const userDetails = {
        userName: loginResponse.username,
        userId: userInfoResponse?.userId,
      };
      sessionStorage.setItem(
        "global.login.userDetails",
        JSON.stringify(userDetails),
      );

      sessionManager.onLogin(userDetails);

      ToastNotificationService.show({
        message: "Successfully logged in",
        type: "success",
        autoClose: true,
        duration: 2000,
      });
      setFormData({
        userName: "",
        password: "",
        otp: "",
        t_otp: "",
      });
      router.push("/workspaces");
    } catch (error: any) {
      setFormData({ ...formData, otp: "", t_otp: "" });
      console.log("Login Error:", error);
      ToastNotificationService.show({
        message: "Something went wrong. Please try again.",
        type: "error",
        autoClose: true,
        duration: 2000,
      });
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      let body: Record<string, any> = {
        userName: formData.userName,
        credential: formData.password,
        credentialType: "password",
      };
      if (formData.otp) {
        body["otp"] = formData.otp;
      } else if (formData.t_otp) {
        body["totp"] = formData.t_otp;
      }
      const loginRequest: IRequestData = {
        endpoint: `/api/v2/auth/login`,
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      };

      const loginResponse: LoginResponse = await apiRequest(loginRequest);
      if (loginResponse?.ACTION_REQUIRED) {
        setActionRequired(loginResponse?.ACTION_REQUIRED);
      } else {
        setActionRequired(null);
        if (!loginResponse.username) {
          throw new Error("Login failed: Missing username in response");
        }
        appEnv === "development" &&
          sessionStorage.setItem("accessToken", loginResponse.access_token);
        await getUserInfo(loginResponse);
      }
    } catch (error: any) {
      console.log("Login Error:", error);
      ToastNotificationService.show({
        message: "Invalid username or password. Please try again.",
        type: "error",
        autoClose: true,
        duration: 2000,
      });
    }
  };

  return actionRequired !== LoginResponseMessage.CONFIGURE ? (
    <Fragment>
      <h3>Log in to your account</h3>
      <span className={styles.subtitle}>
        Enter your credentials to continue.
      </span>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          id="userName"
          data-testid="userName"
          type="text"
          name="userName"
          icon="loginId"
          label="Username"
          placeholder="Username"
          value={formData.userName}
          onChange={handleChange}
          required
        />

        <Input
          id="password"
          data-testid="password"
          type="password"
          name="password"
          icon="password"
          label="Password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {actionRequired == LoginResponseMessage.OTP_REQUIRED && (
          <Input
            icon="password"
            name="otp"
            id={"otp"}
            data-testid={"otp"}
            type="text"
            label="Enter OTP"
            value={formData.otp}
            onChange={handleChange}
            placeholder="Enter OTP"
            required
          />
        )}

        {actionRequired == LoginResponseMessage.TOTP_REQUIRED && (
          <Input
            icon="password"
            name="t_otp"
            id={"t_otp"}
            data-testid={"t_otp"}
            type="text"
            label="Enter OTP"
            value={formData.t_otp}
            onChange={handleChange}
            placeholder="Enter OTP"
            required
          />
        )}

        <button
          data-testid="login-submit"
          disabled={
            !formData.userName ||
            (!!actionRequired && !(formData.t_otp || formData.otp))
          }
          type="submit"
          className={styles.submitButton}
          id="loginButton"
        >
          {actionRequired ? "Verify Code" : "Log In"}
        </button>
      </form>
    </Fragment>
  ) : (
    <ConfigureTOTP
      userName={formData.userName}
      password={formData.password}
      styles={styles}
      setActionRequired={setActionRequired}
    ></ConfigureTOTP>
  );
};

export default LoginForm;
