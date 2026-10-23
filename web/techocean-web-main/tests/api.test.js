import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, post, postPublic, postWithHeaders, putParams, ApiError, API_BASE_URL, LOCAL_API_URL, PRODUCTION_API_URL, resolveApiBaseUrl, setAccessToken, clearAccessToken, getAccessToken } from "../src/api.js";

afterEach(() => { vi.unstubAllGlobals(); clearAccessToken(); });

describe("API client", () => {
  it("uses the same-origin Vite proxy in development and the deployed API in production by default", () => {
    expect(resolveApiBaseUrl({ DEV: true })).toBe(LOCAL_API_URL);
    expect(LOCAL_API_URL).toBe("/api");
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

  it("adds the in-memory Bearer token to protected API requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 11 }));
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("ephemeral-access-token");

    await apiRequest("/admin/me");

    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer ephemeral-access-token");
    expect(getAccessToken()).toBe("ephemeral-access-token");
  });

  it("keeps public posts anonymous even when an admin token is in memory", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 12 }));
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("ephemeral-access-token");

    await postPublic("/mensagens/contatos", { nome: "Ana", email: "ana@example.com", conteudo: "Oi" });

    expect(fetchMock.mock.calls[0][1].headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.stringify(fetchMock.mock.calls[0][1].headers)).not.toContain("Authorization");
  });

  it("sends first-admin setup token only as the requested header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 1 }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("existing-token");
    const data = { nome: "Admin", email: "admin@example.com", senha: "Secret123" };

    await postWithHeaders("/admin/setup", data, { "X-Admin-Setup-Token": "one-time-setup-secret" }, { authenticated: false });

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      "Content-Type": "application/json",
      "X-Admin-Setup-Token": "one-time-setup-secret",
    });
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify(data));
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
    await expect(apiRequest("/clientes")).rejects.toThrow("localhost:8080");
  });
});
