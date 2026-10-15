import type { Carga } from "@/models/carga";
import type { Cliente } from "@/models/cliente";
import type { Servico } from "@/models/servico";

export type Solicitacao = {
  id: number;
  cliente: Cliente;
  carga: Carga;
  servico: Servico;
  status: string;
};
