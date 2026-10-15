import { useEffect, useState } from "react";
import { Printer, RefreshCw, Trash2 } from "lucide-react";
import type { Cliente } from "@/models/cliente";
import type { Relatorio } from "@/models/relatorio";
import { listarClientes } from "@/services/clientes";
import { obterRelatorioCliente } from "@/services/relatorios";

const campo = "w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm";
const botao =
  "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 print:hidden";

function Linha({ titulo, valor }: { titulo: string; valor: string | number | null | undefined }) {
  return (
    <p className="text-sm">
      <span className="font-medium">{titulo}: </span>
      {valor === null || valor === undefined || valor === "" ? "Não informado" : valor}
    </p>
  );
}

function formatoMoeda(valor: number | null) {
  return valor === null
    ? "Não informado"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export function RelatorioClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
  const [atualizacao, setAtualizacao] = useState(0);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    listarClientes()
      .then((resultado) => {
        if (ativo) setClientes(resultado);
      })
      .catch((error: unknown) => {
        if (ativo)
          setErro(
            error instanceof Error ? error.message : "Não foi possível carregar os clientes.",
          );
      })
      .finally(() => {
        if (ativo) setCarregandoClientes(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!clienteId) {
      setRelatorio(null);
      setCarregandoRelatorio(false);
      return;
    }

    let ativo = true;
    setRelatorio(null);
    setErro("");
    setCarregandoRelatorio(true);
    obterRelatorioCliente(Number(clienteId))
      .then((resultado) => {
        if (ativo) setRelatorio(resultado);
      })
      .catch((error: unknown) => {
        if (ativo)
          setErro(
            error instanceof Error ? error.message : "Não foi possível carregar o relatório.",
          );
      })
      .finally(() => {
        if (ativo) setCarregandoRelatorio(false);
      });
    return () => {
      ativo = false;
    };
  }, [atualizacao, clienteId]);

  const operacoesPorSolicitacao = new Map(
    relatorio?.operacoes.map((operacao) => [operacao.solicitacao.id, operacao]) ?? [],
  );
  const orcamentosAssociados = new Set<number>();

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 rounded-xl border border-border bg-card p-5 print:hidden">
        <label className="grid gap-2 text-sm font-medium" htmlFor="relatorio-cliente">
          Cliente
          <select
            id="relatorio-cliente"
            value={clienteId}
            onChange={(evento) => setClienteId(evento.target.value)}
            disabled={carregandoClientes}
            className={campo}
          >
            <option value="">
              {carregandoClientes ? "Carregando clientes..." : "Selecione um cliente"}
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                #{cliente.id} — {cliente.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!relatorio || carregandoRelatorio}
            className={`${botao} px-3 py-1.5 text-xs`}
          >
            <Printer className="size-3.5" aria-hidden="true" />
            Imprimir relatório
          </button>
          <button
            type="button"
            onClick={() => {
              setErro("");
              setAtualizacao((atual) => atual + 1);
            }}
            disabled={!clienteId || carregandoRelatorio}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 print:hidden"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => {
              setClienteId("");
              setErro("");
            }}
            disabled={!clienteId}
            className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60 print:hidden"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Deletar
          </button>
        </div>
      </section>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}
      {carregandoRelatorio && (
        <p role="status" className="text-sm text-muted-foreground">
          Carregando relatório...
        </p>
      )}
      {!clienteId && !carregandoClientes && !erro && (
        <p className="text-sm text-muted-foreground">
          Selecione um cliente para consultar os pedidos e operações relacionados.
        </p>
      )}

      {relatorio && (
        <article className="grid gap-6">
          <header className="border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">
              Relatório do cliente #{relatorio.cliente.id}
            </p>
            <h2 className="text-2xl font-bold">{relatorio.cliente.nome}</h2>
          </header>

          <section className="grid gap-2 rounded-xl border border-border bg-card p-5">
            <h3 className="text-lg font-semibold">Dados do cliente</h3>
            <Linha titulo="ID" valor={relatorio.cliente.id} />
            <Linha titulo="CPF/CNPJ" valor={relatorio.cliente.cpfCnpj} />
            <Linha titulo="Telefone" valor={relatorio.cliente.telefone} />
            <Linha titulo="E-mail" valor={relatorio.cliente.email} />
          </section>

          <section className="grid gap-4">
            <h3 className="text-lg font-semibold">Pedidos e trabalhos</h3>
            {relatorio.solicitacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este cliente não possui solicitações registradas.
              </p>
            ) : (
              relatorio.solicitacoes.map((solicitacao) => {
                const operacao = operacoesPorSolicitacao.get(solicitacao.id);
                const orcamentos = relatorio.orcamentos.filter(
                  (orcamento) =>
                    orcamento.carga.id === solicitacao.carga.id &&
                    orcamento.servico.id === solicitacao.servico.id,
                );
                for (const orcamento of orcamentos) orcamentosAssociados.add(orcamento.id);

                return (
                  <article
                    key={solicitacao.id}
                    className="grid gap-4 rounded-xl border border-border bg-card p-5"
                  >
                    <div>
                      <h4 className="font-semibold">Solicitação #{solicitacao.id}</h4>
                      <Linha titulo="Status" valor={solicitacao.status} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-1">
                        <h5 className="font-medium">Carga #{solicitacao.carga.id}</h5>
                        <Linha titulo="Descrição" valor={solicitacao.carga.descricao} />
                        <Linha titulo="Peso" valor={`${solicitacao.carga.peso} kg`} />
                        <Linha titulo="Volume" valor={`${solicitacao.carga.volume} m³`} />
                        <Linha titulo="Tipo" valor={solicitacao.carga.tipoCarga} />
                        <Linha titulo="Origem" valor={solicitacao.carga.origem} />
                        <Linha titulo="Destino" valor={solicitacao.carga.destino} />
                      </div>
                      <div className="grid gap-1">
                        <h5 className="font-medium">
                          Serviço vinculado ao pedido #{solicitacao.servico.id}
                        </h5>
                        <Linha titulo="Nome" valor={solicitacao.servico.nome} />
                        <Linha titulo="Categoria" valor={solicitacao.servico.categoria} />
                        <Linha titulo="Descrição" valor={solicitacao.servico.descricao} />
                        <Linha
                          titulo="Disponível"
                          valor={solicitacao.servico.disponivel ? "Sim" : "Não"}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <h5 className="font-medium">Orçamentos relacionados</h5>
                      {orcamentos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum orçamento correspondente a esta carga e serviço.
                        </p>
                      ) : (
                        orcamentos.map((orcamento) => (
                          <div
                            key={orcamento.id}
                            className="grid gap-1 rounded-md border border-border p-3"
                          >
                            <Linha titulo={`Orçamento #${orcamento.id}`} valor={orcamento.status} />
                            <Linha
                              titulo="Valor estimado"
                              valor={formatoMoeda(orcamento.valorEstimado)}
                            />
                            <Linha titulo="Observações" valor={orcamento.observacoes} />
                          </div>
                        ))
                      )}
                    </div>

                    <div className="grid gap-2">
                      <h5 className="font-medium">Operação</h5>
                      {!operacao ? (
                        <p className="text-sm text-muted-foreground">
                          Ainda não há operação vinculada a esta solicitação.
                        </p>
                      ) : (
                        <div className="grid gap-1">
                          <Linha titulo={`Operação #${operacao.id}`} valor={operacao.andamento} />
                          <Linha titulo="Responsável" valor={operacao.responsavel} />
                          <Linha titulo="Observações" valor={operacao.observacoes} />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <h5 className="font-medium">Contêiner vinculado à operação</h5>
                      {!operacao?.conteiner ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum contêiner associado a esta solicitação.
                        </p>
                      ) : (
                        <div className="grid gap-1">
                          <Linha titulo="ID do contêiner" valor={operacao.conteiner.id} />
                          <Linha titulo="Número" valor={operacao.conteiner.numeroConteiner} />
                          <Linha titulo="Tipo" valor={operacao.conteiner.tipo} />
                          <Linha titulo="Situação" valor={operacao.conteiner.situacao} />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>

          {relatorio.orcamentos.some((orcamento) => !orcamentosAssociados.has(orcamento.id)) && (
            <section className="grid gap-3">
              <h3 className="text-lg font-semibold">Outros orçamentos do cliente</h3>
              {relatorio.orcamentos
                .filter((orcamento) => !orcamentosAssociados.has(orcamento.id))
                .map((orcamento) => (
                  <div
                    key={orcamento.id}
                    className="grid gap-1 rounded-xl border border-border bg-card p-5"
                  >
                    <h4 className="font-medium">Orçamento #{orcamento.id}</h4>
                    <Linha titulo="Carga" valor={orcamento.carga.descricao} />
                    <Linha titulo="Serviço" valor={orcamento.servico.nome} />
                    <Linha titulo="Status" valor={orcamento.status} />
                    <Linha titulo="Valor estimado" valor={formatoMoeda(orcamento.valorEstimado)} />
                    <Linha titulo="Observações" valor={orcamento.observacoes} />
                  </div>
                ))}
            </section>
          )}

          <section className="grid gap-3">
            <h3 className="text-lg font-semibold">Mensagens do cliente</h3>
            {relatorio.mensagens.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este cliente não possui mensagens registradas.
              </p>
            ) : (
              relatorio.mensagens.map((mensagem) => (
                <div
                  key={mensagem.id}
                  className="grid gap-2 rounded-xl border border-border bg-card p-5"
                >
                  <h4 className="font-medium">
                    Mensagem #{mensagem.id} · {mensagem.status}
                  </h4>
                  <Linha titulo="Especialista" valor={mensagem.especialista} />
                  <Linha titulo="Mensagem" valor={mensagem.conteudo} />
                  <Linha titulo="Resposta" valor={mensagem.resposta} />
                </div>
              ))
            )}
          </section>
        </article>
      )}
    </div>
  );
}
