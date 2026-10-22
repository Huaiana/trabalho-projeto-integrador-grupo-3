import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, post, putParams, ApiError, API_BASE_URL, LOCAL_API_URL, PRODUCTION_API_URL, resolveApiBaseUrl } from "../src/api.js";

afterEach(() => vi.unstubAllGlobals());

describe("API client", () => {
  it("uses localhost in development and the deployed API in production when no override is configured", () => {
    expect(resolveApiBaseUrl({ DEV: true })).toBe(LOCAL_API_URL);
    expect(resolveApiBaseUrl({ DEV: false })).toBe(PRODUCTION_API_URL);
  });

  it("prefers VITE_API_URL over environment defaults", () => {
    expect(resolveApiBaseUrl({ DEV: true, VITE_API_URL: "https://api.example.com/" })).toBe("https://api.example.com");
  });

  it("uses the configurable API origin and requests a JSON resource", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([{ id: 4 }]));
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiRequest("/cargas")).resolves.toEqual([{ id: 4 }]);
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/cargas`, {});
  });

  it("serializes JSON request bodies for implemented endpoints", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 3 }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    await post("/mensagens/contatos", { nome: "Ana", email: "ana@example.com", conteudo: "Olá" });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/mensagens/contatos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "Ana", email: "ana@example.com", conteudo: "Olá" }),
    });
  });

  it("sends cargo fields as JSON for the backend's request-body contract", async () => {
    const cargo = { descricao: "Bobinas de aço", peso: 24.5, volume: 12, tipoCarga: "Bobinas", origem: "Santos", destino: "Recife" };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 7, ...cargo }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    await post("/cargas", cargo);
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/cargas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cargo),
    });
  });

  it("sends state updates using the implemented query-parameter contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 9 }));
    vi.stubGlobal("fetch", fetchMock);
    await putParams("/agendamentos/9/status", { status: "confirmado" });
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/agendamentos/9/status?status=confirmado`);
    expect(fetchMock.mock.calls[0][1]).toEqual({ method: "PUT" });
  });

  it("returns backend messages instead of treating failed writes as success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ code: "DUPLICADO", message: "CPF já cadastrado." }, { status: 409 })));
    await expect(post("/clientes", {})).rejects.toMatchObject({
      name: "ApiError",
      code: "DUPLICADO",
      status: 409,
      message: "CPF já cadastrado.",
    });
  });

  it("surfaces an actionable connection error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(apiRequest("/clientes")).rejects.toBeInstanceOf(ApiError);
    await expect(apiRequest("/clientes")).rejects.toThrow("VITE_API_URL");
  });
});
