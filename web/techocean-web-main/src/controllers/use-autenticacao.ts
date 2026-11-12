import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { entrar, sair, sessaoQueryOptions } from "@/services/autenticacao";

export function useSessao() {
  return useSuspenseQuery(sessaoQueryOptions);
}

export function useEntrar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: entrar,
    onSuccess: (usuario) => queryClient.setQueryData(sessaoQueryOptions.queryKey, usuario),
  });
}

export function useSair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await queryClient.cancelQueries();
      await sair();
    },
    onSuccess: () => queryClient.clear(),
  });
}
