import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as signOutFirebase,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";

/**
 * Configuração do Firebase.
 *
 * Todas as chaves vêm de variáveis de ambiente (ver `.env.example`).
 * Nenhuma credencial deve ser commitada no repositório. As chaves do
 * Firebase Web SDK não são secretas por natureza (ficam expostas no
 * bundle do cliente), mas a segurança real do projeto vem das
 * Firestore Security Rules — nunca do sigilo destas chaves.
 */
export const firebaseConfigurado = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID,
);

// Valores de demonstração permitem abrir a interface local sem chaves. As
// camadas de repositório caem no armazenamento local quando o Firebase não foi
// configurado; eles nunca são usados para uma chamada real em produção.
const firebaseConfig = firebaseConfigurado
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
  : {
      apiKey: "demo-api-key",
      authDomain: "demo.local",
      projectId: "regressive-anxiety-demo",
      appId: "1:000000000000:web:demo",
    };

function criarApp(): FirebaseApp {
  const appsExistentes = getApps();
  if (appsExistentes.length > 0) return appsExistentes[0];
  return initializeApp(firebaseConfig);
}

export const firebaseApp = criarApp();
// Só habilite após publicar as regras privadas da biblioteca no Firebase.
export const bibliotecaNuvemConfigurada = firebaseConfigurado && import.meta.env.VITE_BIBLIOTECA_NUVEM === "true";
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

const googleProvider = new GoogleAuthProvider();

/**
 * Verifica se o usuário logado é administrador.
 *
 * Propositalmente NÃO existe nenhuma lista de e-mails aqui no cliente:
 * uma lista assim ficaria visível a qualquer pessoa que abrisse o
 * DevTools e olhasse o JS publicado (bundle é código público, mesmo
 * sem link divulgado). Em vez disso, perguntamos ao Firestore lendo
 * `sistema/statusAdmin` — um documento que nem precisa existir — e
 * quem decide "sim" ou "não" são as Security Rules, no servidor. Se a
 * leitura for negada (permission-denied), o usuário é visitante.
 */
export async function verificarSeEhAdministrador(): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await getDoc(doc(db, "sistema", "statusAdmin"));
    return true;
  } catch {
    return false;
  }
}

/** Inicia o fluxo de login com Google (único método de autenticação suportado). */
export async function entrarComGoogle(): Promise<User> {
  const resultado = await signInWithPopup(auth, googleProvider);
  return resultado.user;
}

export async function sair(): Promise<void> {
  await signOutFirebase(auth);
}

export function observarUsuario(callback: (usuario: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
