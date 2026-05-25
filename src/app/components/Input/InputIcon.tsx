import React from "react";
interface InputIconProps {
  icon?: string;
}

const InputIcon: React.FC<InputIconProps> = ({ icon }) => {
  switch (icon) {
    case "loginId":
      return (
        <svg
          width="18"
          height="22"
          viewBox="0 0 18 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 17.8C1 15.149 3.14903 13 5.8 13H12.2C14.851 13 17 15.149 17 17.8V17.8C17 19.5673 15.5673 21 13.8 21H4.2C2.43269 21 1 19.5673 1 17.8V17.8Z"
            stroke="#2F384C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 5C13 7.20914 11.2091 9 9 9C6.79086 9 5 7.20914 5 5C5 2.79086 6.79086 1 9 1C11.2091 1 13 2.79086 13 5Z"
            stroke="#2F384C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "password":
      return (
        <svg
          width="20"
          height="22"
          viewBox="0 0 20 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 7V5.8C5 4.11984 5 3.27976 5.32698 2.63803C5.6146 2.07354 6.07354 1.6146 6.63803 1.32698C7.27976 1 8.11984 1 9.8 1H10.2C11.8802 1 12.7202 1 13.362 1.32698C13.9265 1.6146 14.3854 2.07354 14.673 2.63803C15 3.27976 15 4.11984 15 5.8V7M10 13V15M7.4 21H12.6C14.8402 21 15.9603 21 16.816 20.564C17.5686 20.1805 18.1805 19.5686 18.564 18.816C19 17.9603 19 16.8402 19 14.6V13.4C19 11.1598 19 10.0397 18.564 9.18404C18.1805 8.43139 17.5686 7.81947 16.816 7.43597C15.9603 7 14.8402 7 12.6 7H7.4C5.15979 7 4.03968 7 3.18404 7.43597C2.43139 7.81947 1.81947 8.43139 1.43597 9.18404C1 10.0397 1 11.1598 1 13.4V14.6C1 16.8402 1 17.9603 1.43597 18.816C1.81947 19.5686 2.43139 20.1805 3.18404 20.564C4.03968 21 5.15979 21 7.4 21Z"
            stroke="#2F384C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
};

export default InputIcon;
