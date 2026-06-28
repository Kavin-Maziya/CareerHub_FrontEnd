import { auth } from "@/src/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isAuthenticated = !!session?.user;
  const role = session?.user?.role;
  const isEmployer = role === "employer";
  const isCandidate = role === "candidate";

  // /login — redirect already signed-in users away
  if (pathname === "/login") {
    if (isAuthenticated) {
      if (isEmployer) {
        return NextResponse.redirect(new URL("/dashboard/listings", nextUrl));
      }
      if (isCandidate) {
        return NextResponse.redirect(new URL("/jobs", nextUrl));
      }
    }
    return NextResponse.next();
  }

  // /dashboard and all sub-paths — employers only
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (isCandidate) {
      return NextResponse.redirect(new URL("/jobs", nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};