"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useSession } from "./useSession";
import { SessionState } from "./enums";
import SpinningLoader from "@/app/components/SVGIcons/SpinningLoader";

export default function SessionGuard({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { state } = useSession();
  const router = useRouter();
  const pathName = usePathname();
  useEffect(() => {
    if (state === SessionState.LOGGED_OUT && !pathName.includes("/customers")) {
      router.replace("/login");
    }
  }, [state]);

  if (state === SessionState.CHECKING) return <SpinningLoader />;

  return children;
}
