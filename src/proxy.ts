import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/** Pages you can reach signed out. Signed in, they bounce to the app. */
const PUBLIC = new Set(["/sign-in", "/forgot-password"]);

/** Concept-only gate: no session cookie → sign in. */
export function proxy(request: NextRequest) {
  const signedIn = request.cookies.has(SESSION_COOKIE);
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC.has(pathname);

  if (!signedIn && !isPublic) {
    const url = new URL("/sign-in", request.url);
    if (pathname !== "/") url.searchParams.set("from", pathname + search);
    return NextResponse.redirect(url);
  }
  if (signedIn && isPublic) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static files
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)"],
};
