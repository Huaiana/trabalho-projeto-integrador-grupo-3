import { createFileRoute, Link } from "@tanstack/react-router";
import { secoes } from "@/lib/dashboard-secoes";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [
    { title: "Visão geral — Techocean" },
    { name: "description", content: "Acesso às áreas de gestão Techocean." },
    { property: "og:title", content: "Visão geral — Techocean" },
    { property: "og:description", content: "Acesso às áreas de gestão Techocean." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: VisaoGeral,
});

function VisaoGeral() {
  return (
    <div>
      <p className="eyebrow mb-2">Painel</p>
      <h1 className="mb-8 text-3xl font-bold">Visão geral</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {secoes.map((s) => (
          <Link
            key={s.slug}
            to="/dashboard/$secao"
            params={{ secao: s.slug }}
            className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary"
          >
            <s.icone className="mb-4 size-6 text-primary" />
            <h2 className="font-semibold">{s.nome}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.descricao}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
