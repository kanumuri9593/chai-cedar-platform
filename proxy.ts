import { NextResponse, type NextRequest } from "next/server";

// Server-side owner gate for the dashboard. OWNER_PASSWORD has no NEXT_PUBLIC_
// prefix, so it stays on the server and never ships in the page's JavaScript.
// (A static GitHub Pages export has no server, so it shows a notice instead.)
export const config = { matcher: ["/dashboard", "/dashboard/:path*"] };

const challenge = () =>
  new NextResponse("Owner sign-in required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Chai & Cedar owner", charset="UTF-8"' },
  });

export function proxy(request: NextRequest) {
  const password = process.env.OWNER_PASSWORD;
  if (!password) return new NextResponse("Owner password is not set.", { status: 503 });

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return challenge();

  let supplied = "";
  try {
    const decoded = atob(header.slice(6));
    supplied = decoded.slice(decoded.indexOf(":") + 1);
  } catch {
    return challenge();
  }
  return supplied === password ? NextResponse.next() : challenge();
}
