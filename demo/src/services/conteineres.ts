import type { Conteiner } from "@/models/conteiner";
import { parametrosApi, requisicaoApi } from "@/services/api";

export const listarConteineres = () => requisicaoApi<Conteiner[]>("/conteineres");

export const cadastrarConteiner = (dados: Omit<Conteiner, "id">) =>
  requisicaoApi<Conteiner>(`/conteineres?${parametrosApi(dados)}`, { method: "POST" });
