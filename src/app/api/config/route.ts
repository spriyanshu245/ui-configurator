import { getServerConfig } from "@/app/api/utils/serverConfig";
import { NextResponse } from "next/server";

export async function GET() {
  const config = getServerConfig();

  return NextResponse.json(
    { message: "Service Base URL received", ...config },
    { status: 200 }
  );
}
