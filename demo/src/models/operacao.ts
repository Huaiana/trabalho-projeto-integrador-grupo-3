import type { Conteiner } from "@/models/conteiner";
import type { Solicitacao } from "@/models/solicitacao";

export type Operacao = {
  id: number;
  solicitacao: Solicitacao;
  conteiner: Conteiner | null;
  responsavel: string;
  andamento: string;
  observacoes: string;
};
