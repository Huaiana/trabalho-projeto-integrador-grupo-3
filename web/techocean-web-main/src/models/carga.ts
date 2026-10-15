import { z } from "zod";

const obrigatorio = (nome: string) => z.string().trim().min(1, `Informe ${nome}.`);

export const cargaSchema = z.object({
  descricao: obrigatorio("a descrição"),
  peso: z.number({ required_error: "Informe o peso.", invalid_type_error: "Informe um peso numérico." }).finite("Informe um peso numérico."),
  volume: z.number({ required_error: "Informe o volume.", invalid_type_error: "Informe um volume numérico." }).finite("Informe um volume numérico."),
  tipoCarga: obrigatorio("o tipo de carga"),
  origem: obrigatorio("a origem"),
  destino: obrigatorio("o destino"),
});

export type DadosCarga = z.infer<typeof cargaSchema>;
export const cargaRecebidaSchema = cargaSchema.extend({ id: z.number().int() });
export type Carga = z.infer<typeof cargaRecebidaSchema>;