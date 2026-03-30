import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/auth/admin-session-edge";
import { verifyUserSessionToken } from "@/lib/auth/session-edge";
import { isJwtSecretConfigured, requireJwtSecret } from "@/lib/jwt-secret";

const USER_COOKIE = "fms_user_session";
const ADMIN_COOKIE = "fms_admin_session";

/** Strip optional `NEXT_PUBLIC_BASE_PATH` and trailing slash so route checks match production path layouts. */
function normalizeAppPathname(pathname: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  let p = pathname;
  if (base) {
    if (p === base) p = "/";
    else if (p.startsWith(`${base}/`)) p = p.slice(base.length);
  }
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function applyBasePathToUrl(url: URL, appPath: string) {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const p = appPath.startsWith("/") ? appPath : `/${appPath}`;
  url.pathname = base ? `${base}${p}` : p;
}

export async function proxy(request: NextRequest) {
  const pathname = normalizeAppPathname(request.nextUrl.pathname);
  if (!isJwtSecretConfigured()) {
    return NextResponse.next();
  }
  const secret = requireJwtSecret();

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!adminToken) {
      const url = request.nextUrl.clone();
      applyBasePathToUrl(url, "/admin/login");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const adminSession = await verifyAdminSessionToken(adminToken, secret);
    if (!adminSession) {
      const url = request.nextUrl.clone();
      applyBasePathToUrl(url, "/admin/login");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(USER_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    applyBasePathToUrl(url, "/login");
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifyUserSessionToken(token, secret);
  if (!session) {
    const url = request.nextUrl.clone();
    applyBasePathToUrl(url, "/login");
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const onSocialCompletePage =
    pathname === "/account/complete-registration-social" ||
    pathname.startsWith("/account/complete-registration-social/");
  const onChangePasswordPage = pathname.startsWith("/account/change-password");

  /**
   * Password change and post-registration social steps can both be required. Each page must be
   * reachable without the other rule redirecting away — otherwise the browser hits ERR_TOO_MANY_REDIRECTS.
   */
  if (session.mustChangePassword && !onChangePasswordPage && !onSocialCompletePage) {
    const url = request.nextUrl.clone();
    applyBasePathToUrl(url, "/account/change-password");
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!session.registrationSocialGateSatisfied && !onSocialCompletePage && !onChangePasswordPage) {
    const url = request.nextUrl.clone();
    applyBasePathToUrl(url, "/account/complete-registration-social");
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
