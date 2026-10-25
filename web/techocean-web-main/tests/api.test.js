import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, getAppointmentAccounts, createManagedAppointment, updateManagedAppointment, post, postPublic, postWithHeaders, putParams, ApiError, API_BASE_URL, LOCAL_API_URL, PRODUCTION_API_URL, resolveApiBaseUrl, setAccessToken, clearAccessToken, getAccessToken } from "../src/api.js";

afterEach(() => { vi.unstubAllGlobals(); clearAccessToken(); });

describe("API client", () => {
  it("uses the same-origin Vite proxy in development and requires a production API URL", () => {
    expect(resolveApiBaseUrl({ DEV: true })).toBe(LOCAL_API_URL);
    expect(LOCAL_API_URL).toBe("/api");
    expect(resolveApiBaseUrl({ DEV: false })).toBe("");
    expect(PRODUCTION_API_URL).toBe("");
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

  it("loads appointment accounts through the authenticated account-list route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([{ id: 21, nome: "Marina", email: "marina@example.com" }]));
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("staff-token");

    await expect(getAppointmentAccounts()).resolves.toEqual([{ id: 21, nome: "Marina", email: "marina@example.com" }]);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/agendamentos/usuarios`);
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer staff-token");
  });

  it("posts staff-managed appointments with the management route and DTO fields", async () => {
    const payload = { usuarioId: 21, telefone: "13999990000", dataHora: "2026-10-25T10:30:00", confirmado: true };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 4, ...payload }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("manager-token");

    await createManagedAppointment(payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/agendamentos/gerenciamento`);
    expect(options.method).toBe("POST");
    expect(options.headers.get("Authorization")).toBe("Bearer manager-token");
    expect(options.body).toBe(JSON.stringify(payload));
  });

  it("updates managed appointments with PUT /agendamentos/{id} and the same DTO", async () => {
    const payload = { usuarioId: 21, telefone: "13999990000", dataHora: "2026-10-25T10:30:00", confirmado: false };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 4, ...payload }));
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("manager-token");

    await updateManagedAppointment("4/5", payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/agendamentos/4%2F5`);
    expect(options.method).toBe("PUT");
    expect(options.headers.get("Authorization")).toBe("Bearer manager-token");
    expect(options.body).toBe(JSON.stringify(payload));
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

  it("uses the shared admin login endpoint anonymously for both panel entry screens", async () => {
    const credentials = { email: "staff@example.com", senha: "Secret123" };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ accessToken: "temporary", user: { cargo: "SUPERVISOR" } }));
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("stale-token");

    await postPublic("/admin/login", credentials);

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/admin/login`);
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ "Content-Type": "application/json" });
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify(credentials));
  });

  it("keeps the public appointment guest flow anonymous on the original route", async () => {
    const payload = { nome: "Visitante", email: "visitante@example.com", telefone: "13999990000", cpf: "12345678900", senha: "Secret123", dataHora: "2026-10-25T10:30:00", confirmacao: true };
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: 13 }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("staff-token");

    await postPublic("/agendamentos", payload);

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/agendamentos`);
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ "Content-Type": "application/json" });
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify(payload));
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
