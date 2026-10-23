import { describe, expect, it, vi } from "vitest";
import {
  clearRegistrationValidation,
  closeModal,
  renderMessages,
  renderResourceTable,
  roleCapabilities,
  scrollActiveChipIntoView,
  trapFocusWithinModal,
  visibleSectionSlugs,
} from "../src/main.js";

describe("DOM interface helpers", () => {
  it("keeps the refresh action visible when the inbox has messages", () => {
    const markup = renderMessages([{ id: 2, nome: "Ana Souza", email: "ana@example.com", conteudo: "Olá" }]);

    expect(markup).toContain("Caixa de entrada");
    expect(markup).toContain('data-reload');
    expect(markup).toContain("Ana Souza");
  });

  it("clears old validation messages and aria-invalid before a new registration attempt", () => {
    const invalidInput = { removeAttribute: vi.fn() };
    const fieldMessage = { remove: vi.fn() };
    const generalMessage = { textContent: "CPF já cadastrado." };
    const form = {
      querySelectorAll: vi.fn((selector) => selector.includes("aria-invalid") ? [invalidInput] : [fieldMessage]),
      querySelector: vi.fn(() => generalMessage),
    };

    clearRegistrationValidation(form);

    expect(invalidInput.removeAttribute).toHaveBeenCalledWith("aria-invalid");
    expect(fieldMessage.remove).toHaveBeenCalledOnce();
    expect(generalMessage.textContent).toBe("");
  });

  it("scrolls the selected dashboard chip into view only on mobile", () => {
    const chip = { scrollIntoView: vi.fn() };
    const nav = { querySelector: vi.fn(() => chip) };

    scrollActiveChipIntoView(nav, false);
    expect(nav.querySelector).not.toHaveBeenCalled();
    scrollActiveChipIntoView(nav, true);
    expect(nav.querySelector).toHaveBeenCalledWith(".mobile-chip.active");
    expect(chip.scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest", behavior: "smooth" });
  });

  it("wraps Tab and Shift+Tab around modal focusable controls", () => {
    const makeFocusable = () => ({
      disabled: false,
      getAttribute: vi.fn(() => null),
      closest: vi.fn(() => null),
      focus: vi.fn(),
    });
    const first = makeFocusable();
    const middle = makeFocusable();
    const last = makeFocusable();
    const modal = {
      querySelectorAll: vi.fn(() => [first, middle, last]),
      contains: vi.fn(() => true),
      focus: vi.fn(),
    };
    const tabForward = { key: "Tab", shiftKey: false, preventDefault: vi.fn() };
    const tabBackward = { key: "Tab", shiftKey: true, preventDefault: vi.fn() };

    trapFocusWithinModal(tabForward, modal, last);
    trapFocusWithinModal(tabBackward, modal, first);

    expect(tabForward.preventDefault).toHaveBeenCalledOnce();
    expect(first.focus).toHaveBeenCalledOnce();
    expect(tabBackward.preventDefault).toHaveBeenCalledOnce();
    expect(last.focus).toHaveBeenCalledOnce();
  });

  it("does not intercept Tab while focus is between the modal boundaries", () => {
    const makeFocusable = () => ({ disabled: false, getAttribute: () => null, closest: () => null, focus: vi.fn() });
    const first = makeFocusable();
    const middle = makeFocusable();
    const last = makeFocusable();
    const modal = { querySelectorAll: () => [first, middle, last], contains: () => true };
    const event = { key: "Tab", shiftKey: false, preventDefault: vi.fn() };

    trapFocusWithinModal(event, modal, middle);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("restores focus to the connected control that opened the modal", () => {
    const root = { replaceChildren: vi.fn() };
    const opener = { isConnected: true, focus: vi.fn() };

    closeModal(root, opener);

    expect(root.replaceChildren).toHaveBeenCalledOnce();
    expect(opener.focus).toHaveBeenCalledOnce();
  });

  it("applies staff role permissions to operational deletion and admin-only sections", () => {
    expect(roleCapabilities("ADMIN")).toMatchObject({ canDeleteOperational: true, canManageStaff: true, canViewAudit: true, canViewSessions: true });
    expect(roleCapabilities("SUPERVISOR")).toMatchObject({ canCreateOperational: true, canUpdateOperational: true, canDeleteOperational: true, canManageStaff: false, canViewAudit: false });
    expect(roleCapabilities("FUNCIONARIO")).toMatchObject({ canReadOperational: true, canCreateOperational: true, canUpdateOperational: true, canDeleteOperational: false, canManageStaff: false });
    expect(visibleSectionSlugs("FUNCIONARIO")).not.toEqual(expect.arrayContaining(["usuario", "auditoria", "sessoes"]));
    expect(visibleSectionSlugs("ADMIN")).toEqual(expect.arrayContaining(["usuario", "auditoria", "sessoes"]));
  });

  it("renders operational CRUD actions by role and escapes returned fields", () => {
    const record = { id: 4, numeroConteiner: '<img src=x onerror="alert(1)">', tipo: "40 HC", situacao: "Disponível" };
    const staffMarkup = renderResourceTable([record], "conteiner", "FUNCIONARIO");
    const supervisorMarkup = renderResourceTable([record], "conteiner", "SUPERVISOR");

    expect(staffMarkup).toContain('data-resource-action="view"');
    expect(staffMarkup).toContain('data-resource-action="edit"');
    expect(staffMarkup).not.toContain('data-resource-action="delete"');
    expect(supervisorMarkup).toContain('data-resource-action="delete"');
    expect(staffMarkup).not.toContain('<img src=x');
    expect(staffMarkup).toContain("&lt;img");
  });
});
