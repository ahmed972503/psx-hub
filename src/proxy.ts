import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const guarded = pathname.startsWith("/terminal") || pathname.startsWith("/admin");
  const session = request.cookies.get("psx_session")?.value;
  if (guarded && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/terminal/:path*", "/admin/:path*"],
};
