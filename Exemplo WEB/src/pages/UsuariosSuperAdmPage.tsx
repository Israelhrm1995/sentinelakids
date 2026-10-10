import React, { useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useUsuarios } from '../hooks/useUsuarios';
import { useEscolas } from '../hooks/useEscolas';
import { Usuario } from '../types/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

const initialForm: Omit<Usuario, 'uid'> & { senha: string } = {
  email: '',
  nome_completo: '',
  tipo_perfil: 'ESCOLA_MASTER',
  id_escola: '',
  senha: '',
  data_criacao: Timestamp.now(),
};

const UsuariosSuperAdmPage: React.FC = () => {
  const { usuarios, loading, addUsuario, updateUsuario, deleteUsuario } = useUsuarios();
  const { escolas } = useEscolas();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, usuario: Usuario | null }>({ open: false, usuario: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleOpen = (usuario?: Usuario) => {
    if (usuario) {
      setForm({ ...usuario, senha: '' });
      setEditId(usuario.uid);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
    setEditId(null);
    setEmailExists(false);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async () => {
    setEmailExists(false);
    if (editId) {
      const { senha, ...rest } = form;
      await updateUsuario(editId, rest);
      handleClose();
    } else {
      try {
        await addUsuario(form);
        handleClose();
      } catch (err: any) {
        if (err.message === 'EMAIL_EXISTS') {
          setEmailExists(true);
        } else {
          alert('Erro ao cadastrar usuário: ' + err.message);
        }
      }
    }
  };
  // Exclusão em cascata segura
  const handleDeleteCascade = async (usuario: Usuario) => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      // 1. Buscar escola vinculada
      const escolaId = usuario.id_escola;
      // 2. Excluir todos ADM_ESCOLA criados por esse master
      const admSnap = await getDocs(query(collection(db, 'usuarios'), where('uid_criador', '==', usuario.uid)));
      for (const docu of admSnap.docs) {
        await deleteDoc(doc(db, 'usuarios', docu.id));
      }
      // 3. Excluir todos alunos da escola
      if (escolaId) {
        const alunosSnap = await getDocs(query(collection(db, 'alunos'), where('id_escola', '==', escolaId)));
        for (const alunoDoc of alunosSnap.docs) {
          // 4. Excluir eventos do aluno
          const eventosSnap = await getDocs(query(collection(db, 'eventos'), where('id_aluno', '==', alunoDoc.id)));
          for (const eventoDoc of eventosSnap.docs) {
            await deleteDoc(doc(db, 'eventos', eventoDoc.id));
          }
          await deleteDoc(doc(db, 'alunos', alunoDoc.id));
        }
        // 5. Excluir responsáveis da escola
        const respSnap = await getDocs(query(collection(db, 'responsaveis'), where('id_escola', '==', escolaId)));
        for (const respDoc of respSnap.docs) {
          await deleteDoc(doc(db, 'responsaveis', respDoc.id));
        }
        // 6. Excluir escola
        await deleteDoc(doc(db, 'escolas', escolaId));
      }
      // 7. Excluir o próprio ESCOLA_MASTER
      await deleteUsuario(usuario.uid);
      setConfirmDelete({ open: false, usuario: null });
    } catch (err: any) {
      setDeleteError('Erro ao excluir dependências: ' + (err.message || err));
    } finally {
      setDeleteLoading(false);
    }
  };
  return (
    <Box>
      <Typography variant="h5" mb={2}>Escolas Master (ESCOLA_MASTER)</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Novo ESCOLA_MASTER</Button>
      {loading ? <CircularProgress /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Chave PIX</TableCell>
              <TableCell>Valor por Escola</TableCell>
              <TableCell>Próx. Vencimento</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.filter(u => u.tipo_perfil === 'ESCOLA_MASTER').map(u => (
              <TableRow key={u.uid}>
                <TableCell>{u.nome_completo}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.telefone_comprovante || '-'}</TableCell>
                <TableCell>{u.chave_pix || '-'}</TableCell>
                <TableCell>{u.valor_por_escola ? `R$ ${Number(u.valor_por_escola).toFixed(2)}` : '-'}</TableCell>
                <TableCell>{u.data_proximo_vencimento ? (u.data_proximo_vencimento.seconds ? new Date(u.data_proximo_vencimento.seconds * 1000).toLocaleDateString() : '-') : '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(u)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => setConfirmDelete({ open: true, usuario: u })}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Editar ESCOLA_MASTER' : 'Novo ESCOLA_MASTER'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Nome Completo" name="nome_completo" value={form.nome_completo} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Email" name="email" value={form.email} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Senha" name="senha" value={form.senha} onChange={handleChange} type="password" fullWidth required={!editId} helperText={editId ? 'Deixe em branco para não alterar' : ''} />
          <TextField select margin="dense" label="Escola" name="id_escola" value={form.id_escola} onChange={handleChange} fullWidth required>
            {escolas.map((escola) => (
              <MenuItem key={escola.id_documento} value={escola.id_documento}>{escola.nome_instituicao}</MenuItem>
            ))}
          </TextField>
          <TextField margin="dense" label="Telefone" name="telefone_comprovante" value={form.telefone_comprovante || ''} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Chave PIX" name="chave_pix" value={form.chave_pix || ''} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Valor por Escola (R$)" name="valor_por_escola" value={form.valor_por_escola || ''} onChange={handleChange} type="number" fullWidth />
          <TextField margin="dense" label="Próx. Vencimento" name="data_proximo_vencimento" type="date" value={form.data_proximo_vencimento ? (typeof form.data_proximo_vencimento === 'string' ? form.data_proximo_vencimento : (form.data_proximo_vencimento.seconds ? new Date(form.data_proximo_vencimento.seconds * 1000).toISOString().slice(0, 10) : '')) : ''} onChange={e => setForm((prev: any) => ({ ...prev, data_proximo_vencimento: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} helperText="Data limite para acesso ao sistema." />
          {emailExists && (
            <Typography color="error" variant="body2" mb={1}>Já existe um usuário com este e-mail. Escolha outro e-mail.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, usuario: null })}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography color="error" mb={2}>
            Tem certeza que deseja excluir o ESCOLA_MASTER <b>{confirmDelete.usuario?.nome_completo}</b>?<br/>
            <b>Esta ação irá remover TODOS os usuários ADM_ESCOLA criados por ele, todos os alunos, movimentações, responsáveis e a escola vinculada.</b><br/>
            <b>Esta ação não pode ser desfeita!</b>
          </Typography>
          {deleteError && <Typography color="error">{deleteError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, usuario: null })}>Cancelar</Button>
          <Button onClick={() => handleDeleteCascade(confirmDelete.usuario!)} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? 'Excluindo...' : 'Excluir Tudo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsuariosSuperAdmPage;
