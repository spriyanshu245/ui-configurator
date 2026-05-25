import localFont from "next/font/local";

export const gotham = localFont({
  src: [
    {
      path: "./Gotham-Book.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Gotham-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./Gotham-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./Gotham-Medium.otf",
      weight: "500",
      style: "normal",
    },
  ],
});
