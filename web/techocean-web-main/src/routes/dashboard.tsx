import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSair, useSessao } from "@/controllers/use-autenticacao";
import { sessaoQueryOptions } from "@/services/autenticacao";
import { secoes } from "@/lib/dashboard-secoes";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    let usuario;
    try {
      usuario = await context.queryClient.fetchQuery({ ...sessaoQueryOptions, staleTime: 0 });
    } catch {
      throw redirect({ to: "/login", replace: true });
    }
    if (!usuario) throw redirect({ to: "/login", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Painel — Techocean" },
      {
        name: "description",
        content: "Painel de gestão Techocean: cargas, clientes, contêineres, mensagens e mais.",
      },
      { property: "og:title", content: "Painel — Techocean" },
      { property: "og:description", content: "Painel de gestão Techocean." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { data: usuario } = useSessao();
  const logout = useSair();
  const navigate = useNavigate();

  async function encerrar() {
    try {
      await logout.mutateAsync();
      await navigate({ to: "/login", replace: true });
    } catch {
      // A falha é exibida sem afirmar que a sessão foi encerrada.
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <Link to="/" className="px-6 py-6 font-display text-lg font-bold tracking-tight">
          Techocean
        </Link>
        <nav className="flex flex-col gap-1 px-3">
          <Link
            to="/dashboard"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary !text-foreground" }}
          >
            Visão geral
          </Link>
          {secoes.map((s) => (
            <Link
              key={s.slug}
              to="/dashboard/$secao"
              params={{ secao: s.slug }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary !text-foreground" }}
            >
              <s.icone className="size-4" /> {s.nome}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 md:px-10">
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold">{usuario?.nome}</p>
            <p className="break-all text-xs text-muted-foreground">
              {usuario?.email}
              {usuario?.cargo ? ` · ${usuario.cargo}` : ""}
            </p>
          </div>
          <Button variant="outline" disabled={logout.isPending} onClick={() => void encerrar()}>
            <LogOut />
            {logout.isPending ? "Saindo…" : "Sair"}
          </Button>
          {logout.error && (
            <p role="alert" className="w-full text-sm text-destructive">
              {logout.error.message}
            </p>
          )}
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 md:hidden">
          <Link
            to="/dashboard"
            className="whitespace-nowrap rounded-full border border-input px-3 py-1 text-xs"
          >
            Início
          </Link>
          {secoes.map((s) => (
            <Link
              key={s.slug}
              to="/dashboard/$secao"
              params={{ secao: s.slug }}
              className="whitespace-nowrap rounded-full border border-input px-3 py-1 text-xs"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
            >
              {s.nome}
            </Link>
          ))}
        </nav>
        <main className="p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
