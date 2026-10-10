import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout'; // Importar o novo Layout
import EscolasPage from './pages/EscolasPage';
import AlunosPage from './pages/AlunosPage';
import EntradaSaidaPage from './pages/EntradaSaidaPage';
import PagamentoEscolaMasterPage from './pages/PagamentoEscolaMasterPage';
import PagamentoGlobalConfigPage from './pages/PagamentoGlobalConfigPage';
import { useAuth } from './context/AuthContext';
import UsuariosSuperAdmPage from './pages/UsuariosSuperAdmPage';
import SuperAdmDeletePage from './pages/SuperAdmDeletePage';
import UsuariosEscolaMasterPage from './pages/UsuariosEscolaMasterPage';

const AppRouter = () => {
  const { userProfile } = useAuth();
  // Detecta base para local ou produção
  const base = import.meta.env.BASE_URL || '/';
  return (
    <BrowserRouter basename={base}>
      <Routes>
        {/* Rota pública de login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas que usarão o Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* O Outlet do Layout renderizará estas rotas filhas */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/escolas" element={<EscolasPage />} />
            {/* Rota de usuários: SUPER_ADM vê tela especial, ESCOLA_MASTER vê tela própria */}
            <Route path="/usuarios" element={userProfile?.tipo_perfil === 'SUPER_ADM' ? <UsuariosSuperAdmPage /> : <UsuariosEscolaMasterPage />} />
            <Route path="/alunos" element={<AlunosPage />} />
            <Route path="/entrada-saida" element={<EntradaSaidaPage />} />
            <Route path="/pagamento" element={<PagamentoEscolaMasterPage />} />
            {/* Página de configuração global de pagamento (SUPER_ADM) */}
            <Route path="/config-pagamento" element={<PagamentoGlobalConfigPage />} />
            {/* Página de exclusão segura para SUPER_ADM */}
            <Route path="/superadm-delete" element={<SuperAdmDeletePage />} />
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;


