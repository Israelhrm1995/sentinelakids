import React, { useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUsuarios } from '../hooks/useUsuarios';
import { useAuth } from '../context/AuthContext';
import { useEscolas } from '../hooks/useEscolas';
import { Usuario } from '../types/firestore';
import { Timestamp } from 'firebase/firestore';

const initialForm: Omit<Usuario, 'uid'> & { senha: string } = {
  email: '',
  nome_completo: '',
  tipo_perfil: 'ADM_ESCOLA',
  id_escola: '',
  senha: '',
  data_criacao: Timestamp.now(),
};

const UsuariosEscolaMasterPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { usuarios, loading, addUsuario, updateUsuario, deleteUsuario } = useUsuarios();
  const { escolas } = useEscolas();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  // Filtra ADM_ESCOLA criados pelo ESCOLA_MASTER logado
  const usuariosFiltrados = usuarios.filter(u =>
    u.uid_criador === userProfile?.uid && u.tipo_perfil === 'ADM_ESCOLA'
  );
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
    if (!form.id_escola || form.id_escola.trim() === '') {
      alert('Selecione a escola para o usuário ADM_ESCOLA!');
      return;
    }
    if (editId) {
      const { senha, ...rest } = form;
      await updateUsuario(editId, rest);
      handleClose();
    } else {
      try {
        let usuarioParaSalvar = { ...form, uid_criador: userProfile?.uid };
        await addUsuario(usuarioParaSalvar);
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
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Usuários Criados</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Novo Usuário</Button>
      </Box>
      {loading ? <CircularProgress /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Escola</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuariosFiltrados.map(u => {
              const escola = escolas.find(e => e.id_documento === u.id_escola);
              return (
                <TableRow key={u.uid}>
                  <TableCell>{u.nome_completo}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{escola ? escola.nome_instituicao : '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(u)}><EditIcon /></IconButton>
                    <IconButton onClick={() => deleteUsuario(u.uid)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Nome Completo" name="nome_completo" value={form.nome_completo} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Email" name="email" value={form.email} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Senha" name="senha" value={form.senha} onChange={handleChange} type="password" fullWidth required={!editId} helperText={editId ? 'Deixe em branco para não alterar' : ''} />
          <TextField select margin="dense" label="Escola" name="id_escola" value={form.id_escola} onChange={handleChange} fullWidth required>
            {escolas
              .filter(e => String(e.usuario_alteracao || e.uid_criador || '') === String(userProfile?.uid))
              .map((escola) => (
                <MenuItem key={escola.id_documento} value={escola.id_documento}>{escola.nome_instituicao}</MenuItem>
              ))}
        </TextField>
          {emailExists && (
            <Typography color="error" variant="body2" mb={1}>Já existe um usuário com este e-mail. Escolha outro e-mail.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsuariosEscolaMasterPage;
