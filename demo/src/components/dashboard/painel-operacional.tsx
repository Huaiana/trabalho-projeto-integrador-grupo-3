import { useEffect, useState, type FormEvent } from "react";
import { CheckCheck, Mail, MessageSquareText, Send, Trash2, UserRound } from "lucide-react";
import type { Carga } from "@/models/carga";
import type { Cliente } from "@/models/cliente";
import type { Agendamento } from "@/models/agendamento";
import type { Conteiner } from "@/models/conteiner";
import type { ContatoMensagem, Mensagem } from "@/models/mensagem";
import type { Operacao } from "@/models/operacao";
import type { Orcamento } from "@/models/orcamento";
import type { Servico } from "@/models/servico";
import type { Solicitacao } from "@/models/solicitacao";
import type { NovoUsuarioAdmin } from "@/models/usuario-admin";
import { listarClientes } from "@/services/clientes";
import { listarCargas } from "@/services/cargas";
import { atualizarAgendamento, listarAgendamentos } from "@/services/agendamentos";
import { cadastrarConteiner, listarConteineres } from "@/services/conteineres";
import {
  listarMensagensCliente,
  listarMensagensContato,
  responderMensagem,
  responderMensagemContato,
  deletarMensagemCliente,
  deletarMensagemContato,
} from "@/services/mensagens";
import { atualizarOperacao, cadastrarOperacao, listarOperacoes } from "@/services/operacoes";
import { atualizarOrcamento, cadastrarOrcamento, listarOrcamentos } from "@/services/orcamentos";
import { cadastrarServico, listarServicos } from "@/services/servicos";
import {
  atualizarSolicitacao,
  cadastrarSolicitacao,
  listarSolicitacoes,
} from "@/services/solicitacoes";
import { cadastrarAdministrador } from "@/services/usuarios-admin";

const campo = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const botao =
  "rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60";
const botaoSecundario =
  "inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-60";
const botaoDestrutivo =
  "inline-flex items-center gap-2 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60";

function Erro({ texto }: { texto: string }) {
  return texto ? (
    <p role="alert" className="text-sm text-destructive">
      {texto}
    </p>
  ) : null;
}

function Sucesso({ texto }: { texto: string }) {
  return texto ? (
    <p role="status" className="text-sm text-primary">
      {texto}
    </p>
  ) : null;
}

function TabelaVazia({ carregando, vazio }: { carregando: boolean; vazio: string }) {
  return <p className="text-sm text-muted-foreground">{carregando ? "Carregando..." : vazio}</p>;
}

