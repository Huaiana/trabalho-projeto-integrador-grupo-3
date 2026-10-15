import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { secoes } from "@/lib/dashboard-secoes";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — Techocean" },
      { name: "description", content: "Painel de gestão Techocean: cargas, clientes, contêineres, mensagens e mais." },
      { property: "og:title", content: "Painel — Techocean" },
      { property: "og:description", content: "Painel de gestão Techocean." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
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
      <div className="flex-1">
        <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 md:hidden">
          <Link to="/dashboard" className="whitespace-nowrap rounded-full border border-input px-3 py-1 text-xs">Início</Link>
          {secoes.map((s) => (
            <Link key={s.slug} to="/dashboard/$secao" params={{ secao: s.slug }} className="whitespace-nowrap rounded-full border border-input px-3 py-1 text-xs" activeProps={{ className: "bg-primary text-primary-foreground" }}>
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
