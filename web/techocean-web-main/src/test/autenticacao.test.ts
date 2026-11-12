import { afterEach, describe, expect, it, vi } from "vitest";
import { loginSchema } from "@/models/autenticacao";
import { buscarSessao, criarSessao, encerrarSessao } from "@/repositories/autenticacao";

afterEach(() => vi.unstubAllGlobals());

describe("Acesso ao painel", () => {
  it("exige uma senha com pelo menos 8 caracteres", () => {
    expect(loginSchema.safeParse({ email: "usuario@empresa.com", senha: "1234567" }).success).toBe(
      false,
    );
    expect(loginSchema.safeParse({ email: "usuario@empresa.com", senha: "senha123" }).success).toBe(
      true,
    );
  });

  it("envia e-mail e senha ao login com credenciais de sessão", async () => {
    const usuario = { id: 1, nome: "Ana", email: "ana@empresa.com" };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(usuario));
    vi.stubGlobal("fetch", fetchMock);
    await expect(criarSessao({ email: usuario.email, senha: "senha123" })).resolves.toEqual(
      usuario,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/login$/),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email: usuario.email, senha: "senha123" }),
      }),
    );
  });

  it("considera a sessão ausente quando o servidor responde 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    await expect(buscarSessao()).resolves.toBeNull();
  });

  it("encerra a sessão pelo servidor", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await encerrarSessao();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
