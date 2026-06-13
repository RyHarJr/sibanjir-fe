const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request gagal");
  return data;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { token: string; user: User } }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    request<{ success: boolean; data: { token: string; user: User } }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(body) }
    ),

  me: () =>
    request<{ success: boolean; data: User & { _count: { reports: number; verifications: number } } }>(
      "/auth/me"
    ),

  // ── Reports ───────────────────────────────────────────────────────────
  getReports: (params?: {
    status?: string;
    severity?: string;
    sort?: "latest" | "deepest" | "confidence";
    userId?: number;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.status)   q.set("status", params.status);
    if (params?.severity) q.set("severity", params.severity);
    if (params?.sort)     q.set("sort", params.sort);
    if (params?.userId)   q.set("userId", String(params.userId));
    if (params?.page)     q.set("page", String(params.page));
    if (params?.limit)    q.set("limit", String(params.limit));
    if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params?.dateTo)   q.set("dateTo", params.dateTo);
    const qs = q.toString();
    return request<{ success: boolean; data: FloodReport[]; meta: PaginationMeta }>(
      `/reports${qs ? `?${qs}` : ""}`
    );
  },

  getReport: (id: number | string) =>
    request<{ success: boolean; data: FloodReportDetail }>(`/reports/${id}`),

  createReport: (body: CreateReportBody) =>
    request<{ success: boolean; data: FloodReport }>("/reports", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyReport: (id: number | string, vote: "confirm" | "reject", comment?: string) =>
    request<{ success: boolean; data: { confirms: number; rejects: number; confidenceScore: number } }>(
      `/reports/${id}/verify`,
      { method: "POST", body: JSON.stringify({ vote, comment }) }
    ),

  adminVerifyReport: (id: number | string, action: "verify" | "reject") =>
    request<{ success: boolean; data: FloodReport }>(`/reports/${id}/admin-verify`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),

  updateReport: (id: number | string, body: { waterDepthCm: number; status: string; description?: string }) =>
    request<{ success: boolean }>(`/reports/${id}/update`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteReport: (id: number | string) =>
    request<{ success: boolean }>(`/reports/${id}`, { method: "DELETE" }),

  uploadReportPhotos: (id: number | string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f));
    return request<{ success: boolean; data: ReportPhoto[] }>(`/reports/${id}/photos`, {
      method: "POST",
      body: formData,
    });
  },

  // ── Map ───────────────────────────────────────────────────────────────
  getMapReports: (dateFrom?: string, dateTo?: string) => {
    const q = new URLSearchParams();
    if (dateFrom) q.set("dateFrom", dateFrom);
    if (dateTo) q.set("dateTo", dateTo);
    const qs = q.toString();
    return request<{ success: boolean; data: MapReport[] }>(`/map/reports${qs ? `?${qs}` : ""}`);
  },

  getMapZones: () =>
    request<{ success: boolean; data: MapZone[] }>("/map/zones"),

  getNearby: (lat: number, lng: number, radius?: number) => {
    const q = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (radius) q.set("radius", String(radius));
    return request<{ success: boolean; data: FloodReport[] }>(`/map/nearby?${q}`);
  },

  getSafeRoute: (originLat: number, originLng: number, destLat: number, destLng: number) =>
    request<{ success: boolean; data: SafeRouteData }>("/map/safe-route", {
      method: "POST",
      body: JSON.stringify({ originLat, originLng, destLat, destLng }),
    }),

  // ── Notifications ─────────────────────────────────────────────────────
  getNotifications: () =>
    request<{ success: boolean; data: Notification[]; meta: { unreadCount: number } }>(
      "/notifications"
    ),

  readAll: () =>
    request<{ success: boolean }>("/notifications/read-all", { method: "PATCH" }),

  readOne: (id: number) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: "PATCH" }),

  // ── Districts ─────────────────────────────────────────────────────────
  getDistricts: () =>
    request<{ success: boolean; data: District[] }>("/districts"),

  getStats: () =>
    request<{ success: boolean; data: AdminStats }>("/districts/stats"),

  getPublicStats: async () => {
    const [reportsRes, mapRes] = await Promise.all([
      request<{ success: boolean; data: FloodReport[]; meta: PaginationMeta }>("/reports?status=active&limit=1"),
      request<{ success: boolean; data: MapZone[] }>("/map/zones"),
    ]);
    const activeCount = reportsRes.meta.total;
    const highestZone = mapRes.data.sort((a, b) => b.avgDepth - a.avgDepth)[0];
    return {
      activeReports: activeCount,
      highestRiskDistrict: highestZone?.districtName ?? "—",
    };
  },

  // ── Users (Admin) ─────────────────────────────────────────────────────
  getUsers: () => 
    request<{ success: boolean; data: (User & { _count: { reports: number, verifications: number } })[] }>("/users"),
    
  updateUserRole: (id: number | string, role: "admin" | "user") =>
    request<{ success: boolean; data: User }>(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role })
    }),

  // ── BMKG Weather ──────────────────────────────────────────────────────
  getWeather: (adm4?: string) => {
    const q = adm4 ? `?adm4=${adm4}` : "";
    return request<{ success: boolean; data: WeatherData }>(`/weather${q}`);
  }
};

