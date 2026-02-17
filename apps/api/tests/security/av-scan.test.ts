import { afterEach, describe, expect, it } from "vitest";
import { getAvScanConfig, scanBufferWithClamAv } from "@/server/security/av-scan";

const ENV_KEYS = [
  "AV_SCAN_ENABLED",
  "AV_SCAN_FAIL_CLOSED",
  "CLAMAV_HOST",
  "CLAMAV_PORT",
  "CLAMAV_TIMEOUT_MS",
] as const;

const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

describe("AV scan config", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = ORIGINAL_ENV[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("uses secure defaults", () => {
    for (const key of ENV_KEYS) delete process.env[key];

    const cfg = getAvScanConfig();
    expect(cfg.enabled).toBe(false);
    expect(cfg.failClosed).toBe(false);
    expect(cfg.host).toBe("127.0.0.1");
    expect(cfg.port).toBe(3310);
    expect(cfg.timeoutMs).toBe(2500);
  });

  it("parses explicit env configuration", () => {
    process.env.AV_SCAN_ENABLED = "true";
    process.env.AV_SCAN_FAIL_CLOSED = "true";
    process.env.CLAMAV_HOST = "clamav.internal";
    process.env.CLAMAV_PORT = "3311";
    process.env.CLAMAV_TIMEOUT_MS = "5000";

    const cfg = getAvScanConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.failClosed).toBe(true);
    expect(cfg.host).toBe("clamav.internal");
    expect(cfg.port).toBe(3311);
    expect(cfg.timeoutMs).toBe(5000);
  });
});

describe("scanBufferWithClamAv", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = ORIGINAL_ENV[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("skips network scan when AV is disabled", async () => {
    process.env.AV_SCAN_ENABLED = "false";
    const cfg = getAvScanConfig();
    const payload = Buffer.from("safe-file");
    const arrayBuffer = payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength);
    const result = await scanBufferWithClamAv(arrayBuffer, cfg);

    expect(result.clean).toBe(true);
    expect(result.unavailable).toBeUndefined();
  });
});
