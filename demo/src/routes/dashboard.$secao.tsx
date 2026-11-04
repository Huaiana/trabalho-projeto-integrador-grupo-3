import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { secoes } from "@/lib/dashboard-secoes";
import type { Carga as CargaModel } from "@/models/carga";
import { cadastrarCarga, listarCargas } from "@/services/cargas";
import type { Cliente as ClienteModel } from "@/models/cliente";
import { cadastrarCliente, listarClientes } from "@/services/clientes";
import {
  Conteineres,
  Operacoes,
  Orcamentos,
  Servicos,
  Solicitacoes,
  UsuariosAdmin,
} from "@/components/dashboard/painel-operacional";

export const Route = createFileRoute("/dashboard/$secao")({
  loader: ({ params }) => {
    const secao = secoes.find((s) => s.slug === params.secao);
    if (!secao) throw notFound();
    return { slug: secao.slug };
  },
  notFoundComponent: () => (
    <p className="text-muted-foreground">Seção não encontrada.</p>
  ),
  component: SecaoPage,
});

const campo =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SecaoPage() {
  const { slug } = Route.useLoaderData();
  const secao = secoes.find((s) => s.slug === slug)!;

  return (
    <div>
      <p className="eyebrow mb-2">Painel</p>
      <h1 className="text-3xl font-bold">{secao.nome}</h1>
      <p className="mb-8 mt-2 text-muted-foreground">{secao.descricao}</p>

      {/* Controller Central por Slug */}
      {slug === "carga" ? (
        <Cargas />
      ) : slug === "cliente" ? (
        <Clientes />
      ) : slug === "conteiner" ? (
        <Conteineres />
      ) : slug === "mensagens" ? (
        <Mensagens />
      ) : slug === "operacao" ? (
        <Operacoes />
      ) : slug === "orcamento" ? (
        <Orcamentos />
      ) : slug === "usuario" ? (
        <UsuariosAdmin />
      ) : slug === "servico" ? (
        <Servicos />
      ) : slug === "solicitacao" ? (
        <Solicitacoes />
      ) : slug === "relatorio" ? (
        <RelatorioClientes />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {secao.colunas.map((c) => (
                  <th key={c} className="px-4 py-3 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {secao.exemplos.map((linha, i) => (
                <tr key={i} className="border-t border-border">
                  {linha.map((v, j) => (
                    <td key={j} className="px-4 py-3">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   1. RELATÓRIO DE CLIENTES (Com abas interativas no Modal de Detalhes)
   ========================================================================== */
function RelatorioClientes() {
  const [clientes, setClientes] = useState<ClienteModel[]>([
    {
      id: 1,
      nome: "Carlos Lima",
      cpfCnpj: "123.456.789-00",
      telefone: "(41) 9999-8888",
      email: "carlos@empresa.com",
    },
    {
      id: 2,
      nome: "Ana Souza",
      cpfCnpj: "987.654.321-00",
      telefone: "(41) 9888-7777",
      email: "ana@logistica.com",
    },
  ]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // Estado para controlar o cliente selecionado e a aba ativa no modal ("geral" | "historico")
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteModel | null>(null);
  const [abaModal, setAbaModal] = useState<"geral" | "historico">("geral");

  async function carregarDados() {
    setCarregando(true);
    setErro("");
    try {
      const dados = await listarClientes();
      if (dados && dados.length > 0) {
        setClientes(dados);
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o relatório."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function handleImprimir() {
    window.print();
  }

  function handleAbrirModal(cliente: ClienteModel) {
    setClienteSelecionado(cliente);
    setAbaModal("geral"); // Abre na visão geral por padrão
  }

  function handleDeletar(e: React.MouseEvent, id: number | string) {
    e.stopPropagation(); // Evita abrir o modal ao clicar em deletar
    if (confirm("Tem certeza que deseja excluir este cliente do relatório?")) {
      setClientes((atuais) => atuais.filter((cliente) => cliente.id !== id));
      if (clienteSelecionado?.id === id) {
        setClienteSelecionado(null);
      }
    }
  }

  function handleDeletarTudo() {
    if (confirm("Tem certeza que deseja limpar todos os registros deste relatório?")) {
      setClientes([]);
      setClienteSelecionado(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior (Oculta ao imprimir) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 print:hidden">
        <div>
          <h2 className="text-base font-semibold">Ações do Relatório</h2>
          <p className="text-xs text-muted-foreground">
            Clique em qualquer linha da tabela para abrir o cadastro detalhado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Atualizar */}
          <button
            type="button"
            onClick={carregarDados}
            disabled={carregando}
            className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {carregando ? "Atualizando..." : "🔄 Atualizar"}
          </button>

          {/* Botão Limpar Relatório */}
          <button
            type="button"
            onClick={handleDeletarTudo}
            disabled={clientes.length === 0}
            className="rounded-lg bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
          >
            🗑️ Limpar Relatório
          </button>

          {/* Botão Imprimir / PDF */}
          <button
            type="button"
            onClick={handleImprimir}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            🖨️ Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Tabela de Relatório */}
      <section>
        {erro && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {erro}
          </p>
        )}

        {carregando ? (
          <p className="text-sm text-muted-foreground">
            Carregando dados do relatório...
          </p>
        ) : clientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum registro encontrado no relatório.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">CPF/CNPJ</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium text-right print:hidden">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    onClick={() => handleAbrirModal(cliente)}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                      #{cliente.id}
                    </td>
                    <td className="px-4 py-3 font-medium">{cliente.nome}</td>
                    <td className="px-4 py-3">{cliente.cpfCnpj}</td>
                    <td className="px-4 py-3">{cliente.telefone}</td>
                    <td className="px-4 py-3">{cliente.email}</td>
                    <td className="px-4 py-3 text-right print:hidden">
                      {/* Botão Deletar por linha */}
                      <button
                        type="button"
                        onClick={(e) => handleDeletar(e, cliente.id)}
                        className="rounded bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      >
                        🗑️ Deletar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal / Pop-up de Detalhes do Cliente com Abas */}
      {clienteSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-semibold uppercase text-primary">
                  Ficha do Cliente #{clienteSelecionado.id}
                </span>
                <h3 className="text-xl font-bold">{clienteSelecionado.nome}</h3>
              </div>
              <button
                type="button"
                onClick={() => setClienteSelecionado(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ✖
              </button>
            </div>

            {/* Navegação por Abas */}
            <div className="mt-4 flex border-b border-border text-xs font-medium">
              <button
                type="button"
                onClick={() => setAbaModal("geral")}
                className={`border-b-2 px-3 py-2 transition-colors ${
                  abaModal === "geral"
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Visão Geral
              </button>
              <button
                type="button"
                onClick={() => setAbaModal("historico")}
                className={`border-b-2 px-3 py-2 transition-colors ${
                  abaModal === "historico"
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Histórico Detalhado
              </button>
            </div>

            {/* Conteúdo da Aba 1: Visão Geral */}
            {abaModal === "geral" && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">CPF / CNPJ</p>
                    <p className="font-medium">{clienteSelecionado.cpfCnpj}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">{clienteSelecionado.telefone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">E-mail de Contato</p>
                  <p className="font-medium">{clienteSelecionado.email}</p>
                </div>

                {/* Card do Resumo - Clicável para abrir o histórico */}
                <div
                  onClick={() => setAbaModal("historico")}
                  className="group cursor-pointer rounded-lg border border-border bg-muted/10 p-3 transition-all hover:border-primary/50 hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-muted-foreground group-hover:text-primary">
                      Resumo de Atividades
                    </p>
                    <span className="text-[10px] text-muted-foreground group-hover:underline">
                      Ver detalhes ➔
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground space-y-1">
                    • 03 Operações cadastradas<br />
                    • 01 Orçamento aprovado<br />
                    • Status: <span className="font-semibold text-emerald-500">Ativo</span>
                  </p>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba 2: Histórico Detalhado */}
            {abaModal === "historico" && (
              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Operações Cadastradas</h4>
                  <ul className="space-y-2">
                    <li className="rounded-md border border-border bg-muted/20 p-2.5">
                      <div className="flex justify-between font-medium">
                        <span>#OP-2024-01 - Carga de Bobinas</span>
                        <span className="text-emerald-500">Concluído</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Origem: Paranaguá-PR ➔ Destino: Curitiba-PR</p>
                    </li>
                    <li className="rounded-md border border-border bg-muted/20 p-2.5">
                      <div className="flex justify-between font-medium">
                        <span>#OP-2024-02 - Amarração em Contêiner</span>
                        <span className="text-amber-500">Em Transporte</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Origem: Santos-SP ➔ Destino: Itajaí-SC</p>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Orçamentos Aprovados</h4>
                  <div className="rounded-md border border-border bg-muted/20 p-2.5">
                    <div className="flex justify-between font-medium">
                      <span>#ORC-884 - Serviço de Amarração Específica</span>
                      <span className="font-bold text-foreground">R$ 14.500,00</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Aprovado em 02/10/2026</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rodapé do Modal */}
            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={handleImprimir}
                className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted"
              >
                🖨️ Imprimir Ficha
              </button>
              <button
                type="button"
                onClick={() => setClienteSelecionado(null)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   2. MENSAGENS (Atendimento / Chat)
   ========================================================================== */
interface MsgModel {
  id: number;
  nome: string;
  email: string;
  texto: string;
  respostas: string[];
}

function Mensagens() {
  const [msgs, setMsgs] = useState<MsgModel[]>([
    {
      id: 1,
      nome: "Carlos Lima",
      email: "carlos@empresa.com",
      texto: "Gostaria de um orçamento para amarração de bobinas.",
      respostas: [],
    },
    {
      id: 2,
      nome: "Ana Souza",
      email: "ana@logistica.com",
      texto: "Vocês atendem no porto de Paranaguá?",
      respostas: [],
    },
  ]);
  const [ativa, setAtiva] = useState<number>(1);
  const [resposta, setResposta] = useState<string>("");

  const atual = msgs.find((m) => m.id === ativa) ?? msgs[0];

  function responder(e: FormEvent) {
    e.preventDefault();
    if (!resposta.trim() || !atual) return;

    setMsgs((lista) =>
      lista.map((m) =>
        m.id === atual.id
          ? { ...m, respostas: [...m.respostas, resposta.trim()] }
          : m
      )
    );
    setResposta("");
  }

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <ul className="overflow-hidden rounded-xl border border-border bg-card">
        {msgs.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setAtiva(m.id)}
              className={`w-full border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-none ${
                m.id === atual?.id ? "bg-secondary font-medium" : "hover:bg-muted/50"
              }`}
            >
              <span className="block font-semibold text-foreground">{m.nome}</span>
              <span className="block truncate text-xs text-muted-foreground">{m.texto}</span>
            </button>
          </li>
        ))}
      </ul>

      {atual ? (
        <div className="flex min-h-[400px] flex-col justify-between rounded-xl border border-border bg-card p-5">
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="font-semibold">{atual.nome}</h3>
              <p className="text-xs text-muted-foreground">{atual.email}</p>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
              {atual.texto}
            </div>

            <div className="flex flex-col gap-2">
              {atual.respostas.map((r, i) => (
                <div
                  key={i}
                  className="max-w-[80%] self-end rounded-lg bg-primary p-3 text-sm text-primary-foreground shadow-sm"
                >
                  {r}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={responder} className="mt-6 flex gap-2 border-t border-border pt-4">
            <input
              type="text"
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              placeholder="Escreva sua resposta..."
              className={campo}
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Responder
            </button>
          </form>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-border p-5 text-sm text-muted-foreground">
          Nenhuma mensagem selecionada.
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   3. CLIENTES
   ========================================================================== */
function Clientes() {
  const [clientes, setClientes] = useState<ClienteModel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function atualizarLista() {
    setClientes(await listarClientes());
  }

  useEffect(() => {
    let ativa = true;

    listarClientes()
      .then((resultado) => {
        if (ativa) setClientes(resultado);
      })
      .catch((error: unknown) => {
        if (ativa)
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os clientes."
          );
      })
      .finally(() => {
        if (ativa) setCarregando(false);
      });

    return () => {
      ativa = false;
    };
  }, []);

  async function cadastrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);

    const form = e.currentTarget;
    const dados = new FormData(form);
    try {
      await cadastrarCliente({
        nome: String(dados.get("nome")).trim(),
        cpf: String(dados.get("cpfCnpj")).replace(/\D/g, ""),
        telefone: String(dados.get("telefone")).replace(/\D/g, ""),
        email: String(dados.get("email")).trim(),
        senha: String(dados.get("senha")),
      });
      await atualizarLista();
      setSucesso("Cliente cadastrado com sucesso.");
      form.reset();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o cliente."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={cadastrar}
        className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <h2 className="text-lg font-semibold sm:col-span-2">Cadastrar cliente</h2>
        <label className="grid gap-1 text-sm">
          Nome
          <input name="nome" required maxLength={255} className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          CPF/CNPJ
          <input
            name="cpfCnpj"
            required
            inputMode="numeric"
            minLength={11}
            maxLength={18}
            className={campo}
          />
        </label>
        <label className="grid gap-1 text-sm">
          Telefone
          <input name="telefone" required type="tel" maxLength={20} className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          E-mail
          <input name="email" required type="email" maxLength={255} className={campo} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Senha
          <input name="senha" required type="password" minLength={8} className={campo} />
        </label>
        <button
          disabled={salvando}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
        >
          {salvando ? "Cadastrando..." : "Cadastrar cliente"}
        </button>
        {erro && (
          <p role="alert" className="text-sm text-destructive sm:col-span-2">
            {erro}
          </p>
        )}
        {sucesso && (
          <p role="status" className="text-sm text-primary sm:col-span-2">
            {sucesso}
          </p>
        )}
      </form>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Clientes cadastrados</h2>
        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando clientes...</p>
        ) : clientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground">
                <tr>
                  {["Código", "Nome", "CPF/CNPJ", "Telefone", "E-mail"].map((titulo) => (
                    <th key={titulo} className="px-4 py-3 font-medium">
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="border-t border-border">
                    <td className="px-4 py-3">{cliente.id}</td>
                    <td className="px-4 py-3">{cliente.nome}</td>
                    <td className="px-4 py-3">{cliente.cpfCnpj}</td>
                    <td className="px-4 py-3">{cliente.telefone}</td>
                    <td className="px-4 py-3">{cliente.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ==========================================================================
   4. CARGAS
   ========================================================================== */
function Cargas() {
  const [cargas, setCargas] = useState<CargaModel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    let ativa = true;

    listarCargas()
      .then((resultado) => {
        if (ativa) setCargas(resultado);
      })
      .catch((error: unknown) => {
        if (ativa)
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as cargas."
          );
      })
      .finally(() => {
        if (ativa) setCarregando(false);
      });

    return () => {
      ativa = false;
    };
  }, []);

  async function cadastrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);

    const form = e.currentTarget;
    const dados = new FormData(form);
    try {
      const novaCarga = await cadastrarCarga({
        descricao: String(dados.get("descricao")).trim(),
        peso: Number(dados.get("peso")),
        volume: Number(dados.get("volume")),
        tipoCarga: String(dados.get("tipoCarga")).trim(),
        origem: String(dados.get("origem")).trim(),
        destino: String(dados.get("destino")).trim(),
      });
      setCargas((atuais) => [...atuais, novaCarga]);
      setSucesso("Carga cadastrada com sucesso.");
      form.reset();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a carga."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={cadastrar}
        className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <h2 className="text-lg font-semibold sm:col-span-2">Cadastrar carga</h2>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Descrição
          <input name="descricao" required maxLength={255} className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          Peso (kg)
          <input name="peso" type="number" min="0.01" step="any" required className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          Volume (m³)
          <input name="volume" type="number" min="0.01" step="any" required className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          Tipo de carga
          <input name="tipoCarga" required maxLength={100} className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          Origem
          <input name="origem" required maxLength={255} className={campo} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Destino
          <input name="destino" required maxLength={255} className={campo} />
        </label>
        <button
          disabled={salvando}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
        >
          {salvando ? "Cadastrando..." : "Cadastrar carga"}
        </button>
        {erro && (
          <p role="alert" className="text-sm text-destructive sm:col-span-2">
            {erro}
          </p>
        )}
        {sucesso && (
          <p role="status" className="text-sm text-primary sm:col-span-2">
            {sucesso}
          </p>
        )}
      </form>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Cargas cadastradas</h2>
        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando cargas...</p>
        ) : cargas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma carga cadastrada.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground">
                <tr>
                  {[
                    "Código",
                    "Descrição",
                    "Peso (kg)",
                    "Volume (m³)",
                    "Tipo",
                    "Origem",
                    "Destino",
                  ].map((titulo) => (
                    <th key={titulo} className="px-4 py-3 font-medium">
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargas.map((carga) => (
                  <tr key={carga.id} className="border-t border-border">
                    <td className="px-4 py-3">{carga.id}</td>
                    <td className="px-4 py-3">{carga.descricao}</td>
                    <td className="px-4 py-3">{carga.peso}</td>
                    <td className="px-4 py-3">{carga.volume}</td>
                    <td className="px-4 py-3">{carga.tipoCarga}</td>
                    <td className="px-4 py-3">{carga.origem}</td>
                    <td className="px-4 py-3">{carga.destino}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
