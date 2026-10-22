const configuredBase = import.meta.env?.VITE_API_URL || "http://localhost:8080";
export const API_BASE_URL = configuredBase.replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, code = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new ApiError("Não foi possível conectar à API. Verifique o servidor e a configuração VITE_API_URL.", 0, "SEM_CONEXAO");
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

export function put(path, data) {
  return apiRequest(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
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
