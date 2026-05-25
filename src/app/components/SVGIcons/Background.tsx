interface BackgroundProps {
  className?: string;
  type: string;
}

const Background = ({ className, type }: BackgroundProps) => {
  switch (type) {
    case "sideNav":
      return (
        <div className={className}>
          <svg
            width="270"
            height="1117"
            viewBox="0 0 270 1117"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_671_1630)">
              <path
                d="M0 1H265C267.209 1 269 2.79086 269 5V1113C269 1115.21 267.209 1117 265 1117H0V1Z"
                fill="url(#paint0_linear_671_1630)"
              />
              <path
                d="M268.708 1115.89L47.799 1115.89C47.799 1115.89 123.989 1002.82 132.704 910.767C140.832 824.9 93.3926 781.609 96.1474 695.059C99.4029 592.778 166.108 553.844 164.543 451.482C162.871 342.18 102.292 303.518 78.459 199.544C61.0731 123.695 47.799 9.46505e-05 47.799 9.46505e-05L268.708 0.00012207L268.708 1115.89Z"
                fill="white"
                fillOpacity="0.1"
              />
              <path
                d="M270 1115.89L183.995 1115.89C183.995 1115.89 164.014 1016.76 169.34 924.702C174.308 838.835 206.095 801.117 207.778 714.568C209.768 612.286 163.402 555.518 174.625 456.499C192.884 295.414 175.738 318.567 161.172 214.593C150.546 138.744 180.631 0.000110978 180.631 0.000110978L270 0.00012207L270 1115.89Z"
                fill="white"
                fillOpacity="0.1"
              />
              <g filter="url(#filter0_b_671_1630)">
                <path
                  d="M0 0H265C267.209 0 269 1.79086 269 4V1113C269 1115.21 267.209 1117 265 1117H0V0Z"
                  fill="white"
                  fillOpacity="0.1"
                />
              </g>
            </g>
            <defs>
              <filter
                id="filter0_b_671_1630"
                x="-5"
                y="-5"
                width="279"
                height="1127"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feGaussianBlur in="BackgroundImageFix" stdDeviation="2.5" />
                <feComposite
                  in2="SourceAlpha"
                  operator="in"
                  result="effect1_backgroundBlur_671_1630"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_backgroundBlur_671_1630"
                  result="shape"
                />
              </filter>
              <linearGradient
                id="paint0_linear_671_1630"
                x1="134.5"
                y1="1"
                x2="134.5"
                y2="1117"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#00a79d" />
                <stop offset="1" stopColor="#00867E" />
              </linearGradient>
              <clipPath id="clip0_671_1630">
                <rect width="270" height="1117" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
      );
    case "welcomeBackPanel":
      return (
        <div className={className}>
          <svg
            viewBox="0 0 706 1023"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
          >
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#paint0_linear_23_519)"
              rx="20"
            />
            <path
              d="M708 1011L427 1011C427 1011 523.915 909.579 535 827C545.34 749.973 484.996 711.139 488.5 633.5C492.641 541.749 577.491 506.823 575.5 415C573.374 316.951 496.316 282.269 466 189C443.885 120.96 427 9.99998 427 9.99998L708 10L708 1011Z"
              fill="white"
              fillOpacity="0.1"
            />
            <path
              d="M710 1011L600.075 1011C600.075 1011 574.537 922.079 581.344 839.5C587.694 762.473 628.321 728.639 630.473 651C633.016 559.249 573.755 508.325 588.1 419.5C611.436 275 589.522 295.769 570.905 202.5C557.324 134.46 595.776 9.99999 595.776 9.99999L710 10L710 1011Z"
              fill="white"
              fillOpacity="0.1"
            />
            <defs>
              <linearGradient
                id="paint0_linear_23_519"
                x1="360"
                y1="10"
                x2="360"
                y2="1011"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#00a79d" />
                <stop offset="1" stopColor="#00867E" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );
  }
};

export default Background;
