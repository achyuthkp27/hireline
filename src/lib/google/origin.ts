import { env } from "@/lib/env";

/**
 * The address the browser reaches Hireline at: HIRELINE_PUBLIC_URL, else the
 * forwarded host and protocol behind a reverse proxy, else the request's own.
 * Google's redirect and the Claude connector's addresses (#221) use it.
 */
export function publicOrigin(request: Request): string {
  return originFrom(request.headers, new URL(request.url));
}

/**
 * The same address for a page, which has the request's headers but no URL,
 * so Settings shows the redirect URI and connector address the routes will
 * use. Hireline's own server only speaks HTTP: HTTPS comes from a proxy in
 * front, which says so in X-Forwarded-Proto.
 */
export function pageOrigin(headers: Headers): string {
  return originFrom(headers, new URL("http://localhost:3000"));
}

function originFrom(headers: Headers, url: URL): string {
  if (env.HIRELINE_PUBLIC_URL) return env.HIRELINE_PUBLIC_URL;
  const host = headers.get("x-forwarded-host")?.split(",")[0]?.trim() || headers.get("host");
  const protocol = headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(/:$/, "");
  return host ? `${protocol}://${host}` : url.origin;
}
