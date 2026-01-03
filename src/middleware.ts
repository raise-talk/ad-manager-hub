import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const authRoutes = ["/login", "/cadastro", "/recuperar-senha"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (authRoutes.includes(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!token && !pathname.startsWith("/api")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/campanhas/:path*",
    "/alertas/:path*",
    "/financeiro/:path*",
    "/integracoes/:path*",
    "/configuracoes/:path*",
    "/ajuda/:path*",
    "/login",
    "/cadastro",
    "/recuperar-senha",
  ],
};
