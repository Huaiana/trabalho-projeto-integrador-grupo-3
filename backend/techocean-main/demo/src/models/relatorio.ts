import type { Cliente } from "@/models/cliente";
import type { Mensagem } from "@/models/mensagem";
import type { Operacao } from "@/models/operacao";
import type { Orcamento } from "@/models/orcamento";
import type { Solicitacao } from "@/models/solicitacao";

export type Relatorio = {
  cliente: Cliente;
  solicitacoes: Solicitacao[];
  orcamentos: Orcamento[];
  operacoes: Operacao[];
  mensagens: Mensagem[];
};
