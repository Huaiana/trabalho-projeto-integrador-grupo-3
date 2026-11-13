import { describe, expect, it } from "vitest";
import { renderBudgets, renderCrudSection, renderMessages } from "../legacy/main.js";

describe("dashboard panels", () => {
  it("shows message read and reply states with view and reply actions", () => {
    const markup = renderMessages([
      { id: 1, nome: "Ana", email: "ana@example.com", conteudo: "Preciso de ajuda.", lida: false },
      { id: 2, nome: "João", email: "joao@example.com", conteudo: "Obrigado.", lida: true, resposta: "Estamos à disposição." },
    ]);

    expect(markup).toContain("Não lidas");
    expect(markup).toContain("Lidas");
    expect(markup).toContain("Não respondida");
    expect(markup).toContain("Respondida");
    expect(markup).toContain('data-message-action="view"');
    expect(markup).toContain("data-message-toggle-reply");
    expect(markup).toContain("Enviar");
    expect(markup).not.toContain('data-reload');
  });

  it.each([
    ["cliente", "Cliente"],
    ["conteiner", "Contêiner"],
    ["operacao", "Operação"],
    ["servico", "Serviço"],
    ["agendamento", "Agendamento"],
  ])("omits the refresh control from the %s panel", (slug, name) => {
    const markup = renderCrudSection([], { slug, name, columns: [] });
    expect(markup).not.toContain('data-reload');
  });

  it("omits the refresh control from the budget panel", () => {
    expect(renderBudgets([])).not.toContain('data-reload');
  });
});
