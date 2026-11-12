import { beforeEach, describe, expect, it } from "vitest";
import { DATABASE_CATALOG_KEY, readDatabaseEntries, saveDatabaseEntry } from "../legacy/database-catalog.js";

describe("container cargo associations", () => {
  beforeEach(() => localStorage.clear());

  it("links a container to selected cargo types and preserves its ID", () => {
    const container = readDatabaseEntries("conteiner").find((entry) => entry.tipo === "Flat Rack 20'");
    const cargos = readDatabaseEntries("carga");
    saveDatabaseEntry("conteiner", { ...container, cargas: cargos[1].codigo }, container.id);
    const saved = readDatabaseEntries("conteiner").find((entry) => entry.id === container.id);
    expect(saved.codigo).toBe(container.codigo);
    expect(saved.cargas).toBe(cargos[1].codigo);
    expect(readDatabaseEntries("carga")[1].conteineres.split(", ")).toContain(container.codigo);
    expect(readDatabaseEntries("carga")[0].conteineres.split(", ")).not.toContain(container.codigo);
  });

  it("links every cargo type to valid containers, including existing local catalogs", () => {
    const cargos = readDatabaseEntries("carga");
    const containers = readDatabaseEntries("conteiner");
    const containerIds = new Set(containers.map((entry) => entry.codigo));

    expect(cargos).toHaveLength(4);
    for (const cargo of cargos) {
      const links = cargo.conteineres.split(", ").filter(Boolean);
      expect(links.length).toBeGreaterThan(0);
      expect(links.every((code) => containerIds.has(code))).toBe(true);
    }
    for (const container of containers) {
      expect(container.cargas).toBeTruthy();
    }

    const stored = JSON.parse(localStorage.getItem(DATABASE_CATALOG_KEY));
    stored.cargoContainerLinksVersion = undefined;
    stored.carga.find((entry) => entry.tipoCarga === "Granéis Sólidos").conteineres = "";
    localStorage.setItem(DATABASE_CATALOG_KEY, JSON.stringify(stored));

    const migratedCargos = readDatabaseEntries("carga");
    expect(migratedCargos.find((entry) => entry.tipoCarga === "Granéis Sólidos").conteineres).toBeTruthy();
  });

  it("reflects cargo-side edits on the container side", () => {
    const container = readDatabaseEntries("conteiner")[0];
    const cargo = readDatabaseEntries("carga")[1];
    saveDatabaseEntry("carga", { ...cargo, conteineres: container.codigo }, cargo.id);
    expect(readDatabaseEntries("conteiner")[0].cargas.split(", ")).toContain(cargo.codigo);
  });

  it("rejects nonexistent cargo IDs without modifying existing links", () => {
    const container = readDatabaseEntries("conteiner")[0];
    expect(() => saveDatabaseEntry("conteiner", { ...container, cargas: "CRG-999999" }, container.id)).toThrow("ID de carga não encontrado");
    expect(readDatabaseEntries("conteiner")[0].cargas).toBe(container.cargas);
  });
});