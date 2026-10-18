/**
 * TrustShift AI - Unified Frontend API Client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  role: "rider" | "manager" | "admin";
  status: string;
  organization_id: string;
  organization_name: string;
  is_2fa_enabled: boolean;
  rider_profile_id?: string;
  rider_code?: string;
  legal_name?: string;
  branch_id?: string;
  branch_name?: string;
  selfie_enrolled?: boolean;
  trustmark_enrolled?: boolean;
  selfie_image_data?: string;
  trustmark_signature_data?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface IncidentSummary {
  id: string;
  incident_number: string;
  rider_id: string;
  rider_code: string;
  rider_name: string;
  branch_name?: string;
  severity: "low" | "medium" | "high" | "critical";
  status: string;
  reason_codes: string[];
  risk_score_at_detection: number;
  title: string;
  assigned_manager_name?: string;
  has_pdf_report: boolean;
  created_at: string;
}

export interface IncidentEvidence {
  id: string;
  event_reference?: string;
  evidence_type: string;
  summary: string;
  severity: string;
  occurred_at: string;
}

export interface ManagerReview {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  outcome: string;
  notes: string;
  action_taken: string;
  created_at: string;
}

export interface IncidentReport {
  id: string;
  report_number: string;
  report_version: number;
  cryptographic_hash: string;
  status: string;
  generated_by_name?: string;
  generated_at: string;
}

export interface IncidentDetail {
  id: string;
  incident_number: string;
  organization_id: string;
  branch_id?: string;
  branch_name?: string;
  rider_id: string;
  rider_code: string;
  rider_name: string;
  session_id?: string;
  severity: "low" | "medium" | "high" | "critical";
  status: string;
  reason_codes: string[];
  risk_score_at_detection: number;
  title: string;
  description?: string;
  assigned_manager_id?: string;
  assigned_manager_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  evidences: IncidentEvidence[];
  reviews: ManagerReview[];
  reports: IncidentReport[];
}

export interface TrustScoreBreakdown {
  id?: string;
  session_id?: string;
  rider_id: string;
  trust_score: number;
  score_band: "high_trust" | "caution" | "elevated_risk" | "critical";
  evidence_coverage: number;
  recommended_action: "CONTINUE" | "VERIFY" | "INVESTIGATE" | "RETRY";
  identity_score: number;
  auth_score: number;
  device_score: number;
  behavior_score: number;
  corroborating_score: number;
  reason_codes: string[];
  rule_version: string;
  evaluated_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_user_id: string;
  incident_id?: string;
  notification_type: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  delivery_status: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  badge_color: string;
}

// Token helper
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ts_access_token");
}

export function setStoredToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("ts_access_token", token);
  }
}

export function clearStoredToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("ts_access_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Supports cookies
  });

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail
          .map((item: any) => `${item.loc ? item.loc.slice(1).join(".") + ": " : ""}${item.msg}`)
          .join(", ");
      } else {
        errorDetail = errJson.detail || errJson.message || errorDetail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }


  return response.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string; role_hint?: string; device_fingerprint?: string; device_name?: string }) =>
    request<{
      requires_2fa: boolean;
      challenge_id?: string;
      challenge_type?: string;
      simulated_code?: string;
      access_token?: string;
      token_type: string;
      user?: UserProfile;
    }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  verifySecondFactor: (data: { challenge_id: string; code: string; device_fingerprint?: string; device_name?: string; remember_device?: boolean }) =>
    request<{
      requires_2fa: boolean;
      access_token: string;
      token_type: string;
      user: UserProfile;
    }>("/auth/second-factor/verify", { method: "POST", body: JSON.stringify(data) }),

  resendSecondFactor: (challenge_id: string) =>
    request<ApiResponse<{ challenge_id: string; simulated_code?: string }>>("/auth/second-factor/resend", {
      method: "POST",
      body: JSON.stringify({ challenge_id }),
    }),

  getMe: () => request<ApiResponse<UserProfile>>("/auth/me"),
  logout: () => request<ApiResponse<unknown>>("/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) =>
    request<ApiResponse<{ simulated_reset_code?: string }>>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data: { email: string; reset_code: string; new_password: string }) =>
    request<ApiResponse<any>>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  digilockerFastLogin: (data: { rider_identifier?: string; aadhaar_last_four?: string; otp_code?: string; consent?: boolean }) =>
    request<{
      requires_2fa: boolean;
      access_token: string;
      token_type: string;
      user: UserProfile;
    }>("/auth/digilocker/fast-login", { method: "POST", body: JSON.stringify(data) }),
  digilockerPullCredentials: (data?: { preset_identity?: string; phone?: string; aadhaar_last_four?: string }) =>
    request<ApiResponse<{
      digilocker_id: string;
      legal_name: string;
      email: string;
      phone: string;
      date_of_birth: string;
      address: string;
      license_number: string;
      license_expiry: string;
      license_class: string;
      license_document_url: string;
      license_issuer: string;
      government_id_type: string;
      government_id_number: string;
      government_id_document_url: string;
      government_id_issuer: string;
      digilocker_verified: boolean;
      verification_timestamp: string;
      digilocker_uri: string;
      checksum_sha256: string;
    }>>("/auth/digilocker/pull-credentials", { method: "POST", body: JSON.stringify(data || {}) }),
  digilockerOAuthExchange: (data: { code: string; mode?: string; preset_identity?: string; phone?: string; aadhaar_last_four?: string }) =>
    request<any>("/auth/digilocker/oauth/exchange", { method: "POST", body: JSON.stringify(data) }),

  // Riders

  registerRider: (data: any) => request<ApiResponse<any>>("/riders", { method: "POST", body: JSON.stringify(data) }),
  listRiders: (params?: { branch_id?: string; status?: string; search?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<ApiResponse<any[]>>(`/riders${qs ? `?${qs}` : ""}`);
  },
  getMyRiderProfile: () => request<ApiResponse<any>>("/riders/me/profile"),
  getRiderById: (id: string) => request<ApiResponse<any>>(`/riders/${id}`),
  updateOnboardingStep: (riderId: string, step: number, data: any) =>
    request<ApiResponse<any>>(`/riders/${riderId}/step`, {
      method: "POST",
      body: JSON.stringify({ step, data }),
    }),
  submitOnboarding: (riderId: string) =>
    request<ApiResponse<any>>(`/riders/${riderId}/submit-onboarding`, { method: "POST" }),
  activateRider: (riderId: string) =>
    request<ApiResponse<any>>(`/riders/${riderId}/activate`, { method: "POST" }),
  deactivateRider: (riderId: string) =>
    request<ApiResponse<any>>(`/riders/${riderId}/deactivate`, { method: "POST" }),

  // Verification
  enrollSelfie: (data: { rider_id?: string; image_b64?: string; simulation_preset?: string }) =>
    request<ApiResponse<any>>("/verification/selfie/enroll", { method: "POST", body: JSON.stringify(data) }),
  verifySelfie: (data: { session_id?: string; image_b64?: string; simulation_preset?: string }) =>
    request<ApiResponse<any>>("/verification/selfie/check", { method: "POST", body: JSON.stringify(data) }),
  enrollTrustMark: (data: { rider_id?: string; stroke_data?: string; simulation_preset?: string }) =>
    request<ApiResponse<any>>("/verification/trustmark/enroll", { method: "POST", body: JSON.stringify(data) }),
  verifyTrustMark: (data: { session_id?: string; stroke_data?: string; simulation_preset?: string }) =>
    request<ApiResponse<any>>("/verification/trustmark/check", { method: "POST", body: JSON.stringify(data) }),
  getEnrolledBiometricReference: () =>
    request<ApiResponse<{
      rider_id: string;
      rider_code: string;
      legal_name: string;
      selfie_enrolled: boolean;
      selfie_reference_id?: string;
      selfie_image_data?: string;
      trustmark_enrolled: boolean;
      trustmark_reference_id?: string;
      trustmark_signature_data?: string;
    }>>("/verification/reference"),
  getVerificationHistory: () => request<ApiResponse<any[]>>("/verification/history"),


  // Sessions & Shifts
  startShift: (data: {
    device_fingerprint?: string;
    device_name?: string;
    location_area?: string;
    selfie_event_id?: string;
    trustmark_event_id?: string;
    selfie_image_b64?: string;
    trustmark_strokes?: string;
    simulation_preset?: string;
  }) => request<ApiResponse<any>>("/sessions/start", { method: "POST", body: JSON.stringify(data) }),
  endShift: (data: { notes?: string }) =>
    request<ApiResponse<any>>("/sessions/end", { method: "POST", body: JSON.stringify(data) }),
  getCurrentSession: () => request<ApiResponse<{ session: any; trust: TrustScoreBreakdown | null }>>("/sessions/current"),
  getSessionTrust: (sessionId: string) =>
    request<ApiResponse<TrustScoreBreakdown>>(`/sessions/${sessionId}/trust`),
  sendTelemetry: (data: { latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number }) =>
    request<ApiResponse<any>>("/sessions/telemetry", { method: "POST", body: JSON.stringify(data) }),

  // Manager Operations
  getDashboardSummary: () =>
    request<ApiResponse<{
      total_registered_riders: number;
      active_riders: number;
      pending_onboarding: number;
      active_sessions: number;
      open_incidents: number;
      critical_incidents: number;
      verification_requests_awaiting: number;
      resolved_incidents: number;
    }>>("/manager/dashboard"),
  listIncidents: (params?: { severity?: string; status?: string; search?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<ApiResponse<IncidentSummary[]>>(`/manager/incidents${qs ? `?${qs}` : ""}`);
  },
  getIncidentDetails: (id: string) =>
    request<ApiResponse<IncidentDetail>>(`/manager/incidents/${id}`),
  assignIncident: (incidentId: string, managerId: string) =>
    request<ApiResponse<IncidentDetail>>(`/manager/incidents/${incidentId}/assign`, {
      method: "POST",
      body: JSON.stringify({ manager_id: managerId }),
    }),
  reviewIncident: (incidentId: string, data: { outcome: string; notes: string; action_taken: string }) =>
    request<ApiResponse<IncidentDetail>>(`/manager/incidents/${incidentId}/review`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  requestReverification: (incidentId: string, data: { verification_type: string; reason: string; urgency?: string }) =>
    request<ApiResponse<unknown>>(`/manager/incidents/${incidentId}/request-verification`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getLiveSessions: () => request<ApiResponse<any[]>>("/manager/sessions"),
  getAnalytics: () => request<ApiResponse<any>>("/manager/analytics"),

  // Reports
  generateIncidentReport: (incidentId: string, force = false) =>
    request<ApiResponse<IncidentReport>>(`/reports/incidents/${incidentId}?force=${force}`, { method: "POST" }),
  getIncidentReports: (incidentId: string) =>
    request<ApiResponse<IncidentReport[]>>(`/reports/incidents/${incidentId}`),
  listAllReports: () => request<ApiResponse<IncidentReport[]>>("/reports"),
  getReportDownloadUrl: (reportId: string, inline = false) => {
    const token = getStoredToken();
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
    return `${API_BASE_URL}/reports/${reportId}/download?inline=${inline}${tokenParam}`;
  },
  downloadReportPdf: async (reportId: string, defaultFilename?: string): Promise<void> => {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/download${tokenParam}`, {
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      let errorMsg = `PDF download failed (${response.status})`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.detail || errJson.message || errorMsg;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = blobUrl;
    const cleanFilename = defaultFilename
      ? (defaultFilename.toLowerCase().endsWith(".pdf") ? defaultFilename : `${defaultFilename}.pdf`)
      : `Incident_Report_${reportId}.pdf`;
    downloadAnchor.download = cleanFilename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  },

  // Notifications
  getMyNotifications: (unreadOnly = false) =>
    request<ApiResponse<NotificationItem[]>>(`/notifications${unreadOnly ? "?unread_only=true" : ""}`),
  markNotificationRead: (id: string) =>
    request<ApiResponse<NotificationItem>>(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () =>
    request<ApiResponse<{ count: number }>>("/notifications/read-all", { method: "POST" }),

  // Audit
  getAuditLogs: (params?: { action?: string; target_type?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<ApiResponse<any[]>>(`/audit-logs${qs ? `?${qs}` : ""}`);
  },

  // Admin
  listBranches: () => request<ApiResponse<any[]>>("/admin/branches"),
  createBranch: (data: any) => request<ApiResponse<any>>("/admin/branches", { method: "POST", body: JSON.stringify(data) }),
  listManagers: () => request<ApiResponse<any[]>>("/admin/managers"),
  createManager: (data: any) => request<ApiResponse<any>>("/admin/managers", { method: "POST", body: JSON.stringify(data) }),
  getPolicy: () => request<ApiResponse<any>>("/admin/policy"),
  updatePolicy: (data: any) => request<ApiResponse<any>>("/admin/policy", { method: "PUT", body: JSON.stringify(data) }),

  // Demo
  getDemoScenarios: () => request<ApiResponse<DemoScenario[]>>("/demo/scenarios"),
  runDemoScenario: (scenarioId: string) =>
    request<ApiResponse<any>>(`/demo/run/${scenarioId}`, { method: "POST" }),
};
