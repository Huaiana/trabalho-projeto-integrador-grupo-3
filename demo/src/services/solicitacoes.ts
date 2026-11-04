import type { Solicitacao } from "@/models/solicitacao";
import { parametrosApi, requisicaoApi } from "@/services/api";

export const listarSolicitacoes = () => requisicaoApi<Solicitacao[]>("/solicitacoes");

export const listarSolicitacoesDoCliente = (clienteId: number) =>
  requisicaoApi<Solicitacao[]>(`/solicitacoes/cliente/${clienteId}`);

export const cadastrarSolicitacao = (dados: {
  clienteId: number;
  cargaId: number;
  servicoId: number;
}) => requisicaoApi<Solicitacao>(`/solicitacoes?${parametrosApi(dados)}`, { method: "POST" });

export const atualizarSolicitacao = (id: number, status: string) =>
  requisicaoApi<Solicitacao>(`/solicitacoes/${id}/status?${parametrosApi({ status })}`, {
    method: "PUT",
  });
