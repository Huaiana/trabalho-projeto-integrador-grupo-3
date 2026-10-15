import { cargaSchema, type DadosCarga } from "@/models/carga";
import { buscarCargas, inserirCarga } from "@/repositories/cargas";

export const listarCargas = buscarCargas;

export async function cadastrarCarga(dados: DadosCarga): Promise<void> {
  await inserirCarga(cargaSchema.parse(dados));
}