import { describe, expect, it, vi } from "vitest";
import {
  clearRegistrationValidation,
  closeModal,
  enforcePortalRole,
  loginScreenMarkup,
  renderAppointmentAccountsEmpty,
  renderMessages,
  renderCrudSection,
  renderResourceFormMarkup,
  renderResourceTable,
  renderBudgets,
  renderSolicitacoes,
  renderDatabaseSection,
  renderContainerReferenceSection,
  renderOperationReferenceSection,
  updateOperationReference,
  renderCargoReferenceSection,
  updateCargoReference,
  updateContainerReference,
  serviceReferenceMarkup,
  applyServiceCode,
  dashboardGatewayMarkup,
  roleCapabilities,
  panelRoleAllowed,
  publicFooterMarkup,
  publicHeaderBrandMarkup,
  publicHomeActionsMarkup,
  scrollActiveChipIntoView,
  spaNavigationPath,
  trapFocusWithinModal,
  visibleSectionSlugs,
} from "../src/main.js";

describe("DOM interface helpers", () => {
  it("keeps the refresh action visible when the inbox has messages", () => {
    const markup = renderMessages([{ id: 2, nome: "Ana Souza", email: "ana@example.com", conteudo: "Olá" }]);

    expect(markup).toContain("Caixa de entrada");
    expect(markup).toContain('data-reload');
    expect(markup).toContain("Ana Souza");
  });

  it("clears old validation messages and aria-invalid before a new registration attempt", () => {
    const invalidInput = { removeAttribute: vi.fn() };
    const fieldMessage = { remove: vi.fn() };
    const generalMessage = { textContent: "CPF já cadastrado." };
    const form = {
      querySelectorAll: vi.fn((selector) => selector.includes("aria-invalid") ? [invalidInput] : [fieldMessage]),
      querySelector: vi.fn(() => generalMessage),
    };

    clearRegistrationValidation(form);

    expect(invalidInput.removeAttribute).toHaveBeenCalledWith("aria-invalid");
    expect(fieldMessage.remove).toHaveBeenCalledOnce();
    expect(generalMessage.textContent).toBe("");
  });

  it("scrolls the selected dashboard chip into view only on mobile", () => {
    const chip = { scrollIntoView: vi.fn() };
    const nav = { querySelector: vi.fn(() => chip) };

    scrollActiveChipIntoView(nav, false);
    expect(nav.querySelector).not.toHaveBeenCalled();
    scrollActiveChipIntoView(nav, true);
    expect(nav.querySelector).toHaveBeenCalledWith(".mobile-chip.active");
    expect(chip.scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest", behavior: "smooth" });
  });

  it("wraps Tab and Shift+Tab around modal focusable controls", () => {
    const makeFocusable = () => ({
      disabled: false,
      getAttribute: vi.fn(() => null),
      closest: vi.fn(() => null),
      focus: vi.fn(),
    });
    const first = makeFocusable();
    const middle = makeFocusable();
    const last = makeFocusable();
    const modal = {
      querySelectorAll: vi.fn(() => [first, middle, last]),
      contains: vi.fn(() => true),
      focus: vi.fn(),
    };
    const tabForward = { key: "Tab", shiftKey: false, preventDefault: vi.fn() };
    const tabBackward = { key: "Tab", shiftKey: true, preventDefault: vi.fn() };

    trapFocusWithinModal(tabForward, modal, last);
    trapFocusWithinModal(tabBackward, modal, first);

    expect(tabForward.preventDefault).toHaveBeenCalledOnce();
    expect(first.focus).toHaveBeenCalledOnce();
    expect(tabBackward.preventDefault).toHaveBeenCalledOnce();
    expect(last.focus).toHaveBeenCalledOnce();
  });

  it("does not intercept Tab while focus is between the modal boundaries", () => {
    const makeFocusable = () => ({ disabled: false, getAttribute: () => null, closest: () => null, focus: vi.fn() });
    const first = makeFocusable();
    const middle = makeFocusable();
    const last = makeFocusable();
    const modal = { querySelectorAll: () => [first, middle, last], contains: () => true };
    const event = { key: "Tab", shiftKey: false, preventDefault: vi.fn() };

    trapFocusWithinModal(event, modal, middle);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("restores focus to the connected control that opened the modal", () => {
    const root = { replaceChildren: vi.fn() };
    const opener = { isConnected: true, focus: vi.fn() };

    closeModal(root, opener);

    expect(root.replaceChildren).toHaveBeenCalledOnce();
    expect(opener.focus).toHaveBeenCalledOnce();
  });

  it("applies staff role permissions to operational deletion and admin-only sections", () => {
    expect(roleCapabilities("ADMIN")).toMatchObject({ canDeleteOperational: true, canManageStaff: true, canViewAudit: true, canViewSessions: true });
    expect(roleCapabilities("SUPERVISOR")).toMatchObject({ canCreateOperational: true, canUpdateOperational: true, canDeleteOperational: true, canManageStaff: false, canViewAudit: false });
    expect(roleCapabilities("FUNCIONARIO")).toMatchObject({ canReadOperational: true, canCreateOperational: true, canUpdateOperational: true, canDeleteOperational: false, canManageStaff: false });
    expect(visibleSectionSlugs("FUNCIONARIO")).not.toEqual(expect.arrayContaining(["usuario", "auditoria", "sessoes"]));
    expect(visibleSectionSlugs("ADMIN")).toEqual(expect.arrayContaining(["usuario", "auditoria", "sessoes"]));
  });

  it("uses history navigation for same-origin routes but leaves modified and in-page links alone", () => {
    expect(spaNavigationPath("/dashboard/carga", "https://techocean.example/")) .toBe("/dashboard/carga");
    expect(spaNavigationPath("/admin/login", "https://techocean.example/dashboard", { ctrlKey: true })).toBeNull();
    expect(spaNavigationPath("https://external.example/", "https://techocean.example/" )).toBeNull();
    expect(spaNavigationPath("/#servicos", "https://techocean.example/" )).toBeNull();
  });

  it("renders operational CRUD actions by role and escapes returned fields", () => {
    const record = { id: 4, numeroConteiner: '<img src=x onerror="alert(1)">', tipo: "40 HC", situacao: "Disponível" };
    const staffMarkup = renderResourceTable([record], "conteiner", "FUNCIONARIO");
    const supervisorMarkup = renderResourceTable([record], "conteiner", "SUPERVISOR");

    expect(staffMarkup).toContain('data-resource-action="view"');
    expect(staffMarkup).toContain('data-resource-action="edit"');
    expect(staffMarkup).not.toContain('data-resource-action="delete"');
    expect(supervisorMarkup).toContain('data-resource-action="delete"');
    expect(staffMarkup).not.toContain('<img src=x');
    expect(staffMarkup).toContain("&lt;img");
  });

  it("renders budget timestamps and view, print, and edit actions from saved data", () => {
    const markup = renderBudgets([{
      id: 12,
      cliente: { nome: "Cliente de teste" },
      carga: { descricao: "Carga de teste" },
      servico: { nome: "Serviço de teste" },
      status: "PENDENTE",
      valorEstimado: 125.5,
      criadoEm: "2026-11-10T14:30:00",
    }]);

    expect(markup).toContain("Cliente de teste");
    expect(markup).toContain("Carga de teste");
    expect(markup).toContain("Serviço de teste");
    expect(markup).toContain("Data e hora");
    expect(markup).toContain("10/11/2026");
    expect(markup).toContain('data-budget-action="view"');
    expect(markup).toContain('data-budget-action="edit"');
    expect(markup).toContain('data-budget-action="print"');
  });

  it("groups solicitations by the category of the service provided", () => {
    const markup = renderSolicitacoes([
      {
        id: 5,
        cliente: { nome: "Cliente A" },
        carga: { descricao: "Carga A" },
        servico: { nome: "Inspeção", categoria: "Inspeção e conformidade" },
        status: "PENDENTE",
      },
      {
        id: 6,
        cliente: { nome: "Cliente B" },
        carga: { descricao: "Carga B" },
        servico: { nome: "Amarração", categoria: "Amarração de cargas" },
        status: "CONFIRMADO",
      },
      {
        id: 7,
        cliente: { nome: "Cliente C" },
        carga: { descricao: "Carga C" },
        servico: { nome: "Acesso de veículo — automóvel" },
        status: "PENDENTE",
      },
    ]);

    expect(markup).toContain("Inspeção e conformidade");
    expect(markup).toContain("Amarração de cargas");
    expect(markup).toContain("Serviços diversos");
    expect(markup).toContain("Cliente A");
    expect(markup).toContain("Cliente B");
    expect(markup).toContain("Cliente C");
    expect(markup).toContain("Solicitações agrupadas pela categoria do serviço prestado.");
    expect(markup).toContain('data-solicitation-field="solicitado"');
    expect(markup).toContain('data-solicitation-field="prestado"');
    expect(markup).toContain('data-solicitation-action="view"');
  });

  it("shows service tariff data only in the admin database manager", () => {
    const markup = renderDatabaseSection("servico");

    expect(visibleSectionSlugs("ADMIN")).toContain("banco-dados");
    expect(visibleSectionSlugs("FUNCIONARIO")).not.toContain("banco-dados");
    expect(markup).toContain("Banco de dados");
    expect(markup).toContain("Tarifa de referência (R$)");
    expect(markup).toContain("Acesso de veículo — automóvel");
    expect(markup).toContain("34,68");
    expect(markup).toContain("SRV-000001");
    expect(markup).toContain("Data e hora do valor");
  });

  it("shows container references to the operational panel and in the admin database", () => {
    const section = { slug: "conteiner", name: "Contêiner", columns: ["id", "tipo"] };
    const markup = renderCrudSection([], section);
    const database = renderDatabaseSection("conteiner");
    for (const text of ["CTR-000001", "Dry Box 20&#39;", "33,2 m³", "28.200 kg", "Isotank 20&#39;", "21.000 a 26.000 L", "Uso principal"]) {
      expect(markup).toContain(text);
      expect(database).toContain(text);
    }
    expect(visibleSectionSlugs("FUNCIONARIO")).toContain("conteiner");
    expect(visibleSectionSlugs("FUNCIONARIO")).not.toContain("banco-dados");
    expect(renderContainerReferenceSection()).toContain("Confira as medidas");
  });

  it("shows cargo and container IDs in the database and team reference table", () => {
    const markup = renderCargoReferenceSection();
    const database = renderDatabaseSection("carga");
    for (const text of ["CRG-000002", "Caixas", "CTR-000001", "Gases", "CTR-000010"]) {
      expect(markup).toContain(text);
      expect(database).toContain(text);
    }
    expect(visibleSectionSlugs("FUNCIONARIO")).toContain("carga");
  });

  it("shows operation references in the team panel and the admin database", () => {
    const section = { slug: "operacao", name: "Operação", columns: ["id", "andamento"] };
    const markup = renderCrudSection([], section);
    const database = renderDatabaseSection("operacao");
    for (const text of ["OPR-000001", "Granéis Sólidos Vegetais", "350 t/hora", "490 t/hora", "140 t/hora", "OPR-000008", "Offshore"]) {
      expect(markup).toContain(text);
      expect(database).toContain(text);
    }
    expect(renderOperationReferenceSection()).toContain("tabela oficial");
    expect(visibleSectionSlugs("FUNCIONARIO")).toContain("operacao");
    expect(renderResourceFormMarkup("operacao")).toContain('name="codigoOperacao"');
  });

  it("looks up an operation by ID without replacing manually entered status", () => {
    const values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    });
    try {
      const inputs = Object.fromEntries(["codigoOperacao", "andamento", "responsavel", "observacoes"].map((key) => [key, { value: "", dataset: {} }]));
      inputs.codigoOperacao.value = "opr-000001";
      inputs.andamento.value = "Em andamento";
      const details = { innerHTML: "" };
      const suggestions = { innerHTML: "" };
      const form = {
        elements: { namedItem: (key) => inputs[key] },
        querySelector: (selector) => selector === "[data-operation-reference]" ? details : suggestions,
      };
      updateOperationReference(form);
      expect(details.innerHTML).toContain("Granéis Sólidos Vegetais");
      expect(details.innerHTML).toContain("350 t/hora");
      expect(inputs.andamento.value).toBe("Em andamento");
      inputs.codigoOperacao.value = "CTR-000010";
      updateOperationReference(form);
      expect(details.innerHTML).toContain('data-select-operation="OPR-000004"');
      expect(details.innerHTML).toContain("Granéis Líquidos");
      inputs.codigoOperacao.value = "CRG-000021";
      updateOperationReference(form);
      expect(details.innerHTML).toContain("Granéis Líquidos");
      inputs.codigoOperacao.value = "OPR-999999";
      updateOperationReference(form);
      expect(details.innerHTML).toContain("ID não encontrado");
      expect(details.innerHTML).not.toContain("350 t/hora");
      expect(inputs.andamento.value).toBe("Em andamento");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("searches cargo by its ID or lists all cargo linked to a container ID", () => {
    const values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    });
    try {
      const input = { value: "ctr-000001" };
      const result = { innerHTML: "" };
      const suggestions = { innerHTML: "" };
      const form = {
        elements: { namedItem: () => input },
        querySelector: (selector) => selector === "[data-cargo-reference]" ? result : suggestions,
      };
      updateCargoReference(form);
      expect(result.innerHTML).toContain("Caixas");
      expect(result.innerHTML).toContain("Paletes");
      expect(result.innerHTML).toContain('data-select-cargo="CRG-000002"');
      input.value = "CRG-000002";
      updateCargoReference(form);
      expect(result.innerHTML).toContain("CTR-000001");
      expect(result.innerHTML).toContain("Caixas");
      input.value = "CTR-999999";
      updateCargoReference(form);
      expect(result.innerHTML).toContain("ID não encontrado");
      expect(result.innerHTML).not.toContain("Caixas");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("looks up container specifications by ID and clears stale data on an unknown ID", () => {
    const values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    });
    try {
      const inputs = Object.fromEntries(["codigoReferencia", "tipo", "situacao"].map((key) => [key, { value: "", dataset: {} }]));
      const details = { innerHTML: "" };
      const suggestions = { innerHTML: "" };
      const form = {
        dataset: { catalogEntity: "conteiner", catalogLookup: "tipo" },
        elements: { namedItem: (key) => inputs[key] || null },
        querySelector: (selector) => selector === "[data-container-reference]" ? details : selector.includes("suggestions") ? suggestions : null,
      };
      inputs.codigoReferencia.value = "ctr-000010";
      updateContainerReference(form, true);
      expect(inputs.tipo.value).toBe("Isotank 20'");
      expect(details.innerHTML).toContain("21.000 a 26.000 L");
      expect(details.innerHTML).toContain("30.400 kg");
      expect(details.innerHTML).toContain("Líquidos a granel");
      inputs.codigoReferencia.value = "CTR-999999";
      updateContainerReference(form, true);
      expect(inputs.tipo.value).toBe("");
      expect(details.innerHTML).toContain("ID não encontrado");
      inputs.tipo.value = "Dry Box 20'";
      updateContainerReference(form);
      expect(inputs.codigoReferencia.value).toBe("CTR-000001");
      expect(details.innerHTML).toContain("5,90 m");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("displays the service reference details and escapes the stored description", () => {
    const markup = serviceReferenceMarkup({
      codigo: "SRV-000123", nome: "Produto", categoria: "Teste",
      descricao: "<script>teste</script>", valor: 12.5, unidade: "por unidade",
      valorAtualizadoEm: "2026-11-10T12:00:00Z",
    });
    expect(markup).toContain("SRV-000123");
    expect(markup).toContain("Produto");
    expect(markup).toContain("12,50");
    expect(markup).toContain("por unidade");
    expect(markup).toContain("10/11/2026");
    expect(markup).toContain("&lt;script&gt;");
    expect(markup).not.toContain("<script>");
  });

  it("fills a service by code and removes unchanged suggestions when the code is invalid", () => {
    const entries = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, String(value)),
    });
    try {
      const inputs = Object.fromEntries(["codigoReferencia", "nome", "categoria", "descricao"].map((key) => [key, { value: "", dataset: {} }]));
      inputs.codigoReferencia.value = "SRV-000001";
      const detail = { innerHTML: "" };
      const datalist = { innerHTML: "" };
      const form = {
        dataset: { catalogEntity: "servico", catalogLookup: "nome" },
        elements: { namedItem: (key) => inputs[key] || null },
        querySelector: (selector) => selector === ".service-reference-details" ? detail : selector === "#catalog-suggestions-servico" ? datalist : null,
      };
      applyServiceCode(form);
      expect(inputs.nome.value).toBe("Mercadoria não conteinerizada — Cabotagem");
      expect(inputs.categoria.value).toBe("Infraestrutura de proteção e acesso aquaviário");
      expect(detail.innerHTML).toContain("SRV-000001");
      inputs.codigoReferencia.value = "inexistente";
      applyServiceCode(form);
      expect(inputs.nome.value).toBe("");
      expect(inputs.categoria.value).toBe("");
      expect(detail.innerHTML).toContain("Código não encontrado");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("builds staff appointment forms from existing account choices and the DTO contract", () => {
    const accounts = [
      { id: 31, nome: "Ana Cliente", email: "ana@example.com" },
      { id: 32, nome: "João Cliente", email: "joao@example.com" },
    ];
    const markup = renderResourceFormMarkup("agendamento", {
      id: 8,
      usuarioId: 32,
      telefone: "13999990000",
      dataHora: "2026-10-25T10:30:00",
      status: true,
    }, accounts);

    expect(markup).toContain('name="usuarioId"');
    expect(markup).toContain('value="31" >Ana Cliente · ana@example.com');
    expect(markup).toContain('value="32" selected>João Cliente · joao@example.com');
    expect(markup).toContain('name="confirmado"');
    expect(markup).not.toContain('name="confirmacao"');
    expect(markup).not.toContain('name="nome"');
    expect(markup).not.toContain('name="email"');
  });

  it("connects container, operation, and service forms to frontend reference data", () => {
    const containerMarkup = renderResourceFormMarkup("conteiner");
    const operationMarkup = renderResourceFormMarkup("operacao");
    const serviceMarkup = renderResourceFormMarkup("servico");

    expect(containerMarkup).toContain('data-catalog-entity="conteiner"');
    expect(containerMarkup).toContain('data-catalog-lookup list="catalog-suggestions-conteiner"');
    expect(containerMarkup).toContain('name="codigoReferencia" list="container-code-suggestions"');
    expect(operationMarkup).toContain('data-catalog-lookup="andamento"');
    expect(serviceMarkup).toContain('data-catalog-lookup="nome"');
    expect(serviceMarkup).toContain('name="codigoReferencia"');
  });

  it("fills the CPF/CNPJ field when the Java entity serializes its uppercase property", () => {
    const markup = renderResourceFormMarkup("cliente", {
      id: 5,
      nome: "Cliente",
      CPFCNPJ: "12345678901",
      telefone: "11999990000",
      email: "cliente@example.test",
    });

    expect(markup).toContain('name="cpf"');
    expect(markup).toContain('value="12345678901"');
    expect(markup).toContain("CPF / CNPJ");
  });

  it("defaults new dashboard accounts to administrator and keeps password optional when editing", () => {
    const createMarkup = renderResourceFormMarkup("usuario");
    const editMarkup = renderResourceFormMarkup("usuario", {
      id: 8,
      nome: "Admin",
      email: "admin@example.com",
      cargo: "ADMIN",
    });

    expect(createMarkup).toContain('<option value="ADMIN" selected>Administrador</option>');
    expect(editMarkup).toContain("Deixe em branco para manter a senha atual.");
  });

  it("shows an explicit empty state instead of an unusable staff appointment form", () => {
    const markup = renderAppointmentAccountsEmpty();

    expect(markup).toContain("Nenhuma conta de cliente disponível");
    expect(markup).toContain("/dashboard/cliente");
    expect(markup).not.toContain('data-form="resource"');
  });

  it("offers separate team and administration entries from the unauthenticated dashboard gateway", () => {
    const markup = dashboardGatewayMarkup();

    expect(markup).toContain('class="dashboard-gateway"');
    expect(markup).toContain('href="/dashboard/acesso-equipe"');
    expect(markup).toContain('href="/dashboard/acesso-admin"');
    expect(markup).toContain("Equipe");
    expect(markup).toContain("Administração");
    expect(markup).not.toContain("/painel/");
  });

  it("keeps the public header brand routed to the dashboard but removes the Panel action", () => {
    const brand = publicHeaderBrandMarkup();
    const actions = publicHomeActionsMarkup();

    expect(brand).toContain('href="/dashboard"');
    expect(brand).toContain("Techocean");
    expect(actions).not.toContain("Painel");
    expect(actions).not.toContain('href="/dashboard"');
    expect(actions).not.toContain("Acesso da equipe");
  });

  it("renders the public footer wordmark as plain non-interactive text", () => {
    const footer = publicFooterMarkup();

    expect(footer).toContain('<span class="wordmark">Techocean</span>');
    expect(footer).not.toContain("<a");
  });

  it("hides first-admin setup from login and exposes account management in dashboard settings", () => {
    const team = loginScreenMarkup("team");
    const admin = loginScreenMarkup("admin");
    const settings = renderCrudSection([], { slug: "usuario", name: "Configurações" });

    expect(team).toContain('data-login-portal="team"');
    expect(team).toContain("supervisor ou funcionário");
    expect(team).not.toContain("/admin/setup");
    expect(admin).toContain('data-login-portal="admin"');
    expect(admin).toContain("gerenciar a equipe, auditoria e controles");
    expect(admin).toContain("/primeiro-acesso-admin");
    expect(settings).toContain("Contas de acesso");
    expect(settings).toContain("Novo administrador");
    expect(settings).toContain('data-resource="usuario"');
    expect(settings).toContain("Criar registro");
    expect(settings).toContain("atualizar nome, e-mail, perfil ou senha");
  });

  it("accepts only the portal's expected staff roles", () => {
    expect(panelRoleAllowed("SUPERVISOR", "team")).toBe(true);
    expect(panelRoleAllowed("FUNCIONARIO", "team")).toBe(true);
    expect(panelRoleAllowed("ADMIN", "team")).toBe(false);
    expect(panelRoleAllowed("ADMIN", "admin")).toBe(true);
    expect(panelRoleAllowed("SUPERVISOR", "admin")).toBe(false);
  });

  it("clears an in-memory session and returns a portal mismatch message", async () => {
    const { setAccessToken, getAccessToken, clearAccessToken } = await import("../src/api.js");
    setAccessToken("temporary-token");

    const result = enforcePortalRole("ADMIN", "team");

    expect(result).toEqual({ allowed: false, message: expect.stringContaining("Use a entrada Administração") });
    expect(getAccessToken()).toBeNull();
    clearAccessToken();
  });
});
