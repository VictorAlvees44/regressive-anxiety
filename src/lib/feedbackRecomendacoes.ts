const CHAVE_FEEDBACK = "regressive-anxiety:feedback-recomendacoes";
const LIMITE_HISTORICO = 250;

export interface FeedbackRecomendacoes {
  positivas: string[];
  ocultadas: string[];
}

function feedbackVazio(): FeedbackRecomendacoes {
  return { positivas: [], ocultadas: [] };
}

function idsValidos(valores: unknown): string[] {
  if (!Array.isArray(valores)) return [];
  return [...new Set(valores.filter((valor): valor is string => typeof valor === "string" && valor.length > 0))]
    .slice(-LIMITE_HISTORICO);
}

/** O histórico de aprendizado fica somente neste aparelho. */
export function carregarFeedbackRecomendacoes(): FeedbackRecomendacoes {
  try {
    const valor = localStorage.getItem(CHAVE_FEEDBACK);
    if (!valor) return feedbackVazio();
    const feedback = JSON.parse(valor) as Partial<FeedbackRecomendacoes>;
    return {
      positivas: idsValidos(feedback.positivas),
      ocultadas: idsValidos(feedback.ocultadas),
    };
  } catch {
    return feedbackVazio();
  }
}

export function salvarFeedbackRecomendacoes(feedback: FeedbackRecomendacoes): void {
  localStorage.setItem(CHAVE_FEEDBACK, JSON.stringify(feedback));
}

export function registrarInteresse(feedback: FeedbackRecomendacoes, idExterno: string): FeedbackRecomendacoes {
  return {
    positivas: idsValidos([...feedback.positivas, idExterno]),
    ocultadas: feedback.ocultadas.filter((id) => id !== idExterno),
  };
}

export function registrarDesinteresse(feedback: FeedbackRecomendacoes, idExterno: string): FeedbackRecomendacoes {
  return {
    positivas: feedback.positivas.filter((id) => id !== idExterno),
    ocultadas: idsValidos([...feedback.ocultadas, idExterno]),
  };
}
