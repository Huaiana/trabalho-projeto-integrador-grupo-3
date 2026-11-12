export const LOCAL_API_URL = "/api";
// Production deployments must provide VITE_API_URL at build time.
export const PRODUCTION_API_URL = "https://techocean-api.huaydarc.workers.dev";
export const API_REQUEST_TIMEOUT_MS = 15_000;
const ACCESS_TOKEN_STORAGE_KEY = "techocean.accessToken";

export function resolveApiBaseUrl(_env = import.meta.env) {
  const configuredBase = LOCAL_API_URL; // same-origin relay (src/routes/api/$.ts)
  return configuredBase.replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();
function readStoredAccessToken() {
  try {
    return globalThis.localStorage?.getItem(ACCESS_TOKEN_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

let accessToken = readStoredAccessToken();

export function setAccessToken(token) {
  accessToken = typeof token === "string" && token.trim() ? token : null;
  if (accessToken) globalThis.localStorage?.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function clearAccessToken() {
  accessToken = null;
  globalThis.localStorage?.removeItem(ACCESS_TOKEN_STORAGE_KEY);
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
  const controller = new AbortController();
  const callerSignal = requestOptions.signal;
  let timedOut = false;
  let timeoutId;
  const abortFromCaller = () => controller.abort(callerSignal.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  const timeoutError = new ApiError(
    `A API não respondeu em até ${API_REQUEST_TIMEOUT_MS / 1000} segundos. Verifique a conexão e tente novamente.`,
    408,
    "TEMPO_ESGOTADO",
  );
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(timeoutError);
    }, API_REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
          ...requestOptions,
          signal: controller.signal,
        });
        const contentType = response.headers.get("content-type") || "";
        const payload = contentType.includes("json")
          ? await response.json().catch(() => null)
          : await response.text().catch(() => "");
        if (!response.ok) {
          const message = payload && typeof payload === "object" && (payload.message || payload.detail || payload.title)
            ? payload.message || payload.detail || payload.title
            : typeof payload === "string" && payload.trim()
              ? payload
              : response.status === 401 && path === "/admin/login"
                ? "A API recusou o login (HTTP 401). Confira o e-mail e a senha e confirme se o administrador já foi configurado."
              : response.status === 401 && path === "/admin/me"
                ? "Login aceito, mas o servidor recusou a sessão. Tente entrar novamente; se persistir, verifique se as instâncias da API usam o mesmo APP_AUTH_SECRET."
                : `Não foi possível concluir a operação (HTTP ${response.status}).`;
          throw new ApiError(message, response.status, payload?.code || "");
        }
        return payload;
      })(),
      timeout,
    ]);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw timeoutError;
    const guidance = import.meta.env?.DEV
      ? "Confirme o Spring Boot em localhost:8080 e o proxy /api do Vite."
      : "Verifique VITE_API_URL, a disponibilidade do serviço e o CORS.";
    throw new ApiError(`Não foi possível conectar à API (${API_BASE_URL}). ${guidance}`, 0, "SEM_CONEXAO");
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
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
