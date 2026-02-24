import net from "net";

export interface AvScanConfig {
  enabled: boolean;
  failClosed: boolean;
  host: string;
  port: number;
  timeoutMs: number;
}

export interface AvScanResult {
  clean: boolean;
  unavailable?: boolean;
  reason?: string;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") return false;
  return fallback;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) return fallback;
  return parsed;
}

function parseTimeout(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 100 || parsed > 30_000) return fallback;
  return parsed;
}

export function getAvScanConfig(): AvScanConfig {
  return {
    enabled: parseBoolean(process.env.AV_SCAN_ENABLED, false),
    failClosed: parseBoolean(process.env.AV_SCAN_FAIL_CLOSED, false),
    host: process.env.CLAMAV_HOST?.trim() || "127.0.0.1",
    port: parsePort(process.env.CLAMAV_PORT, 3310),
    timeoutMs: parseTimeout(process.env.CLAMAV_TIMEOUT_MS, 2500),
  };
}

function parseClamAvResponse(response: string): AvScanResult {
  if (response.includes(" OK")) return { clean: true };
  if (response.includes(" FOUND")) {
    return {
      clean: false,
      reason: response,
    };
  }
  if (response.includes("ERROR")) {
    return {
      clean: false,
      unavailable: true,
      reason: response,
    };
  }
  return {
    clean: false,
    unavailable: true,
    reason: `Unexpected ClamAV response: ${response}`,
  };
}

async function writeChunk(socket: net.Socket, chunk: Buffer): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    socket.write(chunk, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function scanBufferWithClamAv(
  input: ArrayBuffer,
  cfg: AvScanConfig,
): Promise<AvScanResult> {
  if (!cfg.enabled) return { clean: true };

  const content = Buffer.from(new Uint8Array(input));

  try {
    const response = await new Promise<string>((resolve, reject) => {
      const socket = net.createConnection({ host: cfg.host, port: cfg.port });
      const chunks: Buffer[] = [];
      let settled = false;

      const finish = (err: Error | null, result?: string): void => {
        if (settled) return;
        settled = true;
        socket.removeAllListeners();
        socket.destroy();
        if (err) reject(err);
        else resolve(result ?? "");
      };

      socket.setTimeout(cfg.timeoutMs, () => {
        finish(new Error(`ClamAV timeout after ${cfg.timeoutMs}ms`));
      });

      socket.on("error", (err) => finish(err));
      socket.on("data", (data) => chunks.push(data));
      socket.on("end", () => {
        finish(null, Buffer.concat(chunks).toString("utf8").trim());
      });

      socket.on("connect", async () => {
        try {
          // ClamAV INSTREAM protocol:
          // 1) "zINSTREAM\0"
          // 2) Repeated: 4-byte BE length + data
          // 3) 4-byte zero length terminator
          await writeChunk(socket, Buffer.from("zINSTREAM\0", "utf8"));

          const chunkSize = 64 * 1024;
          for (let offset = 0; offset < content.length; offset += chunkSize) {
            const chunk = content.subarray(offset, Math.min(offset + chunkSize, content.length));
            const lenPrefix = Buffer.allocUnsafe(4);
            lenPrefix.writeUInt32BE(chunk.length, 0);
            await writeChunk(socket, lenPrefix);
            await writeChunk(socket, chunk);
          }

          const eof = Buffer.alloc(4); // zero-length terminator
          await writeChunk(socket, eof);
          socket.end();
        } catch (err) {
          finish(err instanceof Error ? err : new Error(String(err)));
        }
      });
    });

    return parseClamAvResponse(response);
  } catch (err) {
    return {
      clean: false,
      unavailable: true,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

