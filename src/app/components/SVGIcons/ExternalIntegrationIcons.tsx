import React, { JSX } from "react";

export const DigioKYCIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.2" />
    <path
      d="M10 17c1.2-2.8 4-5 6-5s3.3 1 4 3c.7 2-1.5 4-4 4h-2"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const PANVerificationIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="5"
      y="6"
      width="22"
      height="16"
      rx="2.5"
      stroke="currentColor"
      strokeWidth="2.2"
    />
    <rect x="8" y="9" width="10" height="3" rx="1.2" fill="currentColor" />
    <rect
      x="8"
      y="14"
      width="16"
      height="5"
      rx="1.6"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

export const AadhaarVerificationIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 16c2.2-5 7-8 10-8s7.8 3 10 8"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <circle cx="16" cy="18" r="4.5" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="16" cy="18" r="1.5" fill="currentColor" />
    <path
      d="M4 20h24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const AccountAggregatorIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 10h8V6l8 10-8 10v-4H8V10Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="10" cy="10" r="1.6" fill="currentColor" />
    <circle cx="10" cy="22" r="1.6" fill="currentColor" />
  </svg>
);

export const MandateRegistrationIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="6"
      y="5"
      width="20"
      height="22"
      rx="3"
      stroke="currentColor"
      strokeWidth="2.2"
    />
    <path
      d="M11 11h10M11 16h10M11 21h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 5V3h8v2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const DefaultExternalIntegrationIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="6"
      y="8"
      width="20"
      height="16"
      rx="4"
      stroke="currentColor"
      strokeWidth="2.2"
    />
    <path
      d="M10 14h12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 18h7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const OfflineKYCIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="6"
      y="6"
      width="20"
      height="14"
      rx="2.4"
      stroke="currentColor"
      strokeWidth="2.2"
    />
    <path
      d="M8 20v4.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V20"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M11 12h6M11 15h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const externalIntegrationIcons: Record<string, JSX.Element> = {
  "kyc-verification": <DigioKYCIcon />,
  "pan-verification": <PANVerificationIcon />,
  "aadhaar-verification": <AadhaarVerificationIcon />,
  "account-aggregator": <AccountAggregatorIcon />,
  "mandate-registration": <MandateRegistrationIcon />,
  "offline-kyc-verification": <OfflineKYCIcon />,
};
