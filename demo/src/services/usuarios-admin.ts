import type { NovoUsuarioAdmin, UsuarioAdmin } from "@/models/usuario-admin";
import { parametrosApi, requisicaoApi } from "@/services/api";

export const cadastrarAdministrador = (dados: NovoUsuarioAdmin) =>
  requisicaoApi<UsuarioAdmin>(`/admin/cadastrar?${parametrosApi(dados)}`, { method: "POST" });
