
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Avatar, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import type { Aluno, PerfilUsuario, ResponsavelAluno } from '../types/firestore.d';


const AlunoInfoPage: React.FC = () => {
    // Estado para expansão de imagem
    const [expandedImg, setExpandedImg] = useState<string | null>(null);
  const { id } = useParams();
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  // Não usamos mais responsaveisFirestore, tudo vem de aluno.responsaveis
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    tipo: 'E' | 'S' | null;
    responsavel: any;
  }>({ open: false, tipo: null, responsavel: null });
  const [saving, setSaving] = useState(false);
  // Função para abrir o dialog de confirmação
  const handleConfirm = (tipo: 'E' | 'S', responsavel: any) => {
    setConfirmDialog({ open: true, tipo, responsavel });
  };

  // Função para registrar evento
  const handleRegistrarEvento = async () => {
    if (!aluno || !userProfile || !confirmDialog.tipo || !confirmDialog.responsavel) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'eventos'), {
        tipo: confirmDialog.tipo,
        data_hora: Timestamp.now(),
        id_responsavel: confirmDialog.responsavel.cpf,
        id_usuario_operador: userProfile.uid,
        id_aluno: id, 
      });
      setConfirmDialog({ open: false, tipo: null, responsavel: null });
      setSaving(false);
      setAluno(null);
      setError(null);
      setLoading(true);
      navigate('/scan', { replace: true, state: { remountKey: Date.now() } });
    } catch (e) {
      console.error('Erro ao registrar evento:', e);
      setError('Erro ao registrar evento. Tente novamente.');
      setSaving(false);
    }
  };

  const handleScanAnother = useCallback(() => {
    setAluno(null);
    setError(null);
    setLoading(true);
    navigate('/scan', { replace: true, state: { remountKey: Date.now() } });
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    await logout();
    setAluno(null);
    setError(null);
    setLoading(false);
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    const fetchAluno = async () => {
      if (!id) {
        setAluno(null);
        setError(null);
        setLoading(false);
        return;
      }
      try {
        // Busca pelo ID do documento (valor do QR Code)
        const alunoDocRef = doc(db, 'alunos', id);
        const alunoSnap = await getDoc(alunoDocRef);
        if (!alunoSnap.exists()) {
          setAluno(null);
          setError('Nenhum aluno foi encontrado para este QR Code.\n\nVerifique se o código escaneado está correto ou tente novamente. Caso o problema persista, procure a secretaria da escola.');
          setLoading(false);
          return;
        }
        const alunoData = alunoSnap.data() as Aluno;
        setAluno(alunoData);
        setLoading(false);
      } catch (err) {
        setAluno(null);
        setError('Erro ao buscar dados do aluno.');
        setLoading(false);
      }
    };
    // Só busca aluno se houver id
    if (id) {
      fetchAluno();
    } else {
      setAluno(null);
      setError(null);
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Carregando informações do aluno...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Verifica se o aluno pertence à escola do usuário logado
  if (aluno && userProfile && aluno.id_escola !== userProfile.id_escola) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">
          O aluno não pertence à sua escola. Acesso restrito.
        </Alert>
      </Box>
    );
  }


  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Button variant="outlined" color="primary" size="small" onClick={handleScanAnother}>
          Escanear outro aluno
        </Button>
        <Button variant="outlined" color="secondary" size="small" onClick={handleLogout}>
          Sair
        </Button>
      </Box>
      <Typography variant="h6" align="center" gutterBottom>
        Informações do Aluno
      </Typography>
      {aluno && (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            {aluno.url_foto ? (
              <Avatar src={aluno.url_foto} alt={aluno.nome_completo} sx={{ width: 80, height: 80, mb: 2, cursor: 'pointer' }} onClick={() => setExpandedImg(aluno.url_foto ?? null)} />
            ) : (
              <Avatar sx={{ width: 80, height: 80, mb: 2 }}>
                {aluno.nome_completo?.[0] || '?'}
              </Avatar>
            )}
            <Typography variant="subtitle1"><b>Nome:</b> {aluno.nome_completo}</Typography>
            <Typography variant="body2"><b>CPF:</b> {aluno.cpf}</Typography>
            <Typography variant="body2"><b>Data de Nascimento:</b> {aluno.data_nascimento}</Typography>
          </Box>
          {/* Responsáveis */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" align="center" gutterBottom>
              Responsáveis
            </Typography>
            {aluno.responsaveis && aluno.responsaveis.length > 0 ? (
              <Box>
                {aluno.responsaveis.map((resp: ResponsavelAluno, idx: number) => (
                  <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {resp.url_foto ? (
                      <Avatar src={resp.url_foto} alt={resp.nome} sx={{ width: 56, height: 56, mr: 2, cursor: 'pointer' }} onClick={() => setExpandedImg(resp.url_foto ?? null)} />
                    ) : (
                      <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
                        {resp.nome?.[0] || '?'}
                      </Avatar>
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2"><b>Nome:</b> {resp.nome}</Typography>
                      <Typography variant="body2"><b>Parentesco:</b> {resp.parentesco}</Typography>
                      <Typography variant="body2"><b>CPF:</b> {resp.cpf}</Typography>
                      {resp.telefone ? (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2"><b>Telefone:</b> <a href={`tel:${resp.telefone.replace(/\D/g, '')}`} style={{ color: '#1976d2', textDecoration: 'underline' }}>{resp.telefone}</a></Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Telefone não encontrado para este responsável.
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleConfirm('E', resp)}
                          disabled={saving}
                          fullWidth
                        >
                          Entrada
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleConfirm('S', resp)}
                          disabled={saving}
                          fullWidth
                        >
                          Saída
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography align="center" color="text.secondary">Nenhum responsável cadastrado.</Typography>
            )}
          </Box>
          {/* Dialog de confirmação */}
          <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, tipo: null, responsavel: null })}>
            <DialogTitle>Confirmar {confirmDialog.tipo === 'E' ? 'Entrada' : 'Saída'}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Tem certeza que deseja registrar <b>{confirmDialog.tipo === 'E' ? 'ENTRADA' : 'SAÍDA'}</b> do aluno <b>{aluno?.nome_completo}</b> com o responsável <b>{confirmDialog.responsavel?.nome_completo || confirmDialog.responsavel?.nome}</b>?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialog({ open: false, tipo: null, responsavel: null })} disabled={saving}>Não</Button>
              <Button onClick={handleRegistrarEvento} color={confirmDialog.tipo === 'E' ? 'success' : 'error'} disabled={saving} autoFocus>Sim</Button>
            </DialogActions>
          </Dialog>

        </>
      )}
    {/* Dialog para imagem expandida */}
    <Dialog open={!!expandedImg} onClose={() => {
      setExpandedImg(null);
      setError(null);
      setLoading(false);
    }} maxWidth="md">
      <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        {expandedImg && (
          <img src={expandedImg} alt="Foto expandida" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8 }} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setExpandedImg(null);
          setError(null);
          setLoading(false);
        }} color="primary" variant="contained" autoFocus>Fechar</Button>
      </DialogActions>
    </Dialog>
    </Box>
  );
}

export default AlunoInfoPage;
