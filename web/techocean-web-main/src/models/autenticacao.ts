import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(255),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export const usuarioLogadoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nome: z.string().min(1),
  email: z.string().email(),
  cargo: z.string().optional(),
});

export type DadosLogin = z.infer<typeof loginSchema>;
export type UsuarioLogado = z.infer<typeof usuarioLogadoSchema>;
