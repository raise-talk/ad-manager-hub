import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Login from "./pages/auth/Login";
import Cadastro from "./pages/auth/Cadastro";
import RecuperarSenha from "./pages/auth/RecuperarSenha";

// App Pages
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import Campanhas from "./pages/Campanhas";
import Alertas from "./pages/Alertas";
import Financeiro from "./pages/Financeiro";
import Integracoes from "./pages/Integracoes";
import Configuracoes from "./pages/Configuracoes";
import Ajuda from "./pages/Ajuda";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          
          {/* App Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhes />} />
          <Route path="/campanhas" element={<Campanhas />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/integracoes" element={<Integracoes />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/ajuda" element={<Ajuda />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
