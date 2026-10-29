import { beforeEach, describe, expect, it, vi } from "vitest";

import { pageOrigin, publicOrigin } from "./origin";

const publicUrl = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("@/lib/env", () => ({
  env: {
    get HIRELINE_PUBLIC_URL() {
      return publicUrl.value;
    },
  },
}));

beforeEach(() => {
  publicUrl.value = undefined;
});

// The route sees what the proxy passed on; the page only its headers.
const request = (headers: Record<string, string>) => new Request("http://0.0.0.0:3000/api/google/connect", { headers });

describe("the address Hireline is reached at", () => {
  it("is the same for the routes and for Settings, whatever the proxy says", () => {
    const cases: Record<string, string>[] = [
      { host: "192.168.1.20:3000" },
      { host: "localhost:3000" },
      { host: "app:3000", "x-forwarded-host": "hireline.example.com", "x-forwarded-proto": "https" },
      { host: "app:3000", "x-forwarded-host": "hireline.example.com, proxy.internal", "x-forwarded-proto": "https, http" },
    ];
    for (const headers of cases) {
      expect(pageOrigin(new Headers(headers))).toBe(publicOrigin(request(headers)));
    }
  });

  it("takes plain HTTP at a network address as HTTP, since that's what Google is sent back to", () => {
    expect(pageOrigin(new Headers({ host: "192.168.1.20:3000" }))).toBe("http://192.168.1.20:3000");
    expect(pageOrigin(new Headers({ host: "hireline.example.com", "x-forwarded-proto": "https" }))).toBe("https://hireline.example.com");
  });

  it("is HIRELINE_PUBLIC_URL when that's set", () => {
    publicUrl.value = "https://hireline.example.com";
    expect(pageOrigin(new Headers({ host: "192.168.1.20:3000" }))).toBe("https://hireline.example.com");
    expect(publicOrigin(request({ host: "192.168.1.20:3000" }))).toBe("https://hireline.example.com");
  });
});
