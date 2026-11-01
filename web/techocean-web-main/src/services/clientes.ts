import type { Cadastro } from "@/models/cadastro";
import { API_BASE_URL } from "../api.js";

export class ErroClienteApi extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ErroClienteApi";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Cadastra um cliente no back-end (POST /clientes). */
export async function cadastrarCliente(cliente: Cadastro): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: cliente.nome,
      cpf: cliente.cpf.replace(/\D/g, ""),
      telefone: cliente.telefone.replace(/\D/g, ""),
      email: cliente.email,
      senha: cliente.senha,
    }),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
  }

  if (!response.ok) {
    const code =
      isRecord(payload) && typeof payload["code"] === "string"
        ? payload["code"]
        : "ERRO_CADASTRO";
    const message =
      isRecord(payload) && typeof payload["message"] === "string"
        ? payload["message"]
        : `Não foi possível concluir o cadastro (HTTP ${response.status}).`;
    throw new ErroClienteApi(message, code, response.status);
  }
}
