import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Divider, Snackbar, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Página de configuração global de pagamento (apenas SUPER_ADM)
const PagamentoGlobalConfigPage: React.FC = () => {
  const { userProfile } = useAuth();
  // Apenas SUPER_ADM pode acessar
  if (userProfile?.tipo_perfil !== 'SUPER_ADM') {
    return (
      <Box maxWidth={500} mx="auto" mt={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error">Acesso restrito</Typography>
          <Typography variant="body1">Esta página é exclusiva para usuários do tipo SUPER_ADM.</Typography>
        </Paper>
      </Box>
    );
  }
  // Estados locais para os campos globais
  const [chavePix, setChavePix] = useState('');
  const [nomeRecebedor, setNomeRecebedor] = useState('');
  const [cidadeRecebedor, setCidadeRecebedor] = useState('');
  const [telefoneRecebedor, setTelefoneRecebedor] = useState('');
  const [loading, setLoading] = useState(true);

  // Snackbar para feedback visual
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do Firestore ao abrir a página
  useEffect(() => {
    async function fetchConfig() {
      setLoading(true);
      try {
        const docRef = doc(db, 'config', 'pagamento');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setChavePix(data.chavePix || '');
          setNomeRecebedor(data.nomeRecebedor || '');
          setCidadeRecebedor(data.cidadeRecebedor || '');
          setTelefoneRecebedor(data.telefoneRecebedor || '');
        }
      } catch (e) {
        setError('Erro ao carregar configuração.');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  // Salvar dados no Firestore
  const handleSalvar = async () => {
    setError(null);
    try {
      const docRef = doc(db, 'config', 'pagamento');
      await setDoc(docRef, {
        chavePix,
        nomeRecebedor,
        cidadeRecebedor,
        telefoneRecebedor
      });
      setOpenSnackbar(true);
    } catch (e) {
      setError('Erro ao salvar configuração.');
    }
  };
  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Configuração Global de Pagamento PIX</Typography>
        <Divider sx={{ my: 2 }} />
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField label="Chave PIX" fullWidth margin="normal" value={chavePix} onChange={e => setChavePix(e.target.value)} />
            <TextField label="Nome do Recebedor" fullWidth margin="normal" value={nomeRecebedor} onChange={e => setNomeRecebedor(e.target.value)} />
            <TextField label="Cidade do Recebedor" fullWidth margin="normal" value={cidadeRecebedor} onChange={e => setCidadeRecebedor(e.target.value)} />
            <TextField label="Telefone do Recebedor" fullWidth margin="normal" value={telefoneRecebedor} onChange={e => setTelefoneRecebedor(e.target.value)} />
            <Button variant="contained" color="primary" onClick={handleSalvar} sx={{ mt: 2 }}>Salvar</Button>
          </>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        )}
      </Paper>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Configuração salva com sucesso!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PagamentoGlobalConfigPage;
