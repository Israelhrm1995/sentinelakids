import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // A navegação para /login será tratada pelo ProtectedRoute
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bem-vindo ao Dashboard
        </Typography>
        <Typography variant="body1" gutterBottom>
          Você está logado como: {user?.email}
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Sair
        </Button>
      </Box>
    </Container>
  );
};

export default DashboardPage;
