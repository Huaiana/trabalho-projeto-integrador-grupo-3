import { useState, type FormEvent } from "react";
import { LoaderCircle, Plus, RefreshCw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCargas } from "@/controllers/use-cargas";
import { cargaSchema } from "@/models/carga";

const campos = [
  { nome: "descricao", titulo: "Descrição", tipo: "text" },
  { nome: "peso", titulo: "Peso", tipo: "number" },
  { nome: "volume", titulo: "Volume", tipo: "number" },
  { nome: "tipoCarga", titulo: "Tipo de carga", tipo: "text" },
  { nome: "origem", titulo: "Origem", tipo: "text" },
  { nome: "destino", titulo: "Destino", tipo: "text" },
] as const;

export function Cargas() {
  const { consulta, cadastro } = useCargas();
  const [aberto, setAberto] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [sucesso, setSucesso] = useState(false);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    const numero = (nome: string) => {
      const valor = String(dados.get(nome) ?? "").trim();
      return valor === "" ? undefined : Number(valor);
    };
    const resultado = cargaSchema.safeParse({
      descricao: dados.get("descricao"), peso: numero("peso"), volume: numero("volume"),
      tipoCarga: dados.get("tipoCarga"), origem: dados.get("origem"), destino: dados.get("destino"),
    });
    setSucesso(false);
    cadastro.reset();
    if (!resultado.success) {
      const avisos: Record<string, string> = {};
      for (const erro of resultado.error.issues) {
        const chave = String(erro.path[0]);
        if (!avisos[chave]) avisos[chave] = erro.message;
      }
      setErros(avisos);
      return;
    }
    setErros({});
    try {
      await cadastro.mutateAsync(resultado.data);
      setAberto(false);
      setSucesso(true);
    } catch {
      // A mensagem fica no formulário, preservando os dados preenchidos.
    }
  }

  return (
    <section className="min-w-0 space-y-5" aria-label="Gestão de cargas">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Cargas cadastradas</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" title="Atualizar cargas" aria-label="Atualizar cargas" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}><RefreshCw className={consulta.isFetching ? "animate-spin" : ""} /></Button>
          {!aberto && <Button onClick={() => { setAberto(true); setErros({}); setSucesso(false); cadastro.reset(); }}><Plus />Nova carga</Button>}
        </div>
      </div>
      {sucesso && <p role="status" className="text-sm text-primary">Carga cadastrada com sucesso.</p>}
      {aberto && (
        <form noValidate onSubmit={salvar} className="border-y border-border py-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Nova carga</h2>
            <Button type="button" variant="ghost" size="icon" aria-label="Fechar cadastro de carga" title="Fechar" disabled={cadastro.isPending} onClick={() => setAberto(false)}><X /></Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {campos.map((campo) => (
              <label key={campo.nome} className="grid content-start gap-2 text-sm" htmlFor={`carga-${campo.nome}`}>
                {campo.titulo}
                <input id={`carga-${campo.nome}`} aria-label={campo.titulo} name={campo.nome} type={campo.tipo} step={campo.tipo === "number" ? "any" : undefined} required disabled={cadastro.isPending} aria-invalid={Boolean(erros[campo.nome])} aria-describedby={erros[campo.nome] ? `erro-${campo.nome}` : undefined} className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                {erros[campo.nome] && <span id={`erro-${campo.nome}`} className="text-destructive">{erros[campo.nome]}</span>}
              </label>
            ))}
          </div>
          {cadastro.error && <p role="alert" className="mt-4 text-sm text-destructive">{cadastro.error.message}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit" disabled={cadastro.isPending}>{cadastro.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}{cadastro.isPending ? "Salvando…" : "Salvar carga"}</Button>
            <Button type="button" variant="outline" disabled={cadastro.isPending} onClick={() => setAberto(false)}>Cancelar</Button>
          </div>
        </form>
      )}
      {consulta.isPending ? <p role="status" className="text-sm text-muted-foreground">Carregando cargas…</p> : consulta.isError ? (
        <div role="alert" className="space-y-3 border-l-2 border-destructive pl-4">
          <p className="text-sm text-destructive">{consulta.error.message}</p>
          <Button variant="outline" onClick={() => void consulta.refetch()} disabled={consulta.isFetching}>Tentar novamente</Button>
        </div>
      ) : consulta.data.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Nenhuma carga cadastrada.</p> : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-muted-foreground"><tr>{["Código", ...campos.map((c) => c.titulo)].map((titulo) => <th key={titulo} className="whitespace-nowrap px-4 py-3 font-medium">{titulo}</th>)}</tr></thead>
            <tbody>{consulta.data.map((carga) => <tr key={carga.id} className="border-t border-border"><td className="px-4 py-3">{carga.id}</td>{campos.map((campo) => <td key={campo.nome} className="px-4 py-3">{typeof carga[campo.nome] === "number" ? carga[campo.nome].toLocaleString("pt-BR") : carga[campo.nome]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}