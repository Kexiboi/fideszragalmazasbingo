import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

type AuthedRequest = NextRequest & { auth: Session | null };

function safeCallback(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/jatek";
  }
  return path;
}

export default auth((req: AuthedRequest) => {
  const { pathname, searchParams } = req.nextUrl;
  const session = req.auth;
  const isAdmin = session?.user?.role === "ADMIN";

  if (pathname.startsWith("/admin/bejelentkezes")) {
    const url = req.nextUrl.clone();
    url.pathname = "/bejelentkezes";
    url.searchParams.set("callbackUrl", "/admin");
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/regisztracio")) {
    if (session) {
      return NextResponse.redirect(new URL("/jatek", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/bejelentkezes")) {
    if (session) {
      return NextResponse.redirect(new URL("/jatek", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const url = new URL("/bejelentkezes", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/jatek", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/jatek")) {
    if (!session) {
      const url = new URL("/bejelentkezes", req.url);
      const cb = searchParams.get("callbackUrl");
      url.searchParams.set("callbackUrl", safeCallback(cb ?? "/jatek"));
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/javaslat")) {
    if (!session) {
      const url = new URL("/bejelentkezes", req.url);
      url.searchParams.set("callbackUrl", "/javaslat");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/kartyaim") || pathname.startsWith("/kiosztasaim")) {
    if (!session) {
      const url = new URL("/bejelentkezes", req.url);
      const cb = pathname.startsWith("/kiosztasaim") ? "/kiosztasaim" : "/kartyaim";
      url.searchParams.set("callbackUrl", cb);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/javaslataim")) {
    if (!session) {
      const url = new URL("/bejelentkezes", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/jatek",
    "/jatek/:path*",
    "/javaslat",
    "/javaslat/:path*",
    "/kartyaim",
    "/kartyaim/:path*",
    "/kiosztasaim",
    "/kiosztasaim/:path*",
    "/javaslataim",
    "/javaslataim/:path*",
    "/kartya-javaslat",
    "/kartya-javaslat/:path*",
    "/kartya-javaslataim",
    "/kartya-javaslataim/:path*",
    "/admin/:path*",
    "/bejelentkezes",
    "/regisztracio",
  ],
};
