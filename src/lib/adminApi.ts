const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("starflow_admin_token");
}

export function setAdminToken(token: string) {
  localStorage.setItem("starflow_admin_token", token);
}

export function clearAdminToken() {
  localStorage.removeItem("starflow_admin_token");
}

export function hasAdminToken(): boolean {
  return !!getAdminToken();
}

async function adminRequest(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    clearAdminToken();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const adminAuthApi = {
  login: (secret: string) =>
    adminRequest("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ secret }),
    }),
};

export const adminApi = {
  getStats: () => adminRequest("/admin/stats"),

  getAgencies: () => adminRequest("/admin/agencies"),

  getAgency: (id: number) => adminRequest(`/admin/agencies/${id}`),

  adjustCredits: (agencyId: number, amount: number, note: string) =>
    adminRequest(`/admin/agencies/${agencyId}/adjust-credits`, {
      method: "POST",
      body: JSON.stringify({ amount, note }),
    }),

  setSubscriptionStatus: (agencyId: number, status: string) =>
    adminRequest(`/admin/agencies/${agencyId}/set-subscription-status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  impersonate: (agencyId: number) =>
    adminRequest(`/admin/agencies/${agencyId}/impersonate`, { method: "POST" }),

  getSales: (params?: { agency_id?: number; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.agency_id) query.set("agency_id", String(params.agency_id));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return adminRequest(`/admin/sales${qs ? `?${qs}` : ""}`);
  },

  getSessions: () => adminRequest("/admin/system/sessions"),
};
