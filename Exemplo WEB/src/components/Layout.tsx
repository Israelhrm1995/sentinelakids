import React from 'react';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUsuarios } from '../hooks/useUsuarios';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import PagamentoAtrasoBanner from './PagamentoAtrasoBanner';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const { usuarios: allUsuarios } = useUsuarios();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    // SUPER_ADM vê Administração, Configuração Pagamento e Exclusão de Entidades
    { text: 'Administração', icon: <PeopleIcon />, path: '/usuarios', roles: ['SUPER_ADM'] },
    { text: 'Configuração Pagamento', icon: <SettingsIcon />, path: '/config-pagamento', roles: ['SUPER_ADM'] },
    { text: 'Exclusão de Entidades', icon: <SettingsIcon />, path: '/superadm-delete', roles: ['SUPER_ADM'] },
    // ESCOLA_MASTER vê Escolas e Usuários
    { text: 'Escolas', icon: <SchoolIcon />, path: '/escolas', roles: ['ESCOLA_MASTER'] },
    { text: 'Usuários', icon: <PeopleIcon />, path: '/usuarios', roles: ['ESCOLA_MASTER'] },
    // ESCOLA_MASTER vê apenas Escolas, Usuários e Pagamento
    { text: 'Alunos', icon: <PeopleIcon />, path: '/alunos', roles: ['ADM_ESCOLA'] },
    { text: 'Entrada/Saída', icon: <PeopleIcon />, path: '/entrada-saida', roles: ['ADM_ESCOLA'] },
    { text: 'Pagamento', icon: <HomeIcon />, path: '/pagamento', roles: ['ESCOLA_MASTER', 'ADM_ESCOLA'] },
  ];

  // Se userProfile existe mas não tem tipo_perfil, assume ADM_ESCOLA
  let perfil = userProfile?.tipo_perfil;
  if (userProfile && !userProfile.tipo_perfil) {
    perfil = 'ADM_ESCOLA';
  }
  // ESCOLA_MASTER tem acesso total às telas de gestão
  const filteredMenuItems = menuItems.filter(item => {
    if (!perfil) return false;
    if (perfil === 'ESCOLA_MASTER') {
      // ESCOLA_MASTER só vê Escolas, Usuários e Pagamento
      return ['Escolas', 'Usuários', 'Pagamento'].includes(item.text);
    }
    // SUPER_ADM só vê Administração
    return item.roles.includes(perfil);
  });

  // Lógica desacoplada de atraso: mostra para ESCOLA_MASTER e todos ADM_ESCOLA criados por ele, exceto na tela de pagamento
  let atrasoInfo: { dias: number, venc: Date } | null = null;
  if (userProfile && userProfile.tipo_perfil !== 'SUPER_ADM' && location.pathname !== '/pagamento') {
    // Para ESCOLA_MASTER, pega o próprio vencimento
    // Para ADM_ESCOLA, pega o vencimento do ESCOLA_MASTER que o criou (mesmo id_escola)
    let prox: any = null;
    if (userProfile.tipo_perfil === 'ESCOLA_MASTER') {
      prox = userProfile.data_proximo_vencimento;
    } else if (userProfile.tipo_perfil === 'ADM_ESCOLA' && userProfile.id_escola && allUsuarios) {
      const escolaMaster = allUsuarios.find(u => u.tipo_perfil === 'ESCOLA_MASTER' && u.id_escola === userProfile.id_escola);
      prox = escolaMaster?.data_proximo_vencimento;
    }
    let venc: Date | null = null;
    if (prox) {
      if (typeof prox.toDate === 'function') {
        venc = prox.toDate();
      } else if (typeof prox.seconds === 'number') {
        venc = new Date(prox.seconds * 1000);
      } else if (typeof prox === 'string') {
        venc = new Date(prox);
      }
    }
    if (venc && !isNaN(venc.getTime())) {
      const hoje = new Date();
      const diff = Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        atrasoInfo = { dias: diff, venc };
      }
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Sentinela Kids
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <List>
          {filteredMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding onClick={() => navigate(item.path)}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <List>
          <ListItem disablePadding onClick={handleLogout}>
            <ListItemButton>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Sair" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Toolbar />
        {/* O conteúdo da página será renderizado aqui */}
        <Outlet />
        {atrasoInfo && <PagamentoAtrasoBanner diasAtraso={atrasoInfo.dias} dataVencimento={atrasoInfo.venc} />}
      </Box>
    </Box>
  );
};

export default Layout;
