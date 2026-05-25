import * as React from "react";
const ArrowUp = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6 15L12 9L18 15"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default ArrowUp;
