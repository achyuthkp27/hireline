import path from "node:path";

import { describe, expect, it } from "vitest";

import { EnvError, parseEnv } from "./env";

// A hash of "correct horse" (scripts/hash-password.ts).
const PASSWORD_HASH = "argon2id:m=19456,t=2,p=1:CLZW5wQoCjh3Q9CHBp_JWw:Ak2xS7TYlYYrhemlgBkVxFmWXfcMq_rjd0mJGZcZFfA";

const valid = {
  HIRELINE_PASSWORD: PASSWORD_HASH,
  HIRELINE_SECRET: "a".repeat(32),
  DATABASE_URL: "postgresql://postgres:postgres@db:5432/hireline",
};

function problems(source: Record<string, string | undefined>): string[] {
  try {
    parseEnv(source);
  } catch (error) {
    if (error instanceof EnvError) return error.problems;
    throw error;
  }
  throw new Error("Expected parseEnv to throw");
}

describe("parseEnv", () => {
  it("accepts the required variables and fills in defaults", () => {
    expect(parseEnv(valid)).toEqual({
      ...valid,
      HIRELINE_DATA_DIR: "/data",
      HIRELINE_BACKUP_RETENTION_DAYS: 14,
      HIRELINE_TELEMETRY: undefined,
    });
  });

  it("reads whether the usage ping is on", () => {
    // Unset or empty: not decided, so Hireline asks (#172).
    expect(parseEnv({ ...valid, HIRELINE_TELEMETRY: "" }).HIRELINE_TELEMETRY).toBeUndefined();
    expect(parseEnv(valid).HIRELINE_TELEMETRY).toBeUndefined();
    expect(parseEnv({ ...valid, HIRELINE_TELEMETRY: "ON" }).HIRELINE_TELEMETRY).toBe("on");
    expect(parseEnv({ ...valid, HIRELINE_TELEMETRY: " Off " }).HIRELINE_TELEMETRY).toBe("off");
    expect(problems({ ...valid, HIRELINE_TELEMETRY: "false" })).toEqual(['HIRELINE_TELEMETRY must be on or off (got "false").']);
  });

  it("reads the optional variables", () => {
    const env = parseEnv({
      ...valid,
      HIRELINE_DATA_DIR: "/srv/hireline",
      HIRELINE_BACKUP_RETENTION_DAYS: "30",
      HIRELINE_AI_PROVIDER: "local",
      HIRELINE_AI_URL: "http://ollama:11434",
      HIRELINE_AI_MODEL: "llama3.1:8b",
      HIRELINE_AI_KEY: "sk-test",
    });
    expect(env).toMatchObject({
      HIRELINE_DATA_DIR: "/srv/hireline",
      HIRELINE_BACKUP_RETENTION_DAYS: 30,
      HIRELINE_AI_PROVIDER: "local",
      HIRELINE_AI_URL: "http://ollama:11434",
      HIRELINE_AI_MODEL: "llama3.1:8b",
      HIRELINE_AI_KEY: "sk-test",
    });
  });

  it("reads the AI timeout in seconds", () => {
    expect(parseEnv({ ...valid, HIRELINE_AI_TIMEOUT_SECONDS: " 300 " }).HIRELINE_AI_TIMEOUT_SECONDS).toBe(300);
    expect(() => parseEnv({ ...valid, HIRELINE_AI_TIMEOUT_SECONDS: "5m" })).toThrow(/whole number of seconds/);
    expect(() => parseEnv({ ...valid, HIRELINE_AI_TIMEOUT_SECONDS: "1" })).toThrow(/at least 5/);
  });

  it("resolves a relative data directory", () => {
    const env = parseEnv({ ...valid, HIRELINE_DATA_DIR: "./data" });
    expect(env.HIRELINE_DATA_DIR).toBe(path.resolve("data"));
  });

  it("treats empty values as unset", () => {
    const env = parseEnv({ ...valid, HIRELINE_AI_KEY: "", HIRELINE_DATA_DIR: " " });
    expect(env.HIRELINE_AI_KEY).toBeUndefined();
    expect(env.HIRELINE_DATA_DIR).toBe("/data");
    expect(problems({ ...valid, HIRELINE_PASSWORD: "" })).toEqual([
      expect.stringMatching(/^HIRELINE_PASSWORD is not set\./),
    ]);
  });

  it("names every missing required variable", () => {
    expect(problems({})).toEqual([
      expect.stringMatching(/^HIRELINE_PASSWORD is not set\. Set it to/),
      expect.stringMatching(/^HIRELINE_SECRET is not set\. .*openssl rand/),
      expect.stringMatching(/^DATABASE_URL is not set\. /),
    ]);
  });

  it("wants a hash of the password, not the password itself", () => {
    expect(problems({ ...valid, HIRELINE_PASSWORD: "correct horse" })).toEqual([
      expect.stringMatching(/^HIRELINE_PASSWORD must be a hash of your password, not the password itself\. .*hash-password/),
    ]);
    expect(parseEnv({ ...valid, HIRELINE_PASSWORD: ` ${PASSWORD_HASH}\n` }).HIRELINE_PASSWORD).toBe(PASSWORD_HASH);
  });

  it("rejects a secret shorter than 32 characters", () => {
    expect(problems({ ...valid, HIRELINE_SECRET: "short" })).toEqual([
      expect.stringMatching(/^HIRELINE_SECRET is too short \(5 characters\)\./),
    ]);
  });

  it("never echoes secret values", () => {
    const messages = problems({
      HIRELINE_PASSWORD: "hunter2",
      HIRELINE_SECRET: "tiny-secret",
      DATABASE_URL: "mysql://root:db-password@db/hireline",
    }).join("\n");
    expect(messages).not.toContain("hunter2");
    expect(messages).not.toContain("tiny-secret");
    expect(messages).not.toContain("db-password");
    expect(messages).toMatch(/DATABASE_URL must be a PostgreSQL connection string/);
  });

  it("rejects invalid optional values", () => {
    expect(
      problems({
        ...valid,
        HIRELINE_BACKUP_RETENTION_DAYS: "two weeks",
        HIRELINE_AI_PROVIDER: "gemini",
        HIRELINE_AI_URL: "ftp://example.com",
      }),
    ).toEqual([
      'HIRELINE_BACKUP_RETENTION_DAYS must be a whole number of days (got "two weeks").',
      'HIRELINE_AI_PROVIDER must be one of local, openai, anthropic, mistral, lmstudio (got "gemini").',
      "HIRELINE_AI_URL must be an http:// or https:// URL.",
    ]);
    expect(problems({ ...valid, HIRELINE_BACKUP_RETENTION_DAYS: "0" })).toEqual([
      "HIRELINE_BACKUP_RETENTION_DAYS must be at least 1.",
    ]);
  });
});

