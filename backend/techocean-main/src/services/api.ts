// Se VITE_API_URL não estiver definida no .env, usa a origem atual da página (ex: http://169.254.16.217:8080)
const envUrl = import.meta.env["VITE_API_URL"];
const baseUrl = envUrl && envUrl.trim() !== "" ? envUrl : (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080");

const apiUrl = baseUrl.replace(/\/+$/, "");

export async function requisicaoApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, init);
  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  if (!response.ok) {
    const mensagem =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `A API respondeu com HTTP ${response.status}.`;
    throw new Error(mensagem);
  }
  if (payload === null) throw new Error("A API retornou uma resposta vazia.");
  return payload as T;
}

export function parametrosApi(
  valores: Record<string, string | number | boolean | null | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [chave, valor] of Object.entries(valores)) {
    if (valor !== null && valor !== undefined) query.set(chave, String(valor));
  }
  return query.toString();
}
