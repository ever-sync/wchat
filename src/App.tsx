import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { lazyWithReload } from "@/lib/chunk-load-recovery";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PermissionRoute, ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import CadastroPlano from "./pages/CadastroPlano";
import CadastroPagamento from "./pages/CadastroPagamento";
import AtivarAcesso from "./pages/AtivarAcesso";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import EmbedForm from "./pages/EmbedForm";

const Inbox = lazyWithReload(() => import("./pages/Inbox"));
const Clientes = lazyWithReload(() => import("./pages/Clientes"));
const Configuracoes = lazyWithReload(() => import("./pages/Configuracoes"));
const ConfiguracoesFila = lazyWithReload(() => import("./pages/ConfiguracoesFila"));
const ApiDocs = lazyWithReload(() => import("./pages/ApiDocs"));
const ClientePerfil = lazyWithReload(() => import("./pages/ClientePerfil"));
const Crm = lazyWithReload(() => import("./pages/Crm"));
const CrmNegotiationDetail = lazyWithReload(() => import("./pages/CrmNegotiationDetail"));
const Relatorios = lazyWithReload(() => import("./pages/Relatorios"));
const Produtos = lazyWithReload(() => import("./pages/Produtos"));
const Marketing = lazyWithReload(() => import("./pages/Marketing"));
const MarketingFlowEditor = lazyWithReload(() => import("./pages/MarketingFlowEditor"));
const AgenteIA = lazyWithReload(() => import("./pages/AgenteIA"));
const PageFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center bg-background text-sm text-muted-foreground">
    Carregando…
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
});

const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando sessão...
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/inbox" : "/login"} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageFallback />}>
              <RouteErrorBoundary>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                  <Route path="/cadastro" element={<PublicOnlyRoute><Cadastro /></PublicOnlyRoute>} />
                  <Route path="/cadastro/plano" element={<PublicOnlyRoute><CadastroPlano /></PublicOnlyRoute>} />
                  <Route path="/cadastro/pagamento" element={<PublicOnlyRoute><CadastroPagamento /></PublicOnlyRoute>} />
                  <Route path="/recuperar-senha" element={<PublicOnlyRoute><RecuperarSenha /></PublicOnlyRoute>} />
                  <Route path="/ativar-acesso" element={<AtivarAcesso />} />
                  <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                  {/* Formulário público embedável (sem auth) */}
                  <Route path="/embed" element={<EmbedForm />} />

                  {/* Authenticated */}
                  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route
                      path="/inbox"
                      element={
                        <PermissionRoute permission="inbox">
                          <RouteErrorBoundary title="Erro ao carregar o Inbox">
                            <Inbox />
                          </RouteErrorBoundary>
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/clientes"
                      element={
                        <PermissionRoute permission="clientes">
                          <Clientes />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/clientes/:id"
                      element={
                        <PermissionRoute permission="clientes">
                          <ClientePerfil />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/crm"
                      element={
                        <PermissionRoute permission="crm">
                          <Crm />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/crm/negociacao/:negotiationId"
                      element={
                        <PermissionRoute permission="crm">
                          <CrmNegotiationDetail />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/produtos"
                      element={
                        <PermissionRoute permission="produtos">
                          <Produtos />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/relatorios"
                      element={<Navigate to="/painel" replace />}
                    />
                    <Route
                      path="/painel"
                      element={
                        <PermissionRoute permission="relatorios">
                          <Relatorios />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/marketing"
                      element={
                        <PermissionRoute permission="marketing">
                          <Marketing />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/marketing/fluxo/:flowId"
                      element={
                        <PermissionRoute permission="marketing">
                          <MarketingFlowEditor />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/agente-ia"
                      element={
                        <PermissionRoute permission="ia">
                          <AgenteIA />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/configuracoes"
                      element={
                        <PermissionRoute permission="configuracoes">
                          <Configuracoes />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/configuracoes/fila"
                      element={
                        <PermissionRoute permission="configuracoes">
                          <ConfiguracoesFila />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/configuracoes/api-docs"
                      element={
                        <PermissionRoute permission="configuracoes">
                          <ApiDocs />
                        </PermissionRoute>
                      }
                    />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RouteErrorBoundary>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
