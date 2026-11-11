import { catalogoServicos } from "./catalogo-servicos.js";
import { catalogoConteineres } from "./catalogo-conteineres.js";
import { catalogoCargas } from "./catalogo-cargas.js";
import { catalogoOperacoes } from "./catalogo-operacoes.js";
import { catalogoSolicitacoes } from "./catalogo-solicitacoes.js";
import { catalogoOrcamentos, fonteTarifariaHistorica } from "./catalogo-orcamentos.js";
import { parseTarifas, tarifasPadrao } from "./tarifas-orcamento.js";

export const DATABASE_CATALOG_KEY = "techocean.frontDatabase.v1";
export const DATABASE_SOLICITATION_KEY = "techocean.frontSolicitations.v1";
export const DATABASE_BUDGET_KEY = "techocean.frontBudgets.v1";
export const DATABASE_SERVICE_VALUES_KEY = "techocean.frontServiceValues.v1";
export const DATABASE_RESOURCE_DETAILS_KEY = "techocean.frontResourceDetails.v1";

export const databaseCategories = [
  {
    id: "carga",
    label: "Carga",
    lookupField: "tipoCarga",
    fields: [
      { name: "tipoCarga", label: "Tipo de carga", required: true },
      { name: "conteineres", label: "IDs dos contêineres (separados por vírgula)" },
      { name: "servicos", label: "IDs dos serviços (separados por vírgula)" },
      { name: "descricao", label: "Descrição" },
      { name: "peso", label: "Peso (t)", type: "number" },
      { name: "volume", label: "Volume (m³)", type: "number" },
      { name: "origem", label: "Origem" },
      { name: "destino", label: "Destino" },
    ],
  },
  {
    id: "conteiner",
    label: "Contêiner",
    lookupField: "tipo",
    fields: [
      { name: "tipo", label: "Tipo de contêiner", required: true },
      { name: "situacao", label: "Situação padrão" },
      { name: "comprimento", label: "Comprimento" },
      { name: "largura", label: "Largura" },
      { name: "altura", label: "Altura" },
      { name: "capacidade", label: "Capacidade (volume)" },
      { name: "cargaMaxima", label: "Carga máxima" },
      { name: "usoPrincipal", label: "Uso principal", type: "textarea" },
    ],
  },
  {
    id: "operacao",
    label: "Operação",
    lookupField: "categoria",
    fields: [
      { name: "categoria", label: "Categoria da operação", required: true },
      { name: "cargasPrincipais", label: "Principais cargas", type: "textarea" },
      { name: "cargas", label: "IDs das cargas (separados por vírgula)" },
      { name: "conteineres", label: "IDs dos contêineres (separados por vírgula)" },
      { name: "bercos", label: "Berços" },
      { name: "produtividade", label: "Produtividade mínima (prancha)", type: "textarea" },
      { name: "andamento", label: "Andamento padrão" },
      { name: "responsavel", label: "Responsável padrão" },
      { name: "observacoes", label: "Observações padrão", type: "textarea" },
    ],
  },
  {
    id: "orcamento",
    label: "Orçamento",
    lookupField: "servico",
    fields: [
      { name: "servico", label: "Nome do serviço", required: true },
      { name: "categoria", label: "Categoria" },
      { name: "valorEstimado", label: "Valor estimado (R$)", type: "number" },
      { name: "tarifas", label: "Tarifas disponíveis (uma por linha: condição | valor)", type: "textarea" },
      { name: "regras", label: "Valores e condições", type: "textarea" },
      { name: "servicos", label: "IDs dos serviços (separados por vírgula)" },
      { name: "cargas", label: "IDs das cargas (separados por vírgula)" },
      { name: "conteineres", label: "IDs dos contêineres (separados por vírgula)" },
      { name: "operacoes", label: "IDs das operações (separados por vírgula)" },
      { name: "observacoes", label: "Observações padrão", type: "textarea" },
    ],
  },
  {
    id: "servico",
    label: "Serviço",
    lookupField: "nome",
    fields: [
      { name: "nome", label: "Nome do serviço", required: true },
      { name: "categoria", label: "Categoria", required: true },
      { name: "descricao", label: "Descrição" },
      { name: "valor", label: "Tarifa de referência (R$)", type: "number" },
      { name: "unidade", label: "Unidade de cobrança" },
    ],
  },
  {
    id: "solicitacao",
    label: "Solicitação",
    lookupField: "servico",
    fields: [
      { name: "servico", label: "Nome do serviço", required: true },
      { name: "categoria", label: "Categoria" },
      { name: "descricao", label: "Descrição e exemplos", type: "textarea" },
      { name: "servicos", label: "IDs dos serviços (separados por vírgula)" },
      { name: "cargas", label: "IDs das cargas (separados por vírgula)" },
      { name: "conteineres", label: "IDs dos contêineres (separados por vírgula)" },
      { name: "operacoes", label: "IDs das operações (separados por vírgula)" },
      { name: "orcamentos", label: "IDs dos orçamentos (separados por vírgula)" },
      { name: "solicitado", label: "Serviço solicitado?", type: "select", options: ["Sim", "Não"] },
      { name: "prestado", label: "Serviço prestado?", type: "select", options: ["Sim", "Não"] },
      { name: "status", label: "Status padrão", type: "select", options: ["PENDENTE", "CONFIRMADO", "CONCLUÍDO", "CANCELADO"] },
    ],
  },
];

