import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
// Note: You can override model via client setup, but strict ENV default is safer for cost control if needed.
// However, the client (frontend) usually dictates the session config (system prompt, etc).
const GEMINI_LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-2.0-flash-exp'; 

const SUPABASE_URL = process.env.SUPABASE_URL;
// Use SERVICE ROLE key to verify JWTs properly or admin tasks if needed.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PROJECT_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables: GCP_PROJECT_ID, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Durmah Gemini Proxy Logic Ready');
});

const wss = new WebSocketServer({ server });

console.log(`Durmah Proxy starting on port ${PORT}`);

wss.on('connection', (ws: WebSocket, req) => {
  console.log('New client connection');
  let upstream: WebSocket | null = null;
  let isAuthenticated = false;
  let isAnon = false;

  // Buffer messages until upstream is ready
  const messageQueue: string[] = [];
  let isUpstreamOpen = false;

  ws.on('message', async (data: any) => {
    // 1. First message must contain Auth
    if (!isAuthenticated) {
        try {
            const str = data.toString();
            const payload = JSON.parse(str);
            
            // Expected payload: { auth: "SUPABASE_ACCESS_TOKEN" | null, ...gemini_setup_or_first_msg }
            // The client should send the Setup message WRAPPED or attached. 
            // Better: Client sends { auth: "..." } as FIRST packet. Proxy says "OK". Then flow continues.
            // OR: We follow the prompt requirement: "Browser sends Supabase access token in FIRST WS message (JSON)".
            // If the structure is { auth: "...", setup: {...} }, we strip auth and fwd setup.
            
            const token = payload.auth;

            if (token) {
                // Verify Supabase Token
                const { data: { user }, error } = await supabase.auth.getUser(token);
                if (error || !user) {
                    console.log("Invalid token, treating as anon if allowed or disconnect");
                    // Logic: "If no token: allow limited voice usage"
                    // We'll treat failed auth as Anon for now, or strict fail?
                    // User said: "Proxy validates token... If no token: allow limited voice usage"
                    // So we fall back to anon.
                    isAnon = true;
                    console.log(`User query param present but invalid: ${error?.message}. Using Anon.`);
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
                const accessToken = await client.getAccessToken();
                
                // Construct Vertex WebSocket URL
                // Endpoint: wss://us-central1-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent
                const host = `${LOCATION}-aiplatform.googleapis.com`;
                const path = `/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;
                const url = `wss://${host}${path}`;

                console.log(`Connecting upstream to ${url}`);
                
                upstream = new WebSocket(url, {
                    headers: {
                        'Authorization': `Bearer ${accessToken.token}`,
                        'Content-Type': 'application/json'
                    }
                });

                upstream.on('open', () => {
                   console.log("Upstream connected");
                   isUpstreamOpen = true;
                   
                   // If the payload had "setup" or other fields, forward them now (minus "auth").
                   delete payload.auth;
                   // If payload is seemingly empty or just auth, wait for next. 
                   // But if it has "setup", send it.
                   if (Object.keys(payload).length > 0) {
                      upstream?.send(JSON.stringify(payload));
                   }

                   // Process queued messages
                   while (messageQueue.length > 0) {
                       upstream?.send(messageQueue.shift());
                   }
                });

                upstream.on('message', (uData) => {
                    // Forward FROM upstream TO client
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(uData);
                    }
                });

                upstream.on('close', (code, reason) => {
                    console.log(`Upstream closed: ${code} ${reason}`);
                    ws.close(code, reason);
                });

                upstream.on('error', (err) => {
                    console.error("Upstream error:", err);
                    ws.close(1011, "Upstream Error");
                });

                // Mark authenticated (locally) so next messages just forward
                isAuthenticated = true; // (Done above, but ensures subsequent buffer logic works)
                
            } catch (err) {
                console.error("Failed to connect upstream:", err);
                ws.close(1011, "Upstream Connection Failed");
            }

        } catch (e) {
            console.error("Bad handshake payload:", e);
            ws.close(1008, "Invalid Handshake");
        }
        return;
    }

    // 2. Subsequent messages: Forward to Upstream
    if (isUpstreamOpen && upstream) {
        upstream.send(data);
    } else {
        // Queue until open
        messageQueue.push(data.toString());
    }
  });

  ws.on('close', () => {
    console.log("Client disconnected");
    if (upstream) {
        upstream.close();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
