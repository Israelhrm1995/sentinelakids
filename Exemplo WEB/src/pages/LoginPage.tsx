import React, { useState } from 'react';
import CadastroEscolaMasterDialog from '../components/CadastroEscolaMasterDialog';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openCadastro, setOpenCadastro] = useState(false);
  
  const { login, user, resetPassword } = useAuth();
    // Esqueci minha senha
    const [openReset, setOpenReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

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
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // A navegação será tratada pelo AppRouter/ProtectedRoute
      navigate('/');
    } catch (err: any) {
      // Mapeia códigos de erro do Firebase para mensagens amigáveis
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

  // Se o usuário já estiver logado, redireciona para o dashboard
  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Entrar no Sentinela Kids
        </Typography>
        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Endereço de E-mail"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
          </Button>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Link component="button" variant="body2" onClick={handleOpenReset} sx={{ mt: 1 }}>
              Esqueci minha senha
            </Link>
            <Button variant="outlined" color="primary" onClick={() => setOpenCadastro(true)} sx={{ mt: 1, width: '100%' }}>
              Adquirir sistema
            </Button>
          </Box>
          <CadastroEscolaMasterDialog open={openCadastro} onClose={() => setOpenCadastro(false)} onSuccess={() => setOpenCadastro(false)} />
          <Dialog open={openReset} onClose={handleCloseReset}>
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
      </Box>
    </Container>
  );
};

export default LoginPage;

