import { z } from "zod";
import { cargaRecebidaSchema, type Carga, type DadosCarga } from "@/models/carga";

const apiUrl = (import.meta.env["VITE_API_URL"] || "http://localhost:8081").replace(/\/+$/, "");

async function requisitar(init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/cargas`, init);
  } catch {
    throw new Error("Não foi possível conectar ao servidor de cargas. Verifique se ele está ligado e permite o acesso do site.");
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const erro = z.object({ message: z.string() }).safeParse(payload);
    throw new Error(erro.success ? erro.data.message : `Não foi possível concluir a operação (HTTP ${response.status}).`);
  }
  return response;
}

export async function buscarCargas(): Promise<Carga[]> {
  const response = await requisitar();
  const payload: unknown = await response.json();
  // Spring pode retornar uma lista ou uma página com content.
  const lista = z.array(cargaRecebidaSchema);
  const resultado = z.union([lista, z.object({ content: lista })]).safeParse(payload);
  if (!resultado.success) throw new Error("O servidor retornou uma lista de cargas em formato inesperado.");
  return Array.isArray(resultado.data) ? resultado.data : resultado.data.content;
}

export async function inserirCarga(dados: DadosCarga): Promise<void> {
  await requisitar({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
}