const categoryById = new Map(databaseCategories.map((category) => [category.id, category]));

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function readStorage(key) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    throw new Error("O navegador bloqueou o acesso ao armazenamento local. Verifique as permissões de privacidade.");
  }
}

function writeStorage(key, value) {
  try {
    if (!globalThis.localStorage) throw new Error("Armazenamento local indisponível.");
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (error instanceof Error && error.message === "Armazenamento local indisponível.") throw error;
    throw new Error("Não foi possível salvar os dados neste navegador. Verifique o espaço disponível e as permissões de privacidade.");
  }
}

function emptyCatalog() {
  let sequence = 0;
  const serviceRows = catalogoServicos.flatMap(({ categoria, servicos }) => servicos.map((service) => ({
    id: createId(),
    codigo: serviceCode(++sequence),
    nome: service.nome,
    categoria,
    descricao: "",
    valor: service.valor ?? "",
    unidade: service.unidade,
  })));
  return {
    carga: [],
    conteiner: catalogoConteineres.map((entry, index) => ({ ...entry, id: createId(), codigo: containerCode(index + 1) })),
    operacao: [],
    orcamento: [],
    servico: serviceRows,
    solicitacao: [],
    nextServiceCode: sequence + 1,
    nextContainerCode: catalogoConteineres.length + 1,
    containerReferenceVersion: 1,
  };
}

function serviceCode(number) {
  return `SRV-${String(number).padStart(6, "0")}`;
}

function containerCode(number) {
  return `CTR-${String(number).padStart(6, "0")}`;
}

function cargoCode(number) {
  return `CRG-${String(number).padStart(6, "0")}`;
}

function operationCode(number) {
  return `OPR-${String(number).padStart(6, "0")}`;
}

function budgetCode(number) {
  return `ORC-${String(number).padStart(6, "0")}`;
}

