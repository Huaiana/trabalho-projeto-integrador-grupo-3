import type { Carga, NovaCarga } from "@/models/carga";

const apiUrl = (import.meta.env["VITE_API_URL"] || "http://localhost:8080").replace(/\/+$/, "");

async function validarResposta(response: Response): Promise<void> {
  if (response.ok) return;

  let mensagem = `A API de cargas respondeu com HTTP ${response.status}.`;
  try {
    const payload: unknown = await response.json();
    if (
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
    ) {
      mensagem = payload.message;
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  throw new Error(mensagem);
}

export async function listarCargas(): Promise<Carga[]> {
  const response = await fetch(`${apiUrl}/cargas`);
  await validarResposta(response);
  return (await response.json()) as Carga[];
}

export async function cadastrarCarga(carga: NovaCarga): Promise<Carga> {
  const parametros = new URLSearchParams({
    descricao: carga.descricao,
    peso: String(carga.peso),
    volume: String(carga.volume),
    tipoCarga: carga.tipoCarga,
    origem: carga.origem,
    destino: carga.destino,
  });
  const response = await fetch(`${apiUrl}/cargas?${parametros.toString()}`, {
    method: "POST",
  });
  await validarResposta(response);
  return (await response.json()) as Carga;
}
