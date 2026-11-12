import { z } from "zod";
import { usuarioLogadoSchema, type DadosLogin, type UsuarioLogado } from "@/models/autenticacao";

const apiUrl = (import.meta.env["VITE_API_URL"] || "http://localhost:8081").replace(/\/+$/, "");

export class ErroAutenticacaoApi extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ErroAutenticacaoApi";
  }
}

async function mensagemErro(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  const resultado = z.object({ message: z.string() }).safeParse(payload);
  return resultado.success
    ? resultado.data.message
    : `Não foi possível concluir o acesso (HTTP ${response.status}).`;
}

async function requisitar(caminho: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${apiUrl}${caminho}`, { ...init, credentials: "include" });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique se a API está ligada e se o endereço está correto.",
    );
  }
}

export async function criarSessao(dados: DadosLogin): Promise<UsuarioLogado> {
  const response = await requisitar("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!response.ok) throw new ErroAutenticacaoApi(await mensagemErro(response), response.status);
  const payload: unknown = await response.json();
  const resultado = usuarioLogadoSchema.safeParse(payload);
  if (!resultado.success)
    throw new Error("O servidor retornou os dados do usuário em formato inesperado.");
  return resultado.data;
}

export async function buscarSessao(): Promise<UsuarioLogado | null> {
  const response = await requisitar("/auth/me");
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new ErroAutenticacaoApi(await mensagemErro(response), response.status);
  const payload: unknown = await response.json();
  const resultado = usuarioLogadoSchema.safeParse(payload);
  if (!resultado.success)
    throw new Error("O servidor retornou os dados do usuário em formato inesperado.");
  return resultado.data;
}

export async function encerrarSessao(): Promise<void> {
  const response = await requisitar("/auth/logout", { method: "POST" });
  if (!response.ok && response.status !== 401) {
    throw new ErroAutenticacaoApi(await mensagemErro(response), response.status);
  }
}
