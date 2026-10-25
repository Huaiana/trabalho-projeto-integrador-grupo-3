export const LOCAL_API_URL = "/api";
// Production deployments must provide VITE_API_URL at build time.
export const PRODUCTION_API_URL = "";

export function resolveApiBaseUrl(env = import.meta.env) {
  const configuredBase = env?.VITE_API_URL || (env?.DEV ? LOCAL_API_URL : PRODUCTION_API_URL);
  return configuredBase.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();
let accessToken = null;

export function setAccessToken(token) {
  accessToken = typeof token === "string" && token.trim() ? token : null;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  constructor(message, status, code = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, options = {}, { authenticated = true } = {}) {
  let requestOptions = options;
  if (authenticated && accessToken) {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${accessToken}`);
    requestOptions = { ...options, headers };
  }
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, requestOptions);
  } catch {
    const guidance = import.meta.env?.DEV
      ? "Confirme o Spring Boot em localhost:8080 e o proxy /api do Vite."
      : "Verifique VITE_API_URL, a disponibilidade do serviço e o CORS.";
    throw new ApiError(`Não foi possível conectar à API (${API_BASE_URL}). ${guidance}`, 0, "SEM_CONEXAO");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("json") ? await response.json().catch(() => null) : await response.text().catch(() => "");
  if (!response.ok) {
    const message = payload && typeof payload === "object" && payload.message
      ? payload.message
      : typeof payload === "string" && payload.trim()
        ? payload
        : `Não foi possível concluir a operação (HTTP ${response.status}).`;
    throw new ApiError(message, response.status, payload?.code || "");
  }
  return payload;
}

export function get(path) {
  return apiRequest(path);
}

export function post(path, data) {
  return apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function postPublic(path, data) {
  return apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, { authenticated: false });
}

export function postWithHeaders(path, data, headers = {}, { authenticated = true } = {}) {
  return apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  }, { authenticated });
}

export function put(path, data) {
  return apiRequest(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function del(path) {
  return apiRequest(path, { method: "DELETE" });
}

export function getAppointmentAccounts() {
  return get("/agendamentos/usuarios");
}

export function createManagedAppointment(data) {
  return post("/agendamentos/gerenciamento", data);
}

export function updateManagedAppointment(id, data) {
  return put(`/agendamentos/${encodeURIComponent(id)}`, data);
}

export function postParams(path, values) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  return apiRequest(`${path}?${query}`, { method: "POST" });
}

export function putParams(path, values) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  return apiRequest(`${path}?${query}`, { method: "PUT" });
}
