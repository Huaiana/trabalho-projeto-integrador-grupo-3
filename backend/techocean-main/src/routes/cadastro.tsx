import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { cadastroSchema } from "@/models/cadastro";
import { cadastrarCliente, ErroClienteApi } from "@/services/clientes";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [{ title: "Cadastro de cliente — Techocean" }],
  }),
  component: Cadastro,
});

const campoClasse =
  "mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring";

function Cadastro() {
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErros({});
    setErroGeral("");

    const form = new FormData(event.currentTarget);
    const validacao = cadastroSchema.safeParse({
      nome: String(form.get("nome") ?? ""),
      cpf: String(form.get("cpf") ?? ""),
      telefone: String(form.get("telefone") ?? ""),
      email: String(form.get("email") ?? ""),
      senha: String(form.get("senha") ?? ""),
    });

    if (!validacao.success) {
      const porCampo: Record<string, string> = {};
      for (const issue of validacao.error.issues) {
        const campo = String(issue.path[0] ?? "");
        if (campo && !porCampo[campo]) {
          porCampo[campo] = issue.message;
        }
      }
      setErros(porCampo);
      return;
    }

    setEnviando(true);
    try {
      await cadastrarCliente(validacao.data);
      setSucesso(true);
    } catch (error) {
      if (
        error instanceof ErroClienteApi &&
        (error.code.includes("CPF") || error.message.toLowerCase().includes("cpf"))
      ) {
        setErros({ cpf: error.message });
      } else {
        setErroGeral(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o cadastro.",
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 md:p-10">
        <Link to="/" className="text-sm text-primary hover:underline">
          Voltar ao site
        </Link>

        {sucesso ? (
          <div className="mt-8" role="status">
            <p className="eyebrow">Cadastro confirmado</p>
            <h1 className="mt-3 text-3xl font-bold">Cadastro criado!</h1>
            <p className="mt-4 text-muted-foreground">
              Seu cadastro de cliente foi realizado com sucesso. Nossa equipe
              entrará em contato pelo telefone ou e-mail informado.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              Voltar ao site
            </Link>
          </div>
        ) : (
          <>
            <p className="eyebrow mt-8">Cadastro de cliente</p>
            <h1 className="mt-3 text-3xl font-bold">Crie seu cadastro</h1>
            <p className="mt-4 text-muted-foreground">
              Preencha seus dados para se cadastrar como cliente.
            </p>

            <form className="mt-8 space-y-5" onSubmit={cadastrar} noValidate>
              <label className="block text-sm font-medium" htmlFor="nome">
                Nome completo
                <input
                  id="nome"
                  name="nome"
                  autoComplete="name"
                  required
                  className={campoClasse}
                />
                {erros["nome"] && (
                  <span className="mt-1 block text-xs text-destructive" role="alert">
                    {erros["nome"]}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium" htmlFor="cpf">
                CPF
                <input
                  id="cpf"
                  name="cpf"
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  required
                  className={campoClasse}
                />
                {erros["cpf"] && (
                  <span className="mt-1 block text-xs text-destructive" role="alert">
                    {erros["cpf"]}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium" htmlFor="telefone">
                Telefone
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(00) 90000-0000"
                  required
                  className={campoClasse}
                />
                {erros["telefone"] && (
                  <span className="mt-1 block text-xs text-destructive" role="alert">
                    {erros["telefone"]}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium" htmlFor="email">
                E-mail
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={campoClasse}
                />
                {erros["email"] && (
                  <span className="mt-1 block text-xs text-destructive" role="alert">
                    {erros["email"]}
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium" htmlFor="senha">
                Senha
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className={campoClasse}
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Use pelo menos 8 caracteres, com letras e números.
                </span>
                {erros["senha"] && (
                  <span className="mt-1 block text-xs text-destructive" role="alert">
                    {erros["senha"]}
                  </span>
                )}
              </label>

              {erroGeral && (
                <p className="text-sm text-destructive" role="alert">
                  {erroGeral}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {enviando ? "Cadastrando..." : "Cadastrar"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
