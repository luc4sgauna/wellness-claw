import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "wellness_dash_session";

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const password = process.env.DASHBOARD_PASSWORD;
    if (!password) return false;

    const [b64Payload, sig] = token.split(".");
    if (!b64Payload || !sig) return false;

    const enc = new TextEncoder();

    // Derive key the same way lib/auth.ts does: SHA-256(password) as HMAC key
    const passwordHash = await globalThis.crypto.subtle.digest(
      "SHA-256",
      enc.encode(password)
    );
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      passwordHash,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const payload = atob(b64Payload);
    const valid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(sig),
      enc.encode(payload)
    );
    if (!valid) return false;

    const data = JSON.parse(payload);
    const age = Date.now() - data.ts;
    return age < 30 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !(await verifyToken(token))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/data/:path*"],
};
