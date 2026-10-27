import type { Orcamento } from "@/models/orcamento";
import { parametrosApi, requisicaoApi } from "@/services/api";

export const listarOrcamentos = () => requisicaoApi<Orcamento[]>("/orcamentos");

export const listarOrcamentosDoCliente = (clienteId: number) =>
  requisicaoApi<Orcamento[]>(`/orcamentos/cliente/${clienteId}`);

export const cadastrarOrcamento = (dados: {
  clienteId: number;
  cargaId: number;
  servicoId: number;
}) => requisicaoApi<Orcamento>(`/orcamentos?${parametrosApi(dados)}`, { method: "POST" });

export const atualizarOrcamento = (
  id: number,
  dados: { status: string; valorEstimado?: number; observacoes?: string },
) =>
  requisicaoApi<Orcamento>(`/orcamentos/${id}/analise?${parametrosApi(dados)}`, {
    method: "PUT",
  });
