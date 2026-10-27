import type { Cliente } from "@/models/cliente";

export type Mensagem = {
  id: number;
  cliente: Cliente;
  especialista: string;
  conteudo: string;
  resposta: string | null;
  status: string;
};

export type ContatoMensagem = {
  id: number;
  nome: string;
  email: string;
  conteudo: string;
  resposta: string | null;
  status: string;
  criadoEm: string;
};
