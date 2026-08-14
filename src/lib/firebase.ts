import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as signOutFirebase,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
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
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

const googleProvider = new GoogleAuthProvider();

/** Os únicos e-mails com permissão de administrador. Mantido em sincronia com as Firestore Security Rules. */
export const EMAILS_ADMINISTRADORES = [
  "chavosso16@gmail.com",
  "gabrielly.gsena@gmail.com",
] as const;

export function emailEhAdministrador(email: string | null | undefined): boolean {
  if (!email) return false;
  return EMAILS_ADMINISTRADORES.includes(email.toLowerCase() as (typeof EMAILS_ADMINISTRADORES)[number]);
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
