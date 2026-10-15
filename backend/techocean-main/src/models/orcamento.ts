import type { Carga } from "@/models/carga";
import type { Cliente } from "@/models/cliente";
import type { Servico } from "@/models/servico";

export type Orcamento = {
  id: number;
  cliente: Cliente;
  carga: Carga;
  servico: Servico;
  status: string;
  valorEstimado: number | null;
  observacoes: string | null;
};
