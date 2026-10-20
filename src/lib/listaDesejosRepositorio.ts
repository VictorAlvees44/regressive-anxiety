import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db, firebaseConfigurado } from "./firebase";
import type { ItemListaDesejos } from "../types";
import { gerarId } from "./utils";

const COLECAO_LISTA_DESEJOS = "listaDesejos";
const CHAVE_STORAGE_DEMO = "regressive-anxiety:lista-desejos-demo";

/**
 * Assim como `eventosRepositorio.ts`, esta coleção é **compartilhada
 * entre os dois administradores** e vive em `listaDesejos` no
 * Firestore. O `localStorage` de demonstração só é usado quando o
 * Firebase não está configurado; falhas reais são comunicadas à interface.
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
  if (!firebaseConfigurado) return carregarDemo();
  const snapshot = await getDocs(collection(db, COLECAO_LISTA_DESEJOS));
  return snapshot.docs.map((d) => ({ ...(d.data() as ItemListaDesejos), id: d.id }));
}

export async function criarItem(
  dados: Omit<ItemListaDesejos, "id" | "criadoEm" | "atualizadoEm">,
): Promise<ItemListaDesejos> {
  if (!firebaseConfigurado) {
    const agora = new Date().toISOString();
    const novoItem: ItemListaDesejos = { ...dados, id: gerarId("desejo"), criadoEm: agora, atualizadoEm: agora };
    salvarDemo([...carregarDemo(), novoItem]);
    return novoItem;
  }
  const agora = new Date().toISOString();
  const documento = { ...dados, criadoEm: agora, atualizadoEm: agora };

  const referencia = await addDoc(collection(db, COLECAO_LISTA_DESEJOS), documento);
  return { ...documento, id: referencia.id };
}

export async function atualizarItem(id: string, alteracoes: Partial<ItemListaDesejos>): Promise<void> {
  const payload = { ...alteracoes, atualizadoEm: new Date().toISOString() };
  if (!firebaseConfigurado) {
    salvarDemo(carregarDemo().map((item) => (item.id === id ? { ...item, ...payload } : item)));
    return;
  }
  await updateDoc(doc(db, COLECAO_LISTA_DESEJOS, id), payload);
}

export async function excluirItem(id: string): Promise<void> {
  if (!firebaseConfigurado) {
    salvarDemo(carregarDemo().filter((item) => item.id !== id));
    return;
  }
  await deleteDoc(doc(db, COLECAO_LISTA_DESEJOS, id));
}
