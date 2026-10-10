import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, CircularProgress, Checkbox, FormControlLabel } from '@mui/material';
import { useEscolas } from '../hooks/useEscolas';
import { useUsuarios } from '../hooks/useUsuarios';
import { useAlunos } from '../hooks/useAlunos';
import { useResponsaveis } from '../hooks/useResponsaveis';
import { useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const SuperAdmDeletePage: React.FC = () => {
  const { userProfile } = useAuth();
  const { escolas, deleteEscola, loading: loadingEscolas } = useEscolas();
  const { usuarios, deleteUsuario, loading: loadingUsuarios } = useUsuarios();
  const { alunos, deleteAluno, loading: loadingAlunos } = useAlunos('');
  const { responsaveis, deleteResponsavel, loading: loadingResponsaveis } = useResponsaveis('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, type: string, id: string, name: string }>({ open: false, type: '', id: '', name: '' });
  const [deleting, setDeleting] = useState(false);
  // Seleção em massa
  const [selectedEscolas, setSelectedEscolas] = useState<string[]>([]);
  const [selectedUsuarios, setSelectedUsuarios] = useState<string[]>([]);
  const [selectedAlunos, setSelectedAlunos] = useState<string[]>([]);
  const [selectedResponsaveis, setSelectedResponsaveis] = useState<string[]>([]);
  const [selectedEventos, setSelectedEventos] = useState<string[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  const fetchEventos = useCallback(async () => {
    setLoadingEventos(true);
    const snap = await getDocs(collection(db, 'eventos'));
    setEventos(snap.docs.map(d => ({ id_documento: d.id, ...d.data() })));
    setLoadingEventos(false);
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  if (userProfile?.tipo_perfil !== 'SUPER_ADM') return <Typography>Acesso restrito.</Typography>;

  const handleDelete = async () => {
    setDeleting(true);
    switch (confirmDialog.type) {
      case 'escola':
        await deleteEscola(confirmDialog.id);
        break;
      case 'usuario':
        await deleteUsuario(confirmDialog.id);
        break;
      case 'aluno':
        await deleteAluno(confirmDialog.id);
        break;
      case 'responsavel':
        await deleteResponsavel(confirmDialog.id);
        break;
      case 'evento':
        await deleteDoc(doc(db, 'eventos', confirmDialog.id));
        await fetchEventos();
        break;
      default:
        break;
    }
    setDeleting(false);
    setConfirmDialog({ open: false, type: '', id: '', name: '' });
  };

  return (
    <Box>
      <Typography variant="h4" mb={2}>Exclusão de Entidades (SUPER_ADM)</Typography>
      <Box mb={4}>
        <Typography variant="h6">Escolas</Typography>
        {loadingEscolas ? <CircularProgress /> : <>
          <FormControlLabel
            control={<Checkbox checked={selectedEscolas.length === escolas.length && escolas.length > 0}
              indeterminate={selectedEscolas.length > 0 && selectedEscolas.length < escolas.length}
              onChange={e => setSelectedEscolas(e.target.checked ? escolas.map(e => e.id_documento) : [])} />}
            label="Selecionar todos"
          />
          <Button color="error" variant="contained" size="small" sx={{ ml: 2, mb: 1 }}
            disabled={selectedEscolas.length === 0}
            onClick={() => setConfirmDialog({ open: true, type: 'escola-massa', id: '', name: `${selectedEscolas.length} escolas` })}>
            Excluir selecionados
          </Button>
          {escolas.map(e => (
            <Box key={e.id_documento} display="flex" alignItems="center" mb={1}>
              <Checkbox checked={selectedEscolas.includes(e.id_documento)}
                onChange={ev => setSelectedEscolas(ev.target.checked
                  ? [...selectedEscolas, e.id_documento]
                  : selectedEscolas.filter(id => id !== e.id_documento))}
              />
              <Typography sx={{ flex: 1 }}>{e.nome_instituicao}</Typography>
              <Button color="error" variant="outlined" onClick={() => setConfirmDialog({ open: true, type: 'escola', id: e.id_documento, name: e.nome_instituicao })}>Apagar</Button>
            </Box>
          ))}
        </>}
      </Box>
      <Box mb={4}>
        <Typography variant="h6">Usuários</Typography>
        {loadingUsuarios ? <CircularProgress /> : (() => {
          const usuariosSemSuper = usuarios.filter(u => u.tipo_perfil !== 'SUPER_ADM');
          return <>
            <FormControlLabel
              control={<Checkbox checked={selectedUsuarios.length === usuariosSemSuper.length && usuariosSemSuper.length > 0}
                indeterminate={selectedUsuarios.length > 0 && selectedUsuarios.length < usuariosSemSuper.length}
                onChange={e => setSelectedUsuarios(e.target.checked ? usuariosSemSuper.map(u => u.uid) : [])} />}
              label="Selecionar todos"
            />
            <Button color="error" variant="contained" size="small" sx={{ ml: 2, mb: 1 }}
              disabled={selectedUsuarios.length === 0}
              onClick={() => setConfirmDialog({ open: true, type: 'usuario-massa', id: '', name: `${selectedUsuarios.length} usuários` })}>
              Excluir selecionados
            </Button>
            {usuariosSemSuper.map(u => (
              <Box key={u.uid} display="flex" alignItems="center" mb={1}>
                <Checkbox checked={selectedUsuarios.includes(u.uid)}
                  onChange={ev => setSelectedUsuarios(ev.target.checked
                    ? [...selectedUsuarios, u.uid]
                    : selectedUsuarios.filter(id => id !== u.uid))}
                />
                <Typography sx={{ flex: 1 }}>{u.nome_completo} ({u.email})</Typography>
                <Button color="error" variant="outlined" onClick={() => setConfirmDialog({ open: true, type: 'usuario', id: u.uid, name: u.nome_completo })}>Apagar</Button>
              </Box>
            ))}
          </>;
        })()}
      </Box>
      <Box mb={4}>
        <Typography variant="h6">Alunos</Typography>
        {loadingAlunos ? <CircularProgress /> : <>
          <FormControlLabel
            control={<Checkbox checked={selectedAlunos.length === alunos.length && alunos.length > 0}
              indeterminate={selectedAlunos.length > 0 && selectedAlunos.length < alunos.length}
              onChange={e => setSelectedAlunos(e.target.checked ? alunos.map(a => a.id_documento) : [])} />}
            label="Selecionar todos"
          />
          <Button color="error" variant="contained" size="small" sx={{ ml: 2, mb: 1 }}
            disabled={selectedAlunos.length === 0}
            onClick={() => setConfirmDialog({ open: true, type: 'aluno-massa', id: '', name: `${selectedAlunos.length} alunos` })}>
            Excluir selecionados
          </Button>
          {alunos.map(a => (
            <Box key={a.id_documento} display="flex" alignItems="center" mb={1}>
              <Checkbox checked={selectedAlunos.includes(a.id_documento)}
                onChange={ev => setSelectedAlunos(ev.target.checked
                  ? [...selectedAlunos, a.id_documento]
                  : selectedAlunos.filter(id => id !== a.id_documento))}
              />
              <Typography sx={{ flex: 1 }}>{a.nome_completo} ({a.sala})</Typography>
              <Button color="error" variant="outlined" onClick={() => setConfirmDialog({ open: true, type: 'aluno', id: a.id_documento, name: a.nome_completo })}>Apagar</Button>
            </Box>
          ))}
        </>}
      </Box>
      <Box mb={4}>
        <Typography variant="h6">Responsáveis</Typography>
        {loadingResponsaveis ? <CircularProgress /> : <>
          <FormControlLabel
            control={<Checkbox checked={selectedResponsaveis.length === responsaveis.length && responsaveis.length > 0}
              indeterminate={selectedResponsaveis.length > 0 && selectedResponsaveis.length < responsaveis.length}
              onChange={e => setSelectedResponsaveis(e.target.checked ? responsaveis.map(r => r.id_documento) : [])} />}
            label="Selecionar todos"
          />
          <Button color="error" variant="contained" size="small" sx={{ ml: 2, mb: 1 }}
            disabled={selectedResponsaveis.length === 0}
            onClick={() => setConfirmDialog({ open: true, type: 'responsavel-massa', id: '', name: `${selectedResponsaveis.length} responsáveis` })}>
            Excluir selecionados
          </Button>
          {responsaveis.map(r => (
            <Box key={r.id_documento} display="flex" alignItems="center" mb={1}>
              <Checkbox checked={selectedResponsaveis.includes(r.id_documento)}
                onChange={ev => setSelectedResponsaveis(ev.target.checked
                  ? [...selectedResponsaveis, r.id_documento]
                  : selectedResponsaveis.filter(id => id !== r.id_documento))}
              />
              <Typography sx={{ flex: 1 }}>{r.nome_completo}</Typography>
              <Button color="error" variant="outlined" onClick={() => setConfirmDialog({ open: true, type: 'responsavel', id: r.id_documento, name: r.nome_completo })}>Apagar</Button>
            </Box>
          ))}
        </>}
      </Box>
      <Box mb={4}>
        <Typography variant="h6">Eventos</Typography>
        {loadingEventos ? <CircularProgress /> : <>
          <FormControlLabel
            control={<Checkbox checked={selectedEventos.length === eventos.length && eventos.length > 0}
              indeterminate={selectedEventos.length > 0 && selectedEventos.length < eventos.length}
              onChange={e => setSelectedEventos(e.target.checked ? eventos.map(ev => ev.id_documento) : [])} />}
            label="Selecionar todos"
          />
          <Button color="error" variant="contained" size="small" sx={{ ml: 2, mb: 1 }}
            disabled={selectedEventos.length === 0}
            onClick={() => setConfirmDialog({ open: true, type: 'evento-massa', id: '', name: `${selectedEventos.length} eventos` })}>
            Excluir selecionados
          </Button>
          {eventos.map(ev => (
            <Box key={ev.id_documento} display="flex" alignItems="center" mb={1}>
              <Checkbox checked={selectedEventos.includes(ev.id_documento)}
                onChange={evCheck => setSelectedEventos(evCheck.target.checked
                  ? [...selectedEventos, ev.id_documento]
                  : selectedEventos.filter(id => id !== ev.id_documento))}
              />
              <Typography sx={{ flex: 1 }}>Evento {ev.tipo} - {ev.id_responsavel} - {ev.id_aluno} - {ev.data_hora?.seconds ? new Date(ev.data_hora.seconds * 1000).toLocaleString() : ''}</Typography>
              <Button color="error" variant="outlined" onClick={() => setConfirmDialog({ open: true, type: 'evento', id: ev.id_documento, name: `Evento ${ev.tipo}` })}>Apagar</Button>
            </Box>
          ))}
        </>}
      </Box>
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: '', id: '', name: '' })}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja apagar <b>{confirmDialog.name}</b>? Esta ação não pode ser desfeita.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: '', id: '', name: '' })}>Cancelar</Button>
          <Button onClick={async () => {
            setDeleting(true);
            if (confirmDialog.type.endsWith('-massa')) {
              let ids: string[] = [];
              let delFn: (id: string) => Promise<any> = async () => {};
              if (confirmDialog.type === 'escola-massa') { ids = selectedEscolas; delFn = deleteEscola; }
              if (confirmDialog.type === 'usuario-massa') { ids = selectedUsuarios; delFn = deleteUsuario; }
              if (confirmDialog.type === 'aluno-massa') { ids = selectedAlunos; delFn = deleteAluno; }
              if (confirmDialog.type === 'responsavel-massa') { ids = selectedResponsaveis; delFn = deleteResponsavel; }
              if (confirmDialog.type === 'evento-massa') { ids = selectedEventos; delFn = async (id) => { await deleteDoc(doc(db, 'eventos', id)); await fetchEventos(); } }
              for (const id of ids) { await delFn(id); }
              // Limpa seleção após exclusão
              if (confirmDialog.type === 'escola-massa') setSelectedEscolas([]);
              if (confirmDialog.type === 'usuario-massa') setSelectedUsuarios([]);
              if (confirmDialog.type === 'aluno-massa') setSelectedAlunos([]);
              if (confirmDialog.type === 'responsavel-massa') setSelectedResponsaveis([]);
              if (confirmDialog.type === 'evento-massa') setSelectedEventos([]);
            } else {
              await handleDelete();
            }
            setDeleting(false);
            setConfirmDialog({ open: false, type: '', id: '', name: '' });
          }} color="error" variant="contained" disabled={deleting}>{deleting ? 'Apagando...' : 'Apagar'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuperAdmDeletePage;
