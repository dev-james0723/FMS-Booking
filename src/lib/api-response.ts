import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function jsonError(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status }
  );
}

export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/** Avoid CDN/browser caching authenticated JSON (stale booking lists, passkeys, etc.). */
export function withPrivateNoStore<T>(res: NextResponse<T>): NextResponse<T> {
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
