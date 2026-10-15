import { afterEach, describe, expect, it, vi } from "vitest";
import { cargaSchema } from "@/models/carga";
import { cadastrarCarga, listarCargas } from "@/services/cargas";

const carga = { descricao: "Bobinas de aço", peso: 24.5, volume: 12.8, tipoCarga: "Bobinas", origem: "Santos", destino: "Recife" };
afterEach(() => vi.unstubAllGlobals());

describe("Modelo de carga enviado pelo usuário", () => {
  for (const campo of ["descricao", "peso", "volume", "tipoCarga", "origem", "destino"] as const) {
    it(`exige ${campo}`, () => {
      const dados: Record<string, unknown> = { ...carga };
      delete dados[campo];
      expect(cargaSchema.safeParse(dados).success).toBe(false);
    });
  }
  it("aceita peso e volume decimais", () => {
    expect(cargaSchema.parse(carga)).toEqual(carga);
  });
  it("não exige id no cadastro", () => {
    expect(cargaSchema.parse(carga)).not.toHaveProperty("id");
  });
});

describe("Integração de cargas", () => {
  it("envia apenas os campos do modelo para POST /cargas", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    await cadastrarCarga(carga);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/cargas$/), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(carga),
    });
  });
  it("não envia carga sem destino", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(cadastrarCarga({ ...carga, destino: "" })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("lê uma lista com o id gerado pelo servidor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([{ id: 7, ...carga }])));
    expect(await listarCargas()).toEqual([{ id: 7, ...carga }]);
  });
  it("lê uma página Spring", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ content: [{ id: 7, ...carga }] })));
    expect(await listarCargas()).toEqual([{ id: 7, ...carga }]);
  });
  it("não trata falha do servidor como sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "Carga recusada" }, { status: 400 })));
    await expect(cadastrarCarga(carga)).rejects.toThrow("Carga recusada");
  });
});