import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DATABASE_CATALOG_KEY,
  deleteDatabaseEntry,
  findDatabaseEntry,
  readDatabaseEntries,
  saveDatabaseEntry,
} from "../src/database-catalog.js";

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
