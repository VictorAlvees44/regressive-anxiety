import { describe, it, expect } from "vitest";
import { gerarMensagemNotificacao, categoriaParaTipoTemplate, hashString } from "./notificacoes.js";

describe("functions/notificacoes", () => {
  describe("categoriaParaTipoTemplate", () => {
    it("mapeia categorias conhecidas para o tipo de template correspondente", () => {
      expect(categoriaParaTipoTemplate("cartoes")).toBe("cartao");
      expect(categoriaParaTipoTemplate("viagens")).toBe("viagem");
      expect(categoriaParaTipoTemplate("jogos")).toBe("jogos");
    });

    it("cai em 'generico' para categorias sem template dedicado", () => {
      expect(categoriaParaTipoTemplate("financeiro")).toBe("generico");
      expect(categoriaParaTipoTemplate("categoria-desconhecida")).toBe("generico");
    });
  });

  describe("hashString", () => {
    it("é determinístico para a mesma entrada", () => {
      expect(hashString("evento-123-no-dia")).toBe(hashString("evento-123-no-dia"));
    });

    it("sempre retorna um número não negativo", () => {
      expect(hashString("qualquer-coisa")).toBeGreaterThanOrEqual(0);
    });
  });

  describe("gerarMensagemNotificacao", () => {
    it("gera uma mensagem com título e gatilho substituídos", () => {
      const mensagem = gerarMensagemNotificacao("viagem", "3-dias-antes", "Praia", 0);
      expect(mensagem).toContain("Praia");
      expect(mensagem).toContain("3 dias");
    });

    it("usa os templates específicos de pré-venda quando o gatilho é pre-venda-hoje", () => {
      const mensagem = gerarMensagemNotificacao("filmes", "pre-venda-hoje", "Avatar 3", 0);
      expect(mensagem).toContain("Avatar 3");
      expect(mensagem.toLowerCase()).toContain("pré-venda");
    });
  });
});
