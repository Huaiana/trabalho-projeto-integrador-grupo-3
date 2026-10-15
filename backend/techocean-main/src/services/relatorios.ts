import type { Relatorio } from "@/models/relatorio";
import { listarMensagensCliente } from "@/services/mensagens";
import { listarOperacoes } from "@/services/operacoes";
import { listarOrcamentosDoCliente } from "@/services/orcamentos";
import { listarSolicitacoesDoCliente } from "@/services/solicitacoes";
import { listarClientes } from "@/services/clientes";

export async function obterRelatorioCliente(clienteId: number): Promise<Relatorio> {
  const clientes = await listarClientes();
  const cliente = clientes.find((item) => item.id === clienteId);
  if (!cliente) {
    throw new Error(`Cliente ${clienteId} não encontrado.`);
  }

  const [solicitacoes, orcamentos, operacoes, mensagens] = await Promise.all([
    listarSolicitacoesDoCliente(clienteId),
    listarOrcamentosDoCliente(clienteId),
    listarOperacoes(),
    listarMensagensCliente(clienteId),
  ]);
  const idsSolicitacoes = new Set(solicitacoes.map((item) => item.id));

  return {
    cliente,
    solicitacoes,
    orcamentos,
    operacoes: operacoes.filter((item) => idsSolicitacoes.has(item.solicitacao.id)),
    mensagens,
  };
}
