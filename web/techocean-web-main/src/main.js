import { get, post, postParams, put, putParams, ApiError } from "./api.js";
import lashingImage from "./assets/lashing.jpg";
import "./vanilla.css";

const app = globalThis.document?.querySelector?.("#app") ?? null;
let modalReturnFocus = null;
const sections = [
  { slug: "carga", name: "Carga", description: "Cadastro e consulta de cargas.", endpoint: "/cargas", columns: ["id", "descricao", "peso", "volume", "tipoCarga", "origem", "destino"] },
  { slug: "cliente", name: "Cliente", description: "Clientes cadastrados.", endpoint: "/clientes", columns: ["id", "nome", "email", "telefone", "cpfcnpj"] },
  { slug: "conteiner", name: "Contêiner", description: "Contêineres em operação.", endpoint: "/conteineres", columns: ["id", "numeroConteiner", "tipo", "situacao"] },
  { slug: "mensagens", name: "Mensagens", description: "Mensagens recebidas pelo Fale conosco.", endpoint: "/mensagens/contatos" },
  { slug: "operacao", name: "Operação", description: "Operações em andamento.", endpoint: "/operacoes", columns: ["id", "solicitacao", "conteiner", "responsavel", "andamento", "observacoes"] },
  { slug: "orcamento", name: "Orçamento", description: "Orçamentos e solicitações comerciais.", endpoint: "/orcamentos", columns: ["id", "cliente", "carga", "servico", "valorEstimado", "status"] },
  { slug: "usuario", name: "Usuário", description: "Acesso administrativo de usuários.", endpoint: null, columns: ["nome", "email", "perfil"] },
  { slug: "servico", name: "Serviço", description: "Serviços oferecidos.", endpoint: "/servicos", columns: ["id", "nome", "descricao", "categoria", "disponivel"] },
  { slug: "solicitacao", name: "Solicitação", description: "Solicitações recebidas.", endpoint: "/solicitacoes", columns: ["id", "cliente", "carga", "servico", "status"] },
  { slug: "agendamento", name: "Agendamento", description: "Solicitações de visita técnica.", endpoint: "/agendamentos", columns: ["id", "nome", "email", "telefone", "dataHora", "status"] },
];

const services = [
  { number: "01", icon: "⌖", title: "Consultoria operacional", description: "Planejamento técnico para operações mais seguras, eficientes e previsíveis.", details: "Analisamos sua operação portuária para identificar riscos e oportunidades. Nossa equipe elabora planos sob medida, com cronogramas realistas e protocolos claros para cada etapa do embarque.", topics: ["Análise de riscos da operação e da carga", "Plano de embarque com cronograma e responsáveis", "Treinamento das equipes de cais e bordo", "Acompanhamento técnico durante a operação"] },
  { number: "02", icon: "⚓", title: "Amarração de cargas", description: "Projetos de amarração sob medida para cada tipo de carga e modal de transporte.", details: "Cada carga se comporta de um jeito em movimento. Calculamos forças, ângulos e pontos de fixação para projetar a amarração ideal para contêineres, cargas fracionadas, máquinas ou cargas especiais.", topics: ["Cálculo de tensão e resistência", "Projeto por tipo de carga e modal", "Seleção de materiais certificados", "Supervisão da amarração no embarque"] },
  { number: "03", icon: "◈", title: "Inspeção e conformidade", description: "Auditorias e laudos que garantem conformidade com normas internacionais.", details: "Realizamos auditorias completas e emitimos laudos técnicos para manter sua operação em conformidade com as normas de transporte, evitando avarias e atrasos.", topics: ["Inspeção antes da partida", "Laudos com registro fotográfico", "Auditoria de conformidade", "Plano de correção"] },
  { number: "04", icon: "▤", title: "Instalações portuárias", description: "Estruturas e sistemas de fixação instalados com precisão e rastreabilidade.", details: "Projetamos e instalamos estruturas de fixação em terminais e embarcações, com materiais rastreáveis e documentação completa, do projeto executivo à entrega.", topics: ["Projeto executivo de estruturas", "Instalação com equipe especializada", "Rastreabilidade de materiais", "Manutenção preventiva"] },
];

const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const routePath = () => window.location.pathname.replace(/\/+$/, "") || "/";
const valueText = (value) => {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return esc(value.nome || value.name || value.descricao || value.id || JSON.stringify(value));
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return esc(value);
};

