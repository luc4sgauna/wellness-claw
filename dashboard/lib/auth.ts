import crypto from "crypto";

const COOKIE_NAME = "wellness_dash_session";

function getSecret(): string {
  const secret = process.env.DASHBOARD_PASSWORD;
  if (!secret) throw new Error("DASHBOARD_PASSWORD environment variable is not set");
  return secret;
}

function getHmacKey(): Buffer {
  return crypto.createHash("sha256").update(getSecret()).digest();
}

export function verifyPassword(input: string): boolean {
  const secret = getSecret();
  const expected = Buffer.from(secret, "utf-8");
  const actual = Buffer.from(input, "utf-8");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function createSessionToken(): string {
  const payload = JSON.stringify({ ts: Date.now() });
  const key = getHmacKey();
  const sig = crypto.createHmac("sha256", key).update(payload).digest("hex");
  const token = Buffer.from(payload).toString("base64") + "." + sig;
  return token;
}

export function verifySessionToken(token: string): boolean {
  try {
    const [b64Payload, sig] = token.split(".");
    if (!b64Payload || !sig) return false;
    const payload = Buffer.from(b64Payload, "base64").toString("utf-8");
    const key = getHmacKey();
    const expectedSig = crypto
      .createHmac("sha256", key)
      .update(payload)
      .digest("hex");
    if (sig !== expectedSig) return false;
    const data = JSON.parse(payload);
    const age = Date.now() - data.ts;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return age < thirtyDays;
  } catch {
    return false;
  }
}

export function getSessionCookieConfig(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  };
}

export { COOKIE_NAME };
