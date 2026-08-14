import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { calcularTempoRestante, useCountdown } from "./useCountdown";

describe("calcularTempoRestante", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calcula corretamente dias, horas, minutos e segundos restantes", () => {
    const agora = new Date("2026-01-01T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(agora);

    // 2 dias, 3 horas, 4 minutos e 5 segundos no futuro.
    const alvo = new Date(agora.getTime() + (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000).toISOString();
    const resultado = calcularTempoRestante(alvo);

    expect(resultado.chegou).toBe(false);
    expect(resultado.dias).toBe(2);
    expect(resultado.horas).toBe(3);
    expect(resultado.minutos).toBe(4);
    expect(resultado.segundos).toBe(5);
  });

  it("indica 'chegou: true' quando a data alvo já passou", () => {
    const resultado = calcularTempoRestante(new Date(Date.now() - 1000).toISOString());
    expect(resultado.chegou).toBe(true);
    expect(resultado.dias).toBe(0);
    expect(resultado.horas).toBe(0);
  });

  it("indica 'chegou: true' no exato instante da data alvo", () => {
    const agora = new Date();
    vi.useFakeTimers();
    vi.setSystemTime(agora);
    const resultado = calcularTempoRestante(agora.toISOString());
    expect(resultado.chegou).toBe(true);
  });
});

describe("useCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("atualiza o tempo restante a cada segundo", () => {
    vi.useFakeTimers();
    const agora = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(agora);

    const alvo = new Date(agora.getTime() + 5000).toISOString();
    const { result } = renderHook(() => useCountdown(alvo));

    expect(result.current.segundos).toBe(5);
    expect(result.current.chegou).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.segundos).toBe(2);
  });

  it("marca como concluído quando o tempo se esgota", () => {
    vi.useFakeTimers();
    const agora = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(agora);

    const alvo = new Date(agora.getTime() + 1000).toISOString();
    const { result } = renderHook(() => useCountdown(alvo));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.chegou).toBe(true);
  });
});
