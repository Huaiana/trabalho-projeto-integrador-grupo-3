import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDown, Compass, Anchor, ShieldCheck, Container, X, Send, UserPlus } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import heroPort from "@/assets/hero-port.jpg";
import lashing from "@/assets/lashing.jpg";
import {
  ErroAgendamentoApi,
  salvarAgendamentoPendente,
  solicitarAgendamento,
  type DadosAgendamento,
} from "@/services/agendamentos";
import { enviarMensagemContato } from "@/services/mensagens";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Techocean — Amarração e Segurança de Cargas" },
      {
        name: "description",
        content:
          "Projetamos amarrações e instalações que protegem cada produto até o destino. 15+ anos de experiência, 27 portos atendidos, 0 incidentes de carga.",
      },
      { property: "og:title", content: "Techocean — Amarração e Segurança de Cargas" },
      {
        property: "og:description",
        content:
          "A segurança da sua carga começa antes de embarcar. Precisão em cada amarração.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const stats = [
  { value: "15+", label: "Anos de experiência" },
  { value: "27", label: "Portos atendidos" },
  { value: "0", label: "Incidentes de carga" },
];

const services = [
  {
    icon: Compass,
    num: "01",
    title: "Consultoria operacional",
    desc: "Planejamento técnico para operações mais seguras, eficientes e previsíveis.",
    detalhes:
      "Analisamos toda a sua operação portuária para identificar riscos e oportunidades de melhoria. Nossa equipe elabora planos de operação sob medida, com cronogramas realistas e protocolos claros para cada etapa do embarque.",
    topicos: [
      "Análise de riscos da operação e do tipo de carga",
      "Plano de embarque com cronograma e responsáveis",
      "Treinamento das equipes de cais e bordo",
      "Acompanhamento técnico durante a operação",
    ],
  },
  {
    icon: Anchor,
    num: "02",
    title: "Amarração de cargas",
    desc: "Projetos de amarração sob medida para cada tipo de carga e modal de transporte.",
    detalhes:
      "Cada carga tem um comportamento diferente em movimento. Calculamos forças, ângulos e pontos de fixação para projetar a amarração ideal, seja para contêineres, cargas fracionadas, máquinas ou cargas especiais.",
    topicos: [
      "Cálculo de tensão e resistência das cintas e correntes",
      "Projeto de amarração por tipo de carga e modal",
      "Seleção de materiais certificados",
      "Supervisão da amarração no embarque",
    ],
  },
  {
    icon: ShieldCheck,
    num: "03",
    title: "Inspeção e conformidade",
    desc: "Auditorias e laudos que garantem conformidade com normas internacionais.",
    detalhes:
      "Emitimos laudos técnicos e realizamos auditorias completas para garantir que sua operação esteja em conformidade com as normas nacionais e internacionais de transporte de cargas, evitando multas, avarias e atrasos.",
    topicos: [
      "Inspeção de amarração antes da partida",
      "Laudos técnicos com registro fotográfico",
      "Auditoria de conformidade com normas internacionais",
      "Relatórios de não conformidade e plano de correção",
    ],
  },
  {
    icon: Container,
    num: "04",
    title: "Instalações portuárias",
    desc: "Estruturas e sistemas de fixação instalados com precisão e rastreabilidade.",
    detalhes:
      "Projetamos e instalamos estruturas de fixação em terminais e embarcações, com materiais rastreáveis e documentação completa de cada instalação, do projeto executivo à entrega final.",
    topicos: [
      "Projeto executivo de estruturas de fixação",
      "Instalação com equipe especializada",
      "Rastreabilidade de materiais e componentes",
      "Manutenção preventiva e inspeções periódicas",
    ],
  },
];

