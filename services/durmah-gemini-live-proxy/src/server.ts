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

const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/health")) {
    const payload = {
      ok: true,
      project: PROJECT_ID,
      location: LOCATION,
      model: GEMINI_LIVE_MODEL,
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
          const path = `/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent`;
          const url = `wss://${host}${path}`;

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
              upstream?.send(JSON.stringify(payload));
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
            ws.close(code, reasonText);
          });

          upstream.on("error", (err) => {
            console.error("Upstream error:", err);
            sendClientError(
              ws,
              err instanceof Error ? err.message : "Upstream error",
              "upstream_error",
              { error: String(err) }
            );
            ws.close(1011, "Upstream Error");
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
          ws.close(1011, "Upstream Connection Failed");
        }
      } catch (e) {
        console.error("Bad handshake payload:", e);
        sendClientError(
          ws,
          e instanceof Error ? e.message : "Invalid handshake",
          "invalid_handshake"
        );
        ws.close(1008, "Invalid Handshake");
      }

      return;
    }

    // 2) Subsequent messages: Forward to Upstream
    if (isUpstreamOpen && upstream) {
      upstream.send(data);
    } else {
      // Queue until open
      messageQueue.push(data.toString());
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
