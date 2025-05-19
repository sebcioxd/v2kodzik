import { NextRequest, NextResponse } from "next/server";
import getServerSession from "./lib/server-session";

export async function middleware(request: NextRequest) {	
	const session = await getServerSession();
    const pathname = request.nextUrl.pathname
	const url = request.url

	if (pathname.startsWith("/auth")) {
		if (!session) {
			return NextResponse.next()
		}

		return NextResponse.redirect(new URL("/", url))
	}

	if (pathname.startsWith("/panel")) {
		if (!session) {
			return NextResponse.redirect(new URL("/auth", url))
		}

		return NextResponse.next()
	}

 
	return NextResponse.next();
}
 
export const config = {
	matcher: ["/auth", "/panel"], 
};