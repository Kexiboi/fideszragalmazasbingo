import { randomBytes } from "node:crypto";

/**
 * URL-biztos, kitalálhatatlan megosztási azonosító.
 */
export function createShareToken(): string {
  return randomBytes(18).toString("base64url");
}
