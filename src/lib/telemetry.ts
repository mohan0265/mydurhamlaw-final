// Telemetry system for Caseway using Plausible
interface TelemetryEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
  url?: string;
}

interface TelemetryOptions {
  domain?: string;
  apiHost?: string;
  enabled?: boolean;
}

class Telemetry {
  private domain: string;
  private apiHost: string;
  private enabled: boolean;

  constructor(options: TelemetryOptions = {}) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const parsedHost = (() => {
      try {
        return appUrl ? new URL(appUrl).host : "";
      } catch {
        return "";
      }
    })();
    this.domain = options.domain || parsedHost || "casewaylaw.ai";
    this.apiHost = options.apiHost || "https://plausible.io";
    this.enabled = options.enabled !== false && typeof window !== "undefined";
  }

  private async send(event: TelemetryEvent) {
    if (!this.enabled) return;

    try {
      const payload = {
        domain: this.domain,
        name: event.name,
        url: event.url || window.location.href,
        props: event.props || {},
      };

      await fetch(`${this.apiHost}/api/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.debug("Telemetry error:", error);
    }
  }

  // Page view tracking
  pageView(url?: string) {
    this.send({
      name: "pageview",
      url: url || window?.location?.href,
    });
  }

  // API error tracking
  apiError(endpoint: string, error: string, statusCode?: number) {
    this.send({
      name: "api_error",
      props: {
        endpoint,
        error,
        status_code: statusCode || 0,
      },
    });
  }

  // Chat request tracking
  chatRequest(mode?: string, module?: string) {
    this.send({
      name: "chat_request",
      props: {
        mode: mode || "default",
        module: module || "general",
      },
    });
  }

  // Pomodoro session tracking
  pomodoroStart(duration: number, topic?: string) {
    this.send({
      name: "pomodoro_start",
      props: {
        duration_min: duration,
        topic: topic || "general",
      },
    });
  }

  pomodoroEnd(duration: number, completed: boolean, topic?: string) {
    this.send({
      name: "pomodoro_end",
      props: {
        duration_min: duration,
        completed: completed ? 1 : 0,
        topic: topic || "general",
      },
    });
  }

  // Assignment tracking
  assignmentCreated(module?: string, type?: string) {
    this.send({
      name: "assignment_created",
      props: {
        module: module || "unknown",
        type: type || "general",
      },
    });
  }

  // Mood tracking
  moodSubmit(score: number, stressors?: number) {
    this.send({
      name: "mood_submit",
      props: {
        score,
        stressors_count: stressors || 0,
      },
    });
  }

  // Peer interaction tracking
  peerProfileView() {
    this.send({ name: "peer_profile_view" });
  }

  // Generic event tracking
  track(name: string, props?: Record<string, string | number | boolean>) {
    this.send({ name, props });
  }
}

// Initialize telemetry
const telemetry = new Telemetry({
  domain: process.env.PLAUSIBLE_DOMAIN,
  enabled:
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_TELEMETRY === "true",
});

export { telemetry };
export default telemetry;
