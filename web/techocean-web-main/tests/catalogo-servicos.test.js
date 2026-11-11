import { describe, expect, it } from "vitest";
import { catalogoServicos, formatarTarifaServico, localizarTarifaServico } from "../src/catalogo-servicos.js";

describe("catálogo de tarifas", () => {
  it("organizes service references by category and preserves conventional values", () => {
    expect(catalogoServicos).toHaveLength(7);
    expect(catalogoServicos[0].servicos[0]).toMatchObject({
      nome: "Mercadoria não conteinerizada — Cabotagem",
      valor: 1.67,
    });
    expect(formatarTarifaServico({ valor: null })).toBe("Convencional");
    expect(formatarTarifaServico({ valor: 34.68 })).toBe("R$ 34,68");
  });

  it("finds a catalog tariff by service name regardless of accents or case", () => {
    expect(localizarTarifaServico("ACESSO DE VEÍCULO — AUTOMÓVEL")).toMatchObject({
      valor: 34.68,
      categoria: "Serviços diversos",
    });
    expect(localizarTarifaServico("serviço inexistente")).toBeNull();
  });
});
