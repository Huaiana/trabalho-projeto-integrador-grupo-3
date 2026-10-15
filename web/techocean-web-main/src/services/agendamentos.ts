export interface DadosAgendamento {
  nome: string;
  telefone: string;
  email: string;
  dataHora: string;
  confirmacao: true;
}

export interface SolicitacaoAgendamento extends DadosAgendamento {
  cpf?: string;
  senha?: string;
}

export class ErroAgendamentoApi extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ErroAgendamentoApi";
  }
}

const apiUrl = (import.meta.env["VITE_API_URL"] || "http://localhost:8081").replace(/\/+$/, "");
const pendingVisitKey = "techocean.agendamento.pendente";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function solicitarAgendamento(
  solicitacao: SolicitacaoAgendamento,
): Promise<void> {
  const response = await fetch(`${apiUrl}/agendamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(solicitacao),
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
        : "ERRO_AGENDAMENTO";
    const message =
      isRecord(payload) && typeof payload["message"] === "string"
        ? payload["message"]
        : `Não foi possível concluir o agendamento (HTTP ${response.status}).`;
    throw new ErroAgendamentoApi(message, code, response.status);
  }
}

export function salvarAgendamentoPendente(dados: DadosAgendamento): void {
  sessionStorage.setItem(pendingVisitKey, JSON.stringify(dados));
}

export function lerAgendamentoPendente(): DadosAgendamento | null {
  const saved = sessionStorage.getItem(pendingVisitKey);
  if (!saved) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(saved);
    if (
      isRecord(value) &&
      typeof value["nome"] === "string" &&
      typeof value["telefone"] === "string" &&
      typeof value["email"] === "string" &&
      typeof value["dataHora"] === "string" &&
      value["confirmacao"] === true
    ) {
      return {
        nome: value["nome"],
        telefone: value["telefone"],
        email: value["email"],
        dataHora: value["dataHora"],
        confirmacao: true,
      };
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
  }

  sessionStorage.removeItem(pendingVisitKey);
  return null;
}

export function limparAgendamentoPendente(): void {
  sessionStorage.removeItem(pendingVisitKey);
}
