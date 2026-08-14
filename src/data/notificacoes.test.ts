import { describe, it, expect } from "vitest";
import { gerarMensagemNotificacao } from "./notificacoes";

describe("gerarMensagemNotificacao", () => {
  it("substitui o placeholder {titulo} pelo título informado", () => {
    const mensagem = gerarMensagemNotificacao("jogos", "no-dia", "GTA VI", 0);
    expect(mensagem).toContain("GTA VI");
    expect(mensagem).not.toContain("{titulo}");
  });

  it("substitui o placeholder {dias} pelo rótulo do gatilho", () => {
    const mensagem = gerarMensagemNotificacao("filmes", "7-dias-antes", "Avatar 3", 0);
    expect(mensagem).toContain("7 dias");
    expect(mensagem).not.toContain("{dias}");
  });

  it("usa o rótulo 'hoje' para o gatilho no-dia", () => {
    const mensagem = gerarMensagemNotificacao("series", "no-dia", "Wednesday", 1);
    expect(mensagem).toContain("hoje");
  });

  it("cai no template genérico para um tipo desconhecido", () => {
    // @ts-expect-error propositalmente testando um tipo inválido em runtime
    const mensagem = gerarMensagemNotificacao("categoria-inexistente", "1-dia-antes", "Evento X", 0);
    expect(mensagem).toContain("Evento X");
    expect(mensagem).toContain("1 dia");
  });

  it("é determinístico: a mesma seed sempre produz a mesma mensagem", () => {
    const a = gerarMensagemNotificacao("jogos", "3-dias-antes", "The Witcher 4", 5);
    const b = gerarMensagemNotificacao("jogos", "3-dias-antes", "The Witcher 4", 5);
    expect(a).toBe(b);
  });

  it("varia a mensagem conforme a seed muda (dentro do número de templates disponíveis)", () => {
    const mensagens = new Set(
      Array.from({ length: 5 }, (_, seed) => gerarMensagemNotificacao("jogos", "no-dia", "Jogo", seed)),
    );
    expect(mensagens.size).toBeGreaterThan(1);
  });

  it("usa os templates específicos de pré-venda quando o gatilho é pre-venda-hoje", () => {
    const mensagem = gerarMensagemNotificacao("filmes", "pre-venda-hoje", "Avatar 3", 0);
    expect(mensagem).toContain("Avatar 3");
    expect(mensagem.toLowerCase()).toContain("pré-venda");
  });

  it("a mensagem de pré-venda não depende do tipo (mesmo com um tipo genérico, usa o texto de pré-venda)", () => {
    const mensagem = gerarMensagemNotificacao("generico", "pre-venda-hoje", "Filme X", 1);
    expect(mensagem.toLowerCase()).toContain("pré-venda");
  });
});
