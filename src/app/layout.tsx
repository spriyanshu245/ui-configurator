import type { Metadata } from "next";
import "./globals.css";
import { gotham } from "@/app/fonts/baseFonts";
import { HeaderProviderV2 } from "@/app/context/HeaderContextV2";
import ConfigClientWrapper from "@/app/components/ConfigClientWrapper";
import { MicrositeProvider } from "./context/MicrositeContext";
import SessionBootstrap from "@/platforms/session/SessionBootstrap";
import SessionGuard from "@/platforms/session/SessionGuard";
import ToastNotification from "./components/ToastNotification/ToastNotification";

export const metadata: Metadata = {
  title: "UI Configurator",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={gotham.className}>
        <ConfigClientWrapper>
          <MicrositeProvider>
            <SessionBootstrap />
            <HeaderProviderV2>
              <SessionGuard>{children}</SessionGuard>
            </HeaderProviderV2>
          </MicrositeProvider>
        </ConfigClientWrapper>
        <ToastNotification />
      </body>
    </html>
  );
}
