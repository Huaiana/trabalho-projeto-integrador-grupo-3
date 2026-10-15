import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { secoes } from "@/lib/dashboard-secoes";
import { Cargas } from "@/components/dashboard/cargas";

export const Route = createFileRoute("/dashboard/$secao")({
  loader: ({ params }) => {
    const secao = secoes.find((s) => s.slug === params.secao);
    if (!secao) throw notFound();
    return { slug: secao.slug };
  },
  head: ({ loaderData }) => {
    const secao = secoes.find((s) => s.slug === loaderData?.slug);
    const titulo = `${secao?.nome ?? "Seção"} — Techocean`;
    const descricao = secao?.descricao ?? "Gestão operacional Techocean.";
    return { meta: [
      { title: titulo }, { name: "description", content: descricao },
      { property: "og:title", content: titulo }, { property: "og:description", content: descricao },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  notFoundComponent: () => <p className="text-muted-foreground">Seção não encontrada.</p>,
  component: SecaoPage,
});

const campo = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SecaoPage() {
  const { slug } = Route.useLoaderData();
  const secao = secoes.find((s) => s.slug === slug);
  if (!secao) return <p>Seção não encontrada.</p>;
  return (
    <div>
      <p className="eyebrow mb-2">Painel</p>
      <h1 className="text-3xl font-bold">{secao.nome}</h1>
      <p className="mb-8 mt-2 text-muted-foreground">{secao.descricao}</p>
      {slug === "carga" ? <Cargas /> : slug === "mensagens" ? <Mensagens /> : slug === "orcamento" ? <Orcamento /> : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-muted-foreground">
              <tr>{secao.colunas.map((c) => <th key={c} className="px-4 py-3 font-medium">{c}</th>)}</tr>
            </thead>
            <tbody>
              {secao.exemplos.map((linha, i) => (
                <tr key={i} className="border-t border-border">
                  {linha.map((v, j) => <td key={j} className="px-4 py-3">{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type Msg = { id: number; nome: string; email: string; texto: string; respostas: string[] };

function Mensagens() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 1, nome: "Carlos Lima", email: "carlos@empresa.com", texto: "Gostaria de um orçamento para amarração de bobinas.", respostas: [] },
    { id: 2, nome: "Ana Souza", email: "ana@logistica.com", texto: "Vocês atendem no porto de Paranaguá?", respostas: [] },
  ]);
  const [ativa, setAtiva] = useState(1);
  const [resposta, setResposta] = useState("");
  const atual = msgs.find((m) => m.id === ativa)!;

  function responder(e: FormEvent) {
    e.preventDefault();
    if (!resposta.trim()) return;
    setMsgs((l) => l.map((m) => (m.id === ativa ? { ...m, respostas: [...m.respostas, resposta] } : m)));
    setResposta("");
  }

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <ul className="rounded-xl border border-border">
        {msgs.map((m) => (
          <li key={m.id}>
            <button onClick={() => setAtiva(m.id)} className={`w-full border-b border-border px-4 py-3 text-left text-sm ${m.id === ativa ? "bg-secondary" : ""}`}>
              <span className="font-medium">{m.nome}</span>
              <span className="block truncate text-muted-foreground">{m.texto}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground">{atual.nome} · {atual.email}</p>
        <p className="mt-3 rounded-lg bg-card p-4 text-sm">{atual.texto}</p>
        {atual.respostas.map((r, i) => (
          <p key={i} className="mt-3 self-end rounded-lg bg-primary p-4 text-sm text-primary-foreground">{r}</p>
        ))}
        <form onSubmit={responder} className="mt-6 flex gap-2">
          <input value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Escreva sua resposta..." className={campo} />
          <button className="rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Responder</button>
        </form>
      </div>
    </div>
  );
}

function Orcamento() {
  const [enviado, setEnviado] = useState("");
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setEnviado(String(d.get("cliente")));
    e.currentTarget.reset();
  }
  return (
    <form onSubmit={enviar} className="grid max-w-xl gap-4">
      <label className="grid gap-1 text-sm">Cliente
        <select name="cliente" required className={campo}>
          <option value="Logística Atlântica">Logística Atlântica</option>
          <option value="Carlos Lima">Carlos Lima</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">Serviço<input name="servico" required className={campo} /></label>
      <label className="grid gap-1 text-sm">Valor (R$)<input name="valor" type="number" step="0.01" required className={campo} /></label>
      <label className="grid gap-1 text-sm">Observações<textarea name="obs" rows={4} className={campo} /></label>
      <button className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Enviar orçamento</button>
      {enviado && <p className="text-sm text-primary">Orçamento enviado para {enviado}.</p>}
    </form>
  );
}
