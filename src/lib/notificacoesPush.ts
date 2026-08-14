import { getMessaging, getToken, deleteToken, isSupported } from "firebase/messaging";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { firebaseApp, db } from "./firebase";

export type ResultadoAtivacaoPush =
  | { sucesso: true }
  | { sucesso: false; motivo: string };

/**
 * Ativa as notificações push para o administrador autenticado:
 * 1. Confirma suporte do navegador e pede permissão ao usuário.
 * 2. Registra o service worker (já registrado pelo vite-plugin-pwa)
 *    e obtém um token do Firebase Cloud Messaging para este dispositivo.
 * 3. Salva o token em `tokensNotificacao/{uid}/dispositivos/{token}`
 *    no Firestore — é esse token que a Cloud Function de envio
 *    (`functions/index.js`) usa para endereçar as notificações.
 *
 * Cada dispositivo/navegador gera um token diferente, então uma mesma
 * pessoa pode ter notificações ativas no celular e no computador ao
 * mesmo tempo.
 */
export async function ativarNotificacoesPush(uid: string): Promise<ResultadoAtivacaoPush> {
  if (!(await isSupported())) {
    return { sucesso: false, motivo: "Este navegador não tem suporte a notificações push." };
  }

  if (!("Notification" in window)) {
    return { sucesso: false, motivo: "Notificações não são suportadas neste dispositivo." };
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    return { sucesso: false, motivo: "Permissão de notificações não concedida." };
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return {
      sucesso: false,
      motivo: "Chave VAPID não configurada (VITE_FIREBASE_VAPID_KEY). Veja o GUIA-DEPLOY.md.",
    };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

    if (!token) {
      return { sucesso: false, motivo: "Não foi possível gerar o token de notificação." };
    }

    await setDoc(doc(db, "tokensNotificacao", uid, "dispositivos", token), {
      token,
      criadoEm: serverTimestamp(),
      userAgent: navigator.userAgent,
    });

    return { sucesso: true };
  } catch (erro) {
    console.error("[notificacoesPush] Falha ao ativar notificações:", erro);
    return { sucesso: false, motivo: "Ocorreu um erro ao ativar as notificações. Tente novamente." };
  }
}

/** Desativa as notificações push neste dispositivo (remove o token local e do Firestore). */
export async function desativarNotificacoesPush(uid: string): Promise<void> {
  if (!(await isSupported())) return;

  try {
    const messaging = getMessaging(firebaseApp);
    const registration = await navigator.serviceWorker.ready;
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

    if (token) {
      await deleteToken(messaging);
      await deleteDoc(doc(db, "tokensNotificacao", uid, "dispositivos", token));
    }
  } catch (erro) {
    console.warn("[notificacoesPush] Falha ao desativar notificações:", erro);
  }
}

/** Verifica se o navegador atual já concedeu permissão de notificações. */
export function permissaoConcedida(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}
