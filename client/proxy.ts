import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
 
export async function proxy(request: NextRequest) {
    
	const sessionCookie = getSessionCookie(request, {
        cookiePrefix: "dajkodzik"
    });

    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/auth") && !pathname.startsWith("/auth/oauth") && sessionCookie) {
        return NextResponse.redirect(new URL("/panel", request.url));
    }

    if (pathname.startsWith("/auth/oauth") && !sessionCookie) {
        return NextResponse.redirect(new URL("/auth", request.url));
    }

    if (pathname.startsWith("/panel") && !sessionCookie) {
        return NextResponse.redirect(new URL("/auth", request.url));
    }

    if (pathname.startsWith("/oauth-password") && !sessionCookie) {
        return NextResponse.redirect(new URL("/auth", request.url));
    }   
 
	return NextResponse.next();
}
 
export const config = {
    // Specify the routes the middleware applies to
    matcher: ["/panel/:path*", "/auth/:path*", "/oauth-password"]
};