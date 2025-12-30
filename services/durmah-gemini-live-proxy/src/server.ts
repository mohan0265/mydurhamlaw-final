import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import { GoogleAuth } from "google-auth-library";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const PORT = Number(process.env.PORT) || 8080;

const PROJECT_ID = mustEnv("GCP_PROJECT_ID");
const LOCATION = process.env.GCP_LOCATION || "us-central1";
// Note: You can override model via client setup, but strict ENV default is safer for cost control if needed.
// However, the client (frontend) usually dictates the session config (system prompt, etc).
const GEMINI_LIVE_MODEL =
  process.env.GEMINI_LIVE_MODEL || "gemini-live-2.5-flash-native-audio";

const SUPABASE_URL = mustEnv("SUPABASE_URL");
// Use SERVICE ROLE key to verify JWTs properly or admin tasks if needed.
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

const UPSTREAM_PATH = "/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent";

const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/health")) {
    const payload = {
      ok: true,
      project: PROJECT_ID,
      location: LOCATION,
      model: GEMINI_LIVE_MODEL,
      upstream_path: UPSTREAM_PATH,
      time: new Date().toISOString(),
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Durmah Gemini Proxy Logic Ready");
});

const wss = new WebSocketServer({ server });

console.log(`Durmah Proxy starting on port ${PORT}`);

