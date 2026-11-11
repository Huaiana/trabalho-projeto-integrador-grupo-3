import { apiRequest, get, post, postPublic, postWithHeaders, postParams, put, putParams, del, getAppointmentAccounts, createManagedAppointment, updateManagedAppointment, setAccessToken, clearAccessToken, getAccessToken, ApiError } from "./api.js";
import { formatarTarifaServico, localizarTarifaServico } from "./catalogo-servicos.js";
import { parseTarifas } from "./tarifas-orcamento.js";
import { catalogoSolicitacoes } from "./catalogo-solicitacoes.js";
import { startBrasiliaClock, updateClockVisibility } from "./brasilia-clock.js";
import {
  databaseCategories,
  deleteDatabaseEntry,
  findDatabaseEntry,
  getDatabaseCategory,
  readDatabaseEntries,
  readBudgetMetadata,
  readResourceDetails,
  readServiceValues,
  readSolicitationStates,
  saveBudgetMetadata,
  saveResourceDetails,
  saveServiceValue,
  saveDatabaseEntry,
  saveSolicitationState,
} from "./database-catalog.js";
import lashingImage from "./assets/lashing.jpg";
import "./vanilla.css";
import "./admin.css";
import "./panel.css";

const app = globalThis.document?.querySelector?.("#app") ?? null;
const brasiliaClock = globalThis.document?.querySelector?.("#brasilia-clock");
if (brasiliaClock) startBrasiliaClock(brasiliaClock);
let modalReturnFocus = null;
let currentUser = null;
let authNotice = "";
const cachedRecords = new Map();
const budgetServiceOptions = new WeakMap();
const sections = [
  { slug: "carga", name: "Carga", description: "Cadastro e consulta de cargas.", endpoint: "/cargas", columns: ["id", "descricao", "peso", "volume", "tipoCarga", "origem", "destino"] },
  { slug: "cliente", name: "Cliente", description: "Clientes cadastrados.", endpoint: "/clientes", columns: ["id", "nome", "email", "telefone", "cpfcnpj"], resource: true },
  { slug: "conteiner", name: "Contêiner", description: "Contêineres em operação.", endpoint: "/conteineres", columns: ["id", "numeroConteiner", "tipo", "situacao"], resource: true },
  { slug: "mensagens", name: "Mensagens", description: "Mensagens recebidas pelo Fale conosco.", endpoint: "/mensagens/contatos" },
  { slug: "operacao", name: "Operação", description: "Operações em andamento.", endpoint: "/operacoes", columns: ["id", "solicitacao", "conteiner", "responsavel", "andamento", "observacoes"], resource: true },
  { slug: "orcamento", name: "Orçamento", description: "Orçamentos e solicitações comerciais.", endpoint: "/orcamentos", columns: ["id", "cliente", "carga", "servico", "valorEstimado", "status", "criadoEm"] },
  { slug: "backup", name: "Backup", description: "Gere cópias de segurança dos dados da operação.", endpoint: null },
  { slug: "usuario", name: "Configurações", description: "Atualize seus dados e gerencie contas de administradores e equipe.", endpoint: "/admin/usuarios", columns: ["id", "nome", "email", "cargo"], resource: true, adminOnly: true },
  { slug: "auditoria", name: "Auditoria", description: "Registro de atividades administrativas.", endpoint: "/admin/auditoria", adminOnly: true },
  { slug: "sessoes", name: "Sessões", description: "Sessões administrativas ativas e recentes.", endpoint: "/admin/sessoes", adminOnly: true },
  { slug: "servico", name: "Serviço", description: "Serviços oferecidos.", endpoint: "/servicos/todos", columns: ["id", "nome", "descricao", "categoria", "disponivel"], resource: true },
  { slug: "solicitacao", name: "Solicitação", description: "Solicitações recebidas.", endpoint: "/solicitacoes", columns: ["id", "cliente", "carga", "servico", "status"] },
  { slug: "banco-dados", name: "Banco de dados", description: "Cadastros de referência usados para preencher automaticamente os formulários.", adminOnly: true },
  { slug: "agendamento", name: "Agendamento", description: "Solicitações de visita técnica.", endpoint: "/agendamentos", columns: ["id", "nome", "email", "telefone", "dataHora", "status"], resource: true },
];

const resourceDefinitions = {
  cliente: {
    endpoint: "/clientes", singular: "cliente", createMode: "json",
    fields: [
      { name: "nome", label: "Nome completo", required: true },
      { name: "cpf", label: "CPF / CNPJ", required: true },
      { name: "telefone", label: "Telefone", type: "tel", required: true },
      { name: "email", label: "E-mail", type: "email", required: true },
      { name: "senha", label: "Senha inicial", type: "password", required: true, editOptional: true },
    ],
  },
  conteiner: {
    endpoint: "/conteineres", singular: "contêiner", createMode: "params",
    fields: [
      { name: "numeroConteiner", label: "Número do contêiner", required: true },
      { name: "tipo", label: "Tipo", required: true },
      { name: "situacao", label: "Situação", required: true },
    ],
  },
  operacao: {
    endpoint: "/operacoes", singular: "operação", createMode: "params",
    fields: [
      { name: "solicitacaoId", label: "Código da solicitação", type: "number", required: true },
      { name: "conteinerId", label: "Código do contêiner", type: "number" },
      { name: "responsavel", label: "Responsável", required: true },
      { name: "andamento", label: "Andamento", editRequired: true },
      { name: "observacoes", label: "Observações", type: "textarea" },
    ],
  },
  servico: {
    endpoint: "/servicos", singular: "serviço", createMode: "params",
    fields: [
      { name: "nome", label: "Nome do serviço", required: true },
      { name: "descricao", label: "Descrição", type: "textarea", required: true },
      { name: "categoria", label: "Categoria", required: true },
      { name: "disponivel", label: "Disponível", type: "select", options: [["true", "Sim"], ["false", "Não"]] },
    ],
  },
  agendamento: {
    endpoint: "/agendamentos", createPath: "/agendamentos/gerenciamento", singular: "agendamento", createMode: "json",
    fields: [
      { name: "usuarioId", label: "Conta do cliente", type: "account", required: true, valueName: "id" },
      { name: "telefone", label: "Telefone", type: "tel", required: true },
      { name: "dataHora", label: "Data e horário", type: "datetime-local", required: true },
      { name: "confirmado", label: "Confirmado", type: "select", options: [["true", "Sim"], ["false", "Não"]] },
    ],
  },
  usuario: {
    endpoint: "/admin/usuarios", singular: "administrador", createMode: "json",
    fields: [
      { name: "nome", label: "Nome completo", required: true },
      { name: "email", label: "E-mail", type: "email", required: true },
      { name: "cargo", label: "Perfil", type: "select", required: true, options: [["ADMIN", "Administrador"], ["SUPERVISOR", "Supervisor"], ["FUNCIONARIO", "Funcionário"]] },
      { name: "senha", label: "Senha", type: "password", required: true, editOptional: true },
    ],
  },
};

const services = [
  { number: "01", icon: "⌖", title: "Consultoria operacional", description: "Planejamento técnico para operações mais seguras, eficientes e previsíveis.", details: "Analisamos sua operação portuária para identificar riscos e oportunidades. Nossa equipe elabora planos sob medida, com cronogramas realistas e protocolos claros para cada etapa do embarque.", topics: ["Análise de riscos da operação e da carga", "Plano de embarque com cronograma e responsáveis", "Treinamento das equipes de cais e bordo", "Acompanhamento técnico durante a operação"] },
  { number: "02", icon: "⚓", title: "Amarração de cargas", description: "Projetos de amarração sob medida para cada tipo de carga e modal de transporte.", details: "Cada carga se comporta de um jeito em movimento. Calculamos forças, ângulos e pontos de fixação para projetar a amarração ideal para contêineres, cargas fracionadas, máquinas ou cargas especiais.", topics: ["Cálculo de tensão e resistência", "Projeto por tipo de carga e modal", "Seleção de materiais certificados", "Supervisão da amarração no embarque"] },
  { number: "03", icon: "◈", title: "Inspeção e conformidade", description: "Auditorias e laudos que garantem conformidade com normas internacionais.", details: "Realizamos auditorias completas e emitimos laudos técnicos para manter sua operação em conformidade com as normas de transporte, evitando avarias e atrasos.", topics: ["Inspeção antes da partida", "Laudos com registro fotográfico", "Auditoria de conformidade", "Plano de correção"] },
  { number: "04", icon: "▤", title: "Instalações portuárias", description: "Estruturas e sistemas de fixação instalados com precisão e rastreabilidade.", details: "Projetamos e instalamos estruturas de fixação em terminais e embarcações, com materiais rastreáveis e documentação completa, do projeto executivo à entrega.", topics: ["Projeto executivo de estruturas", "Instalação com equipe especializada", "Rastreabilidade de materiais", "Manutenção preventiva"] },
];

const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const isSensitiveField = (key) => /(senha|password|token|secret|api.?key)/i.test(key);
const routePath = () => window.location.pathname.replace(/\/+$/, "") || "/";
function redactSensitive(value) {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !isSensitiveField(key)).map(([key, item]) => [key, redactSensitive(item)]));
  return value;
}
const valueText = (value) => {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return esc(value.nome || value.name || value.descricao || value.id || JSON.stringify(redactSensitive(value)));
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return esc(value);
};

function navLink(href, label, className = "") { return `<a class="${className}" href="${href}">${label}</a>`; }
export function publicHeaderBrandMarkup() { return navLink("/dashboard", "Techocean", "wordmark"); }
export function publicHomeActionsMarkup() {
  return `${navLink("/cadastro", "♙ <span>Cadastre-se</span>", "button button-outline signup-link")}<button class="button button-outline" data-action="contact">Fale conosco</button>`;
}
export function publicFooterMarkup() {
  return `<footer class="footer wrap"><span class="wordmark">Techocean</span><p>© 2026 Techocean. Precisão em cada amarração.</p><span>Operações seguras. Destinos certos.</span></footer>`;
}

function userRole() { return String(currentUser?.cargo || currentUser?.role || "").toUpperCase(); }
export function panelRoleAllowed(role, portal) {
  const normalized = String(role || "").toUpperCase();
  return portal === "team"
    ? ["SUPERVISOR", "FUNCIONARIO"].includes(normalized)
    : portal === "admin" && normalized === "ADMIN";
}
export function roleCapabilities(role) {
  const normalized = String(role || "").toUpperCase();
  const recognized = ["ADMIN", "SUPERVISOR", "FUNCIONARIO"].includes(normalized);
  return {
    canReadOperational: recognized,
    canCreateOperational: recognized,
    canUpdateOperational: recognized,
    canDeleteOperational: ["ADMIN", "SUPERVISOR"].includes(normalized),
    canManageStaff: normalized === "ADMIN",
    canViewAudit: normalized === "ADMIN",
    canViewSessions: normalized === "ADMIN",
  };
}
function isAdmin() { return roleCapabilities(userRole()).canManageStaff; }
function canDeleteOperational() { return roleCapabilities(userRole()).canDeleteOperational; }
export function visibleSectionSlugs(role) { return sections.filter((section) => !section.adminOnly || roleCapabilities(role).canManageStaff).map((section) => section.slug); }
function visibleSections() { const allowed = new Set(visibleSectionSlugs(userRole())); return sections.filter((section) => allowed.has(section.slug)); }

export function spaNavigationPath(anchorHref, currentHref, event = {}) {
  if (event.defaultPrevented || (event.button != null && event.button !== 0) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.target) return null;
  const destination = new URL(anchorHref, currentHref);
  const current = new URL(currentHref);
  if (destination.origin !== current.origin || (destination.pathname === current.pathname && destination.hash) || destination.href === current.href) return null;
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

function renderHome() {
  document.title = "Techocean — Amarração e Segurança de Cargas";
  app.innerHTML = `
    <main class="site-shell">
      <header class="hero">
        <div class="hero-shade"></div>
        <nav class="topbar wrap">
          ${publicHeaderBrandMarkup()}
          <div class="top-actions">${publicHomeActionsMarkup()}</div>
        </nav>
        <div class="hero-copy wrap">
          <p class="eyebrow">Precisão em cada amarração</p>
          <h1>A segurança da sua carga começa antes de embarcar.</h1>
          <p class="hero-lede">Projetamos amarrações e instalações que protegem cada produto até o destino.</p>
          <div class="hero-buttons"><button class="button button-primary" data-action="schedule">Agendar visita <span aria-hidden="true">↗</span></button><a class="text-link" href="#servicos">Conheça nossos serviços <span aria-hidden="true">↓</span></a></div>
        </div>
        <div class="hero-coordinate" aria-hidden="true">23°57′S&nbsp; 46°18′W</div>
      </header>
      <section class="stats wrap" aria-label="Techocean em números"><div><strong>15<span>+</span></strong><p>Anos de experiência</p></div><div><strong>27</strong><p>Portos atendidos</p></div><div><strong>0</strong><p>Incidentes de carga</p></div></section>
      <section class="story wrap"><p class="eyebrow">Nossa história</p><div class="story-grid"><h2>Experiência construída no cais, projeto a projeto.</h2><p>Há mais de 15 anos atuamos nos principais portos do país, unindo engenharia e prática operacional para garantir que cada carga chegue intacta ao destino. Nossa equipe acompanha embarques de ponta a ponta, do planejamento da amarração à inspeção final.</p></div></section>
      <section class="services-section" id="servicos"><div class="wrap section-padding"><p class="eyebrow">Serviços</p><h2 class="section-heading">Soluções completas para a sua operação</h2><div class="service-grid">${services.map((service) => `<article class="service-card"><span class="service-icon">${service.icon}</span><span class="service-number">${service.number}</span><h3>${service.title}</h3><p>${service.description}</p><button class="more-link" data-service="${service.number}">Saiba mais <span>↗</span></button></article>`).join("")}</div></div></section>
      <section class="field-section wrap"><div class="field-copy"><p class="eyebrow">Na prática</p><h2>Cada detalhe verificado antes da partida.</h2><p>Do cálculo de tensão das cintas à conferência dos pontos de fixação, nosso time segue protocolos rigorosos em campo. É assim que mantemos zero incidentes de carga em toda a nossa história.</p><button class="button button-outline" data-action="schedule">Agende uma visita técnica <span>↗</span></button></div><figure class="field-image"><img src="${lashingImage}" alt="Trabalhador prendendo uma carga com cinta de segurança" loading="lazy"></figure></section>
      ${publicFooterMarkup()}
      <div id="modal-root"></div>
    </main>`;
}

function renderCadastro() {
  document.title = "Cadastro de cliente — Techocean";
  app.innerHTML = `<main class="register-page"><section class="register-card"><a href="/" class="back-link">← Voltar ao site</a><div id="registration-content"><p class="eyebrow">Cadastro de cliente</p><h1>Crie seu cadastro</h1><p class="muted">Preencha seus dados para se cadastrar como cliente.</p><form class="form-grid" id="register-form" data-form="register" novalidate>
    ${field("Nome completo", "nome", "text", "name", "minlength=3")}${field("CPF", "cpf", "text", "off", 'inputmode="numeric" placeholder="000.000.000-00"')}${field("Telefone", "telefone", "tel", "tel", 'inputmode="tel" placeholder="(00) 90000-0000"')}${field("E-mail", "email", "email", "email")}${field("Senha", "senha", "password", "new-password", 'minlength="8"')}<p class="hint">Use pelo menos 8 caracteres, com letras e números.</p><div class="form-error" id="register-error" role="alert"></div><button class="button button-primary form-submit" type="submit">Cadastrar <span>↗</span></button>
  </form></div></section></main>`;
}

function field(label, name, type = "text", autocomplete = "off", attributes = "") {
  const input = `<input id="field-${name}" name="${name}" type="${type}" autocomplete="${autocomplete}" ${attributes} required>`;
  const control = type === "password"
    ? `<span class="password-field">${input}<button type="button" class="password-toggle" data-toggle-password="field-${name}" aria-label="Mostrar ${label.toLowerCase()}" aria-pressed="false">Mostrar</button></span>`
    : input;
  return `<label class="field-label" for="field-${name}">${label}${control}</label>`;
}

export function dashboardGatewayMarkup(notice = "") {
  return `<main class="dashboard-gateway"><header class="portal-header"><a href="/dashboard" class="wordmark">Techocean</a><span class="eyebrow">PAINEL DE ACESSO</span></header><section class="portal-intro"><p class="eyebrow">BEM-VINDO</p><h1>Entre no seu espaço de trabalho.</h1><p>Escolha o acesso adequado ao seu perfil.</p>${notice ? `<p class="portal-notice" role="status">${esc(notice)}</p>` : ""}</section><div class="portal-choices"><a class="portal-choice portal-choice-team" href="/dashboard/acesso-equipe"><span class="portal-choice-icon">↗</span><span class="eyebrow">OPERAÇÃO</span><h2>Equipe</h2><p>Acesso para supervisores e funcionários acompanharem a operação.</p><span class="portal-choice-cta">Entrar como equipe <b>→</b></span></a><a class="portal-choice portal-choice-admin" href="/dashboard/acesso-admin"><span class="portal-choice-icon">◈</span><span class="eyebrow">GESTÃO</span><h2>Administração</h2><p>Gestão da equipe, auditoria e controles administrativos.</p><span class="portal-choice-cta">Entrar como administrador <b>→</b></span></a></div><a href="/" class="portal-back">← Voltar ao site</a></main>`;
}

function renderDashboardGateway() {
  document.title = "Painel — Techocean";
  app.innerHTML = dashboardGatewayMarkup(authNotice);
}

export function loginScreenMarkup(portal = "admin", error = "", notice = "") {
  const teamPortal = portal === "team";
  const title = teamPortal ? "Acesso da equipe" : "Acesso administrativo";
  const eyebrow = teamPortal ? "OPERAÇÃO" : "GESTÃO";
  const intro = teamPortal
    ? "Entre como supervisor ou funcionário para acompanhar e atualizar a operação."
    : "Entre como administrador para gerenciar a equipe, auditoria e controles.";
  const returnPortal = `<a href="/dashboard">← Voltar ao painel</a>`;
  const firstAccess = teamPortal ? "" : `<span data-first-access-link><a href="/primeiro-acesso-admin">Primeiro acesso do administrador</a></span>`;
  return `<main class="auth-page"><section class="auth-card ${teamPortal ? "auth-team" : "auth-admin"}"><a href="/dashboard" class="wordmark">Techocean</a><p class="eyebrow">${eyebrow} · PAINEL</p><h1>${title}</h1><p class="muted">${intro}</p>${notice ? `<p class="inline-success" role="status">${esc(notice)}</p>` : ""}<form class="form-grid" data-form="admin-login" data-login-portal="${teamPortal ? "team" : "admin"}">${field("E-mail", "email", "email", "username")}${field("Senha", "senha", "password", "current-password")}<p class="form-feedback" role="alert">${esc(error)}</p><button class="button button-primary form-submit">Entrar <span>↗</span></button></form><div class="auth-links"><a href="/esqueci-senha">Esqueci minha senha</a>${firstAccess}${returnPortal}</div></section></main>`;
}

function renderAdminFirstAccess() {
  document.title = "Primeiro acesso — Techocean";
  app.innerHTML = `<main class="auth-page"><section class="auth-card auth-admin"><a href="/dashboard" class="wordmark">Techocean</a><p class="eyebrow">CONFIGURAÇÃO INICIAL</p><h1>Criar administrador</h1><p class="muted">Use esta tela somente para criar o primeiro administrador em um banco ainda sem contas administrativas.</p><form class="form-grid" data-form="admin-first-access">${field("Nome completo", "nome", "text", "name")}${field("E-mail", "email", "email", "username")}${field("Senha", "senha", "password", "new-password", "minlength=\"8\"")} ${field("Token de configuração", "setupToken", "password", "off")}<p class="form-feedback" role="alert"></p><button class="button button-primary form-submit">Criar administrador <span>↗</span></button></form><div class="auth-links"><a href="/dashboard/acesso-admin">Voltar ao login</a></div></section></main>`;
}

function renderForgotPassword() {
  document.title = "Recuperar senha — Techocean";
  app.innerHTML = `<main class="auth-page"><section class="auth-card"><a href="/dashboard" class="wordmark">Techocean</a><p class="eyebrow">RECUPERAÇÃO DE ACESSO</p><h1>Esqueci minha senha</h1><p class="muted">Informe o e-mail da conta. Se existir, enviaremos um link para criar uma nova senha.</p><form class="form-grid" data-form="password-reset-request">${field("E-mail", "email", "email", "username")}<p class="form-feedback" role="alert"></p><button class="button button-primary form-submit">Enviar link <span>↗</span></button></form><div class="auth-links"><a href="/dashboard/acesso-admin">Voltar ao login</a></div></section></main>`;
}

function renderResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  document.title = "Nova senha — Techocean";
  app.innerHTML = `<main class="auth-page"><section class="auth-card"><a href="/dashboard" class="wordmark">Techocean</a><p class="eyebrow">RECUPERAÇÃO DE ACESSO</p><h1>Criar nova senha</h1><p class="muted">A nova senha deve ter pelo menos 8 caracteres, com letras e números.</p><form class="form-grid" data-form="password-reset-confirm" data-reset-token="${esc(token)}">${field("Nova senha", "senha", "password", "new-password", "minlength=\"8\"")}${field("Confirmar senha", "confirmacao", "password", "new-password", "minlength=\"8\"")}<p class="form-feedback" role="alert"></p><button class="button button-primary form-submit">Atualizar senha <span>↗</span></button></form></section></main>`;
}

function renderLogin(portal = "admin", error = "") {
  document.title = `${portal === "team" ? "Acesso da equipe" : "Acesso administrativo"} — Techocean`;
  app.innerHTML = loginScreenMarkup(portal, error, authNotice);
  if (!portal || portal === "admin") void refreshFirstAccessLink();
}

async function refreshFirstAccessLink() {
  const link = document.querySelector("[data-first-access-link]");
  if (!link) return;
  try {
    const status = await get("/admin/setup-status");
    link.hidden = status?.enabled !== true;
  } catch {
    link.hidden = true;
  }
}

function portalRoleMismatchMessage(role, portal) {
  const otherPortal = portal === "team" ? "Administração" : "Equipe";
  return `Esta conta tem perfil ${role}. Use a entrada ${otherPortal}.`;
}

export function enforcePortalRole(role, portal) {
  if (panelRoleAllowed(role, portal)) return { allowed: true, message: "" };
  clearAccessToken();
  currentUser = null;
  return { allowed: false, message: portalRoleMismatchMessage(role, portal) };
}

function renderPortalLogin(portal) {
  if (getAccessToken() && currentUser) {
    const result = enforcePortalRole(userRole(), portal);
    if (result.allowed) {
      navigateTo("/dashboard", { replace: true });
    } else {
      renderLogin(portal, result.message);
    }
    return;
  }
  renderLogin(portal);
}

function normalizeAdminUser(payload) {
  const user = payload?.user || payload?.data?.user || payload?.data || payload;
  if (!user || typeof user !== "object") return null;
  return { id: user.id, nome: user.nome || user.name || user.email || "Equipe", email: user.email || "", cargo: String(user.cargo || user.role || "").toUpperCase() };
}

function dashboardNav(slug = "") {
  const links = visibleSections();
  return `<aside class="sidebar"><a class="wordmark sidebar-brand" href="/dashboard">Techocean</a><span class="nav-caption">ESPAÇO DE GESTÃO</span><nav>${navLink("/dashboard", "▦&nbsp;&nbsp; Visão geral", `side-link ${slug === "" ? "active" : ""}`)}${links.map((section) => navLink(`/dashboard/${section.slug}`, `<span class="nav-symbol">${section.name.slice(0, 1)}</span>${section.name}`, `side-link ${section.slug === slug ? "active" : ""}`)).join("")}</nav><div class="sidebar-bottom"><span class="status-dot"></span> Techocean · Operações</div></aside>
    <div class="mobile-dash-nav">${navLink("/dashboard", "Início", `mobile-chip ${slug === "" ? "active" : ""}`)}${links.map((section) => navLink(`/dashboard/${section.slug}`, section.name, `mobile-chip ${section.slug === slug ? "active" : ""}`)).join("")}</div>`;
}

