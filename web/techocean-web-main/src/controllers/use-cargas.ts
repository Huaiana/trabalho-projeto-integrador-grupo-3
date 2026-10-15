import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cadastrarCarga, listarCargas } from "@/services/cargas";

export function useCargas() {
  const queryClient = useQueryClient();
  const consulta = useQuery({ queryKey: ["cargas"], queryFn: listarCargas, retry: false });
  const cadastro = useMutation({
    mutationFn: cadastrarCarga,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cargas"] }),
  });
  return { consulta, cadastro };
}