wss.on("connection", (ws: WebSocket, req) => {
  console.log("New client connection");

  let upstream: WebSocket | null = null;
  let isAuthenticated = false;
  let isAnon = false;

  // Buffer messages until upstream is ready
  const messageQueue: string[] = [];
  let isUpstreamOpen = false;

  function extractModelId(rawModel?: string): string {
    const trimmed = (rawModel || "").trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("projects/")) {
      const match = trimmed.match(/\/models\/([^/]+)$/);
      return match?.[1] || trimmed;
    }
    if (trimmed.includes("/models/")) {
      return trimmed.split("/models/").pop() || "";
    }
    if (trimmed.startsWith("models/")) {
      return trimmed.slice("models/".length);
    }
    return trimmed.replace(/^models\//, "");
  }

  function normalizeModelResource(rawModel?: string): string {
    const fallbackId = extractModelId(GEMINI_LIVE_MODEL);
    const candidateId = extractModelId(rawModel);
    const resolved = candidateId || fallbackId;
    if (resolved.startsWith("projects/")) {
      return resolved;
    }
    return `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${resolved}`;
  }

  function sendClientError(
    target: WebSocket,
    message: string,
    code?: string | number,
    details?: Record<string, unknown>
  ) {
    if (target.readyState !== WebSocket.OPEN) return;
    const payload = {
      error: {
        message,
        code: code ?? "upstream_error",
        details: details ?? {},
      },
    };
    target.send(JSON.stringify(payload));
  }

  function toCamelCaseKey(key: string): string {
    if (!key.includes("_")) return key;
    return key.replace(/_([a-z])/g, (_m, chr: string) => chr.toUpperCase());
  }

  function toCamelCase(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => toCamelCase(item));
    }
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        out[toCamelCaseKey(key)] = toCamelCase(val);
      }
      return out;
    }
    return value;
  }

  const ONEOF_KEYS = ["setup", "realtimeInput", "clientContent", "toolResponse"] as const;

  function sanitizeOneof(payload: Record<string, unknown>): {
    sanitized: Record<string, unknown>;
    dropped: string[];
    kept: string | null;
  } {
    const cloned = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    delete cloned.messageType;
    delete cloned.message_type;

    const present = ONEOF_KEYS.filter((key) => key in cloned);
    if (present.length <= 1) {
      return { sanitized: cloned, dropped: [], kept: present[0] ?? null };
    }

    let kept: (typeof ONEOF_KEYS)[number] | null = null;
    if (cloned.realtimeInput !== undefined) {
      kept = "realtimeInput";
    } else if (cloned.setup !== undefined) {
      kept = "setup";
    } else if (cloned.clientContent !== undefined) {
      kept = "clientContent";
    } else if (cloned.toolResponse !== undefined) {
      kept = "toolResponse";
    }

    const dropped = kept ? present.filter((key) => key !== kept) : present;
    for (const key of dropped) {
      delete cloned[key];
    }

    return { sanitized: cloned, dropped, kept };
  }

  function normalizeClientPayload(raw: string): {
    text: string;
    kept: string | null;
    dropped: string[];
    sanitized: Record<string, unknown> | null;
  } {
    try {
      const parsed = JSON.parse(raw);
      const normalized = toCamelCase(parsed);
      const { sanitized, dropped, kept } = sanitizeOneof(normalized as Record<string, unknown>);
      return {
        text: JSON.stringify(sanitized),
        kept,
        dropped,
        sanitized,
      };
    } catch {
      return { text: raw, kept: null, dropped: [], sanitized: null };
    }
  }

  ws.on("message", async (data: any) => {
    // 1) First message must contain Auth (handshake)
    if (!isAuthenticated) {
      try {
        const str = data.toString();
        const payload = JSON.parse(str);

        // Expected payload: { auth: "SUPABASE_ACCESS_TOKEN" | null, ...other_fields }
        const token = payload.auth;

        if (token) {
          // Verify Supabase Token
          const { data: userData, error } = await supabase.auth.getUser(token);
          const user = userData?.user;

          if (error || !user) {
            console.log("Invalid token, treating as anon if allowed or disconnect");
            isAnon = true;
            console.log(`User token present but invalid: ${error?.message}. Using Anon.`);
          } else {
            console.log(`User authenticated: ${user.id}`);
            isAuthenticated = true;
          }
        } else {
          // No token provided -> Anon
          isAnon = true;
          console.log("No auth token. Using Anon mode.");
        }

        // --- Connect Upstream ---
        try {
          const client = await auth.getClient();

          // google-auth-library returns either:
          // - a string access token, OR
          // - an object with { token: string | null }
          const accessTokenResp: any = await (client as any).getAccessToken();
          const accessToken: string | null =
            typeof accessTokenResp === "string" ? accessTokenResp : accessTokenResp?.token ?? null;

          if (!accessToken) {
            throw new Error("Could not obtain Google access token for Vertex AI.");
          }

          // Construct Vertex WebSocket URL
          // Endpoint: wss://{location}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent
          const host = `${LOCATION}-aiplatform.googleapis.com`;
          const url = `wss://${host}${UPSTREAM_PATH}`;

          console.log(`Upstream location=${LOCATION} url=${url}`);

          upstream = new WebSocket(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          upstream.on("open", () => {
            console.log("Upstream connected");
            isUpstreamOpen = true;

            // If the payload had other fields, forward them now (minus "auth")
            delete payload.auth;

            const setup =
              payload.setup && typeof payload.setup === "object" ? payload.setup : {};
            const normalizedModel = normalizeModelResource(setup.model);
            setup.model = normalizedModel;
            if (!setup.generation_config) {
              setup.generation_config = {};
            }
            if (!setup.generation_config.response_modalities) {
              setup.generation_config.response_modalities = ["AUDIO", "TEXT"];
            }
            payload.setup = setup;
            console.log(`Forwarding setup model=${normalizedModel}`);

            // If payload is not empty (beyond auth), send it
            if (Object.keys(payload).length > 0) {
              const normalized = normalizeClientPayload(JSON.stringify(payload));
              if (normalized.dropped.length > 0) {
                console.warn(
                  `Sanitized oneof (dropped: ${normalized.dropped.join(", ")})`
                );
              }
              if (normalized.kept) {
                console.log(`Forwarding: ${normalized.kept}`);
              }
              upstream?.send(normalized.text);
            }

            // Process queued messages (IMPORTANT: shift() can return undefined)
            while (messageQueue.length > 0) {
              const msg = messageQueue.shift();
              if (msg !== undefined) {
                upstream?.send(msg);
              }
            }
          });

          upstream.on("message", (uData) => {
            try {
              const text = typeof uData === "string" ? uData : uData.toString();
              const parsed = JSON.parse(text);
              if (parsed?.error || parsed?.serverContent?.error) {
                const upstreamError = parsed?.error || parsed?.serverContent?.error;
                console.error("Upstream error payload:", upstreamError);
                sendClientError(
                  ws,
                  upstreamError?.message || "Upstream error",
                  upstreamError?.code,
                  { upstream: upstreamError }
                );
              }
            } catch {
              // ignore parse errors
            }
            // Forward FROM upstream TO client
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(uData);
            }
          });

          upstream.on("close", (code, reason) => {
            const reasonText = reason?.toString() || "";
            console.log(`Upstream closed: ${code} ${reasonText}`);
            sendClientError(
              ws,
              `Upstream closed (${code})${reasonText ? `: ${reasonText}` : ""}`,
              code,
              { reason: reasonText }
            );
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.close(code, reasonText);
              }
            }, 150);
          });

          upstream.on("error", (err) => {
            console.error("Upstream error:", err);
            sendClientError(
              ws,
              err instanceof Error ? err.message : "Upstream error",
              "upstream_error",
              { error: String(err) }
            );
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.close(1011, "Upstream Error");
              }
            }, 150);
          });

          // Allow subsequent messages to flow
          isAuthenticated = true;
        } catch (err) {
          console.error("Failed to connect upstream:", err);
        sendClientError(
          ws,
          err instanceof Error ? err.message : "Upstream connection failed",
          "upstream_connect_failed"
        );
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1011, "Upstream Connection Failed");
          }
        }, 150);
      }
      } catch (e) {
        console.error("Bad handshake payload:", e);
        sendClientError(
          ws,
          e instanceof Error ? e.message : "Invalid handshake",
          "invalid_handshake"
        );
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1008, "Invalid Handshake");
          }
        }, 150);
      }

      return;
    }

    // 2) Subsequent messages: Forward to Upstream
    const normalized = normalizeClientPayload(data.toString());
    if (normalized.dropped.length > 0) {
      console.warn(`Sanitized oneof (dropped: ${normalized.dropped.join(", ")})`);
    }
    if (normalized.kept) {
      if (normalized.kept === "realtimeInput") {
        const chunks = (normalized.sanitized as any)?.realtimeInput?.mediaChunks;
        const count = Array.isArray(chunks) ? chunks.length : 0;
        console.log(`Forwarding: realtimeInput mediaChunks=${count}`);
      } else {
        console.log(`Forwarding: ${normalized.kept}`);
      }
    }

    if (isUpstreamOpen && upstream) {
      upstream.send(normalized.text);
    } else {
      // Queue until open
      messageQueue.push(normalized.text);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (upstream) upstream.close();
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