function renderDashboard(slug = "") {
  const section = sections.find((item) => item.slug === slug);
  if (slug && !section) { renderNotFound(); return; }
  if (section?.adminOnly && !isAdmin()) {
    document.title = "Acesso restrito — Techocean";
    app.innerHTML = `<main class="dashboard">${dashboardNav(slug)}<section class="dash-main"><div class="dash-topline">${navLink("/dashboard", "← Painel", "button button-outline compact dashboard-home-link")}${navLink("/", "↖ <span>Voltar ao site</span>", "site-return")}<button class="button button-outline compact" data-action="logout">Sair</button></div><div class="dash-content"><div class="notice-panel"><span class="notice-mark">!</span><div><strong>Acesso restrito</strong><p>Esta área está disponível apenas para ADMIN.</p>${navLink("/dashboard", "Voltar à visão geral", "back-link")}</div></div></div></section></main>`;
    return;
  }
  document.title = `${section?.name || "Visão geral"} — Techocean`;
  app.innerHTML = `<main class="dashboard">${dashboardNav(slug)}<section class="dash-main"><div class="dash-topline">${navLink("/dashboard", "← Painel", "button button-outline compact dashboard-home-link")}${navLink("/", "↖ <span>Voltar ao site</span>", "site-return")}<div class="dash-user-tools"><div class="dash-account"><span class="avatar">${esc((currentUser?.nome || "T").slice(0, 1).toUpperCase())}</span><span>${esc(currentUser?.nome || "Equipe")} · ${esc(userRole())}</span></div><button class="button button-outline compact" data-action="logout">Sair</button></div></div><div class="dash-content">${section ? `<p class="eyebrow">Painel / ${esc(section.name)}</p><h1>${esc(section.name)}</h1><p class="dash-description">${esc(section.description)}</p><div id="section-content" data-slug="${esc(slug)}"><p class="loading-state">Carregando informações…</p></div>` : `<p class="eyebrow">Espaço de gestão</p><h1>Visão geral</h1><p class="dash-description">Acesse as áreas da operação Techocean.</p><div class="dash-cards">${visibleSections().map((item) => `<a href="/dashboard/${item.slug}" class="dash-card"><span class="dash-card-icon">${item.name.slice(0, 1)}</span><h2>${item.name}<span>↗</span></h2><p>${item.description}</p></a>`).join("")}</div>`}</div></section><div id="modal-root"></div></main>`;
  const isMobile = globalThis.window?.matchMedia?.("(max-width: 720px)").matches ?? (globalThis.window?.innerWidth <= 720);
  scrollActiveChipIntoView(document.querySelector(".mobile-dash-nav"), isMobile);
  if (section) void loadSection(section);
}

function renderNotFound() {
  document.title = "Página não encontrada — Techocean";
  app.innerHTML = `<main class="not-found"><span>404</span><h1>Esta rota não existe.</h1><a class="button button-primary" href="/">Voltar ao início</a></main>`;
}

function collectionFrom(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.content)) return payload.content;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

async function loadSection(section, databaseCategory = "servico") {
  const host = document.querySelector("#section-content");
  if (!host) return;
  if (section.slug === "banco-dados") {
    try {
      host.innerHTML = renderDatabaseSection(databaseCategory);
    } catch (error) {
      host.innerHTML = `<div class="load-error" role="alert">${esc(error.message)}</div>`;
    }
    return;
  }
  if (section.slug === "backup") {
    try {
      host.innerHTML = renderBackupSection(await get("/api/backup/historico"));
    } catch (error) {
      host.innerHTML = `<div class="load-error" role="alert">${esc(error.message)}<br>Não foi possível carregar o histórico de backups.</div>`;
    }
    return;
  }
  if (!section.endpoint) {
    host.innerHTML = `<div class="notice-panel"><span class="notice-mark">i</span><div><strong>Consulta ainda não disponível</strong><p>O servidor não oferece uma rota para listar usuários administrativos. Nenhum dado de exemplo é exibido aqui.</p></div></div>`;
    return;
  }
  if (section.slug === "solicitacao") {
    host.innerHTML = `${renderSharedRequestPanel()}<p class="loading-state">Carregando solicitações…</p>`;
  }
  try {
    const payload = section.slug === "usuario"
      ? await Promise.all([get(section.endpoint), get("/admin/setup-status")])
      : await get(section.endpoint);
    const records = collectionFrom(section.slug === "usuario" ? payload[0] : payload);
    if (!host.isConnected) return;
    cachedRecords.set(section.slug, records);
    if (section.slug === "servico") host.innerHTML = renderServiceSection(records, section);
    else if (section.resource) host.innerHTML = renderCrudSection(records, section, section.slug === "usuario" ? payload[1] : null);
    else if (section.slug === "carga") host.innerHTML = renderCargas(records);
    else if (section.slug === "mensagens") host.innerHTML = renderMessages(records);
    else if (section.slug === "orcamento") host.innerHTML = renderBudgets(records);
    else if (section.slug === "agendamento" || section.slug === "solicitacao") {
      if (section.slug === "solicitacao") {
        try {
          host.innerHTML = renderAppointments(records, section.slug);
        } catch (error) {
          host.innerHTML = `<div class="load-error" role="alert">Não foi possível carregar os dados locais das solicitações: ${esc(error.message)}</div>`;
        }
      } else host.innerHTML = renderAppointments(records, section.slug);
      if (section.slug === "solicitacao") {
        host.insertAdjacentHTML("afterbegin", '<div id="shared-solicitations"><p class="loading-state">Carregando solicitações compartilhadas…</p></div>');
        await loadSharedSolicitations(host.querySelector("#shared-solicitations"));
      }
    }
    else if (["auditoria", "sessoes"].includes(section.slug)) host.innerHTML = renderReadOnlySection(records, section.name);
    else host.innerHTML = renderTable(records, section.columns, section.name);
  } catch (error) {
    if (host.isConnected) {
      let references;
      try {
        references = section.slug === "conteiner" ? renderContainerReferenceSection() : section.slug === "carga" ? renderCargoReferenceSection() : section.slug === "operacao" ? renderOperationReferenceSection() : section.slug === "orcamento" ? renderBudgetReferenceSection() : section.slug === "solicitacao" ? renderSolicitationReferenceSection() : "";
      } catch (referenceError) {
        references = `<div class="load-error" role="alert">Não foi possível carregar as referências locais: ${esc(referenceError.message)}</div>`;
      }
      host.innerHTML = `<div class="load-error" role="alert"><p>${esc(error.message)}</p>${section.slug === "solicitacao" ? "" : '<button class="button button-outline" data-reload>Atualizar</button>'}</div>${references}`;
      if (section.slug === "solicitacao") {
        host.insertAdjacentHTML("afterbegin", '<div id="shared-solicitations"><p class="loading-state">Carregando solicitações compartilhadas…</p></div>');
        await loadSharedSolicitations(host.querySelector("#shared-solicitations"));
      }
    }
  }
}

export function renderBackupSection(records = []) {
  const history = Array.isArray(records) ? records : [];
  const historyRows = history.map((record) => `<tr><td><span class="audit-code">${esc(record.backupCode || "BKP-—")}</span></td><td>${esc(record.type || "—")}</td><td>${esc(record.actorName || "Automático")}<br><span class="muted">${esc(record.actorRole || "Sistema")}</span></td><td>${formatAuditDate(record.createdAt)}</td><td>${esc(record.totalRegistros ?? 0)}</td><td>${esc(record.clientes ?? 0)} clientes · ${esc(record.operacoes ?? 0)} operações · ${esc(record.mensagens ?? 0)} mensagens</td></tr>`).join("");
  return `<section class="data-panel backup-panel"><div class="panel-heading"><div><span class="eyebrow">SEGURANÇA DOS DADOS</span><h2>Cópias de segurança</h2></div></div><p class="dash-description">Gere uma cópia dos dados preservando o histórico de quem realizou cada backup, quando ele foi feito e quantos registros foram incluídos.</p><div class="backup-actions"><button class="button button-primary compact" data-action="backup" data-backup-type="operacional">Gerar backup operacional</button>${isAdmin() ? '<button class="button button-outline compact" data-action="backup" data-backup-type="completo">Gerar backup administrativo completo</button>' : ""}</div><p class="backup-feedback" role="status"></p><h3 class="backup-history-title">Backups anteriores <span class="count-pill">${history.length}</span></h3>${history.length ? `<div class="table-scroll"><table class="records-table"><thead><tr><th>Código</th><th>Tipo</th><th>Profissional</th><th>Data e hora</th><th>Total de registros</th><th>Dados incluídos</th></tr></thead><tbody>${historyRows}</tbody></table></div>` : `<div class="empty-state"><span>▱</span><strong>Nenhum backup registrado</strong><p>Os próximos backups aparecerão aqui com seus dados e responsável.</p></div>`}</section>`;
}

const chargeFields = [["descricao", "Descrição", "text"], ["peso", "Peso (t)", "number"], ["volume", "Volume (m³)", "number"], ["tipoCarga", "Tipo de carga", "text"], ["origem", "Origem", "text"], ["destino", "Destino", "text"]];

