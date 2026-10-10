

import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Link,
  Avatar
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  // Esqueci minha senha
  const [openReset, setOpenReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { login, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const handleOpenReset = () => {
    setResetEmail(email); // preenche com o email digitado, se houver
    setResetError('');
    setResetSuccess('');
    setOpenReset(true);
  };
  const handleCloseReset = () => {
    setOpenReset(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess('');
    setResetLoading(false);
  };
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSuccess('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
          setResetError('E-mail não cadastrado.');
          break;
        case 'auth/invalid-email':
          setResetError('Formato de e-mail inválido.');
          break;
        default:
          setResetError('Erro ao enviar e-mail de redefinição.');
      }
    }
    setResetLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/scan');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('E-mail ou senha inválidos.');
          break;
        case 'auth/invalid-email':
          setError('Formato de e-mail inválido.');
          break;
        default:
          setError('Ocorreu um erro ao tentar fazer login.');
          break;
      }
      setLoading(false);
    }
  };
  if (user) {
    return <Navigate to="/scan" />;
  }

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Entrar no Sentinela Kids
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
            autoComplete="email"
            autoFocus
            disabled={loading}
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            autoComplete="current-password"
            disabled={loading}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, mb: 1 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Entrar'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link component="button" variant="body2" onClick={handleOpenReset} sx={{ mt: 1 }}>
              Esqueci minha senha
            </Link>
          </Box>
        </Box>
        <Dialog open={openReset} onClose={handleCloseReset} fullWidth maxWidth="xs">
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Informe seu e-mail cadastrado para receber o link de redefinição de senha.
            </Typography>
            {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}
            {resetSuccess && <Alert severity="success" sx={{ mb: 2 }}>{resetSuccess}</Alert>}
            <TextField
              autoFocus
              margin="dense"
              id="reset-email"
              label="E-mail"
              type="email"
              fullWidth
              variant="standard"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              disabled={resetLoading}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReset} disabled={resetLoading}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resetLoading || !resetEmail} variant="contained">
              {resetLoading ? <CircularProgress size={20} color="inherit" /> : 'Enviar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default LoginPage;