function solicitationCode(number) {
  return `SOL-${String(number).padStart(6, "0")}`;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function readDatabaseCatalog() {
  const stored = readStorage(DATABASE_CATALOG_KEY);
  let data;
  try {
    data = stored === null ? emptyCatalog() : JSON.parse(stored);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
  } catch {
    throw new Error("Os dados locais do Banco de dados estão inválidos. Exporte ou limpe os dados do navegador antes de continuar.");
  }
  const catalog = Object.fromEntries(databaseCategories.map(({ id }) => [id, Array.isArray(data[id]) ? data[id] : []]));
  const used = new Set(catalog.servico.map((entry) => entry.codigo).filter(Boolean));
  let next = Number.isSafeInteger(data.nextServiceCode) && data.nextServiceCode > 0 ? data.nextServiceCode : 1;
  for (const code of used) {
    const match = /^SRV-(\d+)$/i.exec(code);
    if (match) next = Math.max(next, Number(match[1]) + 1);
  }
  let changed = stored === null;
  if (data.containerReferenceVersion !== 1) {
    for (const reference of catalogoConteineres) {
      const existing = catalog.conteiner.find((entry) => normalize(entry.tipo) === normalize(reference.tipo));
      if (existing) {
        for (const [key, value] of Object.entries(reference)) {
          if (key !== "tipo" && existing[key] == null) existing[key] = value;
        }
      } else {
        catalog.conteiner.push({ ...reference, id: createId() });
      }
    }
    changed = true;
  }
  catalog.containerReferenceVersion = 1;
  const containerCodes = new Set(catalog.conteiner.map((entry) => entry.codigo).filter(Boolean));
  let nextContainer = Number.isSafeInteger(data.nextContainerCode) && data.nextContainerCode > 0 ? data.nextContainerCode : 1;
  for (const code of containerCodes) {
    const match = /^CTR-(\d+)$/i.exec(code);
    if (match) nextContainer = Math.max(nextContainer, Number(match[1]) + 1);
  }
  for (const entry of catalog.conteiner) {
    if (entry.codigo) continue;
    while (containerCodes.has(containerCode(nextContainer))) nextContainer++;
    entry.codigo = containerCode(nextContainer++);
    containerCodes.add(entry.codigo);
    changed = true;
  }
  catalog.nextContainerCode = nextContainer;
  if (data.cargoReferenceVersion !== 1) {
    for (const reference of catalogoCargas) {
      const containerIds = reference.conteineres.map((tipo) => catalog.conteiner.find((entry) => normalize(entry.tipo) === normalize(tipo))?.codigo).filter(Boolean);
      if (!containerIds.length) continue;
      const existing = catalog.carga.find((entry) => normalize(entry.tipoCarga) === normalize(reference.tipoCarga));
      if (existing) {
        if (existing.conteineres == null) existing.conteineres = containerIds.join(", ");
      } else {
        catalog.carga.push({ id: createId(), tipoCarga: reference.tipoCarga, conteineres: containerIds.join(", ") });
      }
    }
    changed = true;
  }
  catalog.cargoReferenceVersion = 1;
  const cargoCodes = new Set(catalog.carga.map((entry) => entry.codigo).filter(Boolean));
  let nextCargo = Number.isSafeInteger(data.nextCargoCode) && data.nextCargoCode > 0 ? data.nextCargoCode : 1;
  for (const code of cargoCodes) {
    const match = /^CRG-(\d+)$/i.exec(code);
    if (match) nextCargo = Math.max(nextCargo, Number(match[1]) + 1);
  }
  for (const entry of catalog.carga) {
    if (entry.codigo) continue;
    while (cargoCodes.has(cargoCode(nextCargo))) nextCargo++;
    entry.codigo = cargoCode(nextCargo++);
    cargoCodes.add(entry.codigo);
    changed = true;
  }
  catalog.nextCargoCode = nextCargo;
  if (data.operationReferenceVersion !== 1) {
    for (const entry of catalog.operacao) {
      if (!entry.categoria) entry.categoria = entry.andamento || "";
    }
    for (const reference of catalogoOperacoes) {
      const existing = catalog.operacao.find((entry) => normalize(entry.categoria) === normalize(reference.categoria));
      if (existing) {
        for (const [key, value] of Object.entries(reference)) {
          if (key !== "categoria" && existing[key] == null) existing[key] = value;
        }
      } else {
        catalog.operacao.push({ ...reference, id: createId() });
      }
    }
    changed = true;
  }
  catalog.operationReferenceVersion = 1;
  if (data.operationLinksVersion !== 1) {
    const operation = catalog.operacao.find((entry) => normalize(entry.categoria) === normalize("Granéis Líquidos"));
    const cargo = catalog.carga.find((entry) => normalize(entry.tipoCarga) === normalize("Produtos químicos"));
    const container = catalog.conteiner.find((entry) => normalize(entry.tipo) === normalize("Isotank 20'"));
    if (operation) {
      if (operation.cargas == null && cargo?.codigo) operation.cargas = cargo.codigo;
      if (operation.conteineres == null && container?.codigo && cargo?.codigo) operation.conteineres = container.codigo;
    }
    changed = true;
  }
  catalog.operationLinksVersion = 1;
  const operationCodes = new Set(catalog.operacao.map((entry) => entry.codigo).filter(Boolean));
  let nextOperation = Number.isSafeInteger(data.nextOperationCode) && data.nextOperationCode > 0 ? data.nextOperationCode : 1;
  for (const code of operationCodes) {
    const match = /^OPR-(\d+)$/i.exec(code);
    if (match) nextOperation = Math.max(nextOperation, Number(match[1]) + 1);
  }
  for (const entry of catalog.operacao) {
    if (entry.codigo) continue;
    while (operationCodes.has(operationCode(nextOperation))) nextOperation++;
    entry.codigo = operationCode(nextOperation++);
    operationCodes.add(entry.codigo);
    changed = true;
  }
  catalog.nextOperationCode = nextOperation;
  for (const entry of catalog.servico) {
    if (entry.codigo) continue;
    while (used.has(serviceCode(next))) next++;
    entry.codigo = serviceCode(next++);
    used.add(entry.codigo);
    changed = true;
  }
  catalog.nextServiceCode = next;
  if (data.solicitationReferenceVersion !== 1) {
    for (const reference of catalogoSolicitacoes) {
      const serviceCodes = (reference.servicos || []).flatMap((name) => {
        const matches = catalog.servico.filter((service) => normalize(service.nome) === normalize(name));
        return matches.length === 1 ? [matches[0].codigo] : [];
      });
      const existing = catalog.solicitacao.find((entry) => normalize(entry.servico) === normalize(reference.categoria));
      if (existing) {
        if (existing.categoria == null) existing.categoria = reference.categoria;
        if (existing.descricao == null) existing.descricao = reference.descricao;
        if (existing.servicos == null) existing.servicos = serviceCodes.join(", ");
      } else {
        catalog.solicitacao.push({
          id: createId(), servico: reference.categoria, categoria: reference.categoria,
          descricao: reference.descricao, servicos: serviceCodes.join(", "),
        });
      }
    }
    changed = true;
  }
  catalog.solicitationReferenceVersion = 1;
  const solicitationCodes = new Set(catalog.solicitacao.map((entry) => entry.codigo).filter(Boolean));
  let nextSolicitation = Number.isSafeInteger(data.nextSolicitationCode) && data.nextSolicitationCode > 0 ? data.nextSolicitationCode : 1;
  for (const code of solicitationCodes) {
    const match = /^SOL-(\d+)$/i.exec(code);
    if (match) nextSolicitation = Math.max(nextSolicitation, Number(match[1]) + 1);
  }
  for (const entry of catalog.solicitacao) {
    if (entry.codigo) continue;
    while (solicitationCodes.has(solicitationCode(nextSolicitation))) nextSolicitation++;
    entry.codigo = solicitationCode(nextSolicitation++);
    solicitationCodes.add(entry.codigo);
    changed = true;
  }
  catalog.nextSolicitationCode = nextSolicitation;
  if (data.budgetReferenceVersion !== 1) {
    for (const [item, nome, categoria, regras] of catalogoOrcamentos) {
      if (catalog.orcamento.some((entry) => normalize(entry.servico) === normalize(`${item} — ${nome}`))) continue;
      catalog.orcamento.push({
        id: createId(), servico: `${item} — ${nome}`, categoria, regras,
        fonte: fonteTarifariaHistorica, historico: true,
      });
    }
    changed = true;
  }
  catalog.budgetReferenceVersion = 1;
  if (data.budgetDetailsVersion !== 1) {
    const containerLinks = {
      "2.1.2.2.24": ["Reefer 20'", "Reefer 40' HC"],
      "2.1.2.2.35": ["Open Top 20'", "Open Top 40'", "Flat Rack 20'", "Flat Rack 40'"],
    };
    for (const [item, nome, , regras] of catalogoOrcamentos) {
      const entry = catalog.orcamento.find((record) => record.historico && normalize(record.servico) === normalize(`${item} — ${nome}`));
      if (!entry) continue;
      if (entry.tarifas == null && entry.regras === regras) {
        entry.tarifas = tarifasPadrao(item);
        const options = parseTarifas(entry.tarifas);
        if (entry.valorEstimado == null && options.length === 1 && item !== "2.1.2.1.3") entry.valorEstimado = options[0].value;
      }
      if (entry.observacoes == null) entry.observacoes = "Referência de 2017. Confirme condições, adicionais e impostos antes de usar.";
      if (entry.servicos == null) {
        entry.servicos = catalog.servico.filter((service) => normalize(service.nome) === normalize(nome)).map((service) => service.codigo).join(", ");
      }
      if (entry.conteineres == null && containerLinks[item]) {
        entry.conteineres = containerLinks[item].map((tipo) => catalog.conteiner.find((container) => normalize(container.tipo) === normalize(tipo))?.codigo).filter(Boolean).join(", ");
      }
    }
    changed = true;
  }
  catalog.budgetDetailsVersion = 1;
  if (data.explicitBudgetContainerLinksVersion !== 1) {
    const explicitLinks = {
      "2.1.2.1.7": ["Open Top 20'", "Open Top 40'", "Flat Rack 20'", "Flat Rack 40'"],
      "2.1.2.1.8": ["Dry Box 20'", "Dry Box 40'"],
    };
    for (const [item, nome, , regras] of catalogoOrcamentos) {
      if (!explicitLinks[item]) continue;
      const entry = catalog.orcamento.find((record) => record.historico && normalize(record.servico) === normalize(`${item} — ${nome}`));
      if (!entry || entry.conteineres != null || entry.regras !== regras) continue;
      const codes = explicitLinks[item].map((tipo) => catalog.conteiner.find((container) => normalize(container.tipo) === normalize(tipo))?.codigo).filter(Boolean);
      if (codes.length) entry.conteineres = codes.join(", ");
    }
    changed = true;
  }
  catalog.explicitBudgetContainerLinksVersion = 1;
  const budgetCodes = new Set(catalog.orcamento.map((entry) => entry.codigo).filter(Boolean));
  let nextBudget = Number.isSafeInteger(data.nextBudgetCode) && data.nextBudgetCode > 0 ? data.nextBudgetCode : 1;
  for (const code of budgetCodes) {
    const match = /^ORC-(\d+)$/i.exec(code);
    if (match) nextBudget = Math.max(nextBudget, Number(match[1]) + 1);
  }
  for (const entry of catalog.orcamento) {
    if (entry.codigo) continue;
    while (budgetCodes.has(budgetCode(nextBudget))) nextBudget++;
    entry.codigo = budgetCode(nextBudget++);
    budgetCodes.add(entry.codigo);
    changed = true;
  }
  catalog.nextBudgetCode = nextBudget;
  if (changed && globalThis.localStorage) writeStorage(DATABASE_CATALOG_KEY, catalog);
  return catalog;
}

export function readDatabaseEntries(categoryId) {
  if (!categoryById.has(categoryId)) throw new Error("Categoria do Banco de dados inválida.");
  return readDatabaseCatalog()[categoryId];
}

export function findDatabaseEntry(categoryId, field, value) {
  const sought = normalize(value);
  if (!sought) return null;
  return readDatabaseEntries(categoryId).find((entry) => normalize(entry[field]) === sought) || null;
}

export function saveDatabaseEntry(categoryId, values, id = "") {
  const category = categoryById.get(categoryId);
  if (!category) throw new Error("Categoria do Banco de dados inválida.");
  const record = Object.fromEntries(category.fields.map(({ name }) => [name, values[name] ?? ""]));
  if (!String(record[category.lookupField] ?? "").trim()) throw new Error(`Preencha ${category.fields.find(({ name }) => name === category.lookupField)?.label || "o tipo ou nome"} para salvar o registro.`);
  for (const field of category.fields) {
    if (field.required && !String(record[field.name] ?? "").trim()) throw new Error(`O campo “${field.label}” é obrigatório.`);
    if (field.type === "number" && record[field.name] !== "" && !Number.isFinite(Number(record[field.name]))) throw new Error(`O campo “${field.label}” deve ser numérico.`);
    if (field.type === "number" && record[field.name] !== "") record[field.name] = Number(record[field.name]);
  }
  if (categoryId === "orcamento" && record.valorEstimado !== "" && record.valorEstimado < 0) throw new Error("O valor estimado não pode ser negativo.");
  if (categoryId === "orcamento") parseTarifas(record.tarifas);
  const catalog = readDatabaseCatalog();
  const entries = catalog[categoryId];
  if (categoryId === "carga") {
    for (const [field, linkedCategory] of [["conteineres", "conteiner"], ["servicos", "servico"]]) {
      const codes = String(record[field] || "").split(",").map((code) => code.trim().toUpperCase()).filter(Boolean);
      const invalid = codes.find((code) => !catalog[linkedCategory].some((entry) => normalize(entry.codigo) === normalize(code)));
      if (invalid) throw new Error(`ID de ${getDatabaseCategory(linkedCategory).label.toLowerCase()} não encontrado: ${invalid}.`);
      record[field] = [...new Set(codes)].join(", ");
    }
  }
  if (["operacao", "orcamento", "solicitacao"].includes(categoryId)) {
    const links = categoryId !== "operacao"
      ? [["servicos", "servico"], ["cargas", "carga"], ["conteineres", "conteiner"], ["operacoes", "operacao"], ...(categoryId === "solicitacao" ? [["orcamentos", "orcamento"]] : [])]
      : [["cargas", "carga"], ["conteineres", "conteiner"]];
    for (const [field, linkedCategory] of links) {
      const codes = String(record[field] || "").split(",").map((code) => code.trim().toUpperCase()).filter(Boolean);
      const invalid = codes.find((code) => !catalog[linkedCategory].some((entry) => normalize(entry.codigo) === normalize(code)));
      if (invalid) throw new Error(`ID de ${getDatabaseCategory(linkedCategory).label.toLowerCase()} não encontrado: ${invalid}.`);
      record[field] = [...new Set(codes)].join(", ");
    }
  }
  if (entries.some((entry) => String(entry.id) !== String(id) && normalize(entry[category.lookupField]) === normalize(record[category.lookupField]))) {
    throw new Error(`Já existe um registro para “${record[category.lookupField]}” nesta categoria.`);
  }
  if (id) {
    const index = entries.findIndex((entry) => String(entry.id) === String(id));
    if (index < 0) throw new Error("O registro não foi encontrado. Atualize o Banco de dados e tente novamente.");
    const previous = entries[index];
    if (categoryId === "servico") {
      record.codigo = previous.codigo;
      record.valorAtualizadoEm = record.valor !== previous.valor ? new Date().toISOString() : previous.valorAtualizadoEm;
    }
    if (categoryId === "conteiner") record.codigo = previous.codigo;
    if (categoryId === "carga") record.codigo = previous.codigo;
    if (categoryId === "operacao") record.codigo = previous.codigo;
    if (categoryId === "solicitacao") record.codigo = previous.codigo;
    if (categoryId === "orcamento") {
      record.codigo = previous.codigo;
      record.historico = previous.historico;
      record.fonte = previous.fonte;
      record.valorAtualizadoEm = record.valorEstimado !== previous.valorEstimado ? new Date().toISOString() : previous.valorAtualizadoEm;
    }
    entries[index] = { ...record, id };
  } else {
    if (categoryId === "servico") {
      record.codigo = serviceCode(catalog.nextServiceCode++);
      if (record.valor !== "") record.valorAtualizadoEm = new Date().toISOString();
    }
    if (categoryId === "conteiner") record.codigo = containerCode(catalog.nextContainerCode++);
    if (categoryId === "carga") record.codigo = cargoCode(catalog.nextCargoCode++);
    if (categoryId === "operacao") record.codigo = operationCode(catalog.nextOperationCode++);
    if (categoryId === "solicitacao") record.codigo = solicitationCode(catalog.nextSolicitationCode++);
    if (categoryId === "orcamento") {
      record.codigo = budgetCode(catalog.nextBudgetCode++);
      if (record.valorEstimado !== "") record.valorAtualizadoEm = new Date().toISOString();
    }
    entries.push({ ...record, id: createId() });
  }
  catalog[categoryId] = entries;
  writeStorage(DATABASE_CATALOG_KEY, catalog);
  return entries;
}

export function deleteDatabaseEntry(categoryId, id) {
  if (!categoryById.has(categoryId)) throw new Error("Categoria do Banco de dados inválida.");
  const catalog = readDatabaseCatalog();
  const entries = catalog[categoryId];
  if (!entries.some((entry) => String(entry.id) === String(id))) throw new Error("O registro não foi encontrado. Atualize o Banco de dados e tente novamente.");
  if (categoryId === "conteiner") {
    const code = entries.find((entry) => String(entry.id) === String(id)).codigo;
    if (catalog.carga.some((entry) => String(entry.conteineres || "").split(",").some((value) => normalize(value) === normalize(code)))) {
      throw new Error("Este contêiner está vinculado a cargas. Remova os vínculos nas referências de carga antes de excluí-lo.");
    }
  }
  if (categoryId === "servico") {
    const code = entries.find((entry) => String(entry.id) === String(id)).codigo;
    if (catalog.carga.some((entry) => String(entry.servicos || "").split(",").some((value) => normalize(value) === normalize(code)))) {
      throw new Error("Este serviço está vinculado a cargas. Remova os vínculos nas referências de carga antes de excluí-lo.");
    }
  }
  if (categoryId === "carga" || categoryId === "conteiner") {
    const code = entries.find((entry) => String(entry.id) === String(id)).codigo;
    const field = categoryId === "carga" ? "cargas" : "conteineres";
    if (catalog.operacao.some((entry) => String(entry[field] || "").split(",").some((value) => normalize(value) === normalize(code)))) {
      throw new Error("Esta referência está vinculada a operações. Remova os vínculos nas referências de operação antes de excluí-la.");
    }
  }
  const solicitationLinkFields = { servico: "servicos", carga: "cargas", conteiner: "conteineres", operacao: "operacoes", orcamento: "orcamentos" };
  if (solicitationLinkFields[categoryId]) {
    const code = entries.find((entry) => String(entry.id) === String(id)).codigo;
    if (catalog.solicitacao.some((entry) => String(entry[solicitationLinkFields[categoryId]] || "").split(",").some((value) => normalize(value) === normalize(code)))) {
      throw new Error("Esta referência está vinculada a solicitações. Remova os vínculos nas referências de solicitação antes de excluí-la.");
    }
  }
  const budgetLinkFields = { servico: "servicos", carga: "cargas", conteiner: "conteineres", operacao: "operacoes" };
  if (budgetLinkFields[categoryId]) {
    const code = entries.find((entry) => String(entry.id) === String(id)).codigo;
    if (catalog.orcamento.some((entry) => String(entry[budgetLinkFields[categoryId]] || "").split(",").some((value) => normalize(value) === normalize(code)))) {
      throw new Error("Esta referência está vinculada a orçamentos. Remova os vínculos nas referências de orçamento antes de excluí-la.");
    }
  }
  catalog[categoryId] = entries.filter((entry) => String(entry.id) !== String(id));
  writeStorage(DATABASE_CATALOG_KEY, catalog);
  return catalog[categoryId];
}

export function readSolicitationStates() {
  const stored = readStorage(DATABASE_SOLICITATION_KEY);
  if (stored === null) return {};
  try {
    const states = JSON.parse(stored);
    if (!states || typeof states !== "object" || Array.isArray(states)) throw new Error();
    return states;
  } catch {
    throw new Error("Os estados locais das solicitações estão inválidos.");
  }
}

export function saveSolicitationState(id, patch) {
  if (id == null || String(id).trim() === "") throw new Error("Identificador de solicitação inválido.");
  const states = readSolicitationStates();
  states[id] = { ...(states[id] || {}), ...patch };
  writeStorage(DATABASE_SOLICITATION_KEY, states);
  return states[id];
}

export function readResourceDetails() {
  const stored = readStorage(DATABASE_RESOURCE_DETAILS_KEY);
  if (stored === null) return {};
  try {
    const data = JSON.parse(stored);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
    return data;
  } catch {
    throw new Error("Os detalhes locais dos registros estão inválidos.");
  }
}

export function saveResourceDetails(categoryId, id, details) {
  if (!["carga", "conteiner", "operacao"].includes(categoryId) || id == null || !String(id).trim()) throw new Error("Identificador de registro inválido.");
  const data = readResourceDetails();
  const key = `${categoryId}:${id}`;
  if (details === null) delete data[key];
  else data[key] = details;
  writeStorage(DATABASE_RESOURCE_DETAILS_KEY, data);
}

export function readBudgetMetadata() {
  const stored = readStorage(DATABASE_BUDGET_KEY);
  if (stored === null) return {};
  try {
    const metadata = JSON.parse(stored);
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error();
    return metadata;
  } catch {
    throw new Error("Os dados locais dos orçamentos estão inválidos.");
  }
}

export function saveBudgetMetadata(id, patch) {
  if (id == null || String(id).trim() === "") throw new Error("Identificador de orçamento inválido.");
  const metadata = readBudgetMetadata();
  metadata[id] = { ...(metadata[id] || {}), ...patch };
  writeStorage(DATABASE_BUDGET_KEY, metadata);
  return metadata[id];
}

export function readServiceValues() {
  const stored = readStorage(DATABASE_SERVICE_VALUES_KEY);
  if (stored === null) return {};
  try {
    const values = JSON.parse(stored);
    if (!values || typeof values !== "object" || Array.isArray(values)) throw new Error();
    return values;
  } catch {
    throw new Error("Os valores locais dos serviços estão inválidos.");
  }
}

export function saveServiceValue(id, value) {
  if (id == null || String(id).trim() === "") throw new Error("Identificador de serviço inválido.");
  if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) throw new Error("Informe um valor de serviço válido.");
  const values = readServiceValues();
  if (value === "") delete values[id];
  else {
    const numeric = Number(value);
    const previous = values[id];
    values[id] = { valor: numeric, atualizadoEm: previous?.valor === numeric ? previous.atualizadoEm : new Date().toISOString() };
  }
  writeStorage(DATABASE_SERVICE_VALUES_KEY, values);
}

export function getDatabaseCategory(categoryId) {
  return categoryById.get(categoryId) || null;
}
