import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.delete(name);
          res.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  const { pathname } = req.nextUrl;

  // Check for user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow public routes
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/recipes/");

  if (isPublicRoute) {
    return res;
  }

  // If user is not authenticated, redirect to login
  if (!session && pathname.startsWith("/(dashboard)")) {
    const redirectUrl = new URL("/login", req.url);
    return NextResponse.redirect(redirectUrl.toString());
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
