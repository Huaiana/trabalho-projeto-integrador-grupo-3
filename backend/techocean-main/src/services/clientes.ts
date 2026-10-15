import type { Cadastro } from "@/models/cadastro";
import type { Cliente, NovoCliente } from "@/models/cliente";

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

const apiUrl = (import.meta.env["VITE_API_URL"] || "http://localhost:8080").replace(/\/+$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Cadastra um cliente no back-end (POST /clientes). */
export async function cadastrarCliente(cliente: Cadastro | NovoCliente): Promise<void> {
  const response = await fetch(`${apiUrl}/clientes`, {
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

export async function listarClientes(): Promise<Cliente[]> {
  const response = await fetch(`${apiUrl}/clientes`);
  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new Error("A API retornou uma resposta inválida ao listar clientes.");
  }

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload["message"] === "string"
        ? payload["message"]
        : `Não foi possível carregar os clientes (HTTP ${response.status}).`;
    throw new Error(message);
  }
  if (!Array.isArray(payload)) {
    throw new Error("A API retornou uma lista de clientes inválida.");
  }

  return payload.map((value, index) => {
    if (!isRecord(value)) {
      throw new Error(`Os dados do cliente na posição ${index + 1} são inválidos.`);
    }

    const cpfCnpj =
      value["CPFCNPJ"] ?? value["cpfcnpj"] ?? value["cpfCNPJ"] ?? value["cpfCnpj"] ?? value["cpf"];
    if (
      typeof value["id"] !== "number" ||
      typeof value["nome"] !== "string" ||
      typeof cpfCnpj !== "string" ||
      typeof value["telefone"] !== "string" ||
      typeof value["email"] !== "string"
    ) {
      throw new Error(`Os dados do cliente na posição ${index + 1} estão incompletos.`);
    }

    return {
      id: value["id"],
      nome: value["nome"],
      cpfCnpj,
      telefone: value["telefone"],
      email: value["email"],
    };
  });
}