function navLink(href, label, className = "") { return `<a class="${className}" href="${href}">${label}</a>`; }

function renderHome() {
  document.title = "Techocean — Amarração e Segurança de Cargas";
  app.innerHTML = `
    <main class="site-shell">
      <header class="hero">
        <div class="hero-shade"></div>
        <nav class="topbar wrap">
          ${navLink("/dashboard", "Techocean", "wordmark")}
          <div class="top-actions">${navLink("/cadastro", "♙ <span>Cadastre-se</span>", "button button-outline signup-link")}<button class="button button-outline" data-action="contact">Fale conosco</button></div>
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
      <section class="field-section wrap"><div class="field-copy"><p class="eyebrow">Na prática</p><h2>Cada detalhe verificado antes da partida.</h2><p>Do cálculo de tensão das cintas à conferência dos pontos de fixação, nosso time segue protocolos rigorosos em campo. É assim que mantemos zero incidentes de carga em toda a nossa história.</p><button class="button button-outline" data-action="schedule">Agende uma visita técnica <span>↗</span></button></div><figure class="field-image"><img src="${lashingImage}" alt="Trabalhador prendendo uma carga com cinta de segurança" loading="lazy"><figcaption>01 / Segurança em campo</figcaption></figure></section>
      <footer class="footer wrap"><a href="/dashboard" class="wordmark">Techocean</a><p>© 2026 Techocean. Precisão em cada amarração.</p><span>Operações seguras. Destinos certos.</span></footer>
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
  return `<label class="field-label" for="field-${name}">${label}<input id="field-${name}" name="${name}" type="${type}" autocomplete="${autocomplete}" ${attributes} required></label>`;
}

function dashboardNav(slug = "") {
  return `<aside class="sidebar"><a class="wordmark sidebar-brand" href="/">Techocean</a><span class="nav-caption">ESPAÇO DE GESTÃO</span><nav>${navLink("/dashboard", "▦&nbsp;&nbsp; Visão geral", `side-link ${slug === "" ? "active" : ""}`)}${sections.map((section) => navLink(`/dashboard/${section.slug}`, `<span class="nav-symbol">${section.name.slice(0, 1)}</span>${section.name}`, `side-link ${section.slug === slug ? "active" : ""}`)).join("")}</nav><div class="sidebar-bottom"><span class="status-dot"></span> Techocean · Operações</div></aside>
    <div class="mobile-dash-nav">${navLink("/dashboard", "Início", `mobile-chip ${slug === "" ? "active" : ""}`)}${sections.map((section) => navLink(`/dashboard/${section.slug}`, section.name, `mobile-chip ${section.slug === slug ? "active" : ""}`)).join("")}</div>`;
}

function renderDashboard(slug = "") {
  const section = sections.find((item) => item.slug === slug);
  if (slug && !section) { renderNotFound(); return; }
  document.title = `${section?.name || "Visão geral"} — Techocean`;
  app.innerHTML = `<main class="dashboard">${dashboardNav(slug)}<section class="dash-main"><div class="dash-topline"><a href="/" class="site-return">↖ <span>Voltar ao site</span></a><div class="dash-account"><span class="avatar">T</span><span>Área administrativa</span></div></div><div class="dash-content">${section ? `<p class="eyebrow">Painel / ${esc(section.name)}</p><h1>${esc(section.name)}</h1><p class="dash-description">${esc(section.description)}</p><div id="section-content" data-slug="${esc(slug)}"><p class="loading-state">Carregando informações…</p></div>` : `<p class="eyebrow">Espaço de gestão</p><h1>Visão geral</h1><p class="dash-description">Acesse as áreas da operação Techocean.</p><div class="dash-cards">${sections.map((item) => `<a href="/dashboard/${item.slug}" class="dash-card"><span class="dash-card-icon">${item.name.slice(0, 1)}</span><h2>${item.name}<span>↗</span></h2><p>${item.description}</p></a>`).join("")}</div>`}</div></section></main>`;
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

async function loadSection(section) {
  const host = document.querySelector("#section-content");
  if (!host) return;
  if (!section.endpoint) {
    host.innerHTML = `<div class="notice-panel"><span class="notice-mark">i</span><div><strong>Consulta ainda não disponível</strong><p>O servidor não oferece uma rota para listar usuários administrativos. Nenhum dado de exemplo é exibido aqui.</p></div></div>`;
    return;
  }
  try {
    const records = collectionFrom(await get(section.endpoint));
    if (!host.isConnected) return;
    if (section.slug === "carga") host.innerHTML = renderCargas(records);
    else if (section.slug === "mensagens") host.innerHTML = renderMessages(records);
    else if (section.slug === "orcamento") host.innerHTML = renderBudgets(records);
    else if (section.slug === "agendamento" || section.slug === "solicitacao") host.innerHTML = renderAppointments(records, section.slug);
    else host.innerHTML = renderTable(records, section.columns, section.name);
  } catch (error) {
    if (host.isConnected) host.innerHTML = `<div class="load-error" role="alert"><p>${esc(error.message)}</p><button class="button button-outline" data-reload>Atualizar</button></div>`;
  }
}

const chargeFields = [["descricao", "Descrição", "text"], ["peso", "Peso (t)", "number"], ["volume", "Volume (m³)", "number"], ["tipoCarga", "Tipo de carga", "text"], ["origem", "Origem", "text"], ["destino", "Destino", "text"]];

function renderCargas(records) {
  return `<section class="data-panel"><div class="panel-heading"><div><span class="eyebrow">OPERAÇÕES / REGISTROS</span><h2>Cargas cadastradas <span class="count-pill">${records.length}</span></h2></div><div class="panel-actions"><button class="button button-outline compact" data-reload>↻ <span>Atualizar</span></button><button class="button button-primary compact" data-action="new-charge">＋ Nova carga</button></div></div><div id="charge-form-slot"></div>${records.length ? renderTable(records, ["id", ...chargeFields.map(([name]) => name)], "cargas") : `<div class="empty-state"><span>▱</span><strong>Nenhuma carga cadastrada</strong><p>Cadastre uma carga para começar a acompanhar as especificações.</p></div>`}</section>`;
}

function renderTable(records, columns, title) {
  if (!records.length) return `<div class="empty-state"><span>▱</span><strong>Nenhum registro encontrado</strong><p>A lista de ${esc(title.toLowerCase())} ainda está vazia no servidor.</p></div>`;
  const available = columns?.filter((key) => key in records[0]) || [];
  const keys = (available.length ? available : Object.keys(records[0])).filter((key) => !["senha", "password"].includes(key.toLowerCase())).slice(0, 8);
  return `<div class="table-scroll"><table class="records-table"><thead><tr>${keys.map((key) => `<th>${esc(labelFor(key))}</th>`).join("")}${title === "Agendamento" || title === "Solicitação" ? "<th>Ação</th>" : ""}</tr></thead><tbody>${records.map((item) => `<tr>${keys.map((key) => `<td>${statusPill(key, item[key])}</td>`).join("")}${title === "Agendamento" || title === "Solicitação" ? `<td>${item.id ? `<button class="small-action" data-status-id="${esc(item.id)}" data-status="${String(item.status).toLowerCase() === "true" || String(item.status).toLowerCase() === "confirmado" ? "pendente" : "confirmado"}">${String(item.status).toLowerCase() === "true" || String(item.status).toLowerCase() === "confirmado" ? "Marcar pendente" : "Confirmar"}</button>` : "—"}</td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}

function labelFor(key) { return ({ id: "Código", cpfcnpj: "CPF / CNPJ", numeroConteiner: "Número do contêiner", tipoCarga: "Tipo de carga", dataHora: "Data e horário", criadoEm: "Recebida em", valorEstimado: "Valor estimado" })[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()); }

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
  if (!records.length) return `<div class="data-panel"><div class="panel-heading"><div><span class="eyebrow">GESTÃO</span><h2>${slug === "agendamento" ? "Visitas técnicas" : "Solicitações"} <span class="count-pill">0</span></h2></div><button class="button button-outline compact" data-reload>↻ Atualizar</button></div>${renderTable([], sections.find((item) => item.slug === slug).columns, slug)}</div>`;
  return `<div class="data-panel"><div class="panel-heading"><div><span class="eyebrow">GESTÃO</span><h2>${slug === "agendamento" ? "Visitas técnicas" : "Solicitações"} <span class="count-pill">${records.length}</span></h2></div><button class="button button-outline compact" data-reload>↻ Atualizar</button></div>${renderTable(records, sections.find((item) => item.slug === slug).columns, slug === "agendamento" ? "Agendamento" : "Solicitação")}</div>`;
}

function renderBudgets(records) {
  return `<div class="data-panel"><div class="panel-heading"><div><span class="eyebrow">COMERCIAL</span><h2>Orçamentos <span class="count-pill">${records.length}</span></h2></div><div class="panel-actions"><button class="button button-outline compact" data-reload>↻ Atualizar</button><button class="button button-primary compact" data-action="new-budget">＋ Novo orçamento</button></div></div><div id="budget-form-slot"></div>${renderTable(records, sections.find((item) => item.slug === "orcamento").columns, "Orçamento")}</div>`;
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

function openService(service) {
  modal(service.title, `<p class="modal-lede">${esc(service.details)}</p><ul class="topic-list">${service.topics.map((topic) => `<li><span>✓</span>${esc(topic)}</li>`).join("")}</ul><button class="button button-primary" data-action="schedule">Agendar visita técnica <span>↗</span></button>`);
}

function openContact() {
  modal("Fale conosco", `<p class="modal-lede">Envie sua mensagem e nossa equipe responde no seu e-mail.</p><form class="form-grid" data-form="contact">${field("Nome", "nome", "text", "name")}${field("E-mail", "email", "email", "email")}<label class="field-label" for="contact-content">Mensagem<textarea id="contact-content" name="conteudo" rows="4" required></textarea></label><p class="form-feedback" role="status"></p><button class="button button-primary form-submit">Enviar mensagem <span>↗</span></button></form>`);
}

function openSchedule() {
  modal("Solicite uma visita técnica", `<p class="modal-lede">Informe seus dados e escolha a melhor data para nossa equipe entrar em contato.</p><form class="form-grid" data-form="schedule">${field("Nome completo", "nome", "text", "name")}${field("Telefone", "telefone", "tel", "tel")}${field("E-mail", "email", "email", "email")}<label class="field-label" for="visit-date">Data e horário desejados<input id="visit-date" name="dataHora" type="datetime-local" min="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}" required></label><label class="field-label hidden" id="visit-cpf-field" for="visit-cpf">CPF<input id="visit-cpf" name="cpf" inputmode="numeric" autocomplete="off"></label><label class="field-label hidden" id="visit-password-field" for="visit-password">Senha do seu cadastro<input id="visit-password" name="senha" type="password" autocomplete="current-password"></label><label class="consent"><input name="confirmacao" type="checkbox" required><span>Confirmo que os dados estão corretos e solicito o agendamento da visita técnica.</span></label><p class="form-feedback" role="alert"></p><button class="button button-primary form-submit">Solicitar visita <span>↗</span></button></form>`);
}

function showChargeForm() {
  const slot = document.querySelector("#charge-form-slot");
  if (!slot) return;
  slot.innerHTML = `<form class="inline-form" data-form="charge"><div class="inline-form-title"><h3>Nova carga</h3><button type="button" class="icon-button" aria-label="Fechar cadastro" data-close-form>×</button></div><div class="inline-form-grid">${chargeFields.map(([name, title, type]) => `<label class="field-label">${title}<input name="${name}" type="${type}" ${type === "number" ? 'step="any"' : ""} required></label>`).join("")}</div><p class="form-feedback" role="alert"></p><div class="form-actions"><button class="button button-primary compact">Salvar carga <span>↗</span></button><button class="button button-outline compact" type="button" data-close-form>Cancelar</button></div></form>`;
  slot.querySelector("input")?.focus();
}

async function showBudgetForm() {
  const slot = document.querySelector("#budget-form-slot");
  if (!slot) return;
  slot.innerHTML = `<div class="load-error">Carregando clientes, cargas e serviços…</div>`;
  try {
    const [clients, loads, availableServices] = await Promise.all([get("/clientes"), get("/cargas"), get("/servicos")]);
    const options = (payload, title) => collectionFrom(payload).map((record) => `<option value="${esc(record.id)}">${esc(record.nome || record.descricao || `${title} ${record.id}`)}</option>`).join("");
    slot.innerHTML = `<form class="inline-form" data-form="budget"><div class="inline-form-title"><h3>Novo orçamento</h3><button type="button" class="icon-button" data-close-form aria-label="Fechar">×</button></div><p class="muted small">O servidor cria orçamentos a partir de um cliente, uma carga e um serviço cadastrados.</p><div class="inline-form-grid">${selectField("Cliente", "clienteId", options(clients, "Cliente"))}${selectField("Carga", "cargaId", options(loads, "Carga"))}${selectField("Serviço", "servicoId", options(availableServices, "Serviço"))}</div><p class="form-feedback" role="alert"></p><button class="button button-primary compact">Criar orçamento <span>↗</span></button></form>`;
  } catch (error) {
    slot.innerHTML = `<div class="load-error" role="alert">${esc(error.message)}<br>Para criar um orçamento, cadastre antes um cliente, uma carga e um serviço.</div>`;
  }
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
      case "register": await submitRegistration(form, fields); break;
      case "contact":
        await post("/mensagens/contatos", fields);
        setFeedback(form, "Mensagem enviada. Em breve entraremos em contato.", true);
        form.reset();
        break;
      case "schedule": {
        const payload = { ...fields, confirmacao: form.elements.confirmacao.checked };
        try {
          await post("/agendamentos", payload);
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
        const numeric = { ...fields, peso: Number(fields.peso), volume: Number(fields.volume) };
        await post("/cargas", numeric);
        await reloadCurrentSection("Carga cadastrada com sucesso.");
        break;
      }
      case "budget": {
        await postParams("/orcamentos", fields);
        await reloadCurrentSection("Orçamento criado com sucesso.");
        break;
      }
      case "reply":
        await put(`/mensagens/contatos/${form.dataset.messageId}/resposta`, { resposta: fields.resposta });
        await reloadCurrentSection("Resposta enviada com sucesso.");
        break;
    }
  } catch (error) {
    if (form.dataset.form === "register") {
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
  await post("/clientes", { ...fields, cpf: fields.cpf.replace(/\D/g, ""), telefone: fields.telefone.replace(/\D/g, "") });
  document.querySelector("#registration-content").innerHTML = `<div class="success-register"><p class="eyebrow">Cadastro confirmado</p><span class="success-check">✓</span><h1>Cadastro criado!</h1><p>Seu cadastro foi realizado com sucesso. Nossa equipe entrará em contato pelos dados informados.</p><a class="button button-primary" href="/">Voltar ao site</a></div>`;
}

async function reloadCurrentSection(message = "") {
  const slug = document.querySelector("#section-content")?.dataset.slug;
  const section = sections.find((item) => item.slug === slug);
  if (section) await loadSection(section);
  if (message) {
    const host = document.querySelector("#section-content");
    if (host) host.insertAdjacentHTML("afterbegin", `<p class="inline-success" role="status">${esc(message)}</p>`);
  }
}

if (app) app.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action], [data-service], [data-close-modal], [data-close-form], [data-reload], [data-status-id]");
  if (!target) return;
  if (target.hasAttribute("data-close-modal")) {
    if (target.classList.contains("modal-backdrop") && event.target.closest(".modal-card")) return;
    dismissModal();
    return;
  }
  if (target.hasAttribute("data-close-form")) { target.closest("form")?.remove(); return; }
  if (target.hasAttribute("data-reload")) { await reloadCurrentSection(); return; }
  if (target.hasAttribute("data-status-id")) {
    const next = target.dataset.status;
    const slug = document.querySelector("#section-content")?.dataset.slug;
    const endpoint = slug === "solicitacao" ? "solicitacoes" : "agendamentos";
    try { await putParams(`/${endpoint}/${encodeURIComponent(target.dataset.statusId)}/status`, { status: next }); await reloadCurrentSection("Status atualizado."); }
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
if (app) app.addEventListener("keydown", (event) => {
  const activeModal = document.querySelector("#modal-root .modal-card");
  if (event.key === "Escape" && activeModal) dismissModal();
  else trapFocusWithinModal(event, activeModal);
});

globalThis.window?.addEventListener?.("popstate", () => renderRoute());

function renderRoute() {
  const path = routePath();
  if (path === "/") renderHome();
  else if (path === "/cadastro") renderCadastro();
  else if (path === "/dashboard" || path === "/dashboard/index") renderDashboard();
  else if (path.startsWith("/dashboard/")) renderDashboard(path.slice("/dashboard/".length));
  else renderNotFound();
}

if (app) renderRoute();
