# Durmah Gemini Live Proxy

This service acts as a secure WebSocket proxy between the Caseway client and Google's Vertex AI Gemini Live API.

It handles:

1.  **Authentication**: Validates Supabase JWTs sent by the client.
2.  **Upstream Connection**: Authenticates with Google Cloud (Vertex AI) using service identity.
3.  **Protocol Forwarding**: Tunnels the Gemini Live BidiStreaming protocol.

## Prerequisites

- Google Cloud Project with Vertex AI API enabled.
- Service Account with `Vertex AI User` role.
- Supabase Project.

## Environment Variables

Create a `.env` file (or set in Cloud Run):

```bash
PORT=8080
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GEMINI_LIVE_MODEL=gemini-2.0-flash-exp (or whichever model id is valid for Live)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...
```

## Health Check

If you deploy the US proxy, verify:

- `https://durmah-gemini-live-proxy-us-482960166397.us-central1.run.app/health`

The WebSocket client should use:

- `wss://durmah-gemini-live-proxy-us-482960166397.us-central1.run.app`

## Deployment (Cloud Run)

1.  **Build Container**:

    ```bash
    gcloud builds submit --tag gcr.io/YOUR_PROJECT/durmah-gemini-live-proxy
    ```

2.  **Deploy**:
    ```bash
    gcloud run deploy durmah-gemini-live-proxy \
      --image gcr.io/YOUR_PROJECT/durmah-gemini-live-proxy \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars GCP_PROJECT_ID=...,SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...
    ```
    _Note: We allow unauthenticated at the Cloud Run ingress because the proxy itself handles application-level auth (Supabase)._

## Architecture

- **Client**: `useDurmahGeminiLive.ts` connects to this proxy.
- **Handshake**: First message from client must be JSON: `{ "auth": "SUPABASE_TOKEN", "setup": { ... } }`.
- **Proxy**:
  - Verifies `auth` token with Supabase.
  - Connects to Vertex AI via WebSocket.
  - Forwards `setup` payload to Vertex.
  - Streams audio/text bidirectionally.
