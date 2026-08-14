import { describe, it, expect } from "vitest";
import { cn, formatarData, gerarId } from "./utils";

describe("cn", () => {
  it("combina múltiplas classes em uma única string", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("aplica classes condicionalmente via objeto", () => {
    expect(cn("base", { ativo: true, oculto: false })).toBe("base ativo");
  });
});

describe("formatarData", () => {
  it("formata uma data ISO em português, sem horário por padrão", () => {
    const resultado = formatarData("2026-08-20T12:00:00.000Z");
    expect(resultado).toContain("2026");
    expect(resultado.toLowerCase()).toContain("agosto");
    // Sem horário: não deve conter separador de "às" nem dois-pontos de hora.
    expect(resultado).not.toMatch(/\d{2}:\d{2}/);
  });

  it("inclui hora quando comHorario=true", () => {
    const resultado = formatarData("2026-08-20T12:00:00.000Z", true);
    expect(resultado).toMatch(/\d{2}:\d{2}/);
  });
});

describe("gerarId", () => {
  it("gera ids únicos com o prefixo informado", () => {
    const id1 = gerarId("evt");
    const id2 = gerarId("evt");
    expect(id1).toMatch(/^evt-/);
    expect(id2).toMatch(/^evt-/);
    expect(id1).not.toBe(id2);
  });

  it("usa o prefixo padrão quando nenhum é informado", () => {
    expect(gerarId()).toMatch(/^id-/);
  });
});
