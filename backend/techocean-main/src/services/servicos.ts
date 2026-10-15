import type { Servico } from "@/models/servico";
import { parametrosApi, requisicaoApi } from "@/services/api";

export const listarServicos = () => requisicaoApi<Servico[]>("/servicos");

export const cadastrarServico = (dados: Omit<Servico, "id">) =>
  requisicaoApi<Servico>(`/servicos?${parametrosApi(dados)}`, { method: "POST" });