function renderCargas(records) {
  const rows = records.map((record) => `<tr><td>${valueText(record.id)}</td>${chargeFields.map(([name]) => `<td>${valueText(record[name])}</td>`).join("")}<td><div class="row-actions"><button class="small-action" data-charge-action="view" data-id="${esc(record.id)}">Ver</button><button class="small-action" data-charge-action="edit" data-id="${esc(record.id)}">Editar</button><button class="small-action" data-charge-action="print" data-id="${esc(record.id)}">Imprimir</button>${canDeleteOperational() ? `<button class="small-action danger-action" data-charge-action="delete" data-id="${esc(record.id)}">Excluir</button>` : ""}</div></td></tr>`).join("");
  const table = records.length
    ? `<div class="table-scroll"><table class="records-table"><thead><tr><th>Código</th>${chargeFields.map(([, title]) => `<th>${esc(title)}</th>`).join("")}<th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : `<div class="empty-state"><span>▱</span><strong>Nenhuma carga cadastrada</strong><p>Cadastre uma carga para começar a acompanhar as especificações.</p></div>`;
  return `<section class="data-panel"><div class="panel-heading"><div><span class="eyebrow">OPERAÇÕES / REGISTROS</span><h2>Cargas cadastradas <span class="count-pill">${records.length}</span></h2></div><div class="panel-actions"><button class="button button-outline compact" data-reload>↻ <span>Atualizar</span></button><button class="button button-primary compact" data-action="new-charge">＋ Nova carga</button></div></div><div id="charge-form-slot"></div>${table}</section>${renderCargoReferenceSection()}`;
}

export function renderCargoReferenceSection() {
  try {
    const records = readDatabaseEntries("carga");
    const rows = records.map((entry) => `<tr><td>${valueText(entry.codigo)}</td><td>${valueText(entry.tipoCarga)}</td><td>${valueText(entry.conteineres)}</td><td>${valueText(entry.servicos)}</td><td>${valueText(entry.descricao)}</td></tr>`).join("");
    return `<section class="data-panel" id="cargo-reference-section"><div class="panel-heading"><div><span class="eyebrow">CONSULTA / REFERÊNCIAS</span><h2>Tipos de carga</h2></div></div><p class="dash-description">Referências locais baseadas no uso principal dos contêineres. Verifique a compatibilidade e os limites do equipamento antes da operação.</p>${rows ? `<div class="table-scroll"><table class="records-table"><thead><tr><th>ID da carga</th><th>Tipo de carga</th><th>IDs dos contêineres</th><th>IDs dos serviços</th><th>Descrição</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="muted">Nenhuma referência de carga cadastrada neste navegador.</p>`}</section>`;
  } catch (error) {
    return `<div id="cargo-reference-section" class="load-error" role="alert">Não foi possível carregar as referências de carga: ${esc(error.message)}</div>`;
  }
}

export function renderCrudSection(records, section, setupStatus = null) {
  const definition = resourceDefinitions[section.slug];
  const isUserSettings = section.slug === "usuario";
  const panelTitle = isUserSettings ? "Contas de acesso" : `${section.name}s`;
  const panelEyebrow = isUserSettings ? "CONFIGURAÇÕES" : "GESTÃO / REGISTROS";
  const actionLabel = isUserSettings ? "Novo administrador" : `Novo ${definition.singular}`;
  const actions = `<div class="panel-actions"><button class="button button-outline compact" data-reload>↻ <span>Atualizar</span></button><button class="button button-primary compact" data-action="new-resource" data-resource="${section.slug}">＋ ${actionLabel}</button></div>`;
  const emptyTitle = isUserSettings ? "Nenhuma conta de acesso encontrada" : "Nenhum registro encontrado";
  const emptyDescription = isUserSettings
    ? "Crie uma conta para o administrador ou para outro integrante da equipe."
    : `Cadastre o primeiro ${definition.singular} para começar.`;
  const setupEnabled = setupStatus?.enabled === true;
  const guidance = isUserSettings
    ? `<p class="settings-guidance">Edite uma conta para atualizar nome, e-mail, perfil ou senha. Para manter a senha atual, deixe o campo senha em branco.</p><div class="settings-guidance"><strong>Primeiro acesso para novos administradores</strong><p>Ative esta opção somente durante o cadastro de administradores adicionais e desative-a depois.</p><button class="button button-outline compact" data-action="toggle-admin-setup" data-enabled="${setupEnabled}">${setupEnabled ? "Desativar primeiro acesso" : "Ativar primeiro acesso"}</button></div>`
    : "";
  const initialForm = isUserSettings ? renderResourceFormMarkup(section.slug) : "";
  const references = section.slug === "conteiner" ? renderContainerReferenceSection() : section.slug === "operacao" ? renderOperationReferenceSection() : "";
  return `<section class="data-panel"><div class="panel-heading"><div><span class="eyebrow">${panelEyebrow}</span><h2>${esc(panelTitle)} <span class="count-pill">${records.length}</span></h2></div>${actions}</div>${guidance}<div id="resource-form-slot">${initialForm}</div>${records.length ? renderResourceTable(records, section.slug) : `<div class="empty-state"><span>▱</span><strong>${emptyTitle}</strong><p>${emptyDescription}</p></div>`}</section>${references}`;
}

export function renderContainerReferenceSection() {
  try {
    const records = readDatabaseEntries("conteiner");
    const fields = [{ name: "codigo", label: "ID" }, ...getDatabaseCategory("conteiner").fields.filter((field) => field.name !== "situacao")];
    const table = records.length
      ? `<div class="table-scroll"><table class="records-table"><thead><tr>${fields.map((field) => `<th>${esc(field.label)}</th>`).join("")}</tr></thead><tbody>${records.map((record) => `<tr>${fields.map((field) => `<td>${valueText(record[field.name])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      : `<p class="muted">Nenhuma referência de contêiner cadastrada neste navegador.</p>`;
    return `<section class="data-panel" id="container-reference-section"><div class="panel-heading"><div><span class="eyebrow">CONSULTA / REFERÊNCIAS</span><h2>Tipos de contêiner</h2></div></div><p class="dash-description">Especificações de referência armazenadas neste navegador. Confira as medidas e capacidades do equipamento utilizado antes da operação.</p>${table}</section>`;
  } catch (error) {
    return `<div id="container-reference-section" class="load-error" role="alert">Não foi possível carregar as referências de contêiner: ${esc(error.message)}</div>`;
  }
}

export function renderOperationReferenceSection() {
  try {
    const records = readDatabaseEntries("operacao");
    const fields = [{ name: "codigo", label: "ID" }, ...getDatabaseCategory("operacao").fields.filter((field) => ["categoria", "cargasPrincipais", "cargas", "conteineres", "bercos", "produtividade"].includes(field.name))];
    const rows = records.map((entry) => `<tr>${fields.map((field) => `<td>${valueText(entry[field.name]).replaceAll("\n", "<br>")}</td>`).join("")}</tr>`).join("");
    return `<section class="data-panel" id="operation-reference-section"><div class="panel-heading"><div><span class="eyebrow">CONSULTA / REFERÊNCIAS</span><h2>Categorias de operação</h2></div></div><p class="dash-description">Vínculos por ID são sugestões, não uma confirmação de compatibilidade. Dados armazenados neste navegador. Confirme os valores exatos por berço na tabela oficial de Pranchas Mínimas Operacionais.</p>${rows ? `<div class="table-scroll"><table class="records-table"><thead><tr>${fields.map((field) => `<th>${esc(field.label)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="muted">Nenhuma referência de operação cadastrada neste navegador.</p>`}</section>`;
  } catch (error) {
    return `<div id="operation-reference-section" class="load-error" role="alert">Não foi possível carregar as referências de operação: ${esc(error.message)}</div>`;
  }
}

export function renderResourceTable(records, slug, role = userRole()) {
  const section = sections.find((item) => item.slug === slug);
  const definition = resourceDefinitions[slug];
  const preferred = section.columns?.filter((key) => key in records[0]) || [];
  const columns = (preferred.length ? preferred : Object.keys(records[0])).filter((key) => !["senha", "password"].includes(key.toLowerCase())).slice(0, 7);
  if (slug === "servico") columns.push("valorLocal");
  const serviceValues = slug === "servico" ? readServiceValues() : {};
  const allowDelete = roleCapabilities(role).canDeleteOperational;
  return `<div class="table-scroll"><table class="records-table"><thead><tr>${columns.map((key) => `<th>${esc(key === "valorLocal" ? "Valor local (R$)" : labelFor(key))}</th>`).join("")}<th>Ações</th></tr></thead><tbody>${records.map((record) => `<tr>${columns.map((key) => `<td>${key === "valorLocal" ? serviceValues[record.id] ? esc(formatarTarifaServico({ valor: serviceValues[record.id].valor })) : "Não definido" : statusPill(key, record[key])}</td>`).join("")}<td><div class="row-actions"><button class="small-action" type="button" data-resource-action="view" data-resource="${slug}" data-id="${esc(record.id)}">Ver</button><button class="small-action" type="button" data-resource-action="edit" data-resource="${slug}" data-id="${esc(record.id)}">Editar</button>${slug === "servico" ? `<button class="small-action" type="button" data-resource-action="edit-value" data-resource="${slug}" data-id="${esc(record.id)}">Editar valor</button>` : ""}<button class="small-action" type="button" data-resource-action="print" data-resource="${slug}" data-id="${esc(record.id)}">Imprimir</button>${slug === "agendamento" ? `<button class="small-action" type="button" data-status-id="${esc(record.id)}" data-status="${String(record.status).toLowerCase() === "true" || String(record.status).toLowerCase() === "confirmado" ? "pendente" : "confirmado"}">${String(record.status).toLowerCase() === "true" || String(record.status).toLowerCase() === "confirmado" ? "Marcar pendente" : "Confirmar"}</button>` : ""}${allowDelete ? `<button class="small-action danger-action" type="button" data-resource-action="delete" data-resource="${slug}" data-id="${esc(record.id)}" data-label="${esc(record[columns[1]] ?? definition.singular)}">Excluir</button>` : ""}</div></td></tr>`).join("")}</tbody></table></div>`;
}

function renderServiceSection(records, section) {
  return renderCrudSection(records, section);
}

export function renderDatabaseSection(categoryId = "servico") {
  const category = getDatabaseCategory(categoryId) || databaseCategories[0];
  const records = readDatabaseEntries(category.id);
  const displayFields = category.id === "servico"
    ? [{ name: "codigo", label: "Código" }, ...category.fields, { name: "valorAtualizadoEm", label: "Data e hora do valor", type: "datetime" }]
    : ["conteiner", "carga", "operacao", "orcamento", "solicitacao"].includes(category.id) ? [{ name: "codigo", label: "ID" }, ...category.fields, ...(category.id === "orcamento" ? [{ name: "valorAtualizadoEm", label: "Data e hora do valor", type: "datetime" }] : [])] : category.fields;
  const categoryOptions = databaseCategories.map((item) => `<option value="${esc(item.id)}" ${item.id === category.id ? "selected" : ""}>${esc(item.label)}</option>`).join("");
  const rows = records.map((record) => `<tr>${displayFields.map((field) => `<td>${category.id === "orcamento" ? budgetDatabaseFieldText(field, record) : databaseFieldText(field, record[field.name])}</td>`).join("")}<td><div class="row-actions"><button class="small-action" type="button" data-database-action="view" data-category="${category.id}" data-id="${esc(record.id)}">Ver</button><button class="small-action" type="button" data-database-action="edit" data-category="${category.id}" data-id="${esc(record.id)}">Editar</button>${category.id === "orcamento" ? `<button class="small-action" type="button" data-database-action="edit-value" data-category="${category.id}" data-id="${esc(record.id)}">Editar valor</button>` : ""}${["orcamento", "carga", "operacao", "solicitacao"].includes(category.id) ? `<button class="small-action" type="button" data-database-action="edit-links" data-category="${category.id}" data-id="${esc(record.id)}">Vincular IDs</button>` : ""}<button class="small-action danger-action" type="button" data-database-action="delete" data-category="${category.id}" data-id="${esc(record.id)}">Excluir</button></div></td></tr>`).join("");
  const table = records.length
    ? `<div class="table-scroll"><table class="records-table"><thead><tr>${displayFields.map((field) => `<th>${esc(field.label)}</th>`).join("")}<th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : `<div class="empty-state"><span>▱</span><strong>Nenhum dado cadastrado nesta categoria</strong><p>Adicione um padrão para preencher automaticamente os formulários dos painéis.</p></div>`;
  return `<section class="data-panel"><div class="panel-heading"><div><span class="eyebrow">ADMINISTRAÇÃO / REFERÊNCIAS</span><h2>Banco de dados</h2></div><div class="panel-actions"><label class="field-label database-category-label">Categoria<select id="database-category">${categoryOptions}</select></label><button class="button button-primary compact" data-action="new-database-entry" data-category="${category.id}">＋ Novo dado</button></div></div><p class="dash-description">Os dados são salvos neste navegador e usados para sugerir e preencher os formulários da equipe e da administração. Para sincronizar outros dispositivos, é necessário armazenamento no servidor.</p><div id="database-form-slot"></div><h3 class="database-category-title">${esc(category.label)} <span class="count-pill">${records.length}</span></h3>${table}</section>`;
}

function budgetDatabaseFieldText(field, record) {
  if (field.name === "regras") return budgetConditionsMarkup(record.regras);
  if (field.name === "tarifas") return budgetTariffsMarkup(record.tarifas);
  if (["servicos", "cargas", "conteineres", "operacoes"].includes(field.name) && !record[field.name]) return "Não vinculado";
  if (field.name === "valorEstimado" && (record.valorEstimado == null || record.valorEstimado === "")) return "Selecione uma tarifa ou informe um valor";
  return databaseFieldText(field, record[field.name]);
}

function budgetConditionsMarkup(text) {
  if (!text) return "—";
  const parts = String(text).split(/;\s*|(?<=\.)\s+(?=[A-ZÀ-Ú])/).map((part) => part.trim()).filter(Boolean);
  return `<details><summary>Ver condições (${parts.length})</summary><ul class="budget-reference-list">${parts.map((part) => `<li>${esc(part)}</li>`).join("")}</ul></details>`;
}

function budgetTariffsMarkup(text) {
  const tariffs = parseTarifas(text);
  if (!tariffs.length) return "A consultar";
  return `<details><summary>Ver tarifas (${tariffs.length})</summary><ul class="budget-reference-list">${tariffs.map(({ label, value }) => `<li>${esc(label)}: ${esc(formatarTarifaServico({ valor: value }))}</li>`).join("")}</ul></details>`;
}

export function budgetTariffSelectMarkup(text) {
  const tariffs = parseTarifas(text);
  if (!tariffs.length) return `<p class="muted small">Sem tarifas fixas disponíveis; informe o valor manualmente após consultar as condições.</p>`;
  return `<label class="field-label">Escolher tarifa de referência<select data-budget-tariff><option value="">Selecione uma tarifa ou digite o valor</option>${tariffs.map(({ label, value }) => `<option value="${esc(value)}">${esc(label)} — ${esc(formatarTarifaServico({ valor: value }))}</option>`).join("")}</select></label>`;
}

function databaseFieldText(field, value) {
  if (field.type === "datetime") return formatAuditDate(value);
  if (field.type === "textarea") return valueText(value).replaceAll("\n", "<br>");
  if (field.type === "number" && value !== "" && value != null && Number.isFinite(Number(value))) {
    const formatted = Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits: ["valor", "valorEstimado"].includes(field.name) ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return esc(formatted);
  }
  return valueText(value);
}

export function renderDatabaseEntryForm(categoryId, record = null) {
  const category = getDatabaseCategory(categoryId);
  if (!category) throw new Error("Categoria do Banco de dados inválida.");
  const controls = category.fields.map((field) => {
    const id = `database-field-${field.name}`;
    const value = record?.[field.name] ?? "";
    if (field.type === "select") {
      return `<label class="field-label" for="${id}">${esc(field.label)}<select id="${id}" name="${field.name}">${field.options.map((option) => `<option value="${esc(option)}" ${String(value) === option ? "selected" : ""}>${esc(option)}</option>`).join("")}</select></label>`;
    }
    if (field.type === "textarea") return `<label class="field-label" for="${id}">${esc(field.label)}<textarea id="${id}" name="${field.name}" rows="3">${esc(value)}</textarea></label>`;
    const linked = ["orcamento", "carga", "operacao", "solicitacao"].includes(categoryId) && { servicos: "servico", cargas: "carga", conteineres: "conteiner", operacoes: "operacao", orcamentos: "orcamento" }[field.name];
    if (linked) {
      const selected = String(value).split(",").map((code) => code.trim().toUpperCase());
      const linkedCategory = getDatabaseCategory(linked);
      const options = readDatabaseEntries(linked).map((entry) => `<label><input type="checkbox" data-budget-link="${esc(field.name)}" value="${esc(entry.codigo)}" ${selected.includes(entry.codigo.toUpperCase()) ? "checked" : ""}> ${esc(entry.codigo)} · ${esc(entry[linkedCategory.lookupField])}</label>`).join("");
      return `<div><label class="field-label" for="${id}">${esc(field.label)}<input id="${id}" name="${field.name}" type="text" value="${esc(value)}"></label><details><summary>Selecionar referências</summary><div class="budget-link-options">${options || "Nenhuma referência cadastrada."}</div></details></div>`;
    }
    return `<label class="field-label" for="${id}">${esc(field.label)}<input id="${id}" name="${field.name}" type="${field.type || "text"}" ${field.type === "number" ? 'min="0" step="any"' : ""} value="${esc(value)}" ${field.required ? "required" : ""}></label>`;
  }).join("");
  const codeInfo = categoryId === "servico"
    ? `<p class="muted small">${record ? `Código: ${esc(record.codigo)}. ` : "O código único será gerado ao salvar. "}A data e hora do valor são registradas automaticamente quando a tarifa é alterada.</p>`
    : ["conteiner", "carga", "operacao", "orcamento", "solicitacao"].includes(categoryId) ? `<p class="muted small">${record ? `ID: ${esc(record.codigo)}` : "O ID único será gerado ao salvar."}${categoryId === "carga" ? " Selecione os IDs dos contêineres e serviços ou digite-os separados por vírgula." : ""}${categoryId === "operacao" ? " Selecione os IDs das cargas e contêineres ou digite-os separados por vírgula. Confirme a compatibilidade e as pranchas oficiais." : ""}${categoryId === "orcamento" ? " Selecione os IDs ou digite-os separados por vírgula. Edite as tarifas e condições em conjunto. A alteração do valor é datada." : ""}${categoryId === "solicitacao" ? " Selecione os IDs vinculados ou digite-os separados por vírgula." : ""}${record?.historico ? " Valores de 2017: confirme as condições antes do uso." : ""}</p>` : "";
  const tariffControl = categoryId === "orcamento" ? `<div data-budget-tariff-slot>${budgetTariffSelectMarkup(record?.tarifas)}</div>` : "";
  return `<form class="inline-form" data-form="database-entry" data-database-category="${category.id}" ${record ? `data-database-id="${esc(record.id)}"` : ""}><div class="inline-form-title"><div><span class="eyebrow">${record ? "EDIÇÃO" : "NOVO DADO"}</span><h3>${record ? "Editar" : "Cadastrar"} referência de ${esc(category.label.toLowerCase())}</h3></div><button type="button" class="icon-button" aria-label="Fechar" data-close-form>×</button></div>${codeInfo}${tariffControl}<div class="inline-form-grid">${controls}</div><p class="form-feedback" role="alert"></p><div class="form-actions"><button class="button button-primary compact">Salvar dados</button><button type="button" class="button button-outline compact" data-close-form>Cancelar</button></div></form>`;
}

function renderReadOnlySection(records, title) {
  if (title === "Auditoria") return renderAuditSection(records);
  if (title === "Sessões") return renderSessionsSection(records);
  return `<section class="data-panel"><div class="panel-heading"><div><span class="eyebrow">ADMINISTRAÇÃO</span><h2>${esc(title)} <span class="count-pill">${records.length}</span></h2></div><button class="button button-outline compact" data-reload>↻ Atualizar</button></div>${renderTable(records, null, title)}</section>`;
}

function formatAuditDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? valueText(value) : esc(date.toLocaleString("pt-BR"));
}

function auditMetadata(record) {
  if (record.actionCode || record.actionDescription) {
    return { code: record.actionCode || "SYS-001", description: record.actionDescription || record.action || "Operação registrada" };
  }
  const resource = String(record.resource || "");
  const method = String(record.method || record.action || "GET").toUpperCase();
  if (resource.includes("/api/backup/admin/completo")) return { code: "BKP-001", description: "Geração de backup administrativo completo" };
  if (resource.includes("/api/backup/operacional")) return { code: "BKP-002", description: "Geração de backup operacional" };
  const match = Object.entries({ cargas: ["CARGA", "cargas"], clientes: ["CLI", "clientes"], conteineres: ["CNT", "contêineres"], operacoes: ["OPR", "operações"], orcamentos: ["ORC", "orçamentos"], servicos: ["SRV", "serviços"], solicitacoes: ["SOL", "solicitações"], agendamentos: ["AGD", "agendamentos"], mensagens: ["MSG", "mensagens"] }).find(([resourceName]) => resource.includes(`/${resourceName}`));
  const [prefix, label] = match?.[1] || ["SYS", "operação no sistema"];
  const action = { GET: ["001", "Consulta de "], POST: ["002", "Criação de "], PUT: ["003", "Atualização de "], PATCH: ["003", "Atualização de "], DELETE: ["004", "Exclusão de "] }[method] || ["999", "Execução de "];
  return { code: `${prefix}-${action[0]}`, description: `${action[1]}${label}` };
}

function renderAuditSection(records) {
  const rows = records.map((record) => { const metadata = auditMetadata(record); const eventCode = record.eventCode || (record.id ? `EVT-${String(record.id).padStart(6, "0")}` : metadata.code); return `<tr><td><span class="audit-code">${esc(eventCode)}</span><br><span class="muted">${esc(metadata.code)}</span></td><td><strong>${esc(metadata.description)}</strong><br><span class="muted">${esc(record.method || "—")} · ${esc(record.resource || "—")}</span></td><td>${esc(record.actorName || "Sistema")}<br><span class="muted">${esc(record.actorRole || "Automático")}</span></td><td>${formatAuditDate(record.occurredAt)}</td><td>${esc(record.resourceId || "—")}</td><td><span class="status-pill">${esc(record.responseStatus ?? "—")}</span></td><td>${esc(record.ipAddress || "—")}</td></tr>`; }).join("");
  return `<section class="data-panel audit-panel"><div class="panel-heading"><div><span class="eyebrow">ADMINISTRAÇÃO</span><h2>Auditoria <span class="count-pill">${records.length}</span></h2></div><button class="button button-outline compact" data-reload>↻ Atualizar</button></div>${records.length ? `<div class="table-scroll"><table class="records-table"><thead><tr><th>Código único<br><span class="muted">Tipo</span></th><th>Ação realizada</th><th>Profissional</th><th>Data e hora</th><th>Identificador</th><th>Resultado</th><th>IP</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-state"><span>▱</span><strong>Nenhuma ação registrada</strong><p>As ações realizadas por profissionais aparecerão aqui.</p></div>`}</section>`;
}

function renderSessionsSection(records) {
  const rows = records.map((record) => {
    const sessionId = String(record.id || "");
    const sessionCode = sessionId ? `SES-${sessionId.slice(0, 8).toUpperCase()}` : "SES-—";
    const closing = record.loggedOutAt
      ? `Sessão encerrada<br><span class="muted">${formatAuditDate(record.loggedOutAt)}</span>`
      : `<button class="small-action" type="button" data-action="view-session" data-session-id="${esc(sessionId)}">Acessar</button>`;
    return `<tr><td><span class="audit-code">${esc(sessionCode)}</span></td><td>${esc(record.actorName || "—")}</td><td>${esc(record.role || "—")}</td><td>${formatAuditDate(record.startedAt)}</td><td>${formatAuditDate(record.lastActivityAt)}</td><td>${record.loggedOutAt ? `${closing}<br><button class="small-action" type="button" data-action="view-session" data-session-id="${esc(sessionId)}">Verificar</button>` : closing}</td><td>${esc(record.durationSeconds ?? 0)}</td></tr>`;
  }).join("");
  return `<section class="data-panel"><div class="panel-heading"><div><span class="eyebrow">ADMINISTRAÇÃO</span><h2>Sessões <span class="count-pill">${records.length}</span></h2></div><button class="button button-outline compact" data-reload>↻ Atualizar</button></div>${records.length ? `<div class="table-scroll"><table class="records-table"><thead><tr><th>Código</th><th>Profissional</th><th>Perfil</th><th>Início</th><th>Última atividade</th><th>Verificar</th><th>Duração (segundos)</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-state"><span>▱</span><strong>Nenhuma sessão registrada</strong><p>Os acessos realizados aparecerão aqui.</p></div>`}</section>`;
}

async function openSessionAudit(sessionId, opener) {
  if (!sessionId) return;
  try {
    const records = await get(`/admin/sessoes/${encodeURIComponent(sessionId)}/auditoria`);
    const content = records.length
      ? `<p class="muted">Todas as ações realizadas nesta sessão, em ordem cronológica.</p><div class="table-scroll"><table class="records-table"><thead><tr><th>Código</th><th>O que foi feito</th><th>Data e hora</th><th>Recurso</th><th>Resultado</th><th>IP</th></tr></thead><tbody>${records.map((record) => { const metadata = auditMetadata(record); return `<tr><td><span class="audit-code">${esc(record.eventCode || `EVT-${record.id || "—"}`)}</span><br><span class="muted">${esc(metadata.code)}</span></td><td><strong>${esc(metadata.description)}</strong><br><span class="muted">${esc(record.method || "—")}</span></td><td>${formatAuditDate(record.occurredAt)}</td><td>${esc(record.resource || "—")} ${record.resourceId ? `#${esc(record.resourceId)}` : ""}</td><td>${esc(record.responseStatus ?? "—")}</td><td>${esc(record.ipAddress || "—")}</td></tr>`; }).join("")}</tbody></table></div>`
      : `<div class="empty-state"><span>▱</span><strong>Nenhuma ação registrada</strong><p>As próximas ações desta sessão aparecerão aqui.</p></div>`;
    modal("Verificar sessão", `<div class="detail-modal-content"><p><strong>Código da sessão:</strong> SES-${esc(String(sessionId).slice(0, 8).toUpperCase())}</p>${content}</div>`);
  } catch (error) {
    modal("Verificar sessão", `<div class="load-error" role="alert">${esc(error.message)}</div>`);
  }
  opener?.focus?.();
}

function resourceFieldMarkup(fieldDefinition, record, editing, lookupField = "") {
  const aliases = fieldDefinition.name === "cpf"
    ? ["cpf", "cpfcnpj", "cpfCnpj", "CPFCNPJ", "cpfcNPJ"]
    : fieldDefinition.name === "confirmado" ? ["confirmado", "status"] : [fieldDefinition.name];
  let value = aliases.map((name) => record?.[name]).find((entry) => entry != null) ?? "";
  if (fieldDefinition.type === "datetime-local" && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.valueOf())) value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  const required = editing
    ? (fieldDefinition.editRequired && !fieldDefinition.editOptional ? "required" : "")
    : (fieldDefinition.required ? "required" : "");
  const optionalPassword = editing && fieldDefinition.editOptional ? "<small>Deixe em branco para manter a senha atual.</small>" : "";
  const id = `resource-${fieldDefinition.name}`;
  if (fieldDefinition.type === "select") {
    const selectedValue = value || (!editing && fieldDefinition.name === "cargo" ? "ADMIN" : "");
    return `<label class="field-label" for="${id}">${esc(fieldDefinition.label)}<select id="${id}" name="${fieldDefinition.name}" ${required}>${fieldDefinition.options.map(([optionValue, label]) => `<option value="${esc(optionValue)}" ${String(selectedValue) === optionValue ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label>`;
  }
  if (fieldDefinition.type === "account") {
    const selectedId = value ?? record?.usuarioId ?? record?.usuario?.id ?? "";
    return `<label class="field-label" for="${id}">${esc(fieldDefinition.label)}<select id="${id}" name="${fieldDefinition.name}" ${required}><option value="">Selecione uma conta</option>${(record?.appointmentAccounts || []).map((account) => `<option value="${esc(account.id)}" ${String(selectedId) === String(account.id) ? "selected" : ""}>${esc(account.nome)} · ${esc(account.email)}</option>`).join("")}</select></label>`;
  }
  if (fieldDefinition.type === "textarea") return `<label class="field-label" for="${id}">${esc(fieldDefinition.label)}<textarea id="${id}" name="${fieldDefinition.name}" rows="${record?.catalogEntity === "servico" && fieldDefinition.name === "descricao" ? 8 : 3}" ${required}>${esc(value)}</textarea></label>`;
  const suggestions = fieldDefinition.name === lookupField ? `data-catalog-lookup list="catalog-suggestions-${record?.catalogEntity || ""}"` : "";
  const input = `<input id="${id}" name="${fieldDefinition.name}" type="${fieldDefinition.type || "text"}" value="${fieldDefinition.type === "password" ? "" : esc(value)}" ${suggestions} ${required}>`;
  const control = fieldDefinition.type === "password"
    ? `<span class="password-field">${input}<button type="button" class="password-toggle" data-toggle-password="${id}" aria-label="Mostrar ${esc(fieldDefinition.label).toLowerCase()}" aria-pressed="false">Mostrar</button></span>`
    : input;
  return `<label class="field-label" for="${id}">${esc(fieldDefinition.label)}${control}${optionalPassword}</label>`;
}

export function renderResourceFormMarkup(slug, record = null, appointmentAccounts = [], role = userRole()) {
  const definition = resourceDefinitions[slug];
  const editing = Boolean(record);
  const fields = editing && definition.updateFields ? definition.fields.filter((item) => definition.updateFields.includes(item.name)) : definition.fields;
  const formRecord = slug === "agendamento" ? { ...record, appointmentAccounts }
    : slug === "operacao" && record ? { ...record, solicitacaoId: record.solicitacaoId ?? record.solicitacao?.id, conteinerId: record.conteinerId ?? record.conteiner?.id } : record;
  const lookupField = slug === "operacao" ? "andamento" : getDatabaseCategory(slug)?.lookupField || "";
  const resourceFormRecord = { ...formRecord, catalogEntity: slug };
  const codeField = slug === "servico" ? `<label class="field-label">Código da referência<input name="codigoReferencia" list="service-code-suggestions" autocomplete="off" placeholder="Ex.: SRV-000001"></label><datalist id="service-code-suggestions"></datalist><p class="service-reference-status muted small" aria-live="polite"></p>` : "";
  const localDetails = ["conteiner", "operacao"].includes(slug) && editing ? readResourceDetails()[`${slug}:${record.id}`] : null;
  const containerCode = slug === "conteiner" ? `<label class="field-label">ID do tipo de contêiner<input name="codigoReferencia" value="${esc(localDetails?.referencia || "")}" list="container-code-suggestions" autocomplete="off" placeholder="Ex.: CTR-000001"></label><datalist id="container-code-suggestions"></datalist>` : "";
  const containerDetails = slug === "conteiner" ? `<div data-container-reference aria-live="polite"></div>` : "";
  const operationReference = slug === "operacao" ? `<label class="field-label">Buscar por ID da operação, carga ou contêiner<input name="codigoOperacao" value="${esc(localDetails?.referencia || "")}" list="operation-code-suggestions" autocomplete="off" placeholder="Ex.: OPR-000001, CRG-000001 ou CTR-000001"></label><datalist id="operation-code-suggestions"></datalist><div data-operation-reference aria-live="polite"></div>` : "";
  const operationDetails = slug === "operacao" ? `<div class="inline-form-grid"><label class="field-label">Categoria da operação<input name="categoriaReferencia" readonly placeholder="Não informada"></label><label class="field-label">IDs e tipos dos contêineres da operação<textarea name="conteineresReferencia" rows="3" readonly placeholder="Nenhum vínculo cadastrado"></textarea></label><label class="field-label">IDs e tipos das cargas vinculadas<textarea name="cargasReferencia" rows="3" readonly placeholder="Nenhum vínculo cadastrado"></textarea></label><label class="field-label">Contêineres vinculados às cargas<textarea name="conteineresDasCargasReferencia" rows="3" readonly placeholder="Nenhum vínculo cadastrado"></textarea></label><label class="field-label">Principais cargas<textarea name="cargasPrincipaisReferencia" rows="3" readonly placeholder="Não informadas"></textarea></label><label class="field-label">Berços<input name="bercosReferencia" readonly placeholder="Não informados"></label><label class="field-label">Produtividade de referência<textarea name="produtividadeReferencia" rows="3" readonly placeholder="Não informada"></textarea></label><label class="field-label">Embarque — data e hora de Brasília<input type="datetime-local" name="embarqueLocal" value="${esc(localDetails?.embarqueLocal || "")}"></label><label class="field-label">Desembarque — data e hora de Brasília<input type="datetime-local" name="desembarqueLocal" value="${esc(localDetails?.desembarqueLocal || "")}"></label></div><p class="muted small">Os contêineres das cargas são referências de tipo, não substituem o código do contêiner operacional. Embarque e desembarque são opcionais e salvos neste navegador como horário de Brasília.</p>` : "";
  const localDescription = ["conteiner", "operacao"].includes(slug) ? `<label class="field-label">Descrição da referência (salva neste navegador)<textarea name="descricaoLocal" rows="5">${esc(localDetails?.descricao || "")}</textarea><small>Preenchida com dados da referência e editável manualmente; não altera o cadastro no servidor.</small></label>` : "";
  const serviceValue = slug === "servico" && editing ? readServiceValues()[record.id]?.valor : null;
  const serviceFields = slug === "servico" ? `<div class="service-form-grid">${fields.map((item) => `<div class="service-field service-field-${esc(item.name)}">${resourceFieldMarkup(item, resourceFormRecord, editing, lookupField)}</div>`).join("")}<label class="field-label service-field service-field-valor">Valor do serviço neste navegador (R$)<input type="number" name="valorLocal" min="0" step="0.01" value="${esc(serviceValue ?? "")}"><small>Opcional. Salvo com o serviço apenas neste navegador; não altera a tarifa da referência.</small></label></div>${role === "ADMIN" ? `<div class="service-reference-value"><label class="field-label">Editar tarifa da referência (R$)<input type="number" name="valorReferencia" min="0" step="0.01" disabled></label><button class="button button-outline compact" type="button" data-save-service-reference-value disabled>Salvar tarifa da referência</button><p class="muted small">Selecione um código. Esta alteração é salva separadamente no Banco de dados deste navegador.</p></div>` : ""}` : `<div class="inline-form-grid">${fields.map((item) => resourceFieldMarkup(item, resourceFormRecord, editing, lookupField)).join("")}</div>`;
  return `<form class="inline-form" data-form="resource" data-resource="${slug}" ${lookupField ? `data-catalog-entity="${slug}" data-catalog-lookup="${lookupField}"` : ""} ${editing ? `data-resource-id="${esc(record.id)}"` : ""}><div class="inline-form-title"><div><span class="eyebrow">${editing ? "ATUALIZAÇÃO" : "NOVO REGISTRO"}</span><h3>${editing ? `Editar ${esc(definition.singular)}` : `Novo ${esc(definition.singular)}`}</h3></div><button type="button" class="icon-button" aria-label="Fechar formulário" data-close-form>×</button></div>${codeField}${containerCode}${operationReference}${operationDetails}${serviceFields}${localDescription}${lookupField ? `<datalist id="catalog-suggestions-${slug}"></datalist><p class="muted small">Digite um tipo cadastrado no Banco de dados para preencher os demais campos automaticamente.</p>` : ""}${containerDetails}<p class="form-feedback" role="alert"></p><div class="form-actions"><button class="button button-primary compact">${editing ? "Salvar alterações" : "Criar registro"} <span>↗</span></button><button type="button" class="button button-outline compact" data-close-form>Cancelar</button></div></form>`;
}

export function renderAppointmentAccountsEmpty() {
  return `<div class="empty-state appointment-account-empty" role="status"><span>i</span><strong>Nenhuma conta de cliente disponível</strong><p>Cadastre uma conta de cliente antes de criar ou editar um agendamento.</p><a class="button button-outline compact" href="/dashboard/cliente">Ir para Clientes</a></div>`;
}

async function openResourceForm(slug, record = null, focusValue = false) {
  const slot = document.querySelector("#resource-form-slot");
  if (!slot) return;
  if (slug !== "agendamento") {
    slot.innerHTML = renderResourceFormMarkup(slug, record);
    if (slug === "servico") {
      const form = slot.querySelector("form");
      populateServiceCodeSuggestions(form);
      if (record?.nome) {
        try {
          const entry = findDatabaseEntry("servico", "nome", record.nome);
          if (entry) {
            form.elements.codigoReferencia.value = entry.codigo;
            updateServiceReferenceValueControls(form, entry);
          }
        } catch (error) { setFeedback(form, error.message); }
      }
    }
    if (slug === "conteiner") {
      try {
        updateContainerReference(slot.querySelector("form"));
      } catch (error) {
        setFeedback(slot.querySelector("form"), error.message);
      }
    }
    if (slug === "operacao") {
      try {
        updateOperationReference(slot.querySelector("form"));
      } catch (error) {
        setFeedback(slot.querySelector("form"), error.message);
      }
    }
    slot.querySelector(focusValue ? '[name="valorLocal"]' : "input, select, textarea")?.focus();
    return;
  }
  slot.innerHTML = `<p class="loading-state" role="status">Carregando contas de clientes…</p>`;
  try {
    const accounts = collectionFrom(await getAppointmentAccounts());
    if (!slot.isConnected) return;
    if (!accounts.length) {
      slot.innerHTML = renderAppointmentAccountsEmpty();
      return;
    }
    slot.innerHTML = renderResourceFormMarkup(slug, record, accounts);
    slot.querySelector("input, select, textarea")?.focus();
  } catch (error) {
    if (slot.isConnected) slot.innerHTML = `<div class="load-error" role="alert">${esc(error.message)}<br>Não foi possível carregar as contas de clientes para este agendamento.</div>`;
  }
}

function renderTable(records, columns, title) {
  if (!records.length) return `<div class="empty-state"><span>▱</span><strong>Nenhum registro encontrado</strong><p>A lista de ${esc(title.toLowerCase())} ainda está vazia no servidor.</p></div>`;
  const available = columns?.filter((key) => key in records[0]) || [];
  const keys = (available.length ? available : Object.keys(records[0])).filter((key) => !isSensitiveField(key)).slice(0, 8);
  return `<div class="table-scroll"><table class="records-table"><thead><tr>${keys.map((key) => `<th>${esc(labelFor(key))}</th>`).join("")}${title === "Agendamento" || title === "Solicitação" ? "<th>Ação</th>" : ""}</tr></thead><tbody>${records.map((item) => `<tr>${keys.map((key) => `<td>${statusPill(key, item[key])}</td>`).join("")}${title === "Agendamento" || title === "Solicitação" ? `<td>${item.id ? `<button class="small-action" data-status-id="${esc(item.id)}" data-status="${String(item.status).toLowerCase() === "true" || String(item.status).toLowerCase() === "confirmado" ? "pendente" : "confirmado"}">${String(item.status).toLowerCase() === "true" || String(item.status).toLowerCase() === "confirmado" ? "Marcar pendente" : "Confirmar"}</button>` : "—"}</td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}

function labelFor(key) { return ({ id: "Código", actorName: "Profissional", actorRole: "Perfil", startedAt: "Início", lastActivityAt: "Última atividade", loggedOutAt: "Encerramento", durationSeconds: "Duração (segundos)", cpf: "CPF / CNPJ", cpfcnpj: "CPF / CNPJ", cpfCnpj: "CPF / CNPJ", CPFCNPJ: "CPF / CNPJ", numeroConteiner: "Número do contêiner", tipoCarga: "Tipo de carga", dataHora: "Data e horário", criadoEm: "Data e hora do cadastro", valorEstimado: "Valor estimado", categoriaReferencia: "Categoria da operação", cargaReferencia: "ID de referência da carga", conteineresCargaReferencia: "IDs e tipos dos contêineres vinculados", servicosCargaReferencia: "IDs e nomes dos serviços vinculados", conteineresReferencia: "IDs e tipos dos contêineres da operação", conteineresDasCargasReferencia: "Contêineres vinculados às cargas", cargasReferencia: "IDs e tipos das cargas vinculadas", cargasPrincipaisReferencia: "Principais cargas", bercosReferencia: "Berços", produtividadeReferencia: "Produtividade de referência", embarqueBrasilia: "Embarque", desembarqueBrasilia: "Desembarque" })[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()); }

function statusPill(key, value) {
  const rendered = valueText(value);
  if (/status|disponivel/i.test(key)) return `<span class="status-pill">${rendered}</span>`;
  if (/dataHora|data|createdAt|criadoEm/i.test(key) && value) { const date = new Date(value); if (!Number.isNaN(date.valueOf())) return esc(date.toLocaleString("pt-BR")); }
  return rendered;
}

export function renderMessages(records) {
  if (!records.length) return `<div class="data-panel"><div class="panel-heading"><div><span class="eyebrow">FALE CONOSCO</span><h2>Caixa de entrada <span class="count-pill">0</span></h2></div><button class="button button-outline compact" data-reload>↻ Atualizar</button></div><div class="empty-state"><span>✉</span><strong>Nenhuma mensagem recebida</strong><p>As mensagens enviadas pelo formulário do site aparecerão aqui.</p></div></div>`;
  return `<div class="data-panel"><div class="panel-heading"><div><span class="eyebrow">FALE CONOSCO</span><h2>Caixa de entrada <span class="count-pill">${records.length}</span></h2></div><button class="button button-outline compact" data-reload>↻ Atualizar</button></div><div class="message-list">${records.map((message) => `<article class="message-card"><div class="message-heading"><div class="avatar">${esc((message.nome || "?").slice(0, 1).toUpperCase())}</div><div><h2>${valueText(message.nome)}</h2><p>${valueText(message.email)} · ${message.criadoEm ? valueText(new Date(message.criadoEm).toLocaleString("pt-BR")) : "Contato recebido"}</p></div><span class="status-pill">${valueText(message.status || "Recebida")}</span></div><p class="message-content">${valueText(message.conteudo || message.mensagem || message.texto)}</p>${message.resposta ? `<div class="reply-sent"><strong>Resposta enviada</strong><p>${valueText(message.resposta)}</p></div>` : ""}${message.id ? `<form class="inline-reply" data-form="reply" data-message-id="${esc(message.id)}"><label class="sr-only" for="reply-${esc(message.id)}">Resposta</label><input id="reply-${esc(message.id)}" name="resposta" required placeholder="Escreva uma resposta…"><button class="button button-primary compact">Responder ↗</button></form>` : ""}</article>`).join("")}</div></div>`;
}

function renderAppointments(records, slug) {
  if (slug === "solicitacao") return renderSolicitacoes(records);
  if (!records.length) return `<div class="data-panel"><div class="panel-heading"><div><span class="eyebrow">GESTÃO</span><h2>${slug === "agendamento" ? "Visitas técnicas" : "Solicitações"} <span class="count-pill">0</span></h2></div><button class="button button-outline compact" data-reload>↻ Atualizar</button></div>${renderTable([], sections.find((item) => item.slug === slug).columns, slug)}</div>`;
  return `<div class="data-panel"><div class="panel-heading"><div><span class="eyebrow">GESTÃO</span><h2>${slug === "agendamento" ? "Visitas técnicas" : "Solicitações"} <span class="count-pill">${records.length}</span></h2></div><button class="button button-outline compact" data-reload>↻ Atualizar</button></div>${renderTable(records, sections.find((item) => item.slug === slug).columns, slug === "agendamento" ? "Agendamento" : "Solicitação")}</div>`;
}

export function renderSolicitacoes(records) {
  const solicitationStates = readSolicitationStates();
  const grouped = new Map();
  for (const record of records) {
    const service = record.servico && typeof record.servico === "object" ? record.servico : null;
    const serviceName = service?.nome || record.servico || "Serviço não informado";
    const tariff = localizarTarifaServico(serviceName);
    const category = service?.categoria || record.categoria || tariff?.categoria || "Sem categoria";
    const defaults = findDatabaseEntry("solicitacao", "servico", serviceName) || {};
    const state = solicitationStates[record.id] || {};
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push({
      ...record,
      _serviceName: serviceName,
      _solicitado: state.solicitado || defaults.solicitado || "Sim",
      _prestado: state.prestado || defaults.prestado || "Não",
    });
  }
  const groups = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  const categoriesMarkup = groups.map(([category, items]) => {
    const rows = items.map((record) => {
      const currentStatus = String(record.status).toLowerCase();
      const confirmed = currentStatus === "true" || currentStatus === "confirmado";
      const options = (selected) => ["Sim", "Não"].map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`).join("");
      return `<tr data-solicitation-row="${esc(record.id)}"><td>${valueText(record.id)}</td><td>${valueText(record.cliente?.nome || record.cliente)}</td><td>${valueText(record.carga?.descricao || record.carga)}</td><td>${valueText(record._serviceName)}</td><td><label class="sr-only" for="solicitado-${esc(record.id)}">Serviço solicitado para solicitação ${esc(record.id)}</label><select class="solicitation-flag" id="solicitado-${esc(record.id)}" data-solicitation-field="solicitado" data-id="${esc(record.id)}">${options(record._solicitado)}</select></td><td><label class="sr-only" for="prestado-${esc(record.id)}">Serviço prestado para solicitação ${esc(record.id)}</label><select class="solicitation-flag" id="prestado-${esc(record.id)}" data-solicitation-field="prestado" data-id="${esc(record.id)}">${options(record._prestado)}</select></td><td>${statusPill("status", record.status)}</td><td><div class="row-actions"><button class="small-action" data-solicitation-action="view" data-id="${esc(record.id)}">Ver</button><button class="small-action" data-solicitation-action="edit" data-id="${esc(record.id)}">Editar descrição</button><button class="small-action" data-solicitation-action="print" data-id="${esc(record.id)}">Imprimir</button>${record.id ? `<button class="small-action" data-status-id="${esc(record.id)}" data-status="${confirmed ? "pendente" : "confirmado"}">${confirmed ? "Marcar pendente" : "Confirmar"}</button>` : "—"}</div></td></tr>`;
    }).join("");
    return `<section class="service-catalog-category solicitation-category"><div class="solicitation-category-heading"><h3>${esc(category)}</h3><span class="count-pill">${items.length}</span></div><div class="table-scroll"><table class="records-table"><thead><tr><th>Código</th><th>Cliente</th><th>Carga</th><th>Serviço</th><th>Solicitado?</th><th>Prestado?</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }).join("");
  const content = records.length
    ? categoriesMarkup
    : `<div class="empty-state"><span>▱</span><strong>Nenhuma solicitação recebida</strong><p>As solicitações serão organizadas aqui conforme a categoria do serviço prestado.</p></div>`;
  return `<section class="data-panel"><div class="panel-heading"><div><span class="eyebrow">GESTÃO / SERVIÇOS</span><h2>Solicitações <span class="count-pill">${records.length}</span></h2><p class="dash-description">Solicitações agrupadas pela categoria do serviço prestado.</p></div></div>${records.length ? `<label class="field-label">Buscar solicitação por ID<input type="search" data-solicitation-search placeholder="Digite o ID da solicitação"></label><p class="muted small" data-solicitation-search-status aria-live="polite"></p>` : ""}${content}</section>${renderSolicitationReferenceSection()}`;
}

export function renderSolicitationReferenceSection() {
  const references = readDatabaseEntries("solicitacao");
  const linked = [
    ["servicos", "servico", "nome"],
    ["cargas", "carga", "tipoCarga"],
    ["conteineres", "conteiner", "tipo"],
    ["operacoes", "operacao", "categoria"],
    ["orcamentos", "orcamento", "servico"],
  ].map(([field, category, name]) => [field, readDatabaseEntries(category), name]);
  const rows = references.map((reference) => `<tr data-solicitation-reference-row><td>${valueText(reference.codigo)}</td><td>${valueText(reference.servico)}</td><td>${valueText(reference.categoria)}</td><td>${valueText(reference.descricao)}</td>${linked.map(([field, entries, name]) => `<td>${valueText(linkedReferences(reference[field], entries, name))}</td>`).join("")}</tr>`).join("");
  return `<section class="data-panel" data-solicitation-references><div class="panel-heading"><div><span class="eyebrow">REFERÊNCIAS LOCAIS</span><h2>Categorias de solicitação <span class="count-pill">${references.length}</span></h2></div></div><p class="dash-description">Referências deste navegador. O ID SOL identifica a categoria de referência, não uma solicitação recebida. Os vínculos podem ser editados no Banco de dados.</p><label class="field-label">Buscar categoria ou ID<input type="search" data-solicitation-reference-search placeholder="Digite a categoria ou um ID"></label><p class="muted small" data-solicitation-reference-status aria-live="polite"></p>${references.length ? `<div class="table-scroll"><table class="records-table"><thead><tr><th>ID</th><th>Nome</th><th>Categoria</th><th>Descrição e exemplos</th><th>Serviços vinculados</th><th>Cargas vinculadas</th><th>Contêineres vinculados</th><th>Operações vinculadas</th><th>Orçamentos vinculados</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-state"><strong>Nenhuma referência cadastrada</strong></div>`}</section>`;
}

export function filterSolicitationReferences(panel, query) {
  const search = normalizeServiceSearch(query);
  let visible = 0;
  panel.querySelectorAll("[data-solicitation-reference-row]").forEach((row) => {
    row.hidden = Boolean(search) && !normalizeServiceSearch(row.textContent).includes(search);
    if (!row.hidden) visible++;
  });
  panel.querySelector("[data-solicitation-reference-status]").textContent = search && !visible ? "Nenhuma referência encontrada." : "";
}

async function loadSharedSolicitations(host) {
  if (!host) return;
  cachedRecords.delete("solicitacoes-compartilhadas");
  cachedRecords.delete("referencias-compartilhadas");
  try {
    const [requests, references] = await Promise.all([get("/solicitacoes/compartilhadas"), get("/referencias-compartilhadas")]);
    if (!host.isConnected) return;
    cachedRecords.set("solicitacoes-compartilhadas", collectionFrom(requests));
    cachedRecords.set("referencias-compartilhadas", collectionFrom(references));
    host.innerHTML = `${renderSharedRequestPanel()}${renderSharedSolicitations(collectionFrom(requests), collectionFrom(references), isAdmin())}`;
    await openSharedRequest(null, false);
  } catch (error) {
    if (host.isConnected) host.innerHTML = `${renderSharedRequestPanel()}${renderSharedSolicitationsError(error.message)}`;
  }
}

export function renderSharedSolicitationsError(message) {
  return `<div class="load-error" role="alert"><p>Não foi possível carregar as solicitações compartilhadas: ${esc(message)}</p><p>Verifique se a API atualizada está publicada e recarregue a página.</p></div>`;
}

export function renderSharedRequestPanel() {
  return `<section class="data-panel shared-request-panel"><div class="panel-heading"><div><span class="eyebrow">SOLICITAÇÃO / CADASTRO</span><h2>Dados da solicitação</h2></div><button class="button button-outline compact" data-shared-request-action="new">＋ Criar nova solicitação</button></div><div id="shared-request-slot"><p class="muted small" role="status">Os campos serão habilitados quando os dados do servidor estiverem disponíveis.</p><fieldset disabled class="shared-request-unavailable">${sharedRequestForm(null, [], [], [], [], [])}</fieldset></div></section>`;
}

function sharedReferenceText(reference) {
  if (!reference) return "Não vinculado";
  return [reference.codigo, reference.nome, reference.categoria, reference.descricao].filter(Boolean).join(" · ");
}

function sharedCreatedAt(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? String(value) : `${date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)`;
}

export function renderSharedSolicitations(requests, references, admin) {
  const rows = requests.map((r) => `<tr data-shared-request-row><td>${valueText(r.id)}</td><td>${valueText(r.nomeServico)}</td><td>${valueText(r.categoria)}</td><td>${valueText(r.descricao)}</td><td>${valueText(sharedReferenceText(r.servicoReferencia))}</td><td>${valueText(sharedReferenceText(r.cargaReferencia))}</td><td>${valueText(sharedReferenceText(r.conteinerReferencia))}</td><td>${valueText(sharedReferenceText(r.operacaoReferencia))}</td><td>${valueText(`${sharedReferenceText(r.orcamentoReferencia)} · ${r.valor == null ? "Valor não informado" : formatarTarifaServico({ valor: Number(r.valor) })}`)}</td><td>${valueText(`${r.solicitante.id} · ${r.solicitante.nome}`)}</td><td>${valueText(`${r.prestador.id} · ${r.prestador.nome} · ${r.prestador.cargo}`)}</td><td>${valueText(sharedStatus(r.statusSolicitacao))}</td><td>${valueText(sharedCreatedAt(r.criadoEm))}</td><td><div class="row-actions"><button class="small-action" data-shared-request-action="view" data-id="${esc(r.id)}">Ver</button><button class="small-action" data-shared-request-action="edit" data-id="${esc(r.id)}">Editar</button><button class="small-action" data-shared-request-action="print" data-id="${esc(r.id)}">Imprimir</button></div></td></tr>`).join("");
  const refs = references.map((r) => `<tr><td>${valueText(r.codigo)}</td><td>${valueText(r.nome)}</td><td>${valueText(r.categoria)}</td><td>${valueText(r.descricao)}</td><td>${valueText(r.valor == null ? "—" : formatarTarifaServico({ valor: Number(r.valor) }))}</td>${admin ? `<td><button class="small-action" data-shared-reference-action="edit" data-id="${esc(r.id)}">Editar</button></td>` : ""}</tr>`).join("");
  return `<section class="data-panel" data-shared-requests><div class="panel-heading"><div><span class="eyebrow">DADOS COMPARTILHADOS</span><h2>Solicitações da equipe <span class="count-pill">${requests.length}</span></h2></div><button class="button button-primary compact" data-shared-request-action="new">＋ Criar nova solicitação</button></div><p class="dash-description">Salvas no servidor e disponíveis para a equipe. Estas solicitações também aparecem na lista operacional abaixo.</p>${requests.length ? `<label class="field-label">Buscar por ID ou nome<input type="search" data-shared-request-search></label><p class="muted small" data-shared-search-status aria-live="polite"></p><div class="table-scroll"><table class="records-table"><thead><tr><th>ID</th><th>Nome do serviço</th><th>Categoria</th><th>Descrição</th><th>Serviço oferecido</th><th>Carga</th><th>Contêiner</th><th>Operação</th><th>Orçamento</th><th>Solicitante</th><th>Prestador</th><th>Solicitação</th><th>Data e hora</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty-state"><strong>Nenhuma solicitação compartilhada</strong></div>`}</section><section class="data-panel"><div class="panel-heading"><div><span class="eyebrow">CATÁLOGO DO SERVIDOR</span><h2>Referências compartilhadas</h2></div>${admin ? `<button class="button button-outline compact" data-shared-reference-action="new">＋ Nova referência</button>` : ""}</div><p class="dash-description">Catálogo novo, separado dos dados locais deste navegador. O administrador pode cadastrar e editar referências aqui.</p>${references.length ? `<div class="table-scroll"><table class="records-table"><thead><tr><th>ID</th><th>Nome</th><th>Categoria</th><th>Descrição</th><th>Valor</th>${admin ? "<th>Ações</th>" : ""}</tr></thead><tbody>${refs}</tbody></table></div>` : `<div class="empty-state"><strong>Nenhuma referência compartilhada cadastrada</strong><p>O administrador pode cadastrar referências para vincular às solicitações.</p></div>`}</section>`;
}

function sharedStatus(status) {
  return { SIM: "Sim", NAO: "Não", EM_ANALISE: "Em análise" }[status] || status || "Não informado";
}

function sharedDetails(record) {
  return {
    id: record.id,
    nomeServico: record.nomeServico,
    categoria: record.categoria,
    descricao: record.descricao,
    servicoOferecido: sharedReferenceText(record.servicoReferencia),
    carga: sharedReferenceText(record.cargaReferencia),
    conteiner: sharedReferenceText(record.conteinerReferencia),
    operacao: sharedReferenceText(record.operacaoReferencia),
    orcamento: `${sharedReferenceText(record.orcamentoReferencia)} · ${record.valor == null ? "Valor não informado" : formatarTarifaServico({ valor: Number(record.valor) })}`,
    solicitante: `${record.solicitante.id} · ${record.solicitante.nome}`,
    prestador: `${record.prestador.id} · ${record.prestador.nome} · ${record.prestador.cargo}`,
    statusSolicitacao: sharedStatus(record.statusSolicitacao),
    statusOperacional: record.statusOperacional,
    cargaOperacional: `${record.cargaOperacional.id} · ${record.cargaOperacional.descricao}`,
    servicoOperacional: `${record.servicoOperacional.id} · ${record.servicoOperacional.nome}`,
    criadoEm: sharedCreatedAt(record.criadoEm),
  };
}

function referenceForm(reference = null) {
  const options = [["SRV", "Serviço"], ["CRG", "Carga"], ["CTR", "Contêiner"], ["OPR", "Operação"], ["ORC", "Orçamento"]];
  return `<form class="form-grid" data-form="shared-reference" ${reference ? `data-id="${esc(reference.id)}" data-version="${esc(reference.versao)}"` : ""}><label class="field-label">Tipo<select name="tipo" ${reference ? "disabled" : ""} required>${options.map(([id, name]) => `<option value="${id}" ${reference?.tipo === id ? "selected" : ""}>${name}</option>`).join("")}</select></label>${reference ? `<input type="hidden" name="tipo" value="${esc(reference.tipo)}">` : ""}<label class="field-label">Nome<input name="nome" maxlength="255" required value="${esc(reference?.nome || "")}"></label><label class="field-label">Categoria<input name="categoria" maxlength="255" value="${esc(reference?.categoria || "")}"></label><label class="field-label">Descrição e dados<textarea name="descricao" maxlength="2000">${esc(reference?.descricao || "")}</textarea></label><label class="field-label">Valor (R$), quando aplicável<input name="valor" type="number" step="0.01" min="0" value="${esc(reference?.valor ?? "")}"></label><p class="form-feedback" role="alert"></p><button class="button button-primary compact">Salvar referência</button></form>`;
}

export function sharedRequestForm(record, clients, cargos, services, staff, references) {
  const options = (items, selected, label) => `<option value="">Selecione</option>${items.map((item) => `<option value="${esc(item.id)}" ${String(item.id) === String(selected ?? "") ? "selected" : ""}>${esc(label(item))}</option>`).join("")}`;
  const referenceControl = (field, label, type, selected) => `<label class="field-label">${label}<select name="${field}" data-shared-ref>${options(references.filter((ref) => ref.tipo === type), selected?.id, (ref) => `${ref.codigo} · ${ref.nome}`)}</select><textarea data-shared-ref-details="${field}" rows="3" readonly aria-label="Dados de ${label}">${esc(selected ? sharedReferenceText(selected) : "")}</textarea></label>`;
  const categories = catalogoSolicitacoes.map(({ categoria }) => ({ id: categoria, nome: categoria }));
  if (record?.categoria && !categories.some((item) => item.id === record.categoria)) categories.push({ id: record.categoria, nome: record.categoria });
  return `<form class="inline-form shared-request-form" data-form="shared-request" ${record ? `data-id="${esc(record.id)}" data-version="${esc(record.versao)}"` : ""}><div class="inline-form-grid"><label class="field-label">ID da solicitação<input value="${record ? esc(record.id) : "Gerado ao salvar"}" readonly></label><label class="field-label">Nome do serviço para a solicitação<input name="nomeServico" required maxlength="255" value="${esc(record?.nomeServico || "")}"></label><label class="field-label">Categoria<select name="categoria" required>${options(categories, record?.categoria, (item) => item.nome)}</select></label><label class="field-label">Descrição do pedido<textarea name="descricao" required maxlength="2000">${esc(record?.descricao || "")}</textarea></label>${referenceControl("servicoReferenciaId", "Tipo de serviço oferecido", "SRV", record?.servicoReferencia)}${referenceControl("cargaReferenciaId", "Carga vinculada", "CRG", record?.cargaReferencia)}${referenceControl("conteinerReferenciaId", "Contêiner vinculado", "CTR", record?.conteinerReferencia)}${referenceControl("operacaoReferenciaId", "Operação vinculada", "OPR", record?.operacaoReferencia)}${referenceControl("orcamentoReferenciaId", "Orçamento vinculado", "ORC", record?.orcamentoReferencia)}<label class="field-label">Valor do orçamento (R$)<input name="valor" type="number" min="0" step="0.01" value="${esc(record?.valor ?? "")}"></label><label class="field-label">Solicitante (cliente)<select name="clienteId" required>${options(clients, record?.solicitante?.id, (item) => `${item.id} · ${item.nome}`)}</select></label><label class="field-label">Prestador de serviço<select name="prestadorId" required>${options(staff, record?.prestador?.id, (item) => `${item.id} · ${item.nome} · ${item.cargo}`)}</select></label><label class="field-label">Carga operacional para uso em operações<select name="cargaOperacionalId" required>${options(cargos, record?.cargaOperacional?.id, (item) => `${item.id} · ${item.descricao}`)}</select></label><label class="field-label">Serviço operacional para uso em operações<select name="servicoOperacionalId" required>${options(services, record?.servicoOperacional?.id, (item) => `${item.id} · ${item.nome}`)}</select></label><label class="field-label">Status da solicitação<select name="statusSolicitacao" required>${[["EM_ANALISE", "Em análise"], ["SIM", "Sim"], ["NAO", "Não"]].map(([value, name]) => `<option value="${value}" ${(record?.statusSolicitacao || "EM_ANALISE") === value ? "selected" : ""}>${name}</option>`).join("")}</select></label></div><p class="muted small">Este status é separado do status operacional existente.</p><p class="form-feedback" role="alert"></p><button class="button button-primary compact">Salvar solicitação</button></form>`;
}

async function openSharedRequest(record = null, focus = true) {
  const slot = document.querySelector("#shared-request-slot");
  if (!slot) return;
  if (slot.dataset.loading) return;
  slot.dataset.loading = "true";
  const requestId = String(Number(slot.dataset.requestId || 0) + 1);
  slot.dataset.requestId = requestId;
  if (focus) slot.scrollIntoView({ behavior: "smooth", block: "start" });
  const status = document.createElement("p");
  status.className = "muted small";
  status.setAttribute("role", "status");
  status.textContent = "Carregando dados para o formulário…";
  slot.prepend(status);
  const controls = [...slot.querySelectorAll("input, select, textarea, button")].map((control) => [control, control.disabled]);
  controls.forEach(([control]) => { control.disabled = true; });
  try {
    const [clients, cargos, services, staff, references] = await Promise.all([get("/clientes"), get("/cargas"), get("/servicos/todos"), get("/referencias-compartilhadas/prestadores"), get("/referencias-compartilhadas")]);
    if (!slot.isConnected || slot.dataset.requestId !== requestId) return;
    cachedRecords.set("referencias-compartilhadas", collectionFrom(references));
    slot.innerHTML = `<h3>${record ? `Editar solicitação ${esc(record.id)}` : "Nova solicitação"}</h3>${sharedRequestForm(record, collectionFrom(clients), collectionFrom(cargos), collectionFrom(services), collectionFrom(staff), collectionFrom(references))}`;
    if (focus) slot.querySelector('[name="nomeServico"]')?.focus({ preventScroll: true });
  } catch (error) {
    if (slot.isConnected && slot.dataset.requestId === requestId) {
      status.className = "inline-error";
      status.setAttribute("role", "alert");
      status.textContent = `Não foi possível carregar os dados para o formulário: ${error.message}. Atualize o painel para tentar novamente.`;
      controls.forEach(([control, disabled]) => { control.disabled = disabled; });
    }
  } finally {
    if (slot.isConnected && slot.dataset.requestId === requestId) delete slot.dataset.loading;
  }
}

async function handleSharedRequestAction(action, record) {
  if (action === "edit") {
    const form = document.querySelector('#shared-request-slot form[data-form="shared-request"]');
    if (form?.dataset.dirty && !window.confirm("Descartar alterações não salvas no formulário?")) return;
    if (document.querySelector("#modal-root .modal-card")) dismissModal();
    await openSharedRequest(record);
  }
  else if (action === "view") modal(`Solicitação · ${record.id}`, `<div class="detail-modal-content">${recordDetailsMarkup(sharedDetails(record))}<div class="form-actions"><button class="button button-outline compact" data-shared-request-action="print" data-id="${esc(record.id)}">Imprimir</button><button class="button button-primary compact" data-shared-request-action="edit" data-id="${esc(record.id)}">Editar</button></div></div>`);
  else if (action === "print" && !printRecord(sharedDetails(record), `Solicitação ${record.id}`)) showSectionError("Permita a abertura da janela de impressão para continuar.");
}

export function filterSolicitations(panel, query) {
  const search = String(query).trim();
  let visible = 0;
  panel.querySelectorAll(".solicitation-category").forEach((category) => {
    let categoryVisible = false;
    category.querySelectorAll("[data-solicitation-row]").forEach((row) => {
      row.hidden = Boolean(search) && !row.dataset.solicitationRow.includes(search);
      if (!row.hidden) { categoryVisible = true; visible++; }
    });
    category.hidden = !categoryVisible;
  });
  panel.querySelector("[data-solicitation-search-status]").textContent = search && !visible ? "Nenhuma solicitação encontrada para esse ID." : "";
}

export function renderBudgets(records) {
  const metadata = readBudgetMetadata();
  const rows = records.map((record) => {
    const saved = withBudgetMetadata(record, metadata);
    return `<tr><td>${valueText(record.id)}</td><td>${valueText(record.cliente?.nome || record.cliente)}</td><td>${valueText(record.carga?.descricao || record.carga)}</td><td>${valueText(record.servico?.nome || record.servico)}</td><td>${valueText(budgetReferenceValue(saved))}</td><td>${statusPill("status", record.status)}</td><td>${formatAuditDate(saved.criadoEm || saved.createdAt || saved.dataHora)}</td><td><div class="row-actions"><button class="small-action" type="button" data-budget-action="view" data-id="${esc(record.id)}">Ver</button><button class="small-action" type="button" data-budget-action="edit" data-id="${esc(record.id)}">Editar</button><button class="small-action" type="button" data-budget-action="print" data-id="${esc(record.id)}">Imprimir</button></div></td></tr>`;
  }).join("");
  const table = records.length
    ? `<div class="table-scroll"><table class="records-table"><thead><tr><th>Código</th><th>Cliente</th><th>Carga</th><th>Serviço</th><th>Valor estimado</th><th>Status</th><th>Data e hora</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : `<div class="empty-state"><span>▱</span><strong>Nenhum orçamento cadastrado</strong><p>Os orçamentos criados aparecerão aqui com seus dados e data de cadastro.</p></div>`;
  return `<div class="data-panel"><div class="panel-heading"><div><span class="eyebrow">COMERCIAL</span><h2>Orçamentos <span class="count-pill">${records.length}</span></h2></div><div class="panel-actions"><button class="button button-outline compact" data-reload>↻ Atualizar</button><button class="button button-primary compact" data-action="new-budget">＋ Novo orçamento</button></div></div><div id="budget-form-slot"></div>${table}</div>${renderBudgetReferenceSection()}`;
}

export function renderBudgetReferenceSection() {
  try {
    const records = readDatabaseEntries("orcamento");
    const rows = records.map((entry) => `<tr><td>${valueText(entry.codigo)}</td><td>${valueText(entry.servico)}</td><td>${valueText(entry.categoria)}</td><td>${budgetDatabaseFieldText({ name: "valorEstimado", type: "number" }, entry)}</td><td>${budgetTariffsMarkup(entry.tarifas)}</td><td>${budgetConditionsMarkup(entry.regras)}</td>${["servicos", "cargas", "conteineres", "operacoes"].map((name) => `<td>${budgetDatabaseFieldText({ name }, entry)}</td>`).join("")}<td>${valueText(entry.observacoes)}</td></tr>`).join("");
    return `<section class="data-panel" id="budget-reference-section"><div class="panel-heading"><div><span class="eyebrow">CONSULTA / REFERÊNCIAS</span><h2>Referências de orçamento</h2></div></div><p class="dash-description">As tarifas de 2017 não representam preços atuais e não são calculadas automaticamente. A tabela previa impostos à parte e adicional de 35% para certos serviços e cargas. Confira regras, adicionais e impostos antes de usar.</p>${rows ? `<div class="table-scroll"><table class="records-table"><thead><tr><th>ID</th><th>Serviço</th><th>Categoria</th><th>Valor cadastrado (R$)</th><th>Tarifas disponíveis</th><th>Condições</th><th>IDs de serviço</th><th>IDs de carga</th><th>IDs de contêiner</th><th>IDs de operação</th><th>Observações</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="muted">Nenhuma referência cadastrada.</p>`}</section>`;
  } catch (error) {
    return `<div id="budget-reference-section" class="load-error" role="alert">Não foi possível carregar as referências de orçamento: ${esc(error.message)}</div>`;
  }
}

function withBudgetMetadata(record, metadata = readBudgetMetadata()) {
  const saved = metadata[record.id] || {};
  return {
    ...record,
    valorEstimado: saved.valorEstimado ?? record.valorEstimado,
    criadoEm: record.criadoEm || record.createdAt || record.dataHora || saved.criadoEm,
    ...(saved.referencia ? { referenciaOrcamento: saved.referencia } : {}),
    ...(saved.descricaoLocal ? { descricaoLocal: saved.descricaoLocal } : {}),
  };
}

function budgetReferenceValue(record) {
  if (record.valorEstimado != null) {
    const value = Number(record.valorEstimado);
    return Number.isFinite(value)
      ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : valueText(record.valorEstimado);
  }
  const serviceName = record.servico?.nome || record.servico;
  const defaults = databaseBudgetDefaults(serviceName);
  return defaults.valor != null ? formatarTarifaServico({ valor: defaults.valor }) : "—";
}

function modal(title, contents) {
  const root = document.querySelector("#modal-root");
  if (!root) return;
  if (!root.querySelector(".modal-card")) modalReturnFocus = document.activeElement;
  root.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><h2 id="modal-title">${esc(title)}</h2><button class="icon-button" aria-label="Fechar painel" data-close-modal>×</button></div>${contents}</section></div>`;
  const card = root.querySelector(".modal-card");
  card?.setAttribute("tabindex", "-1");
  root.querySelector(".icon-button[data-close-modal]")?.focus();
}

export function clearRegistrationValidation(form) {
  form.querySelectorAll('[aria-invalid="true"]').forEach((input) => input.removeAttribute("aria-invalid"));
  form.querySelectorAll(".field-error").forEach((message) => message.remove());
  const generalError = form.querySelector("#register-error");
  if (generalError) generalError.textContent = "";
}

export function scrollActiveChipIntoView(nav, isMobile) {
  if (!isMobile) return;
  nav?.querySelector(".mobile-chip.active")?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
}

export function trapFocusWithinModal(event, modalElement, activeElement) {
  if (event.key !== "Tab" || !modalElement) return;
  const focusable = [...modalElement.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.disabled && element.getAttribute("aria-hidden") !== "true" && !element.closest("[hidden], .hidden"));
  if (!focusable.length) {
    event.preventDefault();
    modalElement.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const current = activeElement ?? document.activeElement;
  if (event.shiftKey && (current === first || !modalElement.contains(current))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (current === last || !modalElement.contains(current))) {
    event.preventDefault();
    first.focus();
  }
}

export function closeModal(root, opener) {
  root?.replaceChildren();
  if (opener?.isConnected) opener.focus();
}

function dismissModal() {
  closeModal(document.querySelector("#modal-root"), modalReturnFocus);
  modalReturnFocus = null;
}

function recordDetailsMarkup(record) {
  return `<dl class="record-details">${Object.entries(record).filter(([key]) => !isSensitiveField(key)).map(([key, value]) => `<div><dt>${esc(labelFor(key))}</dt><dd>${valueText(value)}</dd></div>`).join("")}</dl>`;
}

export function serviceReferenceMarkup(record) {
  const rows = [
    ["Código", valueText(record.codigo)],
    ["Produto / serviço", valueText(record.nome)],
    ["Categoria", valueText(record.categoria)],
    ["Descrição", valueText(record.descricao)],
    ["Tarifa", record.valor === "" || record.valor == null ? "A consultar" : esc(formatarTarifaServico({ valor: Number(record.valor) }))],
    ["Unidade de cobrança", valueText(record.unidade)],
    ["Data e hora do valor", formatAuditDate(record.valorAtualizadoEm)],
  ];
  return `<section class="service-reference-content" aria-label="Descrição e dados da referência"><h3>Descrição e dados da referência ${esc(record.codigo)}</h3><dl class="record-details">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`).join("")}</dl></section>`;
}

export function serviceReferenceDescription(record) {
  const timestamp = record.valorAtualizadoEm ? new Date(record.valorAtualizadoEm) : null;
  const value = record.valor === "" || record.valor == null ? "A consultar" : formatarTarifaServico({ valor: Number(record.valor) });
  return [
    `Código: ${record.codigo || "Não informado"}`,
    `Produto / serviço: ${record.nome || "Não informado"}`,
    `Categoria: ${record.categoria || "Não informada"}`,
    `Descrição: ${record.descricao || "Não informada"}`,
    `Tarifa: ${value}`,
    `Unidade de cobrança: ${record.unidade || "Não informada"}`,
    `Data e hora do valor: ${timestamp && !Number.isNaN(timestamp.valueOf()) ? timestamp.toLocaleString("pt-BR") : record.valorAtualizadoEm || "Não informada"}`,
  ].join("\n");
}

function printRecord(record, title) {
  const popup = window.open("", "_blank", "width=800,height=700");
  if (!popup) return false;
  popup.opener = null;
  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:16px Arial,sans-serif;color:#15242b;padding:32px}h1{font-size:24px}dl{display:grid;grid-template-columns:180px 1fr;gap:10px}dt{font-weight:bold}dd{margin:0;white-space:pre-wrap}</style></head><body><h1>${esc(title)}</h1>${recordDetailsMarkup(record)}</body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}

async function handleResourceAction(action, slug, id, label = "") {
  const definition = resourceDefinitions[slug];
  const sectionHost = document.querySelector("#section-content");
  if (!definition || !sectionHost) return;
  if (slug === "usuario" && !isAdmin()) return;
  if (action === "delete" && !canDeleteOperational()) return;
  const records = cachedRecords.get(slug) || [];
  let record = records.find((item) => String(item.id) === String(id));
  if (action === "delete") {
    if (!window.confirm(`Excluir ${definition.singular}${label ? ` “${label}”` : ""}? Esta ação não pode ser desfeita.`)) return;
    try {
      await del(`${definition.endpoint}/${encodeURIComponent(id)}`);
      let warning = "";
      if (slug === "servico") {
        try { saveServiceValue(id, ""); }
        catch (error) { warning = `Serviço excluído, mas o valor local não foi removido: ${error.message}`; }
      }
      if (["conteiner", "operacao"].includes(slug)) {
        try { saveResourceDetails(slug, id, null); }
        catch (error) { warning = `Registro excluído, mas os detalhes locais não foram removidos: ${error.message}`; }
      }
      await reloadCurrentSection(warning ? "" : `${definition.singular[0].toUpperCase()}${definition.singular.slice(1)} excluído com sucesso.`);
      if (warning) showSectionError(warning);
    } catch (error) { showSectionError(error.message); }
    return;
  }
  try {
    if (action !== "print" || !record) record = await get(`${definition.endpoint}/${encodeURIComponent(id)}`);
    record = record?.data || record;
    if (slug === "servico" && action !== "edit" && action !== "edit-value") {
      const value = readServiceValues()[record.id];
      if (value) record = { ...record, valorLocal: formatarTarifaServico({ valor: value.valor }), valorLocalAtualizadoEm: value.atualizadoEm };
    }
    if (["conteiner", "operacao"].includes(slug) && action !== "edit") {
      const local = readResourceDetails()[`${slug}:${record.id ?? id}`];
      if (local) {
        record = { ...record, referenciaLocal: local.referencia, descricaoLocal: local.descricao };
        if (slug === "operacao") {
          const entry = findDatabaseEntry("operacao", "codigo", local.referencia);
          if (entry) {
            const fields = operationReferenceFields(entry, readDatabaseEntries("carga"), readDatabaseEntries("conteiner"));
            record = { ...record, ...fields };
          } else if (local.referencia) {
            record = { ...record, situacaoReferencia: "Referência local não encontrada." };
          }
          record = { ...record, embarqueBrasilia: formatLocalOperationTime(local.embarqueLocal), desembarqueBrasilia: formatLocalOperationTime(local.desembarqueLocal) };
        }
      }
    }
    if (action === "print") {
      if (!printRecord(record, `${sections.find((item) => item.slug === slug)?.name || definition.singular} ${record.id || id}`)) showSectionError("Permita a abertura da janela de impressão para continuar.");
    } else if (action === "edit" || (action === "edit-value" && slug === "servico")) {
      if (document.querySelector("#modal-root .modal-card")) dismissModal();
      await openResourceForm(slug, record, action === "edit-value");
    } else {
      const sectionTitle = sections.find((item) => item.slug === slug)?.name || definition.singular;
      modal(`${sectionTitle} · ${record.id ?? id}`, `<div class="detail-modal-content">${recordDetailsMarkup(record)}<div class="form-actions"><button class="button button-outline compact" type="button" data-resource-action="print" data-resource="${slug}" data-id="${esc(record.id ?? id)}">Imprimir ficha</button><button class="button button-primary compact" type="button" data-resource-action="edit" data-resource="${slug}" data-id="${esc(record.id ?? id)}">Editar</button></div></div>`);
    }
  } catch (error) { showSectionError(error.message); }
}

function formatLocalOperationTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/.exec(String(value || ""));
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}${match[5] ? `:${match[5]}` : ""} (Brasília)` : value || "";
}

async function handleBudgetAction(action, id) {
  const savedRecord = (cachedRecords.get("orcamento") || []).find((item) => String(item.id) === String(id));
  if (!savedRecord) {
    showSectionError("Atualize a lista antes de abrir este orçamento.");
    return;
  }
  const record = withBudgetMetadata(savedRecord);
  if (action === "print") {
    if (!printRecord({ ...record, valorEstimado: budgetReferenceValue(record) }, `Orçamento ${record.id}`)) showSectionError("Permita a abertura da janela de impressão para continuar.");
    return;
  }
  if (action === "edit") {
    const statuses = ["PENDENTE", "EM_ANALISE", "APROVADO", "RECUSADO"];
    const status = String(record.status || "PENDENTE").toUpperCase();
    const statusOptions = [...new Set([...statuses, status])].map((value) => `<option value="${esc(value)}" ${value === status ? "selected" : ""}>${esc(value.replaceAll("_", " "))}</option>`).join("");
    modal(`Editar orçamento ${record.id}`, `<form class="form-grid" data-form="budget-edit" data-budget-id="${esc(record.id)}"><label class="field-label">Status<select name="status" required>${statusOptions}</select></label><label class="field-label">Valor estimado (R$)<input name="valorEstimado" type="number" min="0" step="0.01" value="${esc(record.valorEstimado ?? "")}"></label><label class="field-label">Observações<textarea name="observacoes" rows="4">${esc(record.observacoes || "")}</textarea></label><label class="field-label">Descrição da referência (salva neste navegador)<textarea name="descricaoLocal" rows="5">${esc(record.descricaoLocal || "")}</textarea></label><p class="form-feedback" role="alert"></p><div class="form-actions"><button class="button button-primary compact">Salvar alterações</button></div></form>`);
    return;
  }
  modal(`Orçamento · ${record.id}`, `<div class="detail-modal-content">${recordDetailsMarkup({ ...record, valorEstimado: budgetReferenceValue(record) })}<div class="form-actions"><button class="button button-outline compact" type="button" data-budget-action="print" data-id="${esc(record.id)}">Imprimir ficha</button><button class="button button-primary compact" type="button" data-budget-action="edit" data-id="${esc(record.id)}">Editar</button></div></div>`);
}

function openDatabaseForm(categoryId, id = "", focus = "") {
  if (!isAdmin()) return;
  const slot = document.querySelector("#database-form-slot");
  if (!slot) return;
  try {
    const record = id ? readDatabaseEntries(categoryId).find((entry) => String(entry.id) === String(id)) : null;
    if (id && !record) throw new Error("O registro não foi encontrado. Atualize o Banco de dados e tente novamente.");
    slot.innerHTML = renderDatabaseEntryForm(categoryId, record);
    if (focus === "links") slot.querySelectorAll(".budget-link-options").forEach((options) => { options.parentElement.open = true; });
    slot.querySelector(focus === "value" ? '[name="valorEstimado"]' : focus === "links" ? "[data-budget-link]" : "input, select, textarea")?.focus();
  } catch (error) {
    slot.innerHTML = `<p class="inline-error" role="alert">${esc(error.message)}</p>`;
  }
}

function handleDatabaseAction(action, categoryId, id) {
  if (!isAdmin()) return;
  try {
    const record = readDatabaseEntries(categoryId).find((entry) => String(entry.id) === String(id));
    if (!record) throw new Error("O registro não foi encontrado. Atualize o Banco de dados e tente novamente.");
    if (action === "edit" || (action === "edit-value" && categoryId === "orcamento") || (action === "edit-links" && ["orcamento", "carga", "operacao", "solicitacao"].includes(categoryId))) {
      openDatabaseForm(categoryId, id, action === "edit-value" ? "value" : action === "edit-links" ? "links" : "");
    } else if (action === "view") {
      const details = categoryId === "servico" ? serviceReferenceMarkup(record) : categoryId === "orcamento" ? budgetReferenceSelectionMarkup(record, false) : recordDetailsMarkup(record);
      modal(`${getDatabaseCategory(categoryId).label} · ${record[getDatabaseCategory(categoryId).lookupField]}`, `<div class="detail-modal-content">${details}<div class="form-actions"><button class="button button-primary compact" data-database-action="edit" data-category="${categoryId}" data-id="${esc(id)}">Editar</button></div></div>`);
    } else if (action === "delete") {
      if (!isAdmin()) return;
      if (!window.confirm("Excluir este dado de referência? Os registros existentes não serão alterados.")) return;
      deleteDatabaseEntry(categoryId, id);
      void reloadCurrentSection("Dado de referência excluído.");
    }
  } catch (error) {
    showSectionError(error.message);
  }
}

function handleSolicitationAction(action, id) {
  if (!["view", "edit", "print"].includes(action)) return;
  const record = (cachedRecords.get("solicitacao") || []).find((item) => String(item.id) === String(id));
  if (!record) {
    showSectionError("Atualize a lista antes de abrir esta solicitação.");
    return;
  }
  try {
    const serviceName = record.servico?.nome || record.servico || "Serviço não informado";
    const states = readSolicitationStates();
    const defaults = findDatabaseEntry("solicitacao", "servico", serviceName) || {};
    const state = states[id] || {};
    const details = {
      ...record,
      servicoSolicitado: state.solicitado || defaults.solicitado || "Sim",
      servicoPrestado: state.prestado || defaults.prestado || "Não",
      descricaoLocal: state.descricaoLocal ?? solicitationDescription(record),
    };
    if (action === "print") {
      if (!printRecord(details, `Solicitação ${record.id}`)) showSectionError("Permita a abertura da janela de impressão para continuar.");
    } else if (action === "edit") {
      modal(`Editar solicitação ${record.id}`, `<form class="form-grid" data-form="solicitation-description" data-solicitation-id="${esc(record.id)}"><label class="field-label">Descrição da solicitação (salva neste navegador)<textarea name="descricaoLocal" rows="5">${esc(details.descricaoLocal)}</textarea><small>A edição não altera os dados da solicitação no servidor.</small></label><p class="form-feedback" role="alert"></p><button class="button button-primary compact">Salvar descrição</button></form>`);
    } else {
      modal(`Solicitação · ${record.id}`, `<div class="detail-modal-content">${recordDetailsMarkup(details)}<div class="form-actions"><button class="button button-outline compact" data-solicitation-action="print" data-id="${esc(record.id)}">Imprimir</button><button class="button button-primary compact" data-solicitation-action="edit" data-id="${esc(record.id)}">Editar descrição</button></div></div>`);
    }
  } catch (error) {
    showSectionError(error.message);
  }
}

export function solicitationDescription(record) {
  const service = record.servico && typeof record.servico === "object" ? record.servico : null;
  const cargo = record.carga && typeof record.carga === "object" ? record.carga : null;
  return [
    `Serviço: ${service?.nome || (typeof record.servico === "string" ? record.servico : "não informado")}`,
    `Categoria: ${service?.categoria || record.categoria || "não informada"}`,
    `Carga: ${cargo?.descricao || (typeof record.carga === "string" ? record.carga : "não informada")}`,
    ...(cargo?.tipoCarga ? [`Tipo de carga: ${cargo.tipoCarga}`] : []),
    ...(service?.descricao ? [`Descrição do serviço: ${service.descricao}`] : []),
  ].join("\n");
}

async function handleChargeAction(action, id) {
  let record = (cachedRecords.get("carga") || []).find((item) => String(item.id) === String(id));
  if (!record) {
    showSectionError("Atualize a lista antes de abrir esta carga.");
    return;
  }
  if (action === "edit") {
    showChargeForm(record);
  } else if (action === "print") {
    try {
      record = chargeWithReference(record);
      if (!printRecord(record, `Carga ${record.id}`)) showSectionError("Permita a abertura da janela de impressão para continuar.");
    } catch (error) { showSectionError(error.message); }
  } else if (action === "delete") {
    if (!canDeleteOperational()) return;
    if (!window.confirm(`Excluir a carga ${record.id}? Esta ação não pode ser desfeita.`)) return;
    try {
      await del(`/cargas/${encodeURIComponent(id)}`);
      let warning = "";
      try { saveResourceDetails("carga", id, null); }
      catch (error) { warning = `Carga excluída, mas a referência local não foi removida: ${error.message}`; }
      await reloadCurrentSection(warning ? "" : "Carga excluída com sucesso.");
      if (warning) showSectionError(warning);
    } catch (error) {
      showSectionError(error.message);
    }
  } else {
    try {
      record = chargeWithReference(record);
      modal(`Carga · ${record.id}`, `<div class="detail-modal-content">${recordDetailsMarkup(record)}<div class="form-actions"><button class="button button-outline compact" data-charge-action="print" data-id="${esc(record.id)}">Imprimir ficha</button><button class="button button-primary compact" data-charge-action="edit" data-id="${esc(record.id)}">Editar</button></div></div>`);
    } catch (error) { showSectionError(error.message); }
  }
}

function chargeWithReference(record) {
  const code = readResourceDetails()[`carga:${record.id}`]?.referencia;
  if (!code) return record;
  const cargo = findDatabaseEntry("carga", "codigo", code);
  if (!cargo) return { ...record, cargaReferencia: code, situacaoReferencia: "Referência local não encontrada." };
  return {
    ...record,
    cargaReferencia: cargo.codigo,
    conteineresCargaReferencia: linkedReferences(cargo.conteineres, readDatabaseEntries("conteiner"), "tipo"),
    servicosCargaReferencia: linkedReferences(cargo.servicos, readDatabaseEntries("servico"), "nome"),
  };
}

function cargoReferenceDescription(entry) {
  const serviceCodes = String(entry.servicos || "").split(",").map((code) => code.trim()).filter(Boolean);
  const services = readDatabaseEntries("servico");
  const serviceNames = serviceCodes.map((code) => {
    const service = services.find((item) => item.codigo.toUpperCase() === code.toUpperCase());
    return service ? `${service.nome} (${service.codigo})` : `${code} (não encontrado)`;
  });
  return [
    `Produto/carga: ${entry.tipoCarga}.`,
    entry.descricao ? `Descrição: ${entry.descricao}` : "Descrição adicional não informada.",
    `Serviços vinculados: ${serviceNames.length ? serviceNames.join(", ") : "não informados"}.`,
  ].join(" ");
}

function applyDatabaseTemplate(form, fieldName, lookupValue = null) {
  const categoryId = form.dataset.catalogEntity;
  const category = getDatabaseCategory(categoryId);
  if (!category) return;
  const lookupField = form.dataset.catalogLookup || category.lookupField;
  if (fieldName !== lookupField) return;
  const lookupInput = form.elements.namedItem(fieldName);
  const feedback = form.querySelector(".form-feedback");
  try {
    const entries = readDatabaseEntries(categoryId);
    const datalist = form.querySelector(`#catalog-suggestions-${categoryId}`);
    if (datalist) datalist.innerHTML = [...new Set(entries.map((entry) => entry[lookupField]).filter(Boolean))]
      .map((value) => `<option value="${esc(value)}"></option>`).join("");
    const selected = findDatabaseEntry(categoryId, lookupField, lookupValue ?? lookupInput?.value);
    if (!selected) {
      for (const field of category.fields) {
        if (field.name === lookupField) continue;
        const input = form.elements.namedItem(field.name);
        if (input?.dataset.catalogAutofilledValue != null) {
          if (input.value === input.dataset.catalogAutofilledValue) input.value = "";
          delete input.dataset.catalogAutofilledValue;
        }
      }
      return;
    }
    for (const field of category.fields) {
      if (field.name === lookupField) continue;
      const input = form.elements.namedItem(field.name);
      const value = field.name === "descricao" && categoryId === "servico" ? serviceReferenceDescription(selected)
        : field.name === "descricao" && categoryId === "carga" ? cargoReferenceDescription(selected) : selected[field.name];
      if (!input) continue;
      if (value == null || value === "") {
        if (input.dataset.catalogAutofilledValue != null && input.value === input.dataset.catalogAutofilledValue) input.value = "";
        delete input.dataset.catalogAutofilledValue;
        continue;
      }
      input.value = String(value);
      input.dataset.catalogAutofilledValue = String(value);
    }
    if (feedback) feedback.textContent = "";
  } catch (error) {
    if (feedback) feedback.textContent = error.message;
  }
}

function populateServiceCodeSuggestions(form) {
  try {
    const entries = readDatabaseEntries("servico");
    form.querySelector("#service-code-suggestions").innerHTML = entries.map((entry) => `<option value="${esc(entry.codigo)}">${esc(entry.nome)}</option>`).join("");
  } catch (error) {
    setFeedback(form, error.message);
  }
}

function updateServiceReferenceValueControls(form, entry) {
  const tariffInput = form.elements.namedItem("valorReferencia");
  const tariffButton = form.querySelector("[data-save-service-reference-value]");
  if (tariffInput && tariffButton) {
    tariffInput.disabled = !entry;
    tariffButton.disabled = !entry;
    tariffInput.value = entry?.valor ?? "";
  }
}

export function applyServiceCode(form) {
  const status = form.querySelector(".service-reference-status");
  const name = form.elements.namedItem("nome");
  const code = form.elements.namedItem("codigoReferencia").value;
  const entry = findDatabaseEntry("servico", "codigo", code);
  updateServiceReferenceValueControls(form, entry);
  if (!entry) {
    if (name.dataset.catalogAutofilledValue != null && name.value === name.dataset.catalogAutofilledValue) name.value = "";
    delete name.dataset.catalogAutofilledValue;
    applyDatabaseTemplate(form, "nome", "");
    status.textContent = code.trim() ? "Código não encontrado no Banco de dados deste navegador." : "";
    return;
  }
  name.value = entry.nome;
  name.dataset.catalogAutofilledValue = entry.nome;
  applyDatabaseTemplate(form, "nome", entry.nome);
  status.textContent = "";
}

export function updateLocalReferenceDescription(form, categoryId, entry) {
  const input = form.elements.namedItem("descricaoLocal");
  if (!input) return;
  const previous = input.dataset.referenceAutofilledValue;
  const canReplace = !input.value || (previous != null && input.value === previous);
  if (!entry) {
    if (previous != null && input.value === previous) input.value = "";
    delete input.dataset.referenceAutofilledValue;
    return;
  }
  if (!canReplace) return;
  const fields = getDatabaseCategory(categoryId).fields;
  input.value = [`ID: ${entry.codigo}`, ...fields.filter((field) => entry[field.name] !== "" && entry[field.name] != null).map((field) => `${field.label}: ${entry[field.name]}`)].join("\n");
  input.dataset.referenceAutofilledValue = input.value;
}

export function updateContainerReference(form, byCode = false) {
  const entries = readDatabaseEntries("conteiner");
  const codeInput = form.elements.namedItem("codigoReferencia");
  const typeInput = form.elements.namedItem("tipo");
  const details = form.querySelector("[data-container-reference]");
  form.querySelector("#container-code-suggestions").innerHTML = entries.map((entry) => `<option value="${esc(entry.codigo)}">${esc(entry.tipo)}</option>`).join("");
  form.querySelector("#catalog-suggestions-conteiner").innerHTML = entries.map((entry) => `<option value="${esc(entry.tipo)}"></option>`).join("");
  const entry = findDatabaseEntry("conteiner", byCode ? "codigo" : "tipo", byCode ? codeInput.value : typeInput.value);
  if (byCode) {
    if (entry) {
      typeInput.value = entry.tipo;
      typeInput.dataset.catalogAutofilledValue = entry.tipo;
      applyDatabaseTemplate(form, "tipo", entry.tipo);
    } else {
      if (typeInput.dataset.catalogAutofilledValue != null && typeInput.value === typeInput.dataset.catalogAutofilledValue) typeInput.value = "";
      delete typeInput.dataset.catalogAutofilledValue;
      applyDatabaseTemplate(form, "tipo", "");
    }
  } else {
    if (!codeInput.value || entry) codeInput.value = entry?.codigo || "";
    delete typeInput.dataset.catalogAutofilledValue;
  }
  updateLocalReferenceDescription(form, "conteiner", entry);
  if (!entry) {
    details.innerHTML = byCode && codeInput.value.trim() ? `<p class="muted small">ID não encontrado no Banco de dados deste navegador.</p>` : "";
    return;
  }
  details.innerHTML = `<p class="muted small">Confira e edite a descrição da referência no campo acima.</p>`;
}

function linkedReferences(codes, entries, field) {
  return String(codes || "").split(",").map((code) => code.trim()).filter(Boolean).map((code) => {
    const linked = entries.find((item) => item.codigo.toUpperCase() === code.toUpperCase());
    return linked ? `${linked.codigo} · ${linked[field]}` : `${code} · referência não encontrada`;
  }).join("\n");
}

export function operationReferenceFields(entry, cargos, containers) {
  const cargoCodes = String(entry?.cargas || "").split(",").map((code) => code.trim()).filter(Boolean);
  const cargoContainers = cargoCodes.map((code) => {
    const cargo = cargos.find((item) => item.codigo.toUpperCase() === code.toUpperCase());
    if (!cargo) return `${code} · carga não encontrada`;
    const linked = linkedReferences(cargo.conteineres, containers, "tipo");
    return `${cargo.codigo} · ${cargo.tipoCarga}: ${linked ? linked.replaceAll("\n", "; ") : "nenhum contêiner vinculado"}`;
  });
  return {
    categoriaReferencia: entry?.categoria || "",
    conteineresReferencia: linkedReferences(entry?.conteineres, containers, "tipo"),
    cargasReferencia: linkedReferences(entry?.cargas, cargos, "tipoCarga"),
    conteineresDasCargasReferencia: cargoContainers.join("\n"),
    cargasPrincipaisReferencia: entry?.cargasPrincipais || "",
    bercosReferencia: entry?.bercos || "",
    produtividadeReferencia: entry?.produtividade || "",
  };
}

export function updateOperationReference(form) {
  const entries = readDatabaseEntries("operacao");
  const input = form.elements.namedItem("codigoOperacao");
  const details = form.querySelector("[data-operation-reference]");
  const cargos = readDatabaseEntries("carga");
  const containers = readDatabaseEntries("conteiner");
  form.querySelector("#operation-code-suggestions").innerHTML = [
    ...entries.map((entry) => `<option value="${esc(entry.codigo)}">${esc(entry.categoria)}</option>`),
    ...cargos.map((entry) => `<option value="${esc(entry.codigo)}">${esc(entry.tipoCarga)}</option>`),
    ...containers.map((entry) => `<option value="${esc(entry.codigo)}">${esc(entry.tipo)}</option>`),
  ].join("");
  const entry = findDatabaseEntry("operacao", "codigo", input.value);
  updateLocalReferenceDescription(form, "operacao", entry);
  for (const [name, value] of Object.entries(operationReferenceFields(entry, cargos, containers))) {
    const field = form.elements.namedItem(name);
    if (field) field.value = value;
  }
  for (const name of ["andamento", "responsavel", "observacoes"]) {
    const field = form.elements.namedItem(name);
    if (field.dataset.operationAutofilledValue != null && field.value === field.dataset.operationAutofilledValue) field.value = "";
    delete field.dataset.operationAutofilledValue;
    if (entry?.[name] && !field.value) {
      field.value = String(entry[name]);
      field.dataset.operationAutofilledValue = field.value;
    }
  }
  form.dataset.operationSearchValue = input.value;
  if (!entry) {
    const search = input.value.trim().toUpperCase();
    const linked = [...cargos, ...containers].find((item) => item.codigo.toUpperCase() === search);
    const matches = linked ? entries.filter((item) => ["cargas", "conteineres"].some((key) => String(item[key] || "").split(",").some((code) => code.trim().toUpperCase() === search))) : [];
    const suggestions = search ? entries.filter((item) => item.codigo.toUpperCase().includes(search)) : [];
    details.innerHTML = !search ? "" : linked
      ? `<p class="muted small">Operações vinculadas a ${esc(search)}:</p>${matches.length ? matches.map((item) => `<button type="button" class="small-action" data-select-operation="${esc(item.codigo)}">${esc(item.codigo)} · ${esc(item.categoria)}</button>`).join(" ") : `<p class="muted small">Nenhuma operação vinculada a este ID.</p>`}`
      : suggestions.length
        ? `<p class="muted small">Selecione uma operação:</p>${suggestions.map((item) => `<button type="button" class="small-action" data-select-operation="${esc(item.codigo)}">${esc(item.codigo)} · ${esc(item.categoria)}</button>`).join(" ")}`
      : `<p class="muted small">ID não encontrado no Banco de dados deste navegador.</p>`;
    return;
  }
  const missing = [];
  if (!String(entry.cargas || "").trim()) missing.push("cargas");
  if (!String(entry.conteineres || "").trim()) missing.push("contêineres");
  details.innerHTML = missing.length ? `<p class="muted small">Sem IDs de ${esc(missing.join(" e "))} vinculados a esta referência. O administrador pode cadastrá-los no Banco de dados.</p>` : "";
}

function showSectionError(message) {
  const host = document.querySelector("#section-content");
  if (host) host.insertAdjacentHTML("afterbegin", `<p class="inline-error" role="alert">${esc(message)}</p>`);
}

function coerceResourceForm(form, slug) {
  const data = new FormData(form);
  const definition = resourceDefinitions[slug];
  const result = {};
  for (const fieldDefinition of definition.fields) {
    let value = data.get(fieldDefinition.name);
    if (value == null || value === "") {
      if (fieldDefinition.type === "password" && form.dataset.resourceId) continue;
      if (fieldDefinition.required) result[fieldDefinition.name] = "";
      continue;
    }
    if (fieldDefinition.type === "number" || fieldDefinition.type === "account") value = Number(value);
    if (fieldDefinition.type === "select" && ["true", "false"].includes(value)) value = value === "true";
    result[fieldDefinition.name] = typeof value === "string" ? value.trim() : value;
  }
  if (slug === "agendamento" && result.confirmado === undefined) result.confirmado = true;
  return result;
}

async function saveResource(form) {
  const slug = form.dataset.resource;
  const definition = resourceDefinitions[slug];
  const id = form.dataset.resourceId;
  if (slug === "servico" && form.elements.namedItem("codigoReferencia").value.trim()
    && !findDatabaseEntry("servico", "codigo", form.elements.namedItem("codigoReferencia").value)) {
    throw new Error("Código de referência não encontrado. Corrija ou limpe o código para continuar.");
  }
  if (slug === "conteiner" && form.elements.namedItem("codigoReferencia").value.trim()
    && !findDatabaseEntry("conteiner", "codigo", form.elements.namedItem("codigoReferencia").value)) {
    throw new Error("ID de contêiner não encontrado. Corrija ou limpe o ID para continuar.");
  }
  if (slug === "operacao" && form.elements.namedItem("codigoOperacao").value.trim()
    && !findDatabaseEntry("operacao", "codigo", form.elements.namedItem("codigoOperacao").value)) {
    throw new Error("Selecione uma operação vinculada, informe um ID de operação válido ou limpe a busca para continuar.");
  }
  const payload = coerceResourceForm(form, slug);
  const localValue = slug === "servico" ? form.elements.namedItem("valorLocal").value : "";
  if (slug === "servico" && localValue !== "" && (!Number.isFinite(Number(localValue)) || Number(localValue) < 0)) throw new Error("Informe um valor de serviço válido.");
  const updatingOwnAccount = slug === "usuario" && id && String(id) === String(currentUser?.id);
  let response;
  if (slug === "agendamento") {
    if (id) await updateManagedAppointment(id, payload);
    else await createManagedAppointment(payload);
  } else if (id) {
    if (definition.updateMode === "andamento") {
      await putParams(`${definition.endpoint}/${encodeURIComponent(id)}/andamento`, { andamento: payload.andamento, observacoes: payload.observacoes });
    } else {
      response = await put(`${definition.endpoint}/${encodeURIComponent(id)}`, payload);
    }
  } else if (definition.createMode === "params") {
    response = await postParams(definition.endpoint, payload);
  } else {
    await post(definition.endpoint, payload);
  }
  if (updatingOwnAccount && payload.senha) {
    clearAccessToken();
    currentUser = null;
    authNotice = "Dados atualizados. Entre novamente com as novas credenciais.";
    navigateTo("/dashboard/acesso-admin", { replace: true });
    return;
  }
  if (updatingOwnAccount) currentUser = { ...currentUser, nome: payload.nome, email: payload.email, cargo: payload.cargo };
  let warning = "";
  if (slug === "servico") {
    const savedId = id || response?.id || response?.data?.id;
    if (savedId != null && (id || localValue !== "")) {
      try { saveServiceValue(savedId, localValue); }
      catch (error) { warning = `Serviço salvo, mas o valor local não foi salvo: ${error.message}`; }
    } else if (localValue !== "") warning = "Serviço criado, mas o servidor não retornou o ID necessário para salvar o valor local.";
  }
  if (["conteiner", "operacao"].includes(slug)) {
    const savedId = id || response?.id || response?.data?.id;
    const descricao = form.elements.namedItem("descricaoLocal").value;
    const referencia = form.elements.namedItem(slug === "conteiner" ? "codigoReferencia" : "codigoOperacao").value.trim();
    const operationTimes = slug === "operacao" ? {
      embarqueLocal: form.elements.namedItem("embarqueLocal").value,
      desembarqueLocal: form.elements.namedItem("desembarqueLocal").value,
    } : {};
    if (savedId != null) {
      try { saveResourceDetails(slug, savedId, { descricao, referencia, ...operationTimes }); }
      catch (error) { warning = `Registro salvo, mas os detalhes locais não foram salvos: ${error.message}`; }
    } else if (descricao || referencia || Object.values(operationTimes).some(Boolean)) warning = "Registro criado, mas o servidor não retornou o ID necessário para salvar os detalhes neste navegador.";
  }
  const message = slug === "usuario"
    ? `Conta ${id ? "atualizada" : "criada"} com sucesso.`
    : `${sections.find((item) => item.slug === slug)?.name} ${id ? "atualizado" : "criado"} com sucesso.`;
  await reloadCurrentSection(warning ? "" : message);
  if (warning) showSectionError(warning);
}

function openService(service) {
  modal(service.title, `<p class="modal-lede">${esc(service.details)}</p><ul class="topic-list">${service.topics.map((topic) => `<li><span>✓</span>${esc(topic)}</li>`).join("")}</ul><button class="button button-primary" data-action="schedule">Agendar visita técnica <span>↗</span></button>`);
}

function openContact() {
  modal("Fale conosco", `<p class="modal-lede">Envie sua mensagem e nossa equipe responde no seu e-mail.</p><form class="form-grid" data-form="contact">${field("Nome", "nome", "text", "name")}${field("E-mail", "email", "email", "email")}<label class="field-label" for="contact-content">Mensagem<textarea id="contact-content" name="conteudo" rows="4" required></textarea></label><p class="form-feedback" role="status"></p><button class="button button-primary form-submit">Enviar mensagem <span>↗</span></button></form>`);
}

function openSchedule() {
  modal("Solicite uma visita técnica", `<p class="modal-lede">Informe seus dados e escolha a melhor data para nossa equipe entrar em contato.</p><form class="form-grid" data-form="schedule">${field("Nome completo", "nome", "text", "name")}${field("Telefone", "telefone", "tel", "tel")}${field("E-mail", "email", "email", "email")}<label class="field-label" for="visit-date">Data e horário desejados<input id="visit-date" name="dataHora" type="datetime-local" min="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}" required></label><label class="field-label hidden" id="visit-cpf-field" for="visit-cpf">CPF<input id="visit-cpf" name="cpf" inputmode="numeric" autocomplete="off"></label><label class="field-label hidden" id="visit-password-field" for="visit-password">Senha do seu cadastro<input id="visit-password" name="senha" type="password" autocomplete="current-password"></label><label class="consent"><input name="confirmacao" type="checkbox" required><span>Confirmo que os dados estão corretos e solicito o agendamento da visita técnica.</span></label><p class="form-feedback" role="alert"></p><button class="button button-primary form-submit">Solicitar visita <span>↗</span></button></form>`);
}

function showChargeForm(record = null) {
  const slot = document.querySelector("#charge-form-slot");
  if (!slot) return;
  slot.innerHTML = `<form class="inline-form" data-form="charge" data-catalog-entity="carga" data-catalog-lookup="tipoCarga" ${record ? `data-charge-id="${esc(record.id)}"` : ""}><div class="inline-form-title"><h3>${record ? "Editar carga" : "Nova carga"}</h3><button type="button" class="icon-button" aria-label="Fechar cadastro" data-close-form>×</button></div><label class="field-label">Buscar por ID da carga ou do contêiner<input name="buscaReferencia" list="cargo-reference-suggestions" autocomplete="off" placeholder="Ex.: CRG-000001 ou CTR-000001"></label><datalist id="cargo-reference-suggestions"></datalist><div data-cargo-reference aria-live="polite"></div><div class="inline-form-grid">${chargeFields.map(([name, title, type]) => `<label class="field-label">${title}${name === "descricao" ? `<textarea name="descricao" rows="4" maxlength="255" required>${esc(record?.descricao ?? "")}</textarea>` : `<input name="${name}" type="${type}" value="${esc(record?.[name] ?? "")}" ${name === "tipoCarga" ? 'data-catalog-lookup list="catalog-suggestions-carga"' : ""} ${type === "number" ? 'step="any"' : ""} required>`}</label>`).join("")}</div><datalist id="catalog-suggestions-carga"></datalist><p class="muted small">Selecione uma carga de referência para preencher os campos disponíveis. Todos podem ser editados; peso, volume, origem e destino devem corresponder à carga real. A descrição aceita até 255 caracteres.</p><p class="form-feedback" role="alert"></p><div class="form-actions"><button class="button button-primary compact">${record ? "Salvar alterações" : "Salvar carga"} <span>↗</span></button><button class="button button-outline compact" type="button" data-close-form>Cancelar</button></div></form>`;
  try {
    const form = slot.querySelector("form");
    form.querySelector("#catalog-suggestions-carga").insertAdjacentHTML("afterend", `<div class="inline-form-grid"><label class="field-label">ID de referência da carga<input name="cargaReferencia" readonly placeholder="Nenhuma referência selecionada"></label><label class="field-label">IDs e tipos dos contêineres vinculados<textarea name="conteineresCargaReferencia" rows="3" readonly placeholder="Nenhum vínculo cadastrado"></textarea></label><label class="field-label">IDs e nomes dos serviços vinculados<textarea name="servicosCargaReferencia" rows="3" readonly placeholder="Nenhum vínculo cadastrado"></textarea></label></div><p class="muted small">Estes vínculos são referências locais; confirme a adequação para a carga real.</p>`);
    const savedReference = record ? readResourceDetails()[`carga:${record.id}`]?.referencia : "";
    if (savedReference) {
      form.elements.namedItem("buscaReferencia").value = savedReference;
      form.dataset.cargoReference = savedReference;
    }
    updateCargoReference(form);
  } catch (error) {
    setFeedback(slot.querySelector("form"), error.message);
  }
  slot.querySelector(record ? "[name='tipoCarga']" : "input")?.focus();
}

function updateCargoLinkedFields(form, cargo, containers, services) {
  const fields = {
    cargaReferencia: cargo?.codigo || "",
    conteineresCargaReferencia: linkedReferences(cargo?.conteineres, containers, "tipo"),
    servicosCargaReferencia: linkedReferences(cargo?.servicos, services, "nome"),
  };
  for (const [name, value] of Object.entries(fields)) {
    const input = form.elements.namedItem(name);
    if (input) input.value = value;
  }
}

export function updateCargoReference(form) {
  const cargos = readDatabaseEntries("carga");
  const containers = readDatabaseEntries("conteiner");
  const search = form.elements.namedItem("buscaReferencia").value.trim().toUpperCase();
  const result = form.querySelector("[data-cargo-reference]");
  form.querySelector("#cargo-reference-suggestions").innerHTML = [
    ...cargos.map((entry) => `<option value="${esc(entry.codigo)}">${esc(entry.tipoCarga)}</option>`),
    ...containers.map((entry) => `<option value="${esc(entry.codigo)}">${esc(entry.tipo)}</option>`),
  ].join("");
  form.querySelector("#catalog-suggestions-carga").innerHTML = cargos.map((entry) => `<option value="${esc(entry.tipoCarga)}"></option>`).join("");
  const cargo = cargos.find((entry) => entry.codigo.toUpperCase() === search);
  updateCargoLinkedFields(form, cargo, containers, readDatabaseEntries("servico"));
  if (form.dataset.cargoReference && form.dataset.cargoReference !== cargo?.codigo) {
    for (const [name] of chargeFields) {
      const input = form.elements.namedItem(name);
      if (input.dataset.catalogAutofilledValue != null) {
        if (input.value === input.dataset.catalogAutofilledValue) input.value = "";
        delete input.dataset.catalogAutofilledValue;
      }
    }
    delete form.dataset.cargoReference;
  }
  if (!search) {
    result.innerHTML = "";
    return;
  }
  if (cargo && form.dataset.cargoReference !== cargo.codigo) {
    const typeInput = form.elements.namedItem("tipoCarga");
    typeInput.value = cargo.tipoCarga;
    typeInput.dataset.catalogAutofilledValue = cargo.tipoCarga;
    applyDatabaseTemplate(form, "tipoCarga", cargo.tipoCarga);
    form.dataset.cargoReference = cargo.codigo;
    if (form.elements.namedItem("descricao").value.length > 255) {
      setFeedback(form, "A descrição da referência ultrapassa 255 caracteres. Edite o texto antes de salvar.");
    }
  }
  const container = containers.find((entry) => entry.codigo.toUpperCase() === search);
  const matches = container ? cargos.filter((entry) => String(entry.conteineres || "").split(",").some((code) => code.trim().toUpperCase() === search)) : [];
  const buttons = matches.map((entry) => `<button type="button" class="small-action" data-select-cargo="${esc(entry.codigo)}">${esc(entry.codigo)} · ${esc(entry.tipoCarga)}</button>`).join(" ");
  result.innerHTML = cargo ? "" : container
    ? `<div class="notice-panel"><div><strong>Contêiner ${esc(container.codigo)} · ${esc(container.tipo)}</strong><p>Selecione uma das cargas vinculadas a este tipo de contêiner:</p>${buttons || "Nenhuma carga vinculada."}</div></div>`
    : `<p class="muted small">ID não encontrado no Banco de dados deste navegador.</p>`;
}

async function showBudgetForm() {
  const slot = document.querySelector("#budget-form-slot");
  if (!slot) return;
  slot.innerHTML = `<div class="load-error">Carregando clientes, cargas e serviços…</div>`;
  try {
    const [clients, loads, availableServices] = await Promise.all([get("/clientes"), get("/cargas"), get("/servicos")]);
    const options = (payload, title) => collectionFrom(payload).map((record) => `<option value="${esc(record.id)}">${esc(record.nome || record.descricao || `${title} ${record.id}`)}</option>`).join("");
    const serviceList = collectionFrom(availableServices);
    const categories = [...new Set(serviceList.map((service) => service.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const categoryOptions = categories.map((category) => `<option value="${esc(category)}">${esc(category)}</option>`).join("");
    slot.innerHTML = `<form class="inline-form" data-form="budget" data-catalog-entity="orcamento" data-catalog-lookup="servico"><div class="inline-form-title"><h3>Novo orçamento</h3><button type="button" class="icon-button" data-close-form aria-label="Fechar">×</button></div><p class="muted small">Selecione o cliente, a carga e um serviço cadastrado. A referência histórica é opcional e não substitui o serviço operacional.</p><div class="inline-form-grid">${selectField("Cliente", "clienteId", options(clients, "Cliente"))}${selectField("Carga", "cargaId", options(loads, "Carga"))}<label class="field-label">Categoria do serviço<select name="servicoCategoria"><option value="">Todas as categorias</option>${categoryOptions}</select></label><label class="field-label">Buscar serviço<input name="servicoBusca" type="search" autocomplete="off" placeholder="Digite o nome ou código do serviço" aria-controls="budget-service-results"></label></div><input name="servicoId" type="hidden"><input name="servico" type="hidden"><div class="budget-service-results" id="budget-service-results" aria-live="polite"></div><label class="field-label">Buscar referência por ID, nome ou ID vinculado<input name="buscaOrcamento" type="search" autocomplete="off" placeholder="ORC, SRV, CRG, CTR ou OPR" aria-controls="budget-reference-results"></label><div id="budget-reference-results" aria-live="polite"></div><label class="field-label">Valor estimado (R$)<input name="valorEstimado" type="number" min="0" step="0.01"></label><div id="budget-reference-confirmation"></div><p class="form-feedback" role="alert"></p><button class="button button-primary compact">Criar orçamento <span>↗</span></button></form>`;
    const form = slot.querySelector('form[data-form="budget"]');
    form.querySelector("#budget-reference-confirmation").insertAdjacentHTML("beforebegin", `<label class="field-label">Descrição da referência (salva neste navegador)<textarea name="descricaoLocal" rows="5"></textarea><small>Confira e edite os dados antes de salvar.</small></label>`);
    budgetServiceOptions.set(form, serviceList);
    renderBudgetServiceResults(form);
  } catch (error) {
    slot.innerHTML = `<div class="load-error" role="alert">${esc(error.message)}<br>Para criar um orçamento, cadastre antes um cliente, uma carga e um serviço.</div>`;
  }
}

export function budgetReferenceMatches(query, records = readDatabaseEntries("orcamento")) {
  const search = normalizeServiceSearch(query);
  if (!search) return [];
  return records.filter((entry) => normalizeServiceSearch([entry.codigo, entry.servico, entry.categoria, entry.servicos, entry.cargas, entry.conteineres, entry.operacoes].filter(Boolean).join(" ")).includes(search));
}

function renderBudgetReferenceResults(form) {
  const query = form.elements.buscaOrcamento.value;
  const result = form.querySelector("#budget-reference-results");
  if (!query.trim()) { result.innerHTML = ""; return; }
  const matches = budgetReferenceMatches(query);
  result.innerHTML = matches.length
    ? `<div class="budget-service-options">${matches.map((entry) => `<button type="button" class="budget-service-option" data-budget-reference="${esc(entry.codigo)}"><strong>${esc(entry.codigo)} · ${esc(entry.servico)}</strong><span>${esc(entry.categoria || "Sem categoria")}${entry.historico ? " · HISTÓRICO 2017" : ""}</span></button>`).join("")}</div>`
    : `<p class="muted small">Nenhuma referência encontrada.</p>`;
}

export function budgetReferenceSelectionMarkup(entry, allowSelection = true) {
  const fields = getDatabaseCategory("orcamento").fields;
  return `<div class="notice-panel"><div><strong>Referência ${esc(entry.codigo)}${entry.historico ? " · HISTÓRICA (2017)" : ""}</strong><dl class="record-details">${fields.map((field) => `<div><dt>${esc(field.label)}</dt><dd>${budgetDatabaseFieldText(field, entry)}</dd></div>`).join("")}</dl><p>Confira a tabela original, aplicabilidade, períodos, mínimos, adicionais e impostos. O valor informado é uma estimativa, não um cálculo automático.</p>${allowSelection ? budgetTariffSelectMarkup(entry.tarifas) : ""}</div></div>`;
}

export function validateBudgetReference(reference, confirmed, value) {
  if (!reference) throw new Error("A referência selecionada não existe mais. Selecione outra referência.");
  if (reference.historico && !confirmed) throw new Error("Confirme a consulta à referência histórica antes de usar o valor.");
  if (String(value ?? "").trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0) throw new Error("Informe um valor estimado válido para a referência selecionada.");
}

function renderBudgetServiceResults(form) {
  const resultSlot = form?.querySelector("#budget-service-results");
  if (!resultSlot) return;
  const services = budgetServiceOptions.get(form) || [];
  const serviceValues = readServiceValues();
  const category = form.elements.servicoCategoria.value;
  const query = normalizeServiceSearch(form.elements.servicoBusca.value);
  const matches = services.filter((service) => {
    const categoryMatches = !category || service.categoria === category;
    const reference = findDatabaseEntry("servico", "nome", service.nome);
    const searchMatches = !query || normalizeServiceSearch(`${service.nome} ${service.descricao} ${service.categoria} ${reference?.codigo || ""}`).includes(query);
    return categoryMatches && searchMatches;
  });
  if (!services.length) {
    resultSlot.innerHTML = `<p class="muted small">Nenhum serviço cadastrado. Cadastre serviços antes de criar um orçamento.</p>`;
    return;
  }
  if (!matches.length) {
    resultSlot.innerHTML = `<p class="muted small">Nenhum serviço encontrado para esta categoria e busca.</p>`;
    return;
  }
  resultSlot.innerHTML = `<div class="budget-service-options">${matches.slice(0, 20).map((service) => {
    const valor = formatarTarifaServico({ valor: serviceValues[service.id]?.valor ?? databaseBudgetDefaults(service.nome).valor });
    const reference = findDatabaseEntry("servico", "nome", service.nome);
    return `<button type="button" class="budget-service-option" data-budget-service="${esc(service.id)}"><strong>${esc(service.nome || `Serviço ${service.id}`)}</strong><span>${reference ? `${esc(reference.codigo)} · ` : ""}${esc(service.categoria || "Sem categoria")} · ${esc(valor)}</span><small>${esc(service.descricao || "")}</small></button>`;
  }).join("")}</div>`;
}

function clearBudgetServiceSelection(form) {
  form.elements.servicoId.value = "";
  form.elements.servico.value = "";
  form.elements.valorEstimado.value = "";
  delete form.dataset.selectedServiceName;
}

function databaseBudgetDefaults(serviceName) {
  const foundBudget = findDatabaseEntry("orcamento", "servico", serviceName);
  const budgetEntry = foundBudget?.historico ? null : foundBudget;
  const serviceEntry = findDatabaseEntry("servico", "nome", serviceName);
  const staticTariff = localizarTarifaServico(serviceName);
  const savedValue = (entry, field) => {
    if (entry?.[field] === "" || entry?.[field] == null) return null;
    const value = Number(entry[field]);
    return Number.isFinite(value) ? value : null;
  };
  return {
    ...(budgetEntry || {}),
    valor: budgetEntry
      ? savedValue(budgetEntry, "valorEstimado")
      : serviceEntry
        ? savedValue(serviceEntry, "valor")
        : staticTariff?.valor ?? null,
    categoria: budgetEntry?.categoria || serviceEntry?.categoria || staticTariff?.categoria || "",
  };
}

function normalizeServiceSearch(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function selectField(label, name, options) { return `<label class="field-label">${label}<select name="${name}" required><option value="">Selecione</option>${options}</select></label>`; }

function setFeedback(form, text, success = false) {
  const feedback = form.querySelector(".form-feedback");
  if (!feedback) return;
  feedback.textContent = text;
  feedback.classList.toggle("success", success);
}

async function handleSubmit(event) {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const fields = Object.fromEntries(data.entries());
  const button = form.querySelector('button[type="submit"], button:not([type])');
  if (button) { button.disabled = true; button.dataset.original = button.textContent; button.textContent = "Enviando…"; }
  try {
    switch (form.dataset.form) {
      case "admin-login": {
        const portal = form.dataset.loginPortal || "admin";
        const result = await postPublic("/admin/login", { email: fields.email.trim(), senha: fields.senha });
        const token = result?.accessToken || result?.data?.accessToken;
        if (!token) throw new Error("O servidor não retornou um token de acesso.");
        setAccessToken(token);
        const loginUser = normalizeAdminUser(result);
        const verifiedUser = normalizeAdminUser(await get("/admin/me"));
        currentUser = verifiedUser || loginUser;
        if (!["ADMIN", "SUPERVISOR", "FUNCIONARIO"].includes(userRole())) throw new Error("O perfil retornado não tem acesso ao painel.");
        const roleGate = enforcePortalRole(userRole(), portal);
        if (!roleGate.allowed) {
          renderLogin(portal, roleGate.message);
          break;
        }
        authNotice = "";
        navigateTo("/dashboard", { replace: true });
        break;
      }
      case "password-reset-request": {
        await postPublic("/auth/password-reset/request", { email: fields.email.trim() });
        setFeedback(form, "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.", true);
        form.reset();
        break;
      }
      case "password-reset-confirm": {
        if (fields.senha !== fields.confirmacao) throw new Error("As senhas não conferem.");
        await postPublic("/auth/password-reset/confirm", { token: form.dataset.resetToken, senha: fields.senha });
        form.innerHTML = `<p class="success-message" role="status">Senha atualizada com sucesso. <a href="/dashboard/acesso-admin">Voltar ao login</a></p>`;
        break;
      }
      case "admin-first-access": {
        await postWithHeaders("/admin/setup", {
          nome: fields.nome.trim(),
          email: fields.email.trim(),
          senha: fields.senha,
        }, { "X-Admin-Setup-Token": fields.setupToken }, { authenticated: false });
        form.innerHTML = `<p class="success-message" role="status">Administrador criado com sucesso. <a href="/dashboard/acesso-admin">Ir para o login</a></p>`;
        break;
      }
      case "register": await submitRegistration(form, fields); break;
      case "contact":
        await postPublic("/mensagens/contatos", fields);
        setFeedback(form, "Mensagem enviada. Em breve entraremos em contato.", true);
        form.reset();
        break;
      case "schedule": {
        const payload = { ...fields, confirmacao: form.elements.confirmacao.checked };
        try {
          await postPublic("/agendamentos", payload);
          form.innerHTML = `<p class="success-message" role="status">Solicitação enviada. Nossa equipe entrará em contato para confirmar a visita.</p>`;
        } catch (error) {
          if (error instanceof ApiError && error.code === "CADASTRO_NECESSARIO") {
            form.querySelector("#visit-cpf-field")?.classList.remove("hidden");
            form.querySelector("#visit-password-field")?.classList.remove("hidden");
            form.querySelector("#visit-cpf")?.setAttribute("required", "");
            form.querySelector("#visit-password")?.setAttribute("required", "");
            setFeedback(form, "Para confirmar a visita, informe seu CPF e crie uma senha de acesso. A conta será criada junto com a solicitação.");
          } else if (error instanceof ApiError && ["SENHA_NECESSARIA", "SENHA_INVALIDA"].includes(error.code)) {
            form.querySelector("#visit-password-field")?.classList.remove("hidden");
            form.querySelector("#visit-password")?.setAttribute("required", "");
            setFeedback(form, error.message);
          } else throw error;
        }
        break;
      }
      case "charge": {
        if (fields.buscaReferencia?.trim() && !findDatabaseEntry("carga", "codigo", fields.buscaReferencia)) throw new Error("Selecione uma carga válida ou limpe a busca para continuar.");
        if (String(fields.descricao).length > 255) throw new Error("A descrição da carga deve ter no máximo 255 caracteres. Edite o texto antes de salvar.");
        const numeric = Object.fromEntries(chargeFields.map(([name]) => [name, ["peso", "volume"].includes(name) ? Number(fields[name]) : fields[name]]));
        const id = form.dataset.chargeId;
        const response = id ? await put(`/cargas/${encodeURIComponent(id)}`, numeric) : await post("/cargas", numeric);
        const savedId = id || response?.id || response?.data?.id;
        const referencia = String(fields.buscaReferencia || "").trim();
        let warning = "";
        if (savedId != null) {
          try { saveResourceDetails("carga", savedId, referencia ? { referencia } : null); }
          catch (error) { warning = `Carga salva, mas a referência local não foi salva: ${error.message}`; }
        } else if (referencia) warning = "Carga criada, mas o servidor não retornou o ID necessário para salvar a referência neste navegador.";
        await reloadCurrentSection(warning ? "" : `Carga ${id ? "atualizada" : "cadastrada"} com sucesso.`);
        if (warning) showSectionError(warning);
        break;
      }
      case "database-entry": {
        if (!isAdmin()) throw new Error("Somente o administrador pode alterar o Banco de dados.");
        saveDatabaseEntry(form.dataset.databaseCategory, fields, form.dataset.databaseId || "");
        await reloadCurrentSection("Banco de dados atualizado com sucesso.");
        break;
      }
      case "shared-reference": {
        const payload = { tipo: fields.tipo, nome: fields.nome.trim(), categoria: fields.categoria.trim(), descricao: fields.descricao.trim(), valor: fields.valor === "" ? null : Number(fields.valor), versao: form.dataset.id ? Number(form.dataset.version) : null };
        if (form.dataset.id) await put(`/referencias-compartilhadas/${encodeURIComponent(form.dataset.id)}`, payload);
        else await post("/referencias-compartilhadas", payload);
        dismissModal();
        await reloadCurrentSection("Referência compartilhada salva.");
        break;
      }
      case "shared-request": {
        const numberOrNull = (value) => value ? Number(value) : null;
        const payload = {
          clienteId: numberOrNull(fields.clienteId), cargaOperacionalId: numberOrNull(fields.cargaOperacionalId),
          servicoOperacionalId: numberOrNull(fields.servicoOperacionalId), nomeServico: fields.nomeServico.trim(),
          categoria: fields.categoria, descricao: fields.descricao.trim(),
          servicoReferenciaId: numberOrNull(fields.servicoReferenciaId), cargaReferenciaId: numberOrNull(fields.cargaReferenciaId),
          conteinerReferenciaId: numberOrNull(fields.conteinerReferenciaId), operacaoReferenciaId: numberOrNull(fields.operacaoReferenciaId),
          orcamentoReferenciaId: numberOrNull(fields.orcamentoReferenciaId), valor: fields.valor === "" ? null : Number(fields.valor),
          prestadorId: numberOrNull(fields.prestadorId), statusSolicitacao: fields.statusSolicitacao,
          versao: form.dataset.id ? Number(form.dataset.version) : null,
        };
        if (form.dataset.id) await put(`/solicitacoes/compartilhadas/${encodeURIComponent(form.dataset.id)}`, payload);
        else await post("/solicitacoes/compartilhadas", payload);
        dismissModal();
        await reloadCurrentSection("Solicitação compartilhada salva.");
        break;
      }
      case "solicitation-description": {
        saveSolicitationState(form.dataset.solicitationId, { descricaoLocal: fields.descricaoLocal || "" });
        dismissModal();
        await reloadCurrentSection("Descrição salva neste navegador.");
        break;
      }
      case "budget": {
        if (!fields.servicoId) throw new Error("Selecione um serviço para criar o orçamento.");
        const reference = form.dataset.budgetReference ? findDatabaseEntry("orcamento", "codigo", form.dataset.budgetReference) : null;
        if (form.dataset.budgetReference) validateBudgetReference(reference, form.elements.confirmarHistorico?.checked, fields.valorEstimado);
        const created = await postParams("/orcamentos", {
          clienteId: fields.clienteId,
          cargaId: fields.cargaId,
          servicoId: fields.servicoId,
        });
        const createdId = created?.id ?? created?.data?.id;
        let warning = "";
        if (createdId != null) {
          try {
            saveBudgetMetadata(createdId, {
              criadoEm: new Date().toISOString(),
              valorEstimado: fields.valorEstimado !== "" ? Number(fields.valorEstimado) : null,
              descricaoLocal: fields.descricaoLocal || "",
              ...(reference ? { referencia: `${reference.codigo} · ${reference.servico}${reference.historico ? " · Referência histórica de 2017" : ""}${form.dataset.budgetTariffLabel ? ` · Tarifa selecionada: ${form.dataset.budgetTariffLabel}` : ""} · ${reference.regras || "Sem condições cadastradas"}` } : {}),
            });
          } catch (error) {
            warning = `Orçamento criado, mas os dados locais não puderam ser salvos: ${error.message}`;
          }
        } else warning = "Orçamento criado, mas o servidor não retornou o ID necessário para salvar o valor e a referência neste navegador.";
        await reloadCurrentSection(warning ? "" : "Orçamento criado com sucesso.");
        if (warning) showSectionError(warning);
        break;
      }
      case "budget-edit": {
        const valorEstimado = fields.valorEstimado ? Number(fields.valorEstimado) : undefined;
        await putParams(`/orcamentos/${encodeURIComponent(form.dataset.budgetId)}/analise`, {
          status: fields.status,
          valorEstimado,
          observacoes: fields.observacoes,
        });
        const budget = (cachedRecords.get("orcamento") || []).find((item) => String(item.id) === String(form.dataset.budgetId));
        let warning = "";
        if (budget) {
          try {
            saveBudgetMetadata(budget.id, {
              ...(valorEstimado === undefined ? {} : { valorEstimado }),
              descricaoLocal: fields.descricaoLocal || "",
              criadoEm: withBudgetMetadata(budget).criadoEm || new Date().toISOString(),
            });
          } catch (error) {
            warning = `Orçamento atualizado, mas os dados locais não puderam ser salvos: ${error.message}`;
          }
        }
        dismissModal();
        await reloadCurrentSection(warning ? "" : "Orçamento atualizado com sucesso.");
        if (warning) showSectionError(warning);
        break;
      }
      case "resource":
        await saveResource(form);
        break;
      case "reply":
        await put(`/mensagens/contatos/${form.dataset.messageId}/resposta`, { resposta: fields.resposta });
        await reloadCurrentSection("Resposta enviada com sucesso.");
        break;
    }
  } catch (error) {
    if (form.dataset.form === "admin-login") {
      setFeedback(form, error.message);
      if (form.dataset.form === "admin-login") { clearAccessToken(); currentUser = null; }
    } else if (form.dataset.form === "resource") {
      setFeedback(form, error.message);
    } else if (form.dataset.form === "register") {
      const message = document.querySelector("#register-error");
      if (message) message.textContent = error.message;
    } else {
      setFeedback(form, error.message);
    }
  } finally {
    if (button?.isConnected) { button.disabled = false; button.textContent = button.dataset.original || "Enviar"; }
  }
}

async function submitRegistration(form, fields) {
  clearRegistrationValidation(form);
  const errors = {};
  if (fields.nome.trim().length < 3) errors.nome = "Informe o nome completo.";
  if (!/^\S+@\S+\.\S+$/.test(fields.email)) errors.email = "E-mail inválido.";
  if (!/^\d{10,11}$/.test(fields.telefone.replace(/\D/g, ""))) errors.telefone = "Telefone deve ter DDD + número.";
  if (!/^\d{11}$/.test(fields.cpf.replace(/\D/g, ""))) errors.cpf = "CPF incompleto: informe os 11 dígitos.";
  if (fields.senha.length < 8 || !/[A-Za-z]/.test(fields.senha) || !/\d/.test(fields.senha)) errors.senha = "Use pelo menos 8 caracteres, com letras e números.";
  for (const [name, message] of Object.entries(errors)) {
    const input = form.elements.namedItem(name);
    input.setAttribute("aria-invalid", "true");
    let error = input.parentElement.querySelector(".field-error");
    if (!error) { error = document.createElement("span"); error.className = "field-error"; input.after(error); }
    error.textContent = message;
  }
  if (Object.keys(errors).length) return;
  await postPublic("/clientes", { ...fields, cpf: fields.cpf.replace(/\D/g, ""), telefone: fields.telefone.replace(/\D/g, "") });
  document.querySelector("#registration-content").innerHTML = `<div class="success-register"><p class="eyebrow">Cadastro confirmado</p><span class="success-check">✓</span><h1>Cadastro criado!</h1><p>Seu cadastro foi realizado com sucesso. Nossa equipe entrará em contato pelos dados informados.</p><a class="button button-primary" href="/">Voltar ao site</a></div>`;
}

async function reloadCurrentSection(message = "") {
  const slug = document.querySelector("#section-content")?.dataset.slug;
  const section = sections.find((item) => item.slug === slug);
  const category = document.querySelector("#database-category")?.value;
  if (section) await loadSection(section, category || "servico");
  if (message) {
    const host = document.querySelector("#section-content");
    if (host) host.insertAdjacentHTML("afterbegin", `<p class="inline-success" role="status">${esc(message)}</p>`);
  }
}

async function logoutAdmin() {
  try { await apiRequest("/admin/logout", { method: "POST" }); }
  catch { /* A sessão local será encerrada mesmo se o servidor já estiver indisponível. */ }
  clearAccessToken();
  currentUser = null;
  authNotice = "Você saiu da área administrativa.";
  navigateTo("/dashboard", { replace: true });
}

function navigateTo(path, { replace = false } = {}) {
  const url = new URL(path, window.location.href);
  const stateUrl = `${url.pathname}${url.search}${url.hash}`;
  if (replace) window.history.replaceState({}, "", stateUrl);
  else window.history.pushState({}, "", stateUrl);
  renderRoute();
  if (url.hash) window.requestAnimationFrame(() => document.querySelector(url.hash)?.scrollIntoView({ behavior: "smooth" }));
}

if (app) app.addEventListener("click", async (event) => {
  const sharedRequestAction = event.target.closest("[data-shared-request-action]");
  if (sharedRequestAction) {
    const action = sharedRequestAction.dataset.sharedRequestAction;
    const record = (cachedRecords.get("solicitacoes-compartilhadas") || []).find((item) => String(item.id) === sharedRequestAction.dataset.id);
    if (action === "new") {
      const form = document.querySelector('#shared-request-slot form[data-form="shared-request"]');
      if (form?.dataset.dirty && !window.confirm("Descartar alterações não salvas no formulário?")) return;
      if (document.querySelector("#modal-root .modal-card")) dismissModal();
      await openSharedRequest();
    }
    else if (!record) showSectionError("Solicitação não encontrada. Atualize o painel.");
    else await handleSharedRequestAction(action, record);
    return;
  }
  const sharedReferenceAction = event.target.closest("[data-shared-reference-action]");
  if (sharedReferenceAction) {
    if (!isAdmin()) return;
    const reference = sharedReferenceAction.dataset.sharedReferenceAction === "edit"
      ? (cachedRecords.get("referencias-compartilhadas") || []).find((item) => String(item.id) === sharedReferenceAction.dataset.id)
      : null;
    if (sharedReferenceAction.dataset.sharedReferenceAction === "edit" && !reference) showSectionError("Referência não encontrada. Atualize o painel.");
    else modal(reference ? `Editar referência ${reference.codigo}` : "Nova referência compartilhada", referenceForm(reference));
    return;
  }
  const saveReferenceValue = event.target.closest("[data-save-service-reference-value]");
  if (saveReferenceValue) {
    const form = saveReferenceValue.closest('form[data-resource="servico"]');
    try {
      if (!isAdmin()) throw new Error("Somente o administrador pode alterar a tarifa da referência.");
      const entry = findDatabaseEntry("servico", "codigo", form.elements.codigoReferencia.value);
      if (!entry) throw new Error("Selecione um código de referência válido.");
      const input = form.elements.valorReferencia;
      if (input.value !== "" && (!Number.isFinite(Number(input.value)) || Number(input.value) < 0)) throw new Error("Informe uma tarifa válida.");
      const description = form.elements.descricao;
      const wasAutofilled = description.dataset.catalogAutofilledValue != null && description.value === description.dataset.catalogAutofilledValue;
      saveDatabaseEntry("servico", { ...entry, valor: input.value }, entry.id);
      if (wasAutofilled) {
        const updated = findDatabaseEntry("servico", "codigo", entry.codigo);
        description.value = serviceReferenceDescription(updated);
        description.dataset.catalogAutofilledValue = description.value;
      }
      setFeedback(form, "Tarifa da referência salva neste navegador.", true);
    } catch (error) {
      setFeedback(form, error.message);
    }
    return;
  }
  const anchor = event.target.closest("a[href]");
  const routeDestination = anchor && spaNavigationPath(anchor.href, window.location.href, {
    defaultPrevented: event.defaultPrevented,
    button: event.button,
    metaKey: event.metaKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    target: anchor.target,
  });
  if (routeDestination) {
    event.preventDefault();
    navigateTo(routeDestination);
    return;
  }
  const databaseAction = event.target.closest("[data-database-action]");
  if (databaseAction) {
    if (["edit", "edit-value", "edit-links"].includes(databaseAction.dataset.databaseAction) && document.querySelector("#modal-root .modal-card")) dismissModal();
    handleDatabaseAction(databaseAction.dataset.databaseAction, databaseAction.dataset.category, databaseAction.dataset.id);
    return;
  }
  const operationSelection = event.target.closest("[data-select-operation]");
  if (operationSelection) {
    const form = operationSelection.closest('form[data-form="resource"]');
    try {
      form.elements.namedItem("codigoOperacao").value = operationSelection.dataset.selectOperation;
      updateOperationReference(form);
      setFeedback(form, "");
    } catch (error) {
      setFeedback(form, error.message);
    }
    return;
  }
  const cargoSelection = event.target.closest("[data-select-cargo]");
  if (cargoSelection) {
    const form = cargoSelection.closest('form[data-form="charge"]');
    try {
      const entry = findDatabaseEntry("carga", "codigo", cargoSelection.dataset.selectCargo);
      if (!entry) throw new Error("Referência de carga não encontrada. Atualize a página.");
      form.elements.namedItem("buscaReferencia").value = entry.codigo;
      updateCargoReference(form);
    } catch (error) {
      setFeedback(form, error.message);
    }
    return;
  }
  const chargeAction = event.target.closest("[data-charge-action]");
  if (chargeAction) {
    if (chargeAction.dataset.chargeAction === "edit" && document.querySelector("#modal-root .modal-card")) dismissModal();
    await handleChargeAction(chargeAction.dataset.chargeAction, chargeAction.dataset.id);
    return;
  }
  const solicitationAction = event.target.closest("[data-solicitation-action]");
  if (solicitationAction) {
    const shared = (cachedRecords.get("solicitacoes-compartilhadas") || []).find((item) => String(item.id) === solicitationAction.dataset.id);
    if (shared) await handleSharedRequestAction(solicitationAction.dataset.solicitationAction, shared);
    else handleSolicitationAction(solicitationAction.dataset.solicitationAction, solicitationAction.dataset.id);
    return;
  }
  const budgetService = event.target.closest("[data-budget-service]");
  if (budgetService) {
    const form = budgetService.closest('form[data-form="budget"]');
    const service = (form && budgetServiceOptions.get(form) || []).find((item) => String(item.id) === String(budgetService.dataset.budgetService));
    if (!form || !service) return;
    try {
      delete form.dataset.budgetReference;
      delete form.dataset.budgetTariffLabel;
      updateLocalReferenceDescription(form, "orcamento", null);
      form.querySelector("#budget-reference-confirmation").innerHTML = "";
      renderBudgetReferenceResults(form);
      form.elements.servicoId.value = service.id;
      form.elements.servico.value = service.nome || "";
      form.elements.servicoBusca.value = service.nome || "";
      const defaults = databaseBudgetDefaults(service.nome);
      const localValue = readServiceValues()[service.id]?.valor;
      form.elements.valorEstimado.value = localValue ?? defaults.valor ?? "";
      form.dataset.selectedServiceName = service.nome || "";
      const valor = formatarTarifaServico({ valor: localValue ?? defaults.valor });
      const reference = findDatabaseEntry("servico", "nome", service.nome);
      form.querySelector("#budget-service-results").innerHTML = `<p class="budget-service-selected" role="status">Serviço selecionado: <strong>${esc(service.nome)}</strong> · ${esc(defaults.categoria || service.categoria || "Sem categoria")} · ${esc(valor)}</p>${reference ? serviceReferenceMarkup(reference) : ""}`;
    } catch (error) {
      clearBudgetServiceSelection(form);
      setFeedback(form, error.message);
    }
    return;
  }
  const budgetReference = event.target.closest("[data-budget-reference]");
  if (budgetReference) {
    const form = budgetReference.closest('form[data-form="budget"]');
    try {
      const entry = findDatabaseEntry("orcamento", "codigo", budgetReference.dataset.budgetReference);
      if (!entry) throw new Error("Referência não encontrada. Atualize a busca.");
      updateLocalReferenceDescription(form, "orcamento", entry);
      form.dataset.budgetReference = entry.codigo;
      delete form.dataset.budgetTariffLabel;
      form.elements.valorEstimado.value = !entry.historico && entry.valorEstimado != null ? String(entry.valorEstimado) : "";
      form.querySelector("#budget-reference-results").innerHTML = budgetReferenceSelectionMarkup(entry);
      form.querySelector("#budget-reference-confirmation").innerHTML = entry.historico
        ? `<label class="field-label"><span><input type="checkbox" name="confirmarHistorico"> Confirmo que consultei a referência histórica de 2017 e validei o valor estimado e suas condições.</span></label>`
        : `<p class="muted small">Informe o valor estimado após conferir as condições da referência.</p>`;
      setFeedback(form, "");
    } catch (error) {
      setFeedback(form, error.message);
    }
    return;
  }
  const budgetAction = event.target.closest("[data-budget-action]");
  if (budgetAction) {
    await handleBudgetAction(budgetAction.dataset.budgetAction, budgetAction.dataset.id);
    return;
  }
  const target = event.target.closest("[data-action], [data-service], [data-close-modal], [data-close-form], [data-reload], [data-status-id], [data-toggle-password]");
  const resourceAction = event.target.closest("[data-resource-action]");
  if (resourceAction) {
    await handleResourceAction(resourceAction.dataset.resourceAction, resourceAction.dataset.resource, resourceAction.dataset.id, resourceAction.dataset.label);
    return;
  }
  if (!target) return;
  if (target.hasAttribute("data-toggle-password")) {
    const input = document.getElementById(target.dataset.togglePassword);
    if (!input) return;
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    target.textContent = visible ? "Mostrar" : "Ocultar";
    target.setAttribute("aria-label", `${visible ? "Mostrar" : "Ocultar"} senha`);
    target.setAttribute("aria-pressed", String(!visible));
    return;
  }
  if (target.hasAttribute("data-close-modal")) {
    if (target.classList.contains("modal-backdrop") && event.target.closest(".modal-card")) return;
    dismissModal();
    return;
  }
  if (target.hasAttribute("data-close-form")) { target.closest("form")?.remove(); return; }
  if (target.hasAttribute("data-reload")) { await reloadCurrentSection(); return; }
  if (target.dataset.action === "logout") { await logoutAdmin(); return; }
  if (target.dataset.action === "view-session") {
    await openSessionAudit(target.dataset.sessionId, target);
    return;
  }
  if (target.dataset.action === "backup") {
    const type = target.dataset.backupType;
    const endpoint = type === "completo" ? "/api/backup/admin/completo" : "/api/backup/operacional";
    const originalText = target.textContent;
    const feedback = document.querySelector(".backup-feedback");
    target.disabled = true;
    target.textContent = "Gerando…";
    try {
      const result = await post(endpoint);
      if (feedback) feedback.textContent = typeof result === "string"
        ? result
        : `Backup ${result?.backupCode || "gerado"} concluído com ${result?.totalRegistros ?? 0} registros.`;
      await reloadCurrentSection();
    } catch (error) {
      if (feedback) feedback.textContent = error.message;
    } finally {
      if (target.isConnected) {
        target.disabled = false;
        target.textContent = originalText;
      }
    }
    return;
  }
  if (target.dataset.action === "new-resource") {
    await openResourceForm(target.dataset.resource);
    return;
  }
  if (target.dataset.action === "new-database-entry") {
    openDatabaseForm(target.dataset.category);
    return;
  }
  if (target.dataset.action === "toggle-admin-setup") {
    try {
      await put("/admin/setup-status", { enabled: target.dataset.enabled !== "true" });
      await reloadCurrentSection();
      await refreshFirstAccessLink();
    } catch (error) {
      target.insertAdjacentHTML("afterend", `<span class="field-error">${esc(error.message)}</span>`);
    }
    return;
  }
  if (target.hasAttribute("data-status-id")) {
    const next = target.dataset.status;
    const slug = document.querySelector("#section-content")?.dataset.slug;
    const endpoint = slug === "solicitacao" ? "solicitacoes" : "agendamentos";
    try {
      if (slug === "agendamento") {
        const appointment = (cachedRecords.get(slug) || []).find((item) => String(item.id) === String(target.dataset.statusId));
        if (!appointment) throw new Error("Atualize a lista antes de alterar este agendamento.");
        await updateManagedAppointment(target.dataset.statusId, {
          usuarioId: Number(appointment.usuarioId),
          telefone: appointment.telefone,
          dataHora: appointment.dataHora,
          confirmado: next === "confirmado",
        });
      } else {
        await putParams(`/${endpoint}/${encodeURIComponent(target.dataset.statusId)}/status`, { status: next });
      }
      await reloadCurrentSection("Status atualizado.");
    }
    catch (error) { target.insertAdjacentHTML("afterend", `<span class="field-error">${esc(error.message)}</span>`); }
    return;
  }
  if (target.dataset.service) { const service = services.find((item) => item.number === target.dataset.service); if (service) openService(service); return; }
  if (target.dataset.action === "contact") openContact();
  if (target.dataset.action === "schedule") openSchedule();
  if (target.dataset.action === "new-charge") showChargeForm();
  if (target.dataset.action === "new-budget") void showBudgetForm();
});

if (app) app.addEventListener("submit", (event) => { void handleSubmit(event); });
if (app) app.addEventListener("input", (event) => {
  const sharedRequestFormElement = event.target.closest('form[data-form="shared-request"]');
  if (sharedRequestFormElement) sharedRequestFormElement.dataset.dirty = "true";
  if (event.target.matches("[data-shared-request-search]")) {
    const panel = event.target.closest("[data-shared-requests]");
    const search = normalizeServiceSearch(event.target.value);
    let visible = 0;
    panel.querySelectorAll("[data-shared-request-row]").forEach((row) => {
      row.hidden = Boolean(search) && !normalizeServiceSearch(row.textContent).includes(search);
      if (!row.hidden) visible++;
    });
    panel.querySelector("[data-shared-search-status]").textContent = search && !visible ? "Nenhuma solicitação encontrada." : "";
    return;
  }
  if (event.target.matches("[data-solicitation-search]")) {
    filterSolicitations(event.target.closest(".data-panel"), event.target.value);
    return;
  }
  if (event.target.matches("[data-solicitation-reference-search]")) {
    filterSolicitationReferences(event.target.closest("[data-solicitation-references]"), event.target.value);
    return;
  }
  const formWithCatalog = event.target.closest("form[data-catalog-entity]");
  const databaseForm = event.target.closest('form[data-form="database-entry"]');
  if (databaseForm?.dataset.databaseCategory === "orcamento" && event.target.name === "tarifas") {
    try {
      databaseForm.querySelector("[data-budget-tariff-slot]").innerHTML = budgetTariffSelectMarkup(event.target.value);
      setFeedback(databaseForm, "");
    } catch (error) {
      databaseForm.querySelector("[data-budget-tariff-slot]").innerHTML = "";
      setFeedback(databaseForm, error.message);
    }
    return;
  }
  if (databaseForm && ["servicos", "cargas", "conteineres", "operacoes", "orcamentos"].includes(event.target.name)) {
    const codes = String(event.target.value).split(",").map((code) => code.trim().toUpperCase());
    databaseForm.querySelectorAll(`[data-budget-link="${event.target.name}"]`).forEach((checkbox) => { checkbox.checked = codes.includes(checkbox.value.toUpperCase()); });
  }
  if (databaseForm && event.target.name === "valorEstimado") {
    const select = databaseForm.querySelector("[data-budget-tariff]");
    if (select) select.value = "";
  }
  if (formWithCatalog?.dataset.form === "budget" && event.target.name === "buscaOrcamento") {
    if (formWithCatalog.dataset.budgetReference) formWithCatalog.elements.valorEstimado.value = "";
    updateLocalReferenceDescription(formWithCatalog, "orcamento", null);
    delete formWithCatalog.dataset.budgetReference;
    delete formWithCatalog.dataset.budgetTariffLabel;
    formWithCatalog.querySelector("#budget-reference-confirmation").innerHTML = "";
    try {
      renderBudgetReferenceResults(formWithCatalog);
    } catch (error) {
      setFeedback(formWithCatalog, error.message);
    }
    return;
  }
  if (formWithCatalog?.dataset.resource === "operacao" && event.target.name === "codigoOperacao") {
    try {
      setFeedback(formWithCatalog, "");
      updateOperationReference(formWithCatalog);
    } catch (error) {
      setFeedback(formWithCatalog, error.message);
    }
    return;
  }
  if (formWithCatalog?.dataset.form === "charge" && event.target.name === "buscaReferencia") {
    try {
      setFeedback(formWithCatalog, "");
      updateCargoReference(formWithCatalog);
    } catch (error) {
      setFeedback(formWithCatalog, error.message);
    }
    return;
  }
  if (formWithCatalog?.dataset.resource === "conteiner" && ["codigoReferencia", "tipo"].includes(event.target.name)) {
    try {
      setFeedback(formWithCatalog, "");
      if (event.target.name === "tipo") applyDatabaseTemplate(formWithCatalog, "tipo");
      updateContainerReference(formWithCatalog, event.target.name === "codigoReferencia");
    } catch (error) {
      setFeedback(formWithCatalog, error.message);
    }
    return;
  }
  if (formWithCatalog?.dataset.resource === "servico" && event.target.name === "codigoReferencia") {
    try {
      setFeedback(formWithCatalog, "");
      applyServiceCode(formWithCatalog);
    } catch (error) {
      setFeedback(formWithCatalog, error.message);
    }
    return;
  }
  if (formWithCatalog?.dataset.resource === "servico" && event.target.name === "nome") {
    formWithCatalog.elements.namedItem("codigoReferencia").value = "";
    formWithCatalog.querySelector(".service-reference-status").textContent = "";
    const tariff = formWithCatalog.elements.namedItem("valorReferencia");
    const button = formWithCatalog.querySelector("[data-save-service-reference-value]");
    if (tariff && button) { tariff.value = ""; tariff.disabled = true; button.disabled = true; }
    delete event.target.dataset.catalogAutofilledValue;
  }
  if (formWithCatalog?.dataset.form === "charge" && event.target.name === "tipoCarga" && formWithCatalog.dataset.cargoReference) {
    delete formWithCatalog.dataset.cargoReference;
    formWithCatalog.elements.namedItem("buscaReferencia").value = "";
    formWithCatalog.querySelector("[data-cargo-reference]").innerHTML = "";
  }
  if (formWithCatalog && event.target.hasAttribute("data-catalog-lookup")) {
    applyDatabaseTemplate(formWithCatalog, event.target.name);
    if (formWithCatalog.dataset.form === "charge" && event.target.name === "tipoCarga") {
      try {
        const cargo = findDatabaseEntry("carga", "tipoCarga", event.target.value);
        formWithCatalog.elements.namedItem("buscaReferencia").value = cargo?.codigo || "";
        if (cargo) formWithCatalog.dataset.cargoReference = cargo.codigo;
        updateCargoLinkedFields(formWithCatalog, cargo, readDatabaseEntries("conteiner"), readDatabaseEntries("servico"));
      } catch (error) {
        setFeedback(formWithCatalog, error.message);
      }
    }
  }
  const form = event.target.closest('form[data-form="budget"]');
  if (form && event.target.name === "valorEstimado") {
    delete form.dataset.budgetTariffLabel;
    const select = form.querySelector("[data-budget-tariff]");
    if (select) select.value = "";
  }
  if (!form || event.target.name !== "servicoBusca") return;
  clearBudgetServiceSelection(form);
  try {
    renderBudgetServiceResults(form);
  } catch (error) {
    form.querySelector("#budget-service-results").innerHTML = `<p class="inline-error" role="alert">${esc(error.message)}</p>`;
  }
});
if (app) app.addEventListener("change", (event) => {
  const sharedRequestFormElement = event.target.closest('form[data-form="shared-request"]');
  if (sharedRequestFormElement) sharedRequestFormElement.dataset.dirty = "true";
  if (event.target.matches("[data-shared-ref]")) {
    const form = event.target.closest('form[data-form="shared-request"]');
    const reference = (cachedRecords.get("referencias-compartilhadas") || []).find((item) => String(item.id) === event.target.value);
    form.querySelector(`[data-shared-ref-details="${event.target.name}"]`).value = reference ? sharedReferenceText(reference) : "";
    if (event.target.name === "orcamentoReferenciaId" && reference?.valor != null) form.elements.valor.value = reference.valor;
    return;
  }
  const operationForm = event.target.closest('form[data-resource="operacao"]');
  if (operationForm && event.target.name === "codigoOperacao") {
    if (operationForm.dataset.operationSearchValue === event.target.value) return;
    try {
      setFeedback(operationForm, "");
      updateOperationReference(operationForm);
    } catch (error) {
      setFeedback(operationForm, error.message);
    }
    return;
  }
  const databaseForm = event.target.closest('form[data-form="database-entry"]');
  if (databaseForm && event.target.dataset.budgetLink) {
    const input = databaseForm.elements.namedItem(event.target.dataset.budgetLink);
    const codes = String(input.value).split(",").map((code) => code.trim().toUpperCase()).filter(Boolean);
    const code = event.target.value.toUpperCase();
    input.value = event.target.checked ? [...new Set([...codes, code])].join(", ") : codes.filter((item) => item !== code).join(", ");
    return;
  }
  const budgetForm = event.target.closest('form[data-form="budget"]');
  if ((databaseForm || budgetForm) && event.target.matches("[data-budget-tariff]")) {
    const form = databaseForm || budgetForm;
    if (!event.target.value) return;
    if (budgetForm && form.dataset.budgetReference && form.elements.confirmarHistorico && !form.elements.confirmarHistorico.checked) {
      event.target.value = "";
      setFeedback(form, "Confirme a consulta à referência histórica antes de selecionar a tarifa.");
      return;
    }
    form.elements.valorEstimado.value = event.target.value;
    if (budgetForm) form.dataset.budgetTariffLabel = event.target.selectedOptions[0].textContent;
    setFeedback(form, "");
    return;
  }
  if (budgetForm && event.target.name === "confirmarHistorico") {
    try {
      const entry = findDatabaseEntry("orcamento", "codigo", budgetForm.dataset.budgetReference);
      if (!entry || !entry.historico) throw new Error("Referência histórica não encontrada. Selecione novamente.");
      if (event.target.checked && entry.valorEstimado !== "" && entry.valorEstimado != null && budgetForm.elements.valorEstimado.value === "") {
        budgetForm.elements.valorEstimado.value = String(entry.valorEstimado);
      }
    } catch (error) {
      event.target.checked = false;
      setFeedback(budgetForm, error.message);
    }
    return;
  }
  const databaseCategorySelect = event.target.closest("#database-category");
  if (databaseCategorySelect) {
    try {
      const host = document.querySelector("#section-content");
      if (host) host.innerHTML = renderDatabaseSection(databaseCategorySelect.value);
    } catch (error) {
      showSectionError(error.message);
    }
    return;
  }
  const solicitationField = event.target.closest("[data-solicitation-field]");
  if (solicitationField) {
    try {
      saveSolicitationState(solicitationField.dataset.id, { [solicitationField.dataset.solicitationField]: solicitationField.value });
      solicitationField.setAttribute("aria-label", `${solicitationField.dataset.solicitationField === "solicitado" ? "Serviço solicitado" : "Serviço prestado"}: ${solicitationField.value}`);
    } catch (error) {
      solicitationField.insertAdjacentHTML("afterend", `<span class="field-error" role="alert">${esc(error.message)}</span>`);
    }
    return;
  }
  const form = event.target.closest('form[data-form="budget"]');
  if (!form || event.target.name !== "servicoCategoria") return;
  clearBudgetServiceSelection(form);
  try {
    renderBudgetServiceResults(form);
  } catch (error) {
    form.querySelector("#budget-service-results").innerHTML = `<p class="inline-error" role="alert">${esc(error.message)}</p>`;
  }
});
globalThis.window?.addEventListener?.("storage", (event) => {
  if (!event.key?.startsWith("techocean.frontDatabase.") && !["techocean.frontSolicitations.v1", "techocean.frontBudgets.v1"].includes(event.key)) return;
  const slug = document.querySelector("#section-content")?.dataset.slug;
  if (!slug) return;
  if (event.key?.startsWith("techocean.frontDatabase.") && slug === "conteiner") {
    const referenceSection = document.querySelector("#container-reference-section");
    if (referenceSection) referenceSection.outerHTML = renderContainerReferenceSection();
    return;
  }
  if (event.key?.startsWith("techocean.frontDatabase.") && slug === "carga") {
    const referenceSection = document.querySelector("#cargo-reference-section");
    if (referenceSection) referenceSection.outerHTML = renderCargoReferenceSection();
    return;
  }
  if (event.key?.startsWith("techocean.frontDatabase.") && slug === "operacao") {
    const referenceSection = document.querySelector("#operation-reference-section");
    if (referenceSection) referenceSection.outerHTML = renderOperationReferenceSection();
    return;
  }
  if (event.key === "techocean.frontSolicitations.v1" && slug !== "solicitacao") return;
  if (event.key === "techocean.frontBudgets.v1" && slug !== "orcamento") return;
  if (event.key?.startsWith("techocean.frontDatabase.") && !["banco-dados", "orcamento", "solicitacao"].includes(slug)) return;
  const section = sections.find((item) => item.slug === slug);
  if (section) void loadSection(section);
});
if (app) app.addEventListener("keydown", (event) => {
  const activeModal = document.querySelector("#modal-root .modal-card");
  if (event.key === "Escape" && activeModal) dismissModal();
  else trapFocusWithinModal(event, activeModal);
});

globalThis.window?.addEventListener?.("popstate", () => renderRoute());

function renderRoute() {
  const path = routePath();
  if (brasiliaClock) updateClockVisibility(brasiliaClock.closest(".brasilia-clock"), path);
  if (path === "/") renderHome();
  else if (path === "/cadastro") renderCadastro();
  else if (path === "/primeiro-acesso-admin") renderAdminFirstAccess();
  else if (path === "/esqueci-senha") renderForgotPassword();
  else if (path === "/redefinir-senha") renderResetPassword();
  else if (path === "/dashboard/acesso-admin") renderPortalLogin("admin");
  else if (path === "/dashboard/acesso-equipe") renderPortalLogin("team");
  else if (path === "/admin/login") navigateTo("/dashboard/acesso-admin", { replace: true });
  else if (path === "/painel") navigateTo("/dashboard", { replace: true });
  else if (path === "/dashboard" || path === "/dashboard/index" || path.startsWith("/dashboard/")) {
    if (!getAccessToken()) {
      currentUser = null;
      if (path !== "/dashboard") navigateTo("/dashboard", { replace: true });
      else renderDashboardGateway();
    } else if (!currentUser) {
      app.innerHTML = `<main class="auth-page"><section class="auth-card"><p class="loading-state">Verificando sessão…</p></section></main>`;
      void get("/admin/me").then((payload) => {
        currentUser = normalizeAdminUser(payload);
        if (!currentUser) throw new Error("O perfil da sessão não foi retornado.");
        renderRoute();
      }).catch((error) => {
        clearAccessToken();
        currentUser = null;
        authNotice = error.message;
        renderDashboardGateway();
      });
    } else {
      renderDashboard(path === "/dashboard" || path === "/dashboard/index" ? "" : path.slice("/dashboard/".length));
    }
  }
  else renderNotFound();
}

if (app) renderRoute();
