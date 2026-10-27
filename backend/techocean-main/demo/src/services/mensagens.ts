import type { ContatoMensagem, Mensagem } from "@/models/mensagem";
import { requisicaoApi } from "@/services/api";

export const listarMensagensCliente = (clienteId: number) =>
  requisicaoApi<Mensagem[]>(`/mensagens/cliente/${clienteId}`);

export const enviarMensagemContato = (contato: { nome: string; email: string; conteudo: string }) =>
  requisicaoApi<ContatoMensagem>("/mensagens/contatos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contato),
  });

export const listarMensagensContato = () => requisicaoApi<ContatoMensagem[]>("/mensagens/contatos");

export const responderMensagemContato = (id: number, resposta: string) =>
  requisicaoApi<ContatoMensagem>(`/mensagens/contatos/${id}/resposta`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resposta }),
  });

export const responderMensagem = (id: number, resposta: string) =>
  requisicaoApi<Mensagem>(`/mensagens/${id}/resposta`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resposta }),
  });

export const deletarMensagemCliente = (id: number) =>
  requisicaoApi<{ message: string }>(`/mensagens/${id}`, { method: "DELETE" });

export const deletarMensagemContato = (id: number) =>
  requisicaoApi<{ message: string }>(`/mensagens/contatos/${id}`, { method: "DELETE" });
