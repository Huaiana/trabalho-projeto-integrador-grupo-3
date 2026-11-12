import { queryOptions } from "@tanstack/react-query";
import { loginSchema, type DadosLogin } from "@/models/autenticacao";
import { buscarSessao, criarSessao, encerrarSessao } from "@/repositories/autenticacao";

export const sessaoQueryOptions = queryOptions({
  queryKey: ["sessao"],
  queryFn: buscarSessao,
  staleTime: 30_000,
  retry: false,
});

export function entrar(dados: DadosLogin) {
  return criarSessao(loginSchema.parse(dados));
}

export function sair() {
  return encerrarSessao();
}
