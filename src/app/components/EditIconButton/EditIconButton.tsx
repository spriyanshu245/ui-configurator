import React from "react";

interface IconButtonProps {
  onClick: () => void;
  title?: string;
  name?: string;
  className?: string;
  size?: string;
  color?: string;
  [key: string]: any;
}

const EditIconButton: React.FC<IconButtonProps> = ({
  onClick,
  title = "Edit",
  name = "Edit-icon",
  className = "",
  size = "24px",
  color = "black",
  ...props
}) => {
  return (
    <button
     { ...props}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md hover:bg-gray-100 ${className}`}
      title={title}
      name={name}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 363 363"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M331.24 17.9012C308.296 -5.04229 271.097 -5.04229 248.155 17.9012L234.308 31.7485L331.24 128.681L345.087 114.834C368.031 91.8903 368.031 54.692 345.087 31.7485L331.24 17.9012ZM303.545 156.377L206.611 59.4437L28.5803 237.475C24.6873 241.368 21.9668 246.278 20.729 251.642L0.596117 338.884C-2.66177 353.001 9.99103 365.65 24.1049 362.391L111.347 342.26C116.711 341.022 121.62 338.302 125.513 334.409L303.545 156.377Z"
        />
      </svg>
    </button>
  );
};

export default EditIconButton;
