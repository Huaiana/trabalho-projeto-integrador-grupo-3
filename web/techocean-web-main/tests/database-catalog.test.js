import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DATABASE_CATALOG_KEY,
  readServiceValues,
  readResourceDetails,
  saveResourceDetails,
  saveServiceValue,
  deleteDatabaseEntry,
  findDatabaseEntry,
  readDatabaseEntries,
  saveDatabaseEntry,
} from "../src/database-catalog.js";
import { parseTarifas } from "../src/tarifas-orcamento.js";
import { catalogoOrcamentos } from "../src/catalogo-orcamentos.js";

function installStorage() {
  const values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Banco de dados do frontend", () => {
  it("initializes seven stable solicitation references with only explicit service links", () => {
    installStorage();
    const entries = readDatabaseEntries("solicitacao");
    expect(entries).toHaveLength(7);
    expect(new Set(entries.map((entry) => entry.codigo)).size).toBe(7);
    expect(entries.every((entry) => /^SOL-\d{6}$/.test(entry.codigo) && entry.descricao)).toBe(true);
    const rsm = entries.find((entry) => entry.categoria === "Serviços e Materiais (RSM)");
    expect(rsm.servicos.split(", ")).toEqual([
      findDatabaseEntry("servico", "nome", "Fornecimento de água").codigo,
      findDatabaseEntry("servico", "nome", "Fornecimento de energia elétrica").codigo,
    ]);
    expect(entries.filter((entry) => entry.id !== rsm.id).every((entry) => !entry.servicos && !entry.cargas && !entry.conteineres && !entry.operacoes && !entry.orcamentos)).toBe(true);
    expect(readDatabaseEntries("solicitacao").map((entry) => entry.codigo)).toEqual(entries.map((entry) => entry.codigo));
  });

  it("migrates legacy solicitation references once without overriding edits or restoring deletions", () => {
    installStorage();
    localStorage.setItem(DATABASE_CATALOG_KEY, JSON.stringify({
      servico: [],
      solicitacao: [
        { id: "original", servico: "Operações e Navios", descricao: "Descrição própria", categoria: "Própria", servicos: "" },
        { id: "custom", servico: "Solicitação antiga", status: "PENDENTE" },
      ],
    }));
    const entries = readDatabaseEntries("solicitacao");
    expect(entries).toHaveLength(8);
    expect(entries[0]).toMatchObject({ id: "original", descricao: "Descrição própria", categoria: "Própria", servicos: "", codigo: "SOL-000001" });
    expect(entries[1]).toMatchObject({ id: "custom", status: "PENDENTE", codigo: "SOL-000002" });
    saveDatabaseEntry("solicitacao", { ...entries[0], descricao: "Editada" }, entries[0].id);
    deleteDatabaseEntry("solicitacao", entries[2].id);
    expect(readDatabaseEntries("solicitacao")).toHaveLength(7);
    expect(findDatabaseEntry("solicitacao", "codigo", entries[0].codigo).descricao).toBe("Editada");
    saveDatabaseEntry("solicitacao", { servico: "Nova referência" });
    expect(findDatabaseEntry("solicitacao", "servico", "Nova referência").codigo).toBe("SOL-000009");
  });

  it("validates and protects manually linked solicitation reference IDs", () => {
    installStorage();
    const reference = readDatabaseEntries("solicitacao")[0];
    const links = { servicos: "servico", cargas: "carga", conteineres: "conteiner", operacoes: "operacao", orcamentos: "orcamento" };
    const newEntries = {
      servico: { nome: "Serviço isolado", categoria: "Teste" },
      carga: { tipoCarga: "Carga isolada" },
      conteiner: { tipo: "Contêiner isolado" },
      operacao: { categoria: "Operação isolada" },
      orcamento: { servico: "Orçamento isolado" },
    };
    const selected = Object.fromEntries(Object.entries(links).map(([field, category]) => {
      const entries = saveDatabaseEntry(category, newEntries[category]);
      return [field, entries[entries.length - 1].codigo];
    }));
    for (const field of Object.keys(links)) {
      expect(() => saveDatabaseEntry("solicitacao", { ...reference, [field]: "INVALIDO" }, reference.id)).toThrow("não encontrado");
    }
    saveDatabaseEntry("solicitacao", { ...reference, ...selected }, reference.id);
    for (const [field, category] of Object.entries(links)) {
      const linked = findDatabaseEntry(category, "codigo", selected[field]);
      expect(() => deleteDatabaseEntry(category, linked.id)).toThrow("vinculada a solicitações");
    }
    expect(findDatabaseEntry("solicitacao", "codigo", reference.codigo)).toMatchObject(selected);
  });

  it("persists local descriptions independently by category and operational ID", () => {
    installStorage();
    saveResourceDetails("conteiner", 7, { referencia: "CTR-000001", descricao: "Dados editados" });
    saveResourceDetails("operacao", 7, { referencia: "OPR-000001", descricao: "Operação" });
    expect(readResourceDetails()["conteiner:7"].descricao).toBe("Dados editados");
    expect(readResourceDetails()["operacao:7"].descricao).toBe("Operação");
    saveResourceDetails("conteiner", 7, null);
    expect(readResourceDetails()["conteiner:7"]).toBeUndefined();
    expect(readResourceDetails()["operacao:7"].descricao).toBe("Operação");
    saveResourceDetails("carga", 7, { referencia: "CRG-000002" });
    expect(readResourceDetails()["carga:7"].referencia).toBe("CRG-000002");
    expect(() => saveResourceDetails("invalida", 7, {})).toThrow("inválido");
  });
  it("persists individual service values, timestamps and removal without changing reference tariffs", () => {
    installStorage();
    const reference = readDatabaseEntries("servico")[0];
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));
      saveServiceValue(42, "0");
      expect(readServiceValues()[42]).toEqual({ valor: 0, atualizadoEm: "2026-11-10T12:00:00.000Z" });
      vi.setSystemTime(new Date("2026-11-11T12:00:00Z"));
      saveServiceValue(42, "0");
      expect(readServiceValues()[42].atualizadoEm).toBe("2026-11-10T12:00:00.000Z");
      saveServiceValue(42, "15.50");
      expect(readServiceValues()[42]).toEqual({ valor: 15.5, atualizadoEm: "2026-11-11T12:00:00.000Z" });
      expect(findDatabaseEntry("servico", "codigo", reference.codigo).valor).toBe(reference.valor);
      expect(() => saveServiceValue(42, "-1")).toThrow("válido");
      saveServiceValue(42, "");
      expect(readServiceValues()[42]).toBeUndefined();
    } finally { vi.useRealTimers(); }
  });
  it("seeds service references and stores editable category entries locally", () => {
    installStorage();

    expect(findDatabaseEntry("servico", "nome", "acesso de veículo — automóvel")).toMatchObject({
      categoria: "Serviços diversos",
      valor: 34.68,
    });

    saveDatabaseEntry("conteiner", { tipo: "40 HC", situacao: "Disponível" });
    expect(findDatabaseEntry("conteiner", "tipo", "40 hc")).toMatchObject({
      codigo: "CTR-000011",
      situacao: "Disponível",
    });
  });

  it("initializes all supplied container specifications with stable unique IDs", () => {
    installStorage();
    const entries = readDatabaseEntries("conteiner");
    expect(entries.map(({ tipo, comprimento, largura, altura, capacidade, cargaMaxima }) => [tipo, comprimento, largura, altura, capacidade, cargaMaxima])).toEqual([
      ["Dry Box 20'", "5,90 m", "2,35 m", "2,39 m", "33,2 m³", "28.200 kg"],
      ["Dry Box 40'", "12,03 m", "2,35 m", "2,39 m", "67,7 m³", "26.700 kg"],
      ["High Cube (HC) 40'", "12,03 m", "2,35 m", "2,69 m", "76,3 m³", "26.500 kg"],
      ["Reefer 20'", "5,45 m", "2,29 m", "2,26 m", "28,3 m³", "27.400 kg"],
      ["Reefer 40' HC", "11,58 m", "2,29 m", "2,54 m", "67,3 m³", "29.100 kg"],
      ["Open Top 20'", "5,89 m", "2,35 m", "2,35 m", "32,6 m³", "28.100 kg"],
      ["Open Top 40'", "12,02 m", "2,35 m", "2,35 m", "66,7 m³", "26.600 kg"],
      ["Flat Rack 20'", "5,94 m", "2,35 m", "2,35 m", "", "31.200 kg"],
      ["Flat Rack 40'", "12,13 m", "2,40 m", "2,14 m", "", "40.000 kg"],
      ["Isotank 20'", "6,05 m", "2,43 m", "2,59 m", "21.000 a 26.000 L", "30.400 kg"],
    ]);
    expect(entries.every((entry) => entry.usoPrincipal)).toBe(true);
    expect(new Set(entries.map((entry) => entry.codigo)).size).toBe(10);
    expect(findDatabaseEntry("conteiner", "codigo", "ctr-000010").tipo).toBe("Isotank 20'");
    expect(readDatabaseEntries("conteiner").map((entry) => entry.codigo)).toEqual(entries.map((entry) => entry.codigo));
  });

  it("migrates existing containers once without overwriting user data or restoring deleted entries", () => {
    installStorage();
    localStorage.setItem(DATABASE_CATALOG_KEY, JSON.stringify({
      conteiner: [{ id: "original", tipo: "Dry Box 20'", situacao: "Ocupado", largura: "customizada" }, { id: "extra", tipo: "Personalizado" }],
      servico: [],
    }));
    const entries = readDatabaseEntries("conteiner");
    const original = entries.find((entry) => entry.id === "original");
    expect(entries).toHaveLength(11);
    expect(original).toMatchObject({ situacao: "Ocupado", largura: "customizada", comprimento: "5,90 m", codigo: "CTR-000001" });
    expect(entries.find((entry) => entry.id === "extra").codigo).toBe("CTR-000002");
    saveDatabaseEntry("conteiner", { ...original, largura: "2,30 m" }, original.id);
    expect(findDatabaseEntry("conteiner", "tipo", original.tipo)).toMatchObject({ codigo: original.codigo, largura: "2,30 m", comprimento: "5,90 m" });
    for (const cargo of readDatabaseEntries("carga").filter((entry) => entry.conteineres === original.codigo)) deleteDatabaseEntry("carga", cargo.id);
    for (const budget of readDatabaseEntries("orcamento").filter((entry) => String(entry.conteineres || "").split(",").map((code) => code.trim()).includes(original.codigo))) {
      saveDatabaseEntry("orcamento", { ...budget, conteineres: String(budget.conteineres).split(",").map((code) => code.trim()).filter((code) => code !== original.codigo).join(", ") }, budget.id);
    }
    deleteDatabaseEntry("conteiner", original.id);
    expect(readDatabaseEntries("conteiner").some((entry) => entry.id === original.id)).toBe(false);
    saveDatabaseEntry("conteiner", { tipo: "Novo" });
    expect(findDatabaseEntry("conteiner", "tipo", "Novo").codigo).toBe("CTR-000012");
  });

  it("prevents duplicate lookup values and supports editing and deleting templates", () => {
    installStorage();
    saveDatabaseEntry("carga", { tipoCarga: "Granel sólido", descricao: "Minério", peso: "12" });
    const first = findDatabaseEntry("carga", "tipoCarga", "Granel sólido");

    expect(() => saveDatabaseEntry("carga", { tipoCarga: "granel SÓLIDO", descricao: "Outro" })).toThrow("Já existe");
    saveDatabaseEntry("carga", { tipoCarga: "Granel sólido", descricao: "Minério atualizado", peso: "15" }, first.id);
    expect(findDatabaseEntry("carga", "tipoCarga", "GRANEL SÓLIDO")).toMatchObject({
      descricao: "Minério atualizado",
      peso: 15,
    });

    deleteDatabaseEntry("carga", first.id);
    expect(findDatabaseEntry("carga", "tipoCarga", "Granel sólido")).toBeNull();
  });

  it("creates distinct cargo references linked to the local container IDs", () => {
    installStorage();
    const entries = readDatabaseEntries("carga");
    expect(entries).toHaveLength(23);
    expect(new Set(entries.map((entry) => entry.codigo)).size).toBe(23);
    expect(findDatabaseEntry("carga", "tipoCarga", "Caixas")).toMatchObject({ codigo: "CRG-000002", conteineres: "CTR-000001" });
    expect(findDatabaseEntry("carga", "tipoCarga", "Gases").conteineres).toBe("CTR-000010");
    const container = findDatabaseEntry("conteiner", "codigo", "CTR-000001");
    expect(() => deleteDatabaseEntry("conteiner", container.id)).toThrow("vinculado a cargas");
    expect(() => saveDatabaseEntry("carga", { tipoCarga: "Teste", conteineres: "CTR-999999" })).toThrow("ID de contêiner não encontrado");
    saveDatabaseEntry("carga", { tipoCarga: "Teste", conteineres: "ctr-000001, CTR-000002, CTR-000001" });
    expect(findDatabaseEntry("carga", "tipoCarga", "Teste").conteineres).toBe("CTR-000001, CTR-000002");
  });

  it("validates and protects explicit cargo-service links", () => {
    installStorage();
    const cargo = findDatabaseEntry("carga", "codigo", "CRG-000002");
    const service = readDatabaseEntries("servico")[0];
    expect(() => saveDatabaseEntry("carga", { ...cargo, servicos: "SRV-999999" }, cargo.id)).toThrow("ID de serviço não encontrado");
    saveDatabaseEntry("carga", { ...cargo, servicos: `${service.codigo.toLowerCase()}, ${service.codigo}` }, cargo.id);
    expect(findDatabaseEntry("carga", "codigo", cargo.codigo).servicos).toBe(service.codigo);
    expect(() => deleteDatabaseEntry("servico", service.id)).toThrow("vinculado a cargas");
    const saved = findDatabaseEntry("carga", "codigo", cargo.codigo);
    saveDatabaseEntry("carga", { ...saved, servicos: "" }, saved.id);
    expect(findDatabaseEntry("carga", "codigo", cargo.codigo).servicos).toBe("");
  });

  it("migrates existing cargo without overwriting fields and does not restore deleted references", () => {
    installStorage();
    localStorage.setItem(DATABASE_CATALOG_KEY, JSON.stringify({
      carga: [{ id: "original", tipoCarga: "Caixas", descricao: "Personalizada", peso: 12 }],
      conteiner: [{ id: "container", tipo: "Dry Box 20'", codigo: "CTR-000123" }],
      containerReferenceVersion: 1,
      servico: [],
    }));
    const cargo = findDatabaseEntry("carga", "tipoCarga", "Caixas");
    expect(cargo).toMatchObject({ id: "original", codigo: "CRG-000001", conteineres: "CTR-000123", descricao: "Personalizada", peso: 12 });
    expect(findDatabaseEntry("carga", "tipoCarga", "Paletes").conteineres).toBe("CTR-000123");
    expect(findDatabaseEntry("carga", "tipoCarga", "Gases")).toBeNull();
    saveDatabaseEntry("carga", { ...cargo, descricao: "Editada" }, cargo.id);
    expect(findDatabaseEntry("carga", "codigo", cargo.codigo)).toMatchObject({ descricao: "Editada", conteineres: "CTR-000123" });
    deleteDatabaseEntry("carga", cargo.id);
    expect(findDatabaseEntry("carga", "tipoCarga", "Caixas")).toBeNull();
  });

  it("initializes operation categories with their exact cargo, berth and productivity references", () => {
    installStorage();
    const records = readDatabaseEntries("operacao");
    expect(records.map(({ categoria, cargasPrincipais, bercos, produtividade }) => [categoria, cargasPrincipais, bercos, produtividade])).toEqual([
      ["Granéis Sólidos Vegetais", "Soja, milho, farelo, trigo e açúcar", "14", "Grãos (embarque): 350 t/hora (Armazéns 12A, 16/17)\nAçúcar (embarque): 490 t/hora (Armazéns 16/17)\nTrigo (descarga): 140 t/hora (Armazém 12A)"],
      ["Carga Geral (Contêineres)", "Cargas conteinerizadas diversas", "10", "Movimentação geral: ~220 t/hora no cais público (TEV). Terminais privados operam por movimentos/hora."],
      ["Carga Geral (Celulose)", "Fardos de celulose", "9", "Embarque: 160 t/hora (cais do Saboó I-III)"],
      ["Granéis Líquidos", "Químicos, combustíveis e sucos cítricos", "11 (8 químicos / 3 sucos)", "Calculada por Tempo Máximo de Atividade (TMA) via calculadora oficial (ex.: Alamoa e Ilha Barnabé)."],
      ["Carga Geral (Siderúrgicos)", "Bobinas, chapas e tubos de aço", "5", "Varia conforme o berço e o tipo de amarração da peça."],
      ["Granéis Sólidos Minerais", "Fertilizantes, enxofre e sal", "4", "Sal (descarga): 180 t/hora (Armazém 12A)\nFertilizantes (descarga): 145 t/hora (Saboó e Arm. 12A)"],
      ["Carga Geral (Veículos)", "Automóveis, caminhões e máquinas (Ro-Ro)", "2", "Embarque: 55 t/hora (TEV)\nDesembarque: 40 t/hora (TEV)"],
      ["Outras Operações", "Multipropósito (3), Passageiros (1), Offshore (1)", "5", "Regras específicas por janela de atracação ou contrato de apoio marítimo."],
    ]);
    expect(records.map((record) => record.codigo)).toEqual(Array.from({ length: 8 }, (_, index) => `OPR-${String(index + 1).padStart(6, "0")}`));
    expect(findDatabaseEntry("operacao", "codigo", "opr-000006").categoria).toBe("Granéis Sólidos Minerais");
  });

  it("migrates operation templates without losing their defaults and preserves IDs after edits and deletes", () => {
    installStorage();
    localStorage.setItem(DATABASE_CATALOG_KEY, JSON.stringify({
      operacao: [{ id: "original", andamento: "Granéis Líquidos", responsavel: "Equipe", produtividade: "Personalizada" }],
      servico: [],
    }));
    const existing = findDatabaseEntry("operacao", "codigo", "OPR-000001");
    expect(existing).toMatchObject({ categoria: "Granéis Líquidos", andamento: "Granéis Líquidos", responsavel: "Equipe", produtividade: "Personalizada", bercos: "11 (8 químicos / 3 sucos)" });
    expect(readDatabaseEntries("operacao")).toHaveLength(8);
    saveDatabaseEntry("operacao", { ...existing, responsavel: "Outro" }, existing.id);
    expect(findDatabaseEntry("operacao", "codigo", existing.codigo)).toMatchObject({ responsavel: "Outro" });
    deleteDatabaseEntry("operacao", existing.id);
    expect(findDatabaseEntry("operacao", "codigo", existing.codigo)).toBeNull();
    saveDatabaseEntry("operacao", { categoria: "Personalizada" });
    expect(findDatabaseEntry("operacao", "categoria", "Personalizada").codigo).toBe("OPR-000009");
  });

  it("suggests explicit operation links using local IDs and validates editable links", () => {
    installStorage();
    const operation = findDatabaseEntry("operacao", "codigo", "OPR-000004");
    const cargo = findDatabaseEntry("carga", "tipoCarga", "Produtos químicos");
    const container = findDatabaseEntry("conteiner", "tipo", "Isotank 20'");
    expect(operation).toMatchObject({ cargas: cargo.codigo, conteineres: container.codigo });
    expect(findDatabaseEntry("operacao", "codigo", "OPR-000001").cargas).toBeUndefined();
    expect(() => deleteDatabaseEntry("carga", cargo.id)).toThrow("vinculada a operações");
    expect(() => saveDatabaseEntry("operacao", { ...operation, cargas: "CRG-999999" }, operation.id)).toThrow("ID de carga não encontrado");
    expect(() => saveDatabaseEntry("operacao", { ...operation, conteineres: "CTR-999999" }, operation.id)).toThrow("ID de contêiner não encontrado");
    saveDatabaseEntry("operacao", { ...operation, cargas: "", conteineres: "" }, operation.id);
    expect(findDatabaseEntry("operacao", "codigo", operation.codigo)).toMatchObject({ cargas: "", conteineres: "" });
    deleteDatabaseEntry("carga", cargo.id);
    expect(findDatabaseEntry("operacao", "codigo", operation.codigo).cargas).toBe("");
  });

  it("migrates historical budget references once and allows values and links to be edited", () => {
    installStorage();
    localStorage.setItem(DATABASE_CATALOG_KEY, JSON.stringify({
      orcamento: [{ id: "original", servico: "Serviço próprio", valorEstimado: 50 }],
      servico: [], conteiner: [], carga: [], operacao: [],
    }));
    const records = readDatabaseEntries("orcamento");
    const original = records.find((entry) => entry.id === "original");
    const historic = records.find((entry) => entry.servico.startsWith("2.1.2.1.1 —"));
    expect(records.length).toBeGreaterThan(50);
    expect(original).toMatchObject({ codigo: "ORC-000001", valorEstimado: 50 });
    expect(historic).toMatchObject({ codigo: "ORC-000002", historico: true });
    expect(historic.fonte).toContain("31/12/2017");
    expect(historic.regras).toContain("0,48% CIF");
    expect(historic.regras).toContain("R$ 1.466,88");
    const container = findDatabaseEntry("conteiner", "tipo", "Dry Box 20'");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));
      saveDatabaseEntry("orcamento", { ...historic, valorEstimado: "100.50", conteineres: container.codigo }, historic.id);
      expect(findDatabaseEntry("orcamento", "codigo", historic.codigo)).toMatchObject({
        valorEstimado: 100.5, conteineres: container.codigo, historico: true, fonte: historic.fonte,
        valorAtualizadoEm: "2026-11-10T12:00:00.000Z",
      });

      expect(() => saveDatabaseEntry("orcamento", { ...historic, cargas: "CRG-999999" }, historic.id)).toThrow("ID de carga não encontrado");
      expect(() => saveDatabaseEntry("orcamento", { ...historic, valorEstimado: -1 }, historic.id)).toThrow("não pode ser negativo");
      deleteDatabaseEntry("orcamento", historic.id);
      expect(findDatabaseEntry("orcamento", "codigo", historic.codigo)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("adds only explicitly named container links to unmodified historical budgets", () => {
    installStorage();
    const special = findDatabaseEntry("orcamento", "servico", "2.1.2.1.7 — Armazenagem OOG, Flat Rack ou Open Top");
    const dry = findDatabaseEntry("orcamento", "servico", "2.1.2.1.8 — Armazenagem de vazios");
    const ids = (names) => names.map((name) => findDatabaseEntry("conteiner", "tipo", name).codigo).join(", ");
    expect(special.conteineres).toBe(ids(["Open Top 20'", "Open Top 40'", "Flat Rack 20'", "Flat Rack 40'"]));
    expect(dry.conteineres).toBe(ids(["Dry Box 20'", "Dry Box 40'"]));
    saveDatabaseEntry("orcamento", { ...special, conteineres: "" }, special.id);
    expect(findDatabaseEntry("orcamento", "codigo", special.codigo).conteineres).toBe("");
  });

  it("preserves edited links and changed conditions during explicit link migration", () => {
    installStorage();
    const special = findDatabaseEntry("orcamento", "servico", "2.1.2.1.7 — Armazenagem OOG, Flat Rack ou Open Top");
    const dry = findDatabaseEntry("orcamento", "servico", "2.1.2.1.8 — Armazenagem de vazios");
    saveDatabaseEntry("orcamento", { ...special, conteineres: "" }, special.id);
    saveDatabaseEntry("orcamento", { ...dry, conteineres: "", regras: "Condições personalizadas" }, dry.id);
    const stored = JSON.parse(localStorage.getItem(DATABASE_CATALOG_KEY));
    delete stored.explicitBudgetContainerLinksVersion;
    delete stored.orcamento.find((entry) => entry.id === dry.id).conteineres;
    localStorage.setItem(DATABASE_CATALOG_KEY, JSON.stringify(stored));
    expect(findDatabaseEntry("orcamento", "codigo", special.codigo).conteineres).toBe("");
    expect(findDatabaseEntry("orcamento", "codigo", dry.codigo).conteineres).toBeUndefined();
  });

  it("prevents deleting services and operations linked to budget references", () => {
    installStorage();
    const service = readDatabaseEntries("servico")[0];
    const operation = readDatabaseEntries("operacao")[0];
    saveDatabaseEntry("orcamento", { servico: "Referência vinculada", servicos: service.codigo, operacoes: operation.codigo });
    expect(() => deleteDatabaseEntry("servico", service.id)).toThrow("vinculada a orçamentos");
    expect(() => deleteDatabaseEntry("operacao", operation.id)).toThrow("vinculada a orçamentos");
    const budget = findDatabaseEntry("orcamento", "servico", "Referência vinculada");
    deleteDatabaseEntry("orcamento", budget.id);
    expect(() => deleteDatabaseEntry("servico", service.id)).not.toThrow();
    expect(() => deleteDatabaseEntry("operacao", operation.id)).not.toThrow();
  });

  it("migrates only unmodified historical tariffs and unambiguous links without overwriting user edits", () => {
    installStorage();
    const original = readDatabaseEntries("orcamento").find((entry) => entry.servico.includes("Monitoramento de contêiner refrigerado"));
    expect(original.conteineres).toBe("CTR-000004, CTR-000005");
    expect(original.valorEstimado).toBe(200.46);
    expect(original.observacoes).toContain("2017");
    expect(parseTarifas(original.tarifas)).toEqual([{ label: "Por unidade e dia ou fração", value: 200.46 }]);
    const multi = readDatabaseEntries("orcamento").find((entry) => entry.servico.includes("Desunitização mecanizada"));
    expect(multi.valorEstimado).toBeUndefined();
    expect(parseTarifas(multi.tarifas)).toHaveLength(4);
    saveDatabaseEntry("orcamento", { ...original, valorEstimado: "0", conteineres: "", observacoes: "Minha observação", tarifas: "Outro | 0" }, original.id);
    expect(findDatabaseEntry("orcamento", "codigo", original.codigo)).toMatchObject({ valorEstimado: 0, conteineres: "", observacoes: "Minha observação", tarifas: "Outro | 0" });
    expect(() => saveDatabaseEntry("orcamento", { ...original, tarifas: "Inválida | não é número" }, original.id)).toThrow("formato");
    expect(parseTarifas("Manual | 12,50\nGrátis | 0")).toEqual([{ label: "Manual", value: 12.5 }, { label: "Grátis", value: 0 }]);
  });

  it("preserves edited legacy budget fields and deleted records during detail migration", () => {
    installStorage();
    const records = readDatabaseEntries("orcamento");
    const modified = records.find((entry) => entry.servico.includes("Monitoramento de contêiner refrigerado"));
    const deleted = records.find((entry) => entry.servico.includes("Desunitização mecanizada"));
    const stored = JSON.parse(localStorage.getItem(DATABASE_CATALOG_KEY));
    delete stored.budgetDetailsVersion;
    stored.orcamento = stored.orcamento.filter((entry) => entry.id !== deleted.id);
    const legacy = stored.orcamento.find((entry) => entry.id === modified.id);
    Object.assign(legacy, { regras: "Condições personalizadas", valorEstimado: 0, conteineres: "", observacoes: "Minha observação" });
    delete legacy.tarifas;
    localStorage.setItem(DATABASE_CATALOG_KEY, JSON.stringify(stored));
    const migrated = findDatabaseEntry("orcamento", "codigo", modified.codigo);
    expect(migrated).toMatchObject({ regras: "Condições personalizadas", valorEstimado: 0, conteineres: "", observacoes: "Minha observação" });
    expect(migrated.tarifas).toBeUndefined();
    expect(findDatabaseEntry("orcamento", "codigo", deleted.codigo)).toBeNull();
  });

  it("offers each monetary tariff in the reference conditions without treating CIF thresholds as prices", () => {
    installStorage();
    const records = readDatabaseEntries("orcamento");
    for (const [item, nome, , rules] of catalogoOrcamentos) {
      const entry = records.find((record) => record.servico === `${item} — ${nome}`);
      const values = parseTarifas(entry.tarifas).map((tariff) => tariff.value);
      for (const match of rules.matchAll(/R\$\s*([\d.]+,\d{2})/g)) {
        const value = Number(match[1].replaceAll(".", "").replace(",", "."));
        if (item === "2.1.2.1.4" && [300000, 300001].includes(value)) continue;
        expect(values, `${item}: ${value}`).toContain(value);
      }
    }
  });

  it("migrates existing services once and keeps unique codes through edits and deletion", () => {
    installStorage();
    localStorage.setItem(DATABASE_CATALOG_KEY, JSON.stringify({
      servico: [
        { id: "a", nome: "Primeiro", categoria: "Teste", valor: 10 },
        { id: "b", nome: "Segundo", categoria: "Teste", valor: 20 },
      ],
    }));
    const [first, second] = readDatabaseEntries("servico");
    expect(first.codigo).toBe("SRV-000001");
    expect(second.codigo).toBe("SRV-000002");
    expect(readDatabaseEntries("servico")[0].codigo).toBe(first.codigo);

    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));
      saveDatabaseEntry("servico", { nome: first.nome, categoria: "Teste", valor: "15" }, first.id);
      expect(findDatabaseEntry("servico", "codigo", first.codigo)).toMatchObject({
        valor: 15,
        valorAtualizadoEm: "2026-11-10T12:00:00.000Z",
      });
      vi.setSystemTime(new Date("2026-11-11T12:00:00Z"));
      saveDatabaseEntry("servico", { nome: first.nome, categoria: "Teste", descricao: "Alterada", valor: "15" }, first.id);
      expect(findDatabaseEntry("servico", "codigo", first.codigo).valorAtualizadoEm).toBe("2026-11-10T12:00:00.000Z");
      deleteDatabaseEntry("servico", second.id);
      saveDatabaseEntry("servico", { nome: "Terceiro", categoria: "Teste", valor: "0" });
      expect(findDatabaseEntry("servico", "nome", "Terceiro")).toMatchObject({
        codigo: "SRV-000003", valor: 0, valorAtualizadoEm: "2026-11-11T12:00:00.000Z",
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
