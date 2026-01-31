import { createHmac } from "crypto";
import { parse } from "cookie";
import { IncomingMessage } from "http";

export const ADMIN_COOKIE_NAME = "admin_session";

export function getExpectedAdminToken() {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return null;
  return createHmac("sha256", adminPass).update(adminUser).digest("hex");
}

export function isAuthenticatedAdmin(req: IncomingMessage): boolean {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[ADMIN_COOKIE_NAME];
  const expected = getExpectedAdminToken();
  return !!(token && expected && token === expected);
}