function Painel({
  titulo,
  onFechar,
  children,
}: {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onFechar}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar painel"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Index() {
  const navigate = useNavigate();
  const [painelAgendamento, setPainelAgendamento] = useState(false);
  const [painelMensagem, setPainelMensagem] = useState(false);
  const [servicoAberto, setServicoAberto] = useState<(typeof services)[number] | null>(null);
  const [enviandoAgendamento, setEnviandoAgendamento] = useState(false);
  const [pedirSenha, setPedirSenha] = useState(false);
  const [erroAgendamento, setErroAgendamento] = useState("");
  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState(false);
  const [mensagemEnviada, setMensagemEnviada] = useState(false);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [erroMensagem, setErroMensagem] = useState("");

  function abrirAgendamento() {
    setErroAgendamento("");
    setAgendamentoConfirmado(false);
    setPainelAgendamento(true);
  }

  function abrirMensagem() {
    setMensagemEnviada(false);
    setErroMensagem("");
    setPainelMensagem(true);
  }

  async function enviarAgendamento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const dados: DadosAgendamento = {
      nome: String(form.get("nome")).trim(),
      telefone: String(form.get("telefone")).trim(),
      email: String(form.get("email")).trim(),
      dataHora: String(form.get("dataHora")),
      confirmacao: true,
    };
    const senha = String(form.get("senha") ?? "");

    setErroAgendamento("");
    setEnviandoAgendamento(true);

    try {
      await solicitarAgendamento({ ...dados, ...(senha ? { senha } : {}) });
      formElement.reset();
      setPedirSenha(false);
      setAgendamentoConfirmado(true);
    } catch (error) {
      if (
        error instanceof ErroAgendamentoApi &&
        error.code === "CADASTRO_NECESSARIO"
      ) {
        salvarAgendamentoPendente(dados);
        await navigate({ to: "/cadastro" });
        return;
      }

      if (
        error instanceof ErroAgendamentoApi &&
        (error.code === "SENHA_NECESSARIA" || error.code === "SENHA_INVALIDA")
      ) {
        setPedirSenha(true);
      }

      setErroAgendamento(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a solicitação de visita.",
      );
    } finally {
      setEnviandoAgendamento(false);
    }
  }

  async function enviarMensagem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setErroMensagem("");
    setMensagemEnviada(false);
    setEnviandoMensagem(true);
    try {
      await enviarMensagemContato({
        nome: String(form.get("nome") ?? ""),
        email: String(form.get("email") ?? ""),
        conteudo: String(form.get("mensagem") ?? ""),
      });
      formElement.reset();
      setMensagemEnviada(true);
    } catch (error) {
      setErroMensagem(
        error instanceof Error ? error.message : "Não foi possível enviar a mensagem.",
      );
    } finally {
      setEnviandoMensagem(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="relative flex min-h-svh flex-col overflow-hidden">
        <img
          src={heroPort}
          alt="Porto de contêineres ao entardecer"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
          <Link to="/dashboard" className="font-display text-lg font-bold tracking-tight">
            Techocean
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/cadastro"
              aria-label="Cadastre-se"
              title="Cadastre-se"
              className="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <UserPlus className="size-4" /> <span className="hidden sm:inline">Cadastre-se</span>
            </Link>
            <button
              type="button"
              onClick={abrirMensagem}
              className="rounded-full border border-input px-5 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Fale conosco
            </button>
          </div>
        </nav>

        <div className="relative z-10 mt-auto px-6 pb-16 md:px-12 md:pb-24">
          <p className="eyebrow mb-4">Precisão em cada amarração</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            A segurança da sua carga começa antes de embarcar.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            Projetamos amarrações e instalações que protegem cada produto até o
            destino.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={abrirAgendamento}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              Agendar visita <ArrowUpRight className="size-4" />
            </button>
            <a
              href="#servicos"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Conheça nossos serviços <ArrowDown className="size-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-10 text-center md:py-14">
              <p className="font-display text-5xl font-bold md:text-6xl">{s.value}</p>
              <p className="eyebrow mt-3 text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* História */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
        <p className="eyebrow">Nossa história</p>
        <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-16">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            Experiência construída no cais, projeto a projeto.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Há mais de 15 anos atuamos nos principais portos do país, unindo
            engenharia e prática operacional para garantir que cada carga chegue
            intacta ao destino. Nossa equipe acompanha embarques de ponta a
            ponta, do planejamento da amarração à inspeção final.
          </p>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
          <p className="eyebrow">Serviços</p>
          <h2 className="mt-6 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
            Soluções completas para a sua operação
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {services.map((s) => (
              <article
                key={s.num}
                className="group rounded-2xl border border-border bg-background p-8 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <s.icon className="size-8 text-primary" />
                </div>
                <h3 className="mt-8 text-2xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
                <button
                  type="button"
                  onClick={() => setServicoAberto(s)}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-foreground"
                >
                  Saiba mais
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Na prática */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">
        <p className="eyebrow">Na prática</p>
        <div className="mt-6 grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h2 className="text-3xl font-bold leading-tight md:text-4xl">
              Cada detalhe verificado antes da partida.
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Do cálculo de tensão das cintas à conferência dos pontos de
              fixação, nosso time segue protocolos rigorosos em campo. É assim
              que mantemos zero incidentes de carga em toda a nossa história.
            </p>
            <button
              type="button"
              onClick={abrirAgendamento}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-input px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Agende uma visita técnica <ArrowUpRight className="size-4" />
            </button>
          </div>
          <img
            src={lashing}
            alt="Trabalhador amarrando contêiner com cinta de segurança"
            loading="lazy"
            width={1024}
            height={768}
            className="rounded-2xl border border-border object-cover"
          />
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-display font-bold text-foreground">
            Techocean
          </span>
          <p>© 2026 Techocean. Precisão em cada amarração.</p>
        </div>
      </footer>

      {/* Painel de detalhes do serviço */}
      {servicoAberto && (
        <Painel titulo={servicoAberto.title} onFechar={() => setServicoAberto(null)}>
          <div className="flex items-center gap-3">
            <servicoAberto.icon className="size-7 text-primary" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {servicoAberto.detalhes}
          </p>
          <ul className="mt-5 grid gap-3">
            {servicoAberto.topicos.map((topico) => (
              <li key={topico} className="flex items-start gap-3 text-sm">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                {topico}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setServicoAberto(null);
              abrirAgendamento();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Agendar visita técnica <ArrowUpRight className="size-4" />
          </button>
        </Painel>
      )}

      {/* Painel de agendamento */}
      {painelAgendamento && (
        <Painel titulo="Solicite uma visita técnica" onFechar={() => setPainelAgendamento(false)}>
          <p className="text-sm text-muted-foreground">
            Informe seus dados e escolha a melhor data para nossa equipe entrar
            em contato e confirmar a visita.
          </p>
          <form className="mt-6 grid gap-5" onSubmit={enviarAgendamento}>
            <label className="text-sm font-medium" htmlFor="agendamento-nome">
              Nome completo
              <input
                id="agendamento-nome"
                name="nome"
                autoComplete="name"
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-medium" htmlFor="agendamento-telefone">
              Telefone
              <input
                id="agendamento-telefone"
                name="telefone"
                type="tel"
                autoComplete="tel"
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-medium" htmlFor="agendamento-email">
              E-mail
              <input
                id="agendamento-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-medium" htmlFor="agendamento-data-hora">
              Data e horário desejados
              <input
                id="agendamento-data-hora"
                name="dataHora"
                type="datetime-local"
                min={minDataHora()}
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            {pedirSenha && (
              <label className="text-sm font-medium" htmlFor="agendamento-senha">
                Senha do seu cadastro de usuário
                <input
                  id="agendamento-senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            )}
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                name="confirmacao"
                type="checkbox"
                required
                className="mt-1 size-4 accent-primary"
              />
              Confirmo que os dados estão corretos e solicito o agendamento da
              visita técnica.
            </label>
            {erroAgendamento && (
              <p className="text-sm text-destructive" role="alert">
                {erroAgendamento}
              </p>
            )}
            {agendamentoConfirmado && (
              <p className="text-sm text-primary" role="status">
                Solicitação confirmada. Nossa equipe entrará em contato para
                confirmar a visita.
              </p>
            )}
            <button
              type="submit"
              disabled={enviandoAgendamento}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] disabled:cursor-wait disabled:opacity-60"
            >
              {enviandoAgendamento ? "Enviando..." : "Solicitar visita"}
              {!enviandoAgendamento && <ArrowUpRight className="size-4" />}
            </button>
          </form>
        </Painel>
      )}

      {/* Painel de mensagem */}
      {painelMensagem && (
        <Painel titulo="Fale conosco" onFechar={() => setPainelMensagem(false)}>
          <p className="text-sm text-muted-foreground">
            Envie sua mensagem para que nossa equipe possa entrar em contato.
          </p>
          <form className="mt-6 grid gap-5" onSubmit={enviarMensagem}>
            <label className="text-sm font-medium" htmlFor="mensagem-nome">
              Nome
              <input
                id="mensagem-nome"
                name="nome"
                autoComplete="name"
                maxLength={120}
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-medium" htmlFor="mensagem-email">
              E-mail
              <input
                id="mensagem-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-medium" htmlFor="mensagem-texto">
              Mensagem
              <textarea
                id="mensagem-texto"
                name="mensagem"
                rows={5}
                maxLength={1000}
                required
                className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            {mensagemEnviada && (
              <p className="text-sm text-primary" role="status">
                Mensagem enviada. Em breve entraremos em contato.
              </p>
            )}
            {erroMensagem && (
              <p className="text-sm text-destructive" role="alert">
                {erroMensagem}
              </p>
            )}
            <button
              type="submit"
              disabled={enviandoMensagem}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] disabled:cursor-wait disabled:opacity-60"
            >
              {enviandoMensagem ? "Enviando..." : "Enviar mensagem"}
              {!enviandoMensagem && <Send className="size-4" />}
            </button>
          </form>
        </Painel>
      )}
    </div>
  );
}

function minDataHora() {
  const localDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}
