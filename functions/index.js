const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { gerarMensagemNotificacao, categoriaParaTipoTemplate, hashString } = require("./notificacoes");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const GATILHOS_POR_DIAS = { 7: "7-dias-antes", 3: "3-dias-antes", 1: "1-dia-antes", 0: "no-dia" };

/** Diferença em dias de calendário (ignora hora) entre hoje e a data do evento. */
function diasAteEvento(dataHoraISO, agora) {
  const dataEvento = new Date(dataHoraISO);
  const inicioEvento = new Date(dataEvento.getFullYear(), dataEvento.getMonth(), dataEvento.getDate());
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((inicioEvento.getTime() - inicioHoje.getTime()) / 86_400_000);
}

/** Busca todos os tokens de dispositivo registrados por qualquer administrador. */
async function buscarTodosOsTokens() {
  const snapshot = await db.collectionGroup("dispositivos").get();
  return snapshot.docs.map((d) => ({ ref: d.ref, token: d.data().token }));
}

/** Envia uma notificação para todos os tokens, removendo do Firestore os que forem inválidos. */
async function enviarParaTodos(tokens, titulo, corpo) {
  if (tokens.length === 0) return { enviados: 0 };

  const resposta = await messaging.sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    notification: { title: titulo, body: corpo },
    webpush: { fcmOptions: { link: "/" } },
  });

  await Promise.all(
    resposta.responses.map((resultado, indice) => {
      const codigo = resultado.error?.code;
      const tokenInvalido =
        codigo === "messaging/invalid-registration-token" ||
        codigo === "messaging/registration-token-not-registered";
      return tokenInvalido ? tokens[indice].ref.delete() : Promise.resolve();
    }),
  );

  return { enviados: resposta.successCount };
}

async function registrarLog(dados) {
  await db.collection("logs").add({
    tipoAcao: "sincronizacao-notificacoes",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ...dados,
  });
}

/**
 * Lógica principal usada pela execução agendada diária.
 */
async function executarVerificacaoDeNotificacoes() {
  const agora = new Date();
  const ehSegundaFeira = agora.getDay() === 1;

  const [eventosSnapshot, tokens] = await Promise.all([db.collection("eventos").get(), buscarTodosOsTokens()]);

  let totalEnviado = 0;
  const eventosDaSemana = [];

  for (const documento of eventosSnapshot.docs) {
    const evento = documento.data();
    if (!evento.dataHoraISO || !evento.titulo) continue;

    const dias = diasAteEvento(evento.dataHoraISO, agora);
    if (dias >= 0 && dias <= 6) eventosDaSemana.push(evento.titulo);

    const gatilho = GATILHOS_POR_DIAS[dias];
    if (gatilho) {
      const tipo = categoriaParaTipoTemplate(evento.categoria);
      const seed = hashString(`${documento.id}-${gatilho}`);
      const mensagem = gerarMensagemNotificacao(tipo, gatilho, evento.titulo, seed);

      const { enviados } = await enviarParaTodos(tokens, "Regressive Anxiety", mensagem);
      totalEnviado += enviados;
    }

    // Pré-venda de ingressos (só filmes, e só quando o admin preencheu a
    // data manualmente — não existe API pública para essa informação).
    if (evento.dataPreVendaISO) {
      const diasPreVenda = diasAteEvento(evento.dataPreVendaISO, agora);
      if (diasPreVenda === 0) {
        const seedPreVenda = hashString(`${documento.id}-pre-venda-hoje`);
        const mensagemPreVenda = gerarMensagemNotificacao("filmes", "pre-venda-hoje", evento.titulo, seedPreVenda);
        const { enviados } = await enviarParaTodos(tokens, "Regressive Anxiety", mensagemPreVenda);
        totalEnviado += enviados;
      }
    }
  }

  // Resumo semanal: toda segunda-feira, uma única notificação consolidada.
  if (ehSegundaFeira && eventosDaSemana.length > 0) {
    const corpo =
      eventosDaSemana.length === 1
        ? `Esta semana: ${eventosDaSemana[0]}.`
        : `Esta semana: ${eventosDaSemana.slice(0, 3).join(", ")}${eventosDaSemana.length > 3 ? " e mais" : ""}.`;
    const { enviados } = await enviarParaTodos(tokens, "Resumo da semana", corpo);
    totalEnviado += enviados;
  }

  await registrarLog({ resultado: "sucesso", quantidadeEnviada: totalEnviado, quantidadeEventosAvaliados: eventosSnapshot.size });
  logger.info(`Verificação concluída: ${totalEnviado} notificações enviadas.`);
  return totalEnviado;
}

/**
 * Execução agendada diária. O horário (09:00, America/Sao_Paulo) é
 * intencionalmente fixo em um horário “humano” do dia — ajuste o
 * `schedule` abaixo se preferir outro fuso ou horário.
 */
exports.verificarNotificacoesDiarias = onSchedule(
  { schedule: "0 9 * * *", timeZone: "America/Sao_Paulo" },
  async () => {
    try {
      await executarVerificacaoDeNotificacoes();
    } catch (erro) {
      logger.error("Falha na verificação de notificações:", erro);
      await registrarLog({ resultado: "falha", detalhe: String(erro) });
    }
  },
);
