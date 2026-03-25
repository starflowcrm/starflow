type WSEventHandler = (data: Record<string, unknown>) => void;

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

class StarflowWS {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<WSEventHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    this.doConnect();
  }

  private doConnect() {
    if (!this.token) return;

    try {
      this.ws = new WebSocket(`${WS_BASE}/ws?token=${this.token}`);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type as string;
          const typeHandlers = this.handlers.get(type);
          if (typeHandlers) {
            typeHandlers.forEach((handler) => handler(data));
          }
          // Also fire wildcard handlers
          const allHandlers = this.handlers.get("*");
          if (allHandlers) {
            allHandlers.forEach((handler) => handler(data));
          }
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.doConnect();
    }, 3000);
  }

  on(type: string, handler: WSEventHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.token = null;
    this.ws?.close();
    this.ws = null;
  }
}

export const starflowWS = new StarflowWS();