export function Conteineres() {
  const [itens, setItens] = useState<Conteiner[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    listarConteineres()
      .then((rows) => {
        if (ativo) setItens(rows);
      })
      .catch((error: unknown) => {
        if (ativo)
          setErro(error instanceof Error ? error.message : "Falha ao carregar contêineres.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    const form = evento.currentTarget;
    const dados = new FormData(form);
    try {
      const item = await cadastrarConteiner({
        numeroConteiner: String(dados.get("numeroConteiner")).trim(),
        tipo: String(dados.get("tipo")).trim(),
        situacao: String(dados.get("situacao")).trim(),
      });
      setItens((atuais) => [...atuais, item]);
      setSucesso("Contêiner cadastrado.");
      form.reset();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível cadastrar o contêiner.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={enviar}
        className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3"
      >
        <h2 className="text-lg font-semibold sm:col-span-3">Cadastrar contêiner</h2>
        <label className="grid gap-1 text-sm">
          Número
          <input name="numeroConteiner" required className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          Tipo
          <input name="tipo" required className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          Situação
          <input name="situacao" required className={campo} />
        </label>
        <button disabled={salvando} className={botao}>
          Cadastrar
        </button>
        <Erro texto={erro} />
        <Sucesso texto={sucesso} />
      </form>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Contêineres cadastrados</h2>
        {carregando || (erro && !itens.length) ? (
          <TabelaVazia carregando={carregando} vazio="" />
        ) : !itens.length ? (
          <TabelaVazia carregando={false} vazio="Nenhum contêiner cadastrado." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground">
                <tr>
                  {["Código", "Número", "Tipo", "Situação"].map((x) => (
                    <th key={x} className="px-4 py-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((x) => (
                  <tr key={x.id} className="border-t border-border">
                    <td className="px-4 py-3">{x.id}</td>
                    <td className="px-4 py-3">{x.numeroConteiner}</td>
                    <td className="px-4 py-3">{x.tipo}</td>
                    <td className="px-4 py-3">{x.situacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Erro texto={erro} />
      </section>
    </div>
  );
}

export function Servicos() {
  const [itens, setItens] = useState<Servico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    listarServicos()
      .then((rows) => {
        if (ativo) setItens(rows);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof Error ? error.message : "Falha ao carregar serviços.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    const form = evento.currentTarget;
    const dados = new FormData(form);
    try {
      const item = await cadastrarServico({
        nome: String(dados.get("nome")).trim(),
        descricao: String(dados.get("descricao")).trim(),
        categoria: String(dados.get("categoria")).trim(),
        disponivel: dados.get("disponivel") === "true",
      });
      if (item.disponivel) setItens((atuais) => [...atuais, item]);
      setSucesso("Serviço cadastrado.");
      form.reset();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível cadastrar o serviço.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={enviar}
        className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <h2 className="text-lg font-semibold sm:col-span-2">Cadastrar serviço</h2>
        <label className="grid gap-1 text-sm">
          Nome
          <input name="nome" required className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          Categoria
          <input name="categoria" required className={campo} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          Descrição
          <textarea name="descricao" required maxLength={1000} rows={3} className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          Disponibilidade
          <select name="disponivel" className={campo}>
            <option value="true">Disponível</option>
            <option value="false">Indisponível</option>
          </select>
        </label>
        <button disabled={salvando} className={botao}>
          Cadastrar
        </button>
        <Erro texto={erro} />
        <Sucesso texto={sucesso} />
      </form>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Serviços disponíveis</h2>
        {carregando || (erro && !itens.length) ? (
          <TabelaVazia carregando={carregando} vazio="" />
        ) : !itens.length ? (
          <TabelaVazia carregando={false} vazio="Nenhum serviço disponível." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground">
                <tr>
                  {["Código", "Nome", "Descrição", "Categoria", "Disponível"].map((x) => (
                    <th key={x} className="px-4 py-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((x) => (
                  <tr key={x.id} className="border-t border-border">
                    <td className="px-4 py-3">{x.id}</td>
                    <td className="px-4 py-3">{x.nome}</td>
                    <td className="px-4 py-3">{x.descricao}</td>
                    <td className="px-4 py-3">{x.categoria}</td>
                    <td className="px-4 py-3">{x.disponivel ? "Sim" : "Não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Erro texto={erro} />
      </section>
    </div>
  );
}

export function Solicitacoes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [itens, setItens] = useState<Solicitacao[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      listarClientes(),
      listarCargas(),
      listarServicos(),
      listarSolicitacoes(),
      listarAgendamentos(),
    ])
      .then(([cs, gs, ss, rows, visits]) => {
        if (ativo) {
          setClientes(cs);
          setCargas(gs);
          setServicos(ss);
          setItens(rows);
          setAgendamentos(visits);
        }
      })
      .catch((error: unknown) => {
        if (ativo)
          setErro(error instanceof Error ? error.message : "Falha ao carregar solicitações.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    const form = evento.currentTarget;
    const dados = new FormData(form);
    try {
      const item = await cadastrarSolicitacao({
        clienteId: Number(dados.get("clienteId")),
        cargaId: Number(dados.get("cargaId")),
        servicoId: Number(dados.get("servicoId")),
      });
      setItens((atuais) => [...atuais, item]);
      setSucesso("Solicitação criada.");
      form.reset();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível criar a solicitação.");
    } finally {
      setSalvando(false);
    }
  }

  async function mudarStatus(id: number, status: string) {
    setErro("");
    try {
      const atualizada = await atualizarSolicitacao(id, status);
      setItens((atuais) => atuais.map((x) => (x.id === id ? atualizada : x)));
      setSucesso("Status atualizado.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    }
  }

  async function mudarStatusAgendamento(id: number, confirmado: boolean) {
    setErro("");
    try {
      const atualizado = await atualizarAgendamento(id, confirmado);
      setAgendamentos((atuais) => atuais.map((x) => (x.id === id ? atualizado : x)));
      setSucesso("Status do agendamento atualizado.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar o agendamento.");
    }
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={enviar}
        className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3"
      >
        <h2 className="text-lg font-semibold sm:col-span-3">Criar solicitação</h2>
        <label className="grid gap-1 text-sm">
          Cliente
          <select name="clienteId" required className={campo}>
            <option value="">Selecione...</option>
            {clientes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome} (#{x.id})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Carga
          <select name="cargaId" required className={campo}>
            <option value="">Selecione...</option>
            {cargas.map((x) => (
              <option key={x.id} value={x.id}>
                {x.descricao} (#{x.id})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Serviço
          <select name="servicoId" required className={campo}>
            <option value="">Selecione...</option>
            {servicos.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome} (#{x.id})
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={salvando || !clientes.length || !cargas.length || !servicos.length}
          className={botao}
        >
          Criar solicitação
        </button>
        <Erro texto={erro} />
        <Sucesso texto={sucesso} />
      </form>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Solicitações registradas</h2>
        {carregando || (erro && !itens.length) ? (
          <TabelaVazia carregando={carregando} vazio="" />
        ) : !itens.length ? (
          <TabelaVazia carregando={false} vazio="Nenhuma solicitação cadastrada." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground">
                <tr>
                  {["Código", "Cliente", "Carga", "Serviço", "Status", "Ação"].map((x) => (
                    <th key={x} className="px-4 py-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((x) => (
                  <tr key={x.id} className="border-t border-border">
                    <td className="px-4 py-3">{x.id}</td>
                    <td className="px-4 py-3">{x.cliente?.nome}</td>
                    <td className="px-4 py-3">{x.carga?.descricao}</td>
                    <td className="px-4 py-3">{x.servico?.nome}</td>
                    <td className="px-4 py-3">{x.status}</td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Status da solicitação ${x.id}`}
                        value={x.status}
                        onChange={(e) => void mudarStatus(x.id, e.target.value)}
                        className={campo}
                      >
                        <option value="PENDENTE">PENDENTE</option>
                        <option value="EM_ANALISE">EM_ANALISE</option>
                        <option value="APROVADA">APROVADA</option>
                        <option value="CANCELADA">CANCELADA</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Erro texto={erro} />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Agendamentos de visita</h2>
        {carregando ? (
          <TabelaVazia carregando vazio="" />
        ) : !agendamentos.length ? (
          <TabelaVazia carregando={false} vazio="Nenhum agendamento recebido." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-muted-foreground">
                <tr>
                  {["Código", "Data e hora", "Telefone", "Status", "Ação"].map((x) => (
                    <th key={x} className="px-4 py-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((x) => (
                  <tr key={x.id} className="border-t border-border">
                    <td className="px-4 py-3">{x.id}</td>
                    <td className="px-4 py-3">{x.dataHora}</td>
                    <td className="px-4 py-3">{x.telefone}</td>
                    <td className="px-4 py-3">{x.status ? "Confirmado" : "Pendente"}</td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Status do agendamento ${x.id}`}
                        value={x.status ? "confirmado" : "pendente"}
                        onChange={(e) =>
                          void mudarStatusAgendamento(x.id, e.target.value === "confirmado")
                        }
                        className={campo}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="confirmado">Confirmado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Erro texto={erro} />
        <Sucesso texto={sucesso} />
      </section>
    </div>
  );
}

export function Orcamentos() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [itens, setItens] = useState<Orcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarClientes(), listarCargas(), listarServicos(), listarOrcamentos()])
      .then(([cs, gs, ss, rows]) => {
        if (ativo) {
          setClientes(cs);
          setCargas(gs);
          setServicos(ss);
          setItens(rows);
        }
      })
      .catch((error: unknown) => {
        if (ativo)
          setErro(error instanceof Error ? error.message : "Falha ao carregar orçamentos.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    const form = evento.currentTarget;
    const dados = new FormData(form);
    try {
      const item = await cadastrarOrcamento({
        clienteId: Number(dados.get("clienteId")),
        cargaId: Number(dados.get("cargaId")),
        servicoId: Number(dados.get("servicoId")),
      });
      setItens((atuais) => [...atuais, item]);
      setSucesso("Orçamento criado com status pendente.");
      form.reset();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível criar o orçamento.");
    } finally {
      setSalvando(false);
    }
  }

  async function analisar(evento: FormEvent<HTMLFormElement>, item: Orcamento) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    const dados = new FormData(evento.currentTarget);
    try {
      const valor = String(dados.get("valorEstimado")).trim();
      const atualizado = await atualizarOrcamento(item.id, {
        status: String(dados.get("status")),
        ...(valor ? { valorEstimado: Number(valor) } : {}),
        observacoes: String(dados.get("observacoes")).trim(),
      });
      setItens((atuais) => atuais.map((x) => (x.id === item.id ? atualizado : x)));
      setSucesso(`Análise do orçamento ${item.id} atualizada.`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar o orçamento.");
    }
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={enviar}
        className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3"
      >
        <h2 className="text-lg font-semibold sm:col-span-3">Criar orçamento</h2>
        <label className="grid gap-1 text-sm">
          Cliente
          <select name="clienteId" required className={campo}>
            <option value="">Selecione...</option>
            {clientes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome} (#{x.id})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Carga
          <select name="cargaId" required className={campo}>
            <option value="">Selecione...</option>
            {cargas.map((x) => (
              <option key={x.id} value={x.id}>
                {x.descricao} (#{x.id})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Serviço
          <select name="servicoId" required className={campo}>
            <option value="">Selecione...</option>
            {servicos.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome} (#{x.id})
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={salvando || !clientes.length || !cargas.length || !servicos.length}
          className={botao}
        >
          Criar orçamento
        </button>
        <Erro texto={erro} />
        <Sucesso texto={sucesso} />
      </form>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Orçamentos</h2>
        {carregando || (erro && !itens.length) ? (
          <TabelaVazia carregando={carregando} vazio="" />
        ) : !itens.length ? (
          <TabelaVazia carregando={false} vazio="Nenhum orçamento cadastrado." />
        ) : (
          <div className="grid gap-4">
            {itens.map((x) => (
              <form
                key={x.id}
                onSubmit={(e) => void analisar(e, x)}
                className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
              >
                <p className="font-semibold sm:col-span-2">
                  Orçamento #{x.id}: {x.cliente?.nome} · {x.carga?.descricao} · {x.servico?.nome}
                </p>
                <label className="grid gap-1 text-sm">
                  Status
                  <select name="status" defaultValue={x.status} className={campo}>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="EM_ANALISE">EM_ANALISE</option>
                    <option value="APROVADO">APROVADO</option>
                    <option value="RECUSADO">RECUSADO</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  Valor estimado (R$)
                  <input
                    name="valorEstimado"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={x.valorEstimado ?? ""}
                    className={campo}
                  />
                </label>
                <label className="grid gap-1 text-sm sm:col-span-2">
                  Observações
                  <textarea
                    name="observacoes"
                    maxLength={500}
                    rows={2}
                    defaultValue={x.observacoes ?? ""}
                    className={campo}
                  />
                </label>
                <button className={botao}>Salvar análise</button>
              </form>
            ))}
          </div>
        )}
        <Erro texto={erro} />
        <Sucesso texto={sucesso} />
      </section>
    </div>
  );
}

export function Operacoes() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [conteineres, setConteineres] = useState<Conteiner[]>([]);
  const [itens, setItens] = useState<Operacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarSolicitacoes(), listarConteineres(), listarOperacoes()])
      .then(([ss, cs, rows]) => {
        if (ativo) {
          setSolicitacoes(ss);
          setConteineres(cs);
          setItens(rows);
        }
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof Error ? error.message : "Falha ao carregar operações.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    const form = evento.currentTarget;
    const dados = new FormData(form);
    try {
      const conteinerId = String(dados.get("conteinerId"));
      const item = await cadastrarOperacao({
        solicitacaoId: Number(dados.get("solicitacaoId")),
        ...(conteinerId ? { conteinerId: Number(conteinerId) } : {}),
        responsavel: String(dados.get("responsavel")).trim(),
        observacoes: String(dados.get("observacoes")).trim(),
      });
      setItens((atuais) => [...atuais, item]);
      setSucesso("Operação iniciada.");
      form.reset();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível iniciar a operação.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarAndamento(evento: FormEvent<HTMLFormElement>, item: Operacao) {
    evento.preventDefault();
    setErro("");
    const dados = new FormData(evento.currentTarget);
    try {
      const atualizada = await atualizarOperacao(item.id, {
        andamento: String(dados.get("andamento")),
        observacoes: String(dados.get("observacoes")).trim(),
      });
      setItens((atuais) => atuais.map((x) => (x.id === item.id ? atualizada : x)));
      setSucesso(`Operação ${item.id} atualizada.`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar a operação.");
    }
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={enviar}
        className="grid max-w-4xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <h2 className="text-lg font-semibold sm:col-span-2">Iniciar operação</h2>
        <label className="grid gap-1 text-sm">
          Solicitação
          <select name="solicitacaoId" required className={campo}>
            <option value="">Selecione...</option>
            {solicitacoes.map((x) => (
              <option key={x.id} value={x.id}>
                #{x.id} · {x.cliente?.nome} · {x.carga?.descricao}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Contêiner (opcional)
          <select name="conteinerId" className={campo}>
            <option value="">Sem contêiner</option>
            {conteineres.map((x) => (
              <option key={x.id} value={x.id}>
                {x.numeroConteiner} (#{x.id})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Responsável
          <input name="responsavel" required className={campo} />
        </label>
        <label className="grid gap-1 text-sm">
          Observações
          <input name="observacoes" required className={campo} />
        </label>
        <button
          disabled={salvando || !solicitacoes.length}
          className={`${botao} sm:col-span-2 sm:justify-self-start`}
        >
          Iniciar operação
        </button>
        <Erro texto={erro} />
        <Sucesso texto={sucesso} />
      </form>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Operações registradas</h2>
        {carregando || (erro && !itens.length) ? (
          <TabelaVazia carregando={carregando} vazio="" />
        ) : !itens.length ? (
          <TabelaVazia carregando={false} vazio="Nenhuma operação registrada." />
        ) : (
          <div className="grid gap-4">
            {itens.map((x) => (
              <form
                key={x.id}
                onSubmit={(e) => void salvarAndamento(e, x)}
                className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
              >
                <p className="font-semibold sm:col-span-2">
                  Operação #{x.id} · {x.solicitacao?.cliente?.nome} ·{" "}
                  {x.solicitacao?.carga?.descricao}
                </p>
                <p className="text-sm text-muted-foreground">
                  Responsável: {x.responsavel} · Contêiner:{" "}
                  {x.conteiner?.numeroConteiner ?? "Não definido"}
                </p>
                <label className="grid gap-1 text-sm">
                  Andamento
                  <input name="andamento" required defaultValue={x.andamento} className={campo} />
                </label>
                <label className="grid gap-1 text-sm sm:col-span-2">
                  Observações
                  <input
                    name="observacoes"
                    required
                    defaultValue={x.observacoes}
                    className={campo}
                  />
                </label>
                <button className={botao}>Atualizar andamento</button>
              </form>
            ))}
          </div>
        )}
        <Erro texto={erro} />
      </section>
    </div>
  );
}

type Conversa =
  { tipo: "cliente"; mensagem: Mensagem } | { tipo: "contato"; mensagem: ContatoMensagem };

export function Mensagens() {
  const [itens, setItens] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarClientes(), listarMensagensContato()])
      .then(([clientes, contatos]) =>
        Promise.all(clientes.map((cliente) => listarMensagensCliente(cliente.id))).then(
          (listas) => ({
            contatos,
            mensagens: listas.flat(),
          }),
        ),
      )
      .then(({ contatos, mensagens }) => {
        if (ativo) {
          setItens([
            ...contatos.map((mensagem) => ({ tipo: "contato" as const, mensagem })),
            ...mensagens
              .sort((a, b) => a.id - b.id)
              .map((mensagem) => ({ tipo: "cliente" as const, mensagem })),
          ]);
        }
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof Error ? error.message : "Falha ao carregar mensagens.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function responder(evento: FormEvent<HTMLFormElement>, conversa: Conversa) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    const item = conversa.mensagem;
    const chave = `${conversa.tipo}-${item.id}`;
    setProcessandoId(chave);
    const form = evento.currentTarget;
    const resposta = String(new FormData(form).get("resposta")).trim();
    try {
      if (conversa.tipo === "contato") {
        const atualizada = await responderMensagemContato(item.id, resposta);
        setItens((atuais) =>
          atuais.map((x) =>
            x.tipo === "contato" && x.mensagem.id === item.id ? { ...x, mensagem: atualizada } : x,
          ),
        );
      } else {
        const atualizada = await responderMensagem(item.id, resposta);
        setItens((atuais) =>
          atuais.map((x) =>
            x.tipo === "cliente" && x.mensagem.id === item.id ? { ...x, mensagem: atualizada } : x,
          ),
        );
      }
      setSucesso(`Mensagem ${item.id} respondida.`);
      form.reset();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível responder à mensagem.");
    } finally {
      setProcessandoId(null);
    }
  }

  async function deletar(conversa: Conversa) {
    const item = conversa.mensagem;
    const chave = `${conversa.tipo}-${item.id}`;
    const nome = conversa.tipo === "contato" ? item.nome : item.cliente?.nome || "cliente";
    if (!window.confirm(`Deseja realmente deletar a mensagem de ${nome}?`)) {
      return;
    }

    setErro("");
    setSucesso("");
    setProcessandoId(chave);
    try {
      if (conversa.tipo === "contato") {
        await deletarMensagemContato(item.id);
      } else {
        await deletarMensagemCliente(item.id);
      }
      setItens((atuais) =>
        atuais.filter((x) => !(x.tipo === conversa.tipo && x.mensagem.id === item.id)),
      );
      setSucesso("Mensagem deletada.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível deletar a mensagem.");
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <section>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Mensagens recebidas</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe contatos do site e conversas com clientes.
          </p>
        </div>
        {!carregando && !erro && itens.length > 0 && (
          <span className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium">
            {itens.length} {itens.length === 1 ? "mensagem" : "mensagens"}
          </span>
        )}
      </header>
      {carregando || (erro && !itens.length) ? (
        <TabelaVazia carregando={carregando} vazio="" />
      ) : !itens.length ? (
        <TabelaVazia carregando={false} vazio="Nenhuma mensagem recebida." />
      ) : (
        <div className="grid gap-5">
          {itens.map((conversa) => {
            const x = conversa.mensagem;
            const chave = `${conversa.tipo}-${x.id}`;
            const nome = conversa.tipo === "contato" ? x.nome : x.cliente?.nome;
            const email = conversa.tipo === "contato" ? x.email : x.cliente?.email;
            return (
              <article
                key={chave}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
                      <MessageSquareText className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold">
                        {conversa.tipo === "contato" ? "Contato" : "Conversa"} #{x.id}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {conversa.tipo === "contato"
                          ? "Contato pelo site"
                          : "Atendimento ao cliente"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                      x.resposta
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    {x.resposta ? (
                      <CheckCheck className="size-3.5" aria-hidden="true" />
                    ) : (
                      <MessageSquareText className="size-3.5" aria-hidden="true" />
                    )}
                    {x.status}
                  </span>
                </header>
                <div className="grid gap-5 p-5">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
                        <UserRound className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {conversa.tipo === "contato" ? "Contato" : "Cliente"}
                        </p>
                        <p className="text-sm font-medium">{nome || "Não informado"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4 shrink-0" aria-hidden="true" />
                      <span className="break-all">{email || "E-mail não informado"}</span>
                    </div>
                    {conversa.tipo === "cliente" && x.especialista && (
                      <p className="text-xs text-muted-foreground">
                        Atendimento:{" "}
                        <span className="font-medium text-foreground">{x.especialista}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="max-w-3xl rounded-2xl rounded-tl-sm border border-border bg-secondary/50 p-4">
                      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <MessageSquareText className="size-3.5" aria-hidden="true" />
                        Mensagem do cliente
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {x.conteudo}
                      </p>
                    </div>
                    {x.resposta && (
                      <div className="ml-auto w-full max-w-3xl rounded-2xl rounded-tr-sm border border-primary/25 bg-primary/10 p-4">
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                          <CheckCheck className="size-3.5" aria-hidden="true" />
                          Resposta da equipe
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {x.resposta}
                        </p>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => void responder(e, conversa)}
                    className="grid gap-3 border-t border-border pt-4"
                  >
                    <label className="grid gap-2 text-sm font-medium">
                      Responder mensagem
                      <textarea
                        name="resposta"
                        required
                        maxLength={1000}
                        rows={3}
                        placeholder="Escreva sua resposta..."
                        className={`${campo} resize-y`}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button disabled={processandoId === chave} className={botaoSecundario}>
                        <Send className="size-3.5" aria-hidden="true" />
                        {processandoId === chave ? "Enviando..." : "Enviar resposta"}
                      </button>
                      <button
                        type="button"
                        disabled={processandoId === chave}
                        onClick={() => void deletar(conversa)}
                        className={botaoDestrutivo}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        {processandoId === chave ? "Aguarde..." : "Deletar mensagem"}
                      </button>
                    </div>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Erro texto={erro} />
      <Sucesso texto={sucesso} />
    </section>
  );
}

export function UsuariosAdmin() {
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");
    setSalvando(true);
    const form = evento.currentTarget;
    const dados = new FormData(form);
    try {
      const novoUsuario: NovoUsuarioAdmin = {
        nome: String(dados.get("nome")).trim(),
        email: String(dados.get("email")).trim(),
        senha: String(dados.get("senha")),
        cargo: String(dados.get("cargo")).trim(),
      };
      await cadastrarAdministrador(novoUsuario);
      setSucesso("Usuário administrativo cadastrado.");
      form.reset();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível cadastrar o usuário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
    >
      <h2 className="text-lg font-semibold sm:col-span-2">Cadastrar usuário administrativo</h2>
      <label className="grid gap-1 text-sm">
        Nome
        <input name="nome" required className={campo} />
      </label>
      <label className="grid gap-1 text-sm">
        Cargo
        <input name="cargo" required className={campo} />
      </label>
      <label className="grid gap-1 text-sm">
        E-mail
        <input name="email" required type="email" className={campo} />
      </label>
      <label className="grid gap-1 text-sm">
        Senha
        <input name="senha" required type="password" minLength={8} className={campo} />
      </label>
      <button disabled={salvando} className={`${botao} sm:col-span-2 sm:justify-self-start`}>
        {salvando ? "Cadastrando..." : "Cadastrar usuário"}
      </button>
      <p className="text-sm text-muted-foreground sm:col-span-2">
        A API ainda não disponibiliza consulta ou listagem de usuários administrativos.
      </p>
      <Erro texto={erro} />
      <Sucesso texto={sucesso} />
    </form>
  );
}
