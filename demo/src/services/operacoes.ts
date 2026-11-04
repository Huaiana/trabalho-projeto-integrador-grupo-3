import type { Operacao } from "@/models/operacao";
import { parametrosApi, requisicaoApi } from "@/services/api";

export const listarOperacoes = () => requisicaoApi<Operacao[]>("/operacoes");

export const cadastrarOperacao = (dados: {
  solicitacaoId: number;
  conteinerId?: number;
  responsavel: string;
  observacoes: string;
}) => requisicaoApi<Operacao>(`/operacoes?${parametrosApi(dados)}`, { method: "POST" });

export const atualizarOperacao = (id: number, dados: { andamento: string; observacoes?: string }) =>
  requisicaoApi<Operacao>(`/operacoes/${id}/andamento?${parametrosApi(dados)}`, {
    method: "PUT",
  });
