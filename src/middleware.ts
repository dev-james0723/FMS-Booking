import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/auth/admin-session-edge";
import { verifyUserSessionToken } from "@/lib/auth/session-edge";

const USER_COOKIE = "fms_user_session";
const ADMIN_COOKIE = "fms_admin_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!adminToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const adminSession = await verifyAdminSessionToken(adminToken, secret);
    if (!adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(USER_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifyUserSessionToken(token, secret);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session.mustChangePassword && !pathname.startsWith("/account/change-password")) {
    const url = request.nextUrl.clone();
    url.pathname = "/account/change-password";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account",
    "/dashboard/:path*",
    "/booking",
    "/booking/:path*",
    "/account/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
