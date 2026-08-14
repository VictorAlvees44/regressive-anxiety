import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { EventosProvider } from "./contexts/EventosContext";
import { AppShell } from "./components/layout/AppShell";
import { RotaProtegida } from "./components/layout/RotaProtegida";
import { Home } from "./pages/Home";

// Code splitting por rota: apenas a Home entra no bundle inicial.
// As demais páginas (e o SDK do Firebase usado por Login/Admin) só são
// baixadas quando o usuário efetivamente navega até elas.
const Sugestoes = lazy(() => import("./pages/Sugestoes").then((m) => ({ default: m.Sugestoes })));
const Calendario = lazy(() => import("./pages/Calendario").then((m) => ({ default: m.Calendario })));
const ListaDesejos = lazy(() => import("./pages/ListaDesejos").then((m) => ({ default: m.ListaDesejos })));
const Admin = lazy(() => import("./pages/Admin").then((m) => ({ default: m.Admin })));
const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const NaoEncontrada = lazy(() => import("./pages/NaoEncontrada").then((m) => ({ default: m.NaoEncontrada })));

function CarregandoPagina() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-base-900/40 dark:text-base-50/40">
      Carregando...
    </div>
  );
}

/**
 * Ponto único de definição de rotas. Para adicionar uma nova página,
 * crie o componente em `src/pages` e registre-o aqui.
 */
export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EventosProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Suspense fallback={<CarregandoPagina />}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/sugestoes" element={<Sugestoes />} />
                  <Route path="/calendario" element={<Calendario />} />
                  <Route path="/lista-de-desejos" element={<ListaDesejos />} />
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/admin"
                    element={
                      <RotaProtegida>
                        <Admin />
                      </RotaProtegida>
                    }
                  />
                  <Route path="*" element={<NaoEncontrada />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </EventosProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
