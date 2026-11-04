import { z } from "zod";

/** CPF precisa ter os 11 dígitos; duplicidade é verificada pelo back-end. */
export function cpfValido(valor: string): boolean {
  return /^\d{11}$/.test(valor.replace(/\D/g, ""));
}

/** Requisitos do cadastro de usuário (mesmas regras que o back-end deve aplicar). */
export const cadastroSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo.").max(100),
  email: z.string().trim().email("E-mail inválido.").max(255),
  telefone: z
    .string()
    .trim()
    .refine((t) => /^\d{10,11}$/.test(t.replace(/\D/g, "")), "Telefone deve ter DDD + número."),
  cpf: z.string().trim().refine(cpfValido, "CPF incompleto: informe os 11 dígitos."),
  senha: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Za-z]/, "A senha deve conter letras.")
    .regex(/\d/, "A senha deve conter números."),
});

export type Cadastro = z.infer<typeof cadastroSchema>;
