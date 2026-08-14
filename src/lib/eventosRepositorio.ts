import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import eventosMock from "../data/eventos.mock.json";
import type { Evento, StatusEvento } from "../types";
import { gerarId } from "./utils";

const COLECAO_EVENTOS = "eventos";
const CHAVE_STORAGE_DEMO = "regressive-anxiety:eventos-demo";

/**
 * Camada de acesso a dados de eventos.
 *
 * Os eventos são **compartilhados entre os dois administradores** (é
 * o painel de um casal, não dados isolados por conta) — por isso vivem
 * em uma única coleção de nível raiz no Firestore, `eventos`, protegida
 * pelas Security Rules (`firestore.rules`): leitura para qualquer
 * usuário autenticado, escrita apenas para os dois e-mails admin.
 *
 * Modo de demonstração: se o Firebase não estiver configurado (sem
 * `.env.local`) ou a chamada ao Firestore falhar por qualquer motivo,
 * a camada cai automaticamente para um armazenamento local
 * (`localStorage`, seed a partir de `eventos.mock.json`), para que o
 * app continue navegável em ambiente de desenvolvimento/demonstração
 * sem exigir um projeto Firebase real.
 */

function recalcularStatus(evento: Pick<Evento, "dataHoraISO">): StatusEvento {
  const alvo = new Date(evento.dataHoraISO).getTime();
  const agora = Date.now();
  const inicioDoDiaAlvo = new Date(evento.dataHoraISO);
  inicioDoDiaAlvo.setHours(0, 0, 0, 0);
  const fimDoDiaAlvo = new Date(inicioDoDiaAlvo);
  fimDoDiaAlvo.setHours(23, 59, 59, 999);

  if (agora > fimDoDiaAlvo.getTime()) return "concluido";
  if (agora >= inicioDoDiaAlvo.getTime() && agora <= fimDoDiaAlvo.getTime()) return "hoje";
  if (alvo <= agora) return "concluido";
  return "futuro";
}

function normalizar(evento: Evento): Evento {
  return { ...evento, status: recalcularStatus(evento) };
}

/** Remove chaves com valor `undefined` (o Firestore rejeita `undefined` em addDoc/setDoc). */
function removerIndefinidos<T extends object>(objeto: T): Partial<T> {
  const resultado: Partial<T> = {};
  (Object.keys(objeto) as (keyof T)[]).forEach((chave) => {
    if (objeto[chave] !== undefined) resultado[chave] = objeto[chave];
  });
  return resultado;
}

/**
 * Prepara um payload de atualização para o Firestore: campos explicitamente
 * definidos como `undefined` (ex.: limpar a data de pré-venda) viram
 * `deleteField()`, para que o campo seja de fato removido do documento em
 * vez de causar erro (Firestore não aceita `undefined` como valor).
 */
function prepararPayloadAtualizacao(alteracoes: Partial<Evento>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  Object.entries(alteracoes).forEach(([chave, valor]) => {
    payload[chave] = valor === undefined ? deleteField() : valor;
  });
  return payload;
}

// ---------------------------------------------------------------------------
// Modo de demonstração (fallback local, sem Firebase configurado)
// ---------------------------------------------------------------------------

function carregarDemo(): Evento[] {
  const bruto = window.localStorage.getItem(CHAVE_STORAGE_DEMO);
  if (!bruto) {
    // Primeira execução: semeia com os dados mock para a demo não nascer vazia.
    salvarDemo(eventosMock as Evento[]);
    return eventosMock as Evento[];
  }
  try {
    return JSON.parse(bruto) as Evento[];
  } catch {
    return [];
  }
}

function salvarDemo(eventos: Evento[]): void {
  window.localStorage.setItem(CHAVE_STORAGE_DEMO, JSON.stringify(eventos));
}

function criarEventoDemo(dados: Omit<Evento, "id" | "criadoEm" | "atualizadoEm" | "status">): Evento {
  const agora = new Date().toISOString();
  const novo: Evento = { ...dados, id: gerarId("evt"), status: "futuro", criadoEm: agora, atualizadoEm: agora };
  salvarDemo([...carregarDemo(), novo]);
  return normalizar(novo);
}

function atualizarEventoDemo(id: string, alteracoes: Partial<Evento>): void {
  const atual = carregarDemo();
  salvarDemo(
    atual.map((e) => {
      if (e.id !== id) return e;
      const atualizado = { ...e, ...alteracoes, atualizadoEm: new Date().toISOString() };
      // Espelha o comportamento do deleteField() do Firestore: um valor
      // explicitamente undefined remove a chave do objeto local também.
      Object.keys(alteracoes).forEach((chave) => {
        if ((alteracoes as Record<string, unknown>)[chave] === undefined) {
          delete (atualizado as Record<string, unknown>)[chave];
        }
      });
      return atualizado;
    }),
  );
}

function excluirEventoDemo(id: string): void {
  salvarDemo(carregarDemo().filter((e) => e.id !== id));
}

// ---------------------------------------------------------------------------
// API pública (tenta Firestore primeiro; cai para o modo demo em caso de erro)
// ---------------------------------------------------------------------------

function documentoParaEvento(id: string, dados: DocumentData): Evento {
  return normalizar({ ...(dados as Evento), id });
}

export async function listarEventos(): Promise<Evento[]> {
  try {
    const snapshot = await getDocs(collection(db, COLECAO_EVENTOS));
    return snapshot.docs.map((d) => documentoParaEvento(d.id, d.data()));
  } catch (erro) {
    console.warn("[eventosRepositorio] Firestore indisponível, usando modo de demonstração local.", erro);
    return carregarDemo().map(normalizar);
  }
}

export async function criarEvento(
  dados: Omit<Evento, "id" | "criadoEm" | "atualizadoEm" | "status">,
): Promise<Evento> {
  const agora = new Date().toISOString();
  const documento = {
    ...removerIndefinidos(dados),
    criadoEm: agora,
    atualizadoEm: agora,
    status: recalcularStatus(dados),
  };

  try {
    const referencia = await addDoc(collection(db, COLECAO_EVENTOS), documento);
    return normalizar({ ...documento, id: referencia.id } as Evento);
  } catch (erro) {
    console.warn("[eventosRepositorio] Falha ao criar no Firestore, salvando localmente.", erro);
    return criarEventoDemo(dados);
  }
}

export async function atualizarEvento(id: string, alteracoes: Partial<Evento>): Promise<void> {
  try {
    await updateDoc(doc(db, COLECAO_EVENTOS, id), {
      ...prepararPayloadAtualizacao(alteracoes),
      atualizadoEm: new Date().toISOString(),
    });
  } catch (erro) {
    console.warn("[eventosRepositorio] Falha ao atualizar no Firestore, salvando localmente.", erro);
    atualizarEventoDemo(id, alteracoes);
  }
}

export async function excluirEvento(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLECAO_EVENTOS, id));
  } catch (erro) {
    console.warn("[eventosRepositorio] Falha ao excluir no Firestore, removendo localmente.", erro);
    excluirEventoDemo(id);
  }
}
