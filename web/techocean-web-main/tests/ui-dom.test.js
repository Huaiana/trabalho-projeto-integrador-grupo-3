import { describe, expect, it, vi } from "vitest";
import { findDatabaseEntry, saveDatabaseEntry, saveResourceDetails } from "../src/database-catalog.js";
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
  filterSolicitations,
  solicitationDescription,
  renderDatabaseSection,
  renderDatabaseEntryForm,
  renderContainerReferenceSection,
  renderOperationReferenceSection,
  updateOperationReference,
  updateLocalReferenceDescription,
  renderBudgetReferenceSection,
  budgetReferenceMatches,
  budgetReferenceSelectionMarkup,
  budgetTariffSelectMarkup,
  validateBudgetReference,
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

  it("organizes service fields and separates local service value from the admin reference tariff", () => {
    const staff = renderResourceFormMarkup("servico", null, [], "FUNCIONARIO");
    const admin = renderResourceFormMarkup("servico", null, [], "ADMIN");
    expect(staff).toContain("service-form-grid");
    for (const field of ["nome", "descricao", "categoria", "disponivel", "valor"]) expect(staff).toContain(`service-field-${field}`);
    expect(staff).toContain('name="valorLocal"');
    expect(staff).not.toContain('name="valorReferencia"');
    expect(admin).toContain('name="valorReferencia"');
    expect(admin).toContain("Salvar tarifa da referência");
    expect(renderResourceTable([{ id: 1, nome: "Teste" }], "servico", "FUNCIONARIO")).toContain("Editar valor");
  });

  it("displays and edits the individual service value including zero", () => {
    const values = new Map([["techocean.frontServiceValues.v1", JSON.stringify({ 7: { valor: 0, atualizadoEm: "2026-11-10T12:00:00Z" } })]]);
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    });
    try {
      const record = { id: 7, nome: "Teste" };
      expect(renderResourceTable([record], "servico", "FUNCIONARIO")).toContain("0,00");
      expect(renderResourceFormMarkup("servico", record, [], "FUNCIONARIO")).toContain('name="valorLocal" min="0" step="0.01" value="0"');
    } finally { vi.unstubAllGlobals(); }
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

  it("shows organized budget conditions and searchable IDs without a source column", () => {
    const database = renderDatabaseSection("orcamento");
    const panel = renderBudgetReferenceSection();
    expect(database).toContain("ORC-000001");
    expect(panel).toContain("2017");
    expect(panel).toContain("0,48% CIF");
    expect(panel).toContain("R$ 1.466,88");
    const [reference] = budgetReferenceMatches("ORC-000001");
    expect(reference.historico).toBe(true);
    const details = budgetReferenceSelectionMarkup(reference);
    expect(details).toContain("HISTÓRICA (2017)");
    expect(details).not.toContain("31/12/2017");
    expect(details).toContain("não um cálculo automático");
    expect(database).toContain("Editar valor");
    expect(database).toContain("Vincular IDs");
    expect(database).not.toContain("Fonte histórica");
    expect(details).toContain("Ver tarifas (6)");
    expect(details).toContain("Ver condições");
    expect(budgetReferenceMatches("CTR-TEST", [{ codigo: "ORC-TEST", conteineres: "CTR-TEST", servico: "Teste" }])).toHaveLength(1);
  });

  it("offers condition-specific tariff options and selectable IDs for all linked categories", () => {
    const form = renderDatabaseEntryForm("orcamento", { tarifas: "20 pés | 643.65\n40 pés | 787.31", conteineres: "CTR-000001" });
    expect(form).toContain('data-budget-tariff');
    expect(form).toContain('value="643.65"');
    expect(form).toContain("40 pés");
    for (const field of ["servicos", "cargas", "conteineres", "operacoes"]) expect(form).toContain(`data-budget-link="${field}"`);
    expect(form).toContain('value="CTR-000001" checked');
    expect(budgetTariffSelectMarkup("")).toContain("informe o valor manualmente");
  });

  it("requires explicit confirmation and a valid editable value for historical budget references", () => {
    const reference = { historico: true };
    expect(() => validateBudgetReference(reference, false, "150")).toThrow("Confirme");
    expect(() => validateBudgetReference(reference, true, "")).toThrow("valor estimado");
    expect(() => validateBudgetReference(reference, true, "-1")).toThrow("valor estimado");
    expect(() => validateBudgetReference(null, true, "150")).toThrow("não existe mais");
    expect(() => validateBudgetReference(reference, true, "0")).not.toThrow();
    expect(() => validateBudgetReference(reference, true, "150.50")).not.toThrow();
  });

  it("displays the locally saved budget value even when the API returns another value", () => {
    const values = new Map([["techocean.frontBudgets.v1", JSON.stringify({ 12: { valorEstimado: 0 } })]]);
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    });
    try {
      const markup = renderBudgets([{ id: 12, servico: "Teste", valorEstimado: 100 }]);
      expect(markup).toContain("0,00");
      expect(markup).not.toContain("100,00");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("looks up an operation by ID without replacing manually entered status", () => {
    const values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    });
    try {
      const inputs = Object.fromEntries(["codigoOperacao", "andamento", "responsavel", "observacoes", "descricaoLocal", "categoriaReferencia", "conteineresReferencia", "cargasReferencia", "cargasPrincipaisReferencia", "bercosReferencia", "produtividadeReferencia", "embarqueLocal", "desembarqueLocal", "conteinerId"].map((key) => [key, { value: "", dataset: {} }]));
      inputs.codigoOperacao.value = "opr-000001";
      inputs.andamento.value = "Em andamento";
      const details = { innerHTML: "" };
      const suggestions = { innerHTML: "" };
      const form = {
        dataset: {},
        elements: { namedItem: (key) => inputs[key] },
        querySelector: (selector) => selector === "[data-operation-reference]" ? details : suggestions,
      };
      updateOperationReference(form);
      expect(inputs.descricaoLocal.value).toContain("Granéis Sólidos Vegetais");
      expect(inputs.descricaoLocal.value).toContain("350 t/hora");
      expect(inputs.categoriaReferencia.value).toBe("Granéis Sólidos Vegetais");
      expect(inputs.cargasPrincipaisReferencia.value).toContain("Soja, milho");
      expect(inputs.bercosReferencia.value).toBe("14");
      expect(inputs.produtividadeReferencia.value).toContain("350 t/hora");
      expect(inputs.cargasReferencia.value).toBe("");
      expect(details.innerHTML).toContain("Sem IDs de cargas e contêineres");
      inputs.embarqueLocal.value = "2026-11-11T09:30";
      inputs.desembarqueLocal.value = "2026-11-12T10:15";
      inputs.conteinerId.value = "42";
      expect(inputs.andamento.value).toBe("Em andamento");
      inputs.codigoOperacao.value = "CTR-000010";
      updateOperationReference(form);
      expect(details.innerHTML).toContain('data-select-operation="OPR-000004"');
      expect(details.innerHTML).toContain("Granéis Líquidos");
      expect(inputs.descricaoLocal.value).toBe("");
      expect(inputs.cargasPrincipaisReferencia.value).toBe("");
      expect(inputs.embarqueLocal.value).toBe("2026-11-11T09:30");
      inputs.codigoOperacao.value = "OPR-000004";
      updateOperationReference(form);
      expect(inputs.cargasReferencia.value).toContain("CRG-000021 · Produtos químicos");
      expect(inputs.conteineresReferencia.value).toContain("CTR-000010");
      expect(details.innerHTML).toBe("");
      expect(inputs.conteinerId.value).toBe("42");
      expect(inputs.desembarqueLocal.value).toBe("2026-11-12T10:15");
      inputs.codigoOperacao.value = "CRG-000021";
      updateOperationReference(form);
      expect(details.innerHTML).toContain("Granéis Líquidos");
      inputs.codigoOperacao.value = "OPR-999999";
      updateOperationReference(form);
      expect(details.innerHTML).toContain("ID não encontrado");
      expect(details.innerHTML).not.toContain("350 t/hora");
      expect(inputs.andamento.value).toBe("Em andamento");
      expect(inputs.cargasReferencia.value).toBe("");
      inputs.codigoOperacao.value = "OPR-00000";
      updateOperationReference(form);
      expect(details.innerHTML).toContain('data-select-operation="OPR-000004"');
      expect(inputs.categoriaReferencia.value).toBe("");
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
      const inputs = Object.fromEntries(["buscaReferencia", "tipoCarga", "descricao", "peso", "volume", "origem", "destino"].map((name) => [name, { value: "", dataset: {} }]));
      inputs.buscaReferencia.value = "ctr-000001";
      const result = { innerHTML: "" };
      const suggestions = { innerHTML: "" };
      const form = {
        dataset: { catalogEntity: "carga", catalogLookup: "tipoCarga" },
        elements: { namedItem: (name) => inputs[name] || null },
        querySelector: (selector) => selector === "[data-cargo-reference]" ? result : selector === ".form-feedback" ? null : suggestions,
      };
      updateCargoReference(form);
      expect(result.innerHTML).toContain("CRG-000002");
      expect(result.innerHTML).toContain("Paletes");
      expect(result.innerHTML).toContain('data-select-cargo="CRG-000002"');
      inputs.buscaReferencia.value = "CRG-000002";
      updateCargoReference(form);
      expect(result.innerHTML).toBe("");
      expect(inputs.tipoCarga.value).toBe("Caixas");
      expect(inputs.descricao.value).toContain("Produto/carga: Caixas.");
      expect(inputs.descricao.value).toContain("Serviços vinculados: não informados.");
      expect(inputs.peso.value).toBe("");
      inputs.descricao.value = "Editado manualmente";
      inputs.origem.value = "Santos";
      inputs.buscaReferencia.value = "CTR-999999";
      updateCargoReference(form);
      expect(result.innerHTML).toContain("ID não encontrado");
      expect(result.innerHTML).not.toContain("Caixas");
      expect(inputs.tipoCarga.value).toBe("");
      expect(inputs.descricao.value).toBe("Editado manualmente");
      expect(inputs.origem.value).toBe("Santos");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("fills cargo fields and describes only explicitly linked services", () => {
    const values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    });
    try {
      const cargo = findDatabaseEntry("carga", "codigo", "CRG-000002");
      const service = findDatabaseEntry("servico", "codigo", "SRV-000001");
      saveDatabaseEntry("carga", { ...cargo, descricao: "Mercadoria embalada", peso: 12, servicos: service.codigo }, cargo.id);
      const inputs = Object.fromEntries(["buscaReferencia", "tipoCarga", "descricao", "peso", "volume", "origem", "destino"].map((name) => [name, { value: "", dataset: {} }]));
      inputs.buscaReferencia.value = cargo.codigo;
      const result = { innerHTML: "" };
      const suggestions = { innerHTML: "" };
      const feedback = { textContent: "", classList: { toggle: vi.fn() } };
      const form = {
        dataset: { catalogEntity: "carga", catalogLookup: "tipoCarga" },
        elements: { namedItem: (name) => inputs[name] || null },
        querySelector: (selector) => selector === "[data-cargo-reference]" ? result : selector === ".form-feedback" ? feedback : suggestions,
      };
      updateCargoReference(form);
      expect(inputs.descricao.value).toContain("Mercadoria embalada");
      expect(inputs.descricao.value).toContain(`${service.nome} (${service.codigo})`);
      expect(inputs.peso.value).toBe("12");
      expect(inputs.volume.value).toBe("");
      inputs.buscaReferencia.value = "CRG-000003";
      updateCargoReference(form);
      expect(inputs.peso.value).toBe("");
      expect(inputs.descricao.value).toContain("Paletes");
      expect(inputs.descricao.value).not.toContain(service.codigo);
      expect(renderDatabaseEntryForm("carga", cargo)).toContain('data-budget-link="servicos"');
      saveDatabaseEntry("carga", { ...cargo, descricao: "A".repeat(256) }, cargo.id);
      inputs.buscaReferencia.value = cargo.codigo;
      updateCargoReference(form);
      expect(inputs.descricao.value.length).toBeGreaterThan(255);
      expect(feedback.textContent).toContain("ultrapassa 255 caracteres");
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
      const inputs = Object.fromEntries(["codigoReferencia", "tipo", "situacao", "descricaoLocal"].map((key) => [key, { value: "", dataset: {} }]));
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
      expect(inputs.descricaoLocal.value).toContain("21.000 a 26.000 L");
      expect(inputs.descricaoLocal.value).toContain("30.400 kg");
      expect(inputs.descricaoLocal.value).toContain("Líquidos a granel");
      inputs.codigoReferencia.value = "CTR-999999";
      updateContainerReference(form, true);
      expect(inputs.tipo.value).toBe("");
      expect(inputs.descricaoLocal.value).toBe("");
      expect(details.innerHTML).toContain("ID não encontrado");
      inputs.tipo.value = "Dry Box 20'";
      updateContainerReference(form);
      expect(inputs.codigoReferencia.value).toBe("CTR-000001");
      expect(inputs.descricaoLocal.value).toContain("5,90 m");
      inputs.descricaoLocal.value = "Descrição manual";
      inputs.codigoReferencia.value = "CTR-999999";
      updateContainerReference(form, true);
      expect(inputs.descricaoLocal.value).toBe("Descrição manual");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("uses solicitation data without inventing related products or services", () => {
    const description = solicitationDescription({ servico: { nome: "Inspeção", categoria: "Operação" }, carga: { descricao: "Frutas", tipoCarga: "Refrigerada" } });
    expect(description).toContain("Serviço: Inspeção");
    expect(description).toContain("Carga: Frutas");
    expect(description).toContain("Tipo de carga: Refrigerada");
    expect(solicitationDescription({})).toContain("não informada");
  });

  it("filters solicitation rows by their operational ID", () => {
    const first = { dataset: { solicitationRow: "12" }, hidden: false };
    const second = { dataset: { solicitationRow: "24" }, hidden: false };
    const category = { hidden: false, querySelectorAll: () => [first, second] };
    const status = { textContent: "" };
    const panel = { querySelectorAll: () => [category], querySelector: () => status };
    filterSolicitations(panel, "12");
    expect(first.hidden).toBe(false);
    expect(second.hidden).toBe(true);
    filterSolicitations(panel, "99");
    expect(category.hidden).toBe(true);
    expect(status.textContent).toContain("Nenhuma solicitação");
    filterSolicitations(panel, "");
    expect(category.hidden).toBe(false);
    expect(second.hidden).toBe(false);
  });

  it("fills reference descriptions and preserves manual edits when the ID is cleared", () => {
    const input = { value: "", dataset: {} };
    const form = { elements: { namedItem: () => input } };
    const entry = { codigo: "ORC-000001", servico: "Teste", categoria: "Operação", valorEstimado: 10 };
    updateLocalReferenceDescription(form, "orcamento", entry);
    expect(input.value).toContain("ID: ORC-000001");
    expect(input.value).toContain("Nome do serviço: Teste");
    input.value = "Texto manual";
    updateLocalReferenceDescription(form, "orcamento", null);
    expect(input.value).toBe("Texto manual");
  });

  it("restores local descriptions and actual operational IDs in resource edit forms", () => {
    const values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    });
    try {
      saveResourceDetails("operacao", 7, { referencia: "OPR-000001", descricao: "Descrição editada", embarqueLocal: "2026-11-11T09:30", desembarqueLocal: "2026-11-12T10:15" });
      const markup = renderResourceFormMarkup("operacao", { id: 7, solicitacao: { id: 12 }, conteiner: { id: 34 }, andamento: "Iniciada" });
      expect(markup).toContain('value="OPR-000001"');
      expect(markup).toContain("Descrição editada");
      expect(markup).toContain('name="embarqueLocal" value="2026-11-11T09:30"');
      expect(markup).toContain('name="desembarqueLocal" value="2026-11-12T10:15"');
      expect(markup).toContain('name="cargasReferencia"');
      expect(markup).toMatch(/name="solicitacaoId"[^>]*value="12"/);
      expect(markup).toMatch(/name="conteinerId"[^>]*value="34"/);
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
    expect(markup).not.toContain("<details");
    expect(markup).not.toContain("<summary");
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
      const detail = { textContent: "" };
      const datalist = { innerHTML: "" };
      const form = {
        dataset: { catalogEntity: "servico", catalogLookup: "nome" },
        elements: { namedItem: (key) => inputs[key] || null },
        querySelector: (selector) => selector === ".service-reference-status" ? detail : selector === "#catalog-suggestions-servico" ? datalist : null,
      };
      applyServiceCode(form);
      expect(inputs.nome.value).toBe("Mercadoria não conteinerizada — Cabotagem");
      expect(inputs.categoria.value).toBe("Infraestrutura de proteção e acesso aquaviário");
      expect(inputs.descricao.value).toContain("Código: SRV-000001");
      expect(inputs.descricao.value).toContain("Produto / serviço: Mercadoria não conteinerizada — Cabotagem");
      expect(inputs.descricao.value).toContain("Categoria: Infraestrutura de proteção e acesso aquaviário");
      expect(inputs.descricao.value).toContain("Descrição: Não informada");
      expect(inputs.descricao.value).toContain("Tarifa: R$");
      expect(inputs.descricao.value).toContain("Unidade de cobrança: por tonelada");
      expect(inputs.descricao.value).toContain("Data e hora do valor: Não informada");
      expect(detail.textContent).toBe("");
      inputs.codigoReferencia.value = "SRV-000002";
      applyServiceCode(form);
      expect(inputs.descricao.value).toContain("Código: SRV-000002");
      expect(inputs.descricao.value).not.toContain("SRV-000001");
      inputs.codigoReferencia.value = "inexistente";
      applyServiceCode(form);
      expect(inputs.nome.value).toBe("");
      expect(inputs.categoria.value).toBe("");
      expect(inputs.descricao.value).toBe("");
      expect(detail.textContent).toContain("Código não encontrado");
      inputs.codigoReferencia.value = "SRV-000001";
      applyServiceCode(form);
      inputs.descricao.value = "Descrição editada manualmente";
      inputs.codigoReferencia.value = "inexistente";
      applyServiceCode(form);
      expect(inputs.descricao.value).toBe("Descrição editada manualmente");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("uses the stored description and price in the service reference description", async () => {
    const { serviceReferenceDescription } = await import("../src/main.js");
    const description = serviceReferenceDescription({
      codigo: "SRV-123", nome: "Teste", categoria: "Operação", descricao: "Descrição própria",
      valor: 0, unidade: "por serviço", valorAtualizadoEm: "2026-11-10T12:00:00Z",
    });
    expect(description).toContain("Descrição: Descrição própria");
    expect(description).toContain("Tarifa: R$");
    expect(description).toContain("0,00");
    expect(description).toContain("10/11/2026");
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
    expect(containerMarkup).toContain('list="container-code-suggestions"');
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
