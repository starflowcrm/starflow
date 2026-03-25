const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("starflow_token");
}

export function getAuthData(): {
  token: string;
  role: string;
  name: string;
  agency_id: number;
  user_id: number;
} | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("starflow_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthData(data: {
  token: string;
  role: string;
  name: string;
  agency_id: number;
  user_id: number;
}) {
  localStorage.setItem("starflow_token", data.token);
  localStorage.setItem("starflow_auth", JSON.stringify(data));
}

export function clearAuth() {
  localStorage.removeItem("starflow_token");
  localStorage.removeItem("starflow_auth");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
};

// Accounts
export const accountsApi = {
  list: () => request("/accounts"),
  startAuth: (phone: string) =>
    request("/accounts/start-auth", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  verifyCode: (auth_token: string, phone: string, code: string) =>
    request("/accounts/verify-code", {
      method: "POST",
      body: JSON.stringify({ auth_token, phone, code }),
    }),
  delete: (id: number) => request(`/accounts/${id}`, { method: "DELETE" }),
  // QR Code auth
  startQrAuth: () =>
    request("/accounts/start-qr-auth", { method: "POST" }),
  qrStatus: (auth_token: string) =>
    request(`/accounts/qr-status/${auth_token}`),
  // Proxy
  updateProxy: (
    id: number,
    data: {
      proxy_host: string | null;
      proxy_port: number | null;
      proxy_username: string | null;
      proxy_password: string | null;
    }
  ) =>
    request(`/accounts/${id}/proxy`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Chatters
export const chattersApi = {
  list: () => request("/chatters"),
  create: (data: { name: string; email: string; password: string }) =>
    request("/chatters", { method: "POST", body: JSON.stringify(data) }),
  assign: (chatterId: number, accountIds: number[]) =>
    request(`/chatters/${chatterId}/assign`, {
      method: "POST",
      body: JSON.stringify({ account_ids: accountIds }),
    }),
  delete: (id: number) => request(`/chatters/${id}`, { method: "DELETE" }),
};

// Conversations
export const conversationsApi = {
  list: () => request("/conversations"),
  getMessages: (id: number) => request(`/conversations/${id}/messages`),
  assign: (id: number, chatterId: number | null) =>
    request(`/conversations/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ chatter_id: chatterId }),
    }),
};

// Messages
export const messagesApi = {
  send: (conversationId: number, text: string) =>
    request("/messages/send", {
      method: "POST",
      body: JSON.stringify({ conversation_id: conversationId, text }),
    }),
  sendPaidMedia: (data: {
    conversation_id: number;
    star_count: number;
    file_data: string;
    media_type: "photo" | "video";
    caption?: string;
  }) =>
    request("/messages/send-paid-media", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Bot token
export const botTokenApi = {
  get: () => request("/accounts/bot-token"),
  update: (data: { bot_token?: string; business_connection_id?: string }) =>
    request("/accounts/bot-token", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
