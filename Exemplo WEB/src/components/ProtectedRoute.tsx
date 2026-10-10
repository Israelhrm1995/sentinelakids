import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // Usuário não está logado, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  // Bloqueio de acesso por vencimento para ESCOLA_MASTER e seus usuários
  // if (userProfile?.tipo_perfil === 'ESCOLA_MASTER' || userProfile?.tipo_perfil === 'ADM_ESCOLA') {
  //   const venc = userProfile?.data_proximo_vencimento;
  //   let vencDate: Date | null = null;
  //   if (venc) {
  //     if (typeof venc.toDate === 'function') {
  //       vencDate = venc.toDate();
  //     } else if (typeof venc.seconds === 'number') {
  //       vencDate = new Date(venc.seconds * 1000);
  //     } else if (typeof venc === 'string') {
  //       vencDate = new Date(venc);
  //     }
  //   }
  //   if (vencDate && vencDate < new Date()) {
  //     // Vencimento expirado, redireciona para tela de pagamento
  //     return <Navigate to="/pagamento" replace />;
  //   }
  // }

  // Usuário está logado, renderiza o conteúdo da rota
  // Se 'children' for passado, renderiza, senão usa <Outlet /> para rotas aninhadas.
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
