import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import type { ItemListaDesejos } from "../types";
import { gerarId } from "./utils";

const COLECAO_LISTA_DESEJOS = "listaDesejos";
const CHAVE_STORAGE_DEMO = "regressive-anxiety:lista-desejos-demo";

/**
 * Assim como `eventosRepositorio.ts`, esta coleção é **compartilhada
 * entre os dois administradores** e vive em `listaDesejos` no
 * Firestore. Em caso de falha (ex.: Firebase não configurado), cai
 * para um `localStorage` local de demonstração.
 */

function carregarDemo(): ItemListaDesejos[] {
  const bruto = window.localStorage.getItem(CHAVE_STORAGE_DEMO);
  if (!bruto) return [];
  try {
    return JSON.parse(bruto) as ItemListaDesejos[];
  } catch {
    return [];
  }
}

function salvarDemo(itens: ItemListaDesejos[]): void {
  window.localStorage.setItem(CHAVE_STORAGE_DEMO, JSON.stringify(itens));
}

export async function listarItens(): Promise<ItemListaDesejos[]> {
  try {
    const snapshot = await getDocs(collection(db, COLECAO_LISTA_DESEJOS));
    return snapshot.docs.map((d) => ({ ...(d.data() as ItemListaDesejos), id: d.id }));
  } catch (erro) {
    console.warn("[listaDesejosRepositorio] Firestore indisponível, usando modo de demonstração local.", erro);
    return carregarDemo();
  }
}

export async function criarItem(
  dados: Omit<ItemListaDesejos, "id" | "criadoEm" | "atualizadoEm">,
): Promise<ItemListaDesejos> {
  const agora = new Date().toISOString();
  const documento = { ...dados, criadoEm: agora, atualizadoEm: agora };

  try {
    const referencia = await addDoc(collection(db, COLECAO_LISTA_DESEJOS), documento);
    return { ...documento, id: referencia.id };
  } catch (erro) {
    console.warn("[listaDesejosRepositorio] Falha ao criar no Firestore, salvando localmente.", erro);
    const novoItem: ItemListaDesejos = { ...documento, id: gerarId("desejo") };
    salvarDemo([...carregarDemo(), novoItem]);
    return novoItem;
  }
}

export async function atualizarItem(id: string, alteracoes: Partial<ItemListaDesejos>): Promise<void> {
  const payload = { ...alteracoes, atualizadoEm: new Date().toISOString() };
  try {
    await updateDoc(doc(db, COLECAO_LISTA_DESEJOS, id), payload);
  } catch (erro) {
    console.warn("[listaDesejosRepositorio] Falha ao atualizar no Firestore, salvando localmente.", erro);
    salvarDemo(carregarDemo().map((item) => (item.id === id ? { ...item, ...payload } : item)));
  }
}

export async function excluirItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLECAO_LISTA_DESEJOS, id));
  } catch (erro) {
    console.warn("[listaDesejosRepositorio] Falha ao excluir no Firestore, removendo localmente.", erro);
    salvarDemo(carregarDemo().filter((item) => item.id !== id));
  }
}
