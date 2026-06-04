// A utility library to fetch all microsite pages
// In a real application, this would talk to the API Server directly
// or use Server Actions if integrated in Next.js

import { cookies } from 'next/headers';

export async function fetchMicrositePages(micrositeId: string) {
  const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.dev.rahi.cloud';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${API_URL}/api/v1/config/microsites/${micrositeId}?version=1`, {
    headers: {
      "accept": "*/*",
      "content-type": "application/json",
      "workspace-code": "engineering-workspace",
      "x-user-type": "employee",
      "Cookie": cookieHeader
    },
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch microsite pages: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