describe("job search variables (E14-4)", () => {
  it("reads the source and its keys", () => {
    expect(
      parseEnv({
        ...valid,
        HIRELINE_JOBS_SOURCE: "jsearch",
        HIRELINE_JSEARCH_KEY: "ak_test",
        HIRELINE_JSEARCH_HOST: "rapidapi",
        HIRELINE_ADZUNA_APP_ID: "app",
        HIRELINE_ADZUNA_KEY: "adz",
      }),
    ).toMatchObject({
      HIRELINE_JOBS_SOURCE: "jsearch",
      HIRELINE_JSEARCH_KEY: "ak_test",
      HIRELINE_JSEARCH_HOST: "rapidapi",
      HIRELINE_ADZUNA_APP_ID: "app",
      HIRELINE_ADZUNA_KEY: "adz",
    });
  });

  it("reads whether the Bundesagentur für Arbeit is offered, and refuses choosing it while it's off (#223)", () => {
    expect(parseEnv(valid).HIRELINE_JOBS_ARBEITSAGENTUR).toBeUndefined();
    expect(parseEnv({ ...valid, HIRELINE_JOBS_ARBEITSAGENTUR: " OFF " }).HIRELINE_JOBS_ARBEITSAGENTUR).toBe("off");
    expect(problems({ ...valid, HIRELINE_JOBS_ARBEITSAGENTUR: "no" })).toEqual(['HIRELINE_JOBS_ARBEITSAGENTUR must be on or off (got "no").']);
    expect(problems({ ...valid, HIRELINE_JOBS_SOURCE: "arbeitsagentur", HIRELINE_JOBS_ARBEITSAGENTUR: "off" })).toEqual([
      "HIRELINE_JOBS_SOURCE is arbeitsagentur, but HIRELINE_JOBS_ARBEITSAGENTUR is off. Choose another source, or remove one of the two.",
    ]);
  });

  it("rejects sources and hosts it doesn't know, without echoing keys", () => {
    expect(problems({ ...valid, HIRELINE_JOBS_SOURCE: "linkedin", HIRELINE_JSEARCH_HOST: "google", HIRELINE_JSEARCH_KEY: "ak_secret" })).toEqual([
      'HIRELINE_JOBS_SOURCE must be one of jsearch, adzuna, arbeitsagentur, off (got "linkedin").',
      'HIRELINE_JSEARCH_HOST must be openwebninja or rapidapi (got "google").',
    ]);
  });
});
