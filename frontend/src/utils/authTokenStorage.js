const STORAGE_KEY = "pysimverse_jwt";
const USER_KEY = "advokate_desk_user";

function emitAdvokateAuthChange() {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("advokate-auth-change"));
    }
  } catch {
    /* ignore */
  }
}

export function getStoredAccessToken() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredAccessToken(token) {
  try {
    if (!token) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* ignore quota / private mode */
  }
  emitAdvokateAuthChange();
}

export function clearStoredAccessToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
  emitAdvokateAuthChange();
}

export function setStoredUser(user) {
  try {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** JWT from login body (backend may use any of these keys). */
export function pickTokenFromLoginResponse(data) {
  if (!data || typeof data !== "object") return null;
  const t = data.token || data.accessToken || data.jwt;
  return typeof t === "string" && t.trim() ? t.trim() : null;
}

/** For fetch / manual axios config — middleware accepts Bearer or raw. */
export function authHeaders() {
  const t = getStoredAccessToken().trim();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}

export function attachAuthTokenInterceptor(axiosInstance) {
  axiosInstance.interceptors.request.use((config) => {
    const t = getStoredAccessToken().trim();
    if (t && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  });
}
