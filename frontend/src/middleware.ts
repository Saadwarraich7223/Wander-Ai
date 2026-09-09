import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("travel_access_token")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register");
  const isProtectedPage = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/onboarding");

  if (isProtectedPage && !token) {
    // Client-side auth check handled in components via authStorage fallback
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/register"],
};