// ── Types ────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin";
  reputationScore: number;
  createdAt: string;
}

export interface FloodReport {
  id: number;
  userId: number;
  districtId?: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  waterDepthCm: number;
  severityLevel: "low" | "medium" | "high" | "extreme";
  roadAccess: "passable" | "motorcycle_only" | "difficult" | "impassable";
  waterCurrent: "calm" | "slow" | "moderate" | "fast";
  status: "active" | "surging" | "receded";
  photoUrl?: string;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "name" | "avatar" | "reputationScore">;
  district?: Pick<District, "id" | "name">;
  _count?: { verifications: number; photos: number; updates: number };
  photos?: Pick<ReportPhoto, "imageUrl">[];
}

export interface FloodReportDetail extends FloodReport {
  verifications: (ReportVerification & { user: Pick<User, "id" | "name" | "avatar"> })[];
  updates: (ReportUpdate & { user: Pick<User, "id" | "name"> })[];
  photos: (ReportPhoto & { user: Pick<User, "id" | "name"> })[];
}

export interface ReportVerification {
  id: number;
  reportId: number;
  userId: number;
  vote: "confirm" | "reject";
  comment?: string;
  createdAt: string;
}

export interface ReportUpdate {
  id: number;
  reportId: number;
  createdBy: number;
  waterDepthCm: number;
  status: string;
  description?: string;
  createdAt: string;
}

export interface ReportPhoto {
  id: number;
  reportId: number;
  imageUrl: string;
  createdAt: string;
}

export interface MapReport {
  id: number;
  title: string;
  latitude: number;
  longitude: number;
  waterDepthCm: number;
  severityLevel: string;
  status: string;
  roadAccess: string;
  confidenceScore: number;
  address?: string;
  createdAt: string;
  district?: { name: string };
  _count?: { verifications: number };
}

export interface SafeRouteData {
  safeRoute: {
    points: { lat: number; lng: number }[];
    distance: number;
    duration: number;
    floodScore: number;
    summary: string;
    isSafe: boolean;
    isDetour: boolean;
    nearbyFloods: { lat: number; lng: number; depth: string }[];
  };
  floodedRoute: {
    points: { lat: number; lng: number }[];
    distance: number;
    duration: number;
    floodScore: number;
    summary: string;
    nearbyFloods: { lat: number; lng: number; depth: string }[];
  } | null;
  floodMarkers: { lat: number; lng: number; depth: string; severity: string }[];
  totalFloodReports: number;
  warningMessage: string | null;
}

export interface MapZone {
  districtId: number;
  districtName: string;
  latitude: number;
  longitude: number;
  avgDepth: number;
  reportCount: number;
  riskLevel: "low" | "medium" | "high" | "extreme";
  polygonGeojson?: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "alert" | "report_update" | "verification" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface District {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  floodZone?: { riskLevel: string; avgDepth: number; reportCount: number };
}

export interface CreateReportBody {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  districtId?: number;
  waterDepthCm: number;
  roadAccess: string;
  waterCurrent?: string;
  photoUrl?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalReports: number;
  activeReports: number;
  totalUsers: number;
  totalVerifications: number;
  deepestReport?: FloodReport & { district?: District };
  recentReports: FloodReport[];
  byDistrict: { districtId: number; _avg: { waterDepthCm: number }; _count: { id: number } }[];
}

export interface WeatherForecast {
  datetime: string;
  utc_datetime: string;
  weatherCode: string;
  weatherDesc: string;
  humidity: number | null;
  temp: number | null;
  image: string;
}

export interface WeatherData {
  city: string;
  domain: string;
  kecamatan?: string;
  forecasts: WeatherForecast[];
}

// ── Helpers ──────────────────────────────────────────────────────────────
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

export function severityLabel(level: string): string {
  return { low: "Aman", medium: "Waspada", high: "Kritis", extreme: "Bahaya" }[level] ?? level;
}

export function severityColor(level: string): string {
  return {
    low: "bg-primary border-primary",
    medium: "bg-warning border-warning",
    high: "bg-error border-error",
    extreme: "bg-error border-error",
  }[level] ?? "bg-outline border-outline";
}

export function roadAccessLabel(access: string): string {
  return {
    passable: "Bisa Dilalui",
    motorcycle_only: "Motor Saja",
    difficult: "Sulit Dilalui",
    impassable: "Tidak Bisa",
  }[access] ?? access;
}
