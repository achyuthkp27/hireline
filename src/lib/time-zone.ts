import "server-only";

import { cookies } from "next/headers";

import { TIME_ZONE_COOKIE } from "@/lib/greeting";
import { loadSettings, saveSettings } from "@/lib/settings-data";

/**
 * The browser's time zone as it last told the server (the dashboard's
 * greeting keeps it in a cookie), for showing times the user picked, such as
 * an interview (E9-9). Undefined when unknown: then the server's own is used.
 */
export async function userTimeZone(): Promise<string | undefined> {
  const value = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  if (!value) return undefined;
  try {
    const zone = decodeURIComponent(value);
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return undefined;
  }
}

/**
 * The user's time zone where there may be no request, as in the inbox
 * check or a job: this request's browser zone when there is one, else the
 * one the browser last told the server, else the server's own.
 */
export async function lastKnownTimeZone(): Promise<string> {
  let zone: string | undefined;
  try {
    zone = await userTimeZone();
  } catch {
    // No request: cookies() can't be read here.
  }
  return zone ?? (await loadSettings()).browserTimeZone ?? serverTimeZone();
}

/**
 * The server's own zone. Without one, as with TZ set but empty (Compose
 * passes it so when .env leaves it out), Intl calls it "Etc/Unknown" and
 * then refuses that name; such a server keeps UTC, so that's the answer.
 */
export function serverTimeZone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return "UTC";
  }
}

/** Keeps the browser's zone for work done without a request; called after a page with the zone its request had. */
export async function rememberBrowserTimeZone(zone: string | undefined): Promise<void> {
  if (!zone) return;
  const { browserTimeZone } = await loadSettings();
  if (browserTimeZone !== zone) await saveSettings({ browserTimeZone: zone });
}
