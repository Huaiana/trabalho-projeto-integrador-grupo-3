import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEntrar } from "@/controllers/use-autenticacao";
import { loginSchema } from "@/models/autenticacao";
import heroPort from "@/assets/hero-port.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acesso ao painel — Techocean" },
      { name: "description", content: "Acesso seguro ao painel de gestão Techocean." },
      { property: "og:title", content: "Acesso ao painel — Techocean" },
      { property: "og:description", content: "Acesso seguro ao painel de gestão Techocean." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const acesso = useEntrar();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    acesso.reset();
    const form = new FormData(event.currentTarget);
    const resultado = loginSchema.safeParse({
      email: String(form.get("email") ?? ""),
      senha: String(form.get("senha") ?? ""),
    });
    if (!resultado.success) {
      const avisos: Record<string, string> = {};
      for (const erro of resultado.error.issues) {
        const nome = String(erro.path[0] ?? "");
        if (nome && !avisos[nome]) avisos[nome] = erro.message;
      }
      setErros(avisos);
      return;
    }
    setErros({});
    try {
      await acesso.mutateAsync(resultado.data);
      await navigate({ to: "/dashboard", replace: true });
    } catch {
      // A mensagem da API é exibida abaixo do formulário.
    }
  }

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_1.1fr]">
      <section className="flex min-h-screen items-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="font-display text-lg font-bold">
            Techocean
          </Link>
          <p className="eyebrow mt-12">Área restrita</p>
          <h1 className="mt-3 text-4xl font-bold">Acesse o painel</h1>
          <p className="mt-3 text-muted-foreground">
            Entre com o e-mail e a senha cadastrados no sistema.
          </p>

          <form className="mt-10 grid gap-5" onSubmit={enviar} noValidate>
            <div className="grid gap-2">
              <Label htmlFor="login-email">E-mail</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                disabled={acesso.isPending}
                aria-invalid={Boolean(erros["email"])}
                className="h-12"
              />
              {erros["email"] && (
                <p className="text-xs text-destructive" role="alert">
                  {erros["email"]}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="login-senha">Senha</Label>
              <div className="relative">
                <Input
                  id="login-senha"
                  name="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={acesso.isPending}
                  aria-invalid={Boolean(erros["senha"])}
                  className="h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1.5"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {erros["senha"] && (
                <p className="text-xs text-destructive" role="alert">
                  {erros["senha"]}
                </p>
              )}
            </div>
            {acesso.error && (
              <p className="text-sm text-destructive" role="alert">
                {acesso.error.message}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-2 h-12" disabled={acesso.isPending}>
              <LogIn /> {acesso.isPending ? "Entrando…" : "Entrar"}
            </Button>
          </form>
          <p className="mt-8 text-sm text-muted-foreground">
            Ainda não tem cadastro?{" "}
            <Link to="/cadastro" className="font-medium text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </section>
      <aside
        className="relative hidden overflow-hidden border-l border-border bg-card lg:block"
        aria-hidden="true"
      >
        <img src={heroPort} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </aside>
    </main>
  );
}
