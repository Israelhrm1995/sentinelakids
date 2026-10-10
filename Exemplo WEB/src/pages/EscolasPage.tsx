import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Switch, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
// import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useEscolas, Escola } from '../hooks/useEscolas';
import { useAuth } from '../context/AuthContext';

const initialForm: Omit<Escola, 'id_documento'> = {
  nome_instituicao: '',
  cnpj: '',
  ativo: true,
  endereco_completo: '',
  url_logo: '',
};

const EscolasPage: React.FC = () => {
  const { userProfile } = useAuth();
  // Permite acesso para ESCOLA_MASTER e SUPER_ADM
  if (userProfile?.tipo_perfil !== 'SUPER_ADM' && userProfile?.tipo_perfil !== 'ESCOLA_MASTER') return <Typography>Acesso restrito.</Typography>;

  const { escolas, loading, addEscola, updateEscola } = useEscolas();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);

  const handleOpen = (escola?: Escola) => {
    if (escola) {
      setForm({ ...escola });
      setEditId(escola.id_documento);
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    if (editId) {
      await updateEscola(editId, form);
    } else {
      // Adiciona usuario_alteracao e uid_criador ao criar escola
      await addEscola({ ...form, usuario_alteracao: userProfile?.uid || '', uid_criador: userProfile?.uid || '' });
    }
    handleClose();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Escolas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Nova Escola</Button>
      </Box>
      {loading ? <CircularProgress /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CNPJ</TableCell>
              <TableCell>Ativo</TableCell>
              <TableCell>Endereço</TableCell>
              <TableCell>Logo</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {escolas
              .filter(e => userProfile?.tipo_perfil !== 'ESCOLA_MASTER' || e.usuario_alteracao === userProfile?.uid)
              .map((escola) => (
                <TableRow key={escola.id_documento}>
                <TableCell>{escola.nome_instituicao}</TableCell>
                <TableCell>{escola.cnpj}</TableCell>
                <TableCell><Switch checked={escola.ativo} disabled /></TableCell>
                <TableCell>{escola.endereco_completo}</TableCell>
                <TableCell>{escola.url_logo ? <img src={escola.url_logo} alt="logo" width={40} /> : '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(escola)}><EditIcon /></IconButton>
                  {/* Removido botão de deletar escola */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Editar Escola' : 'Nova Escola'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Nome da Instituição" name="nome_instituicao" value={form.nome_instituicao} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="CNPJ" name="cnpj" value={form.cnpj} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Endereço Completo" name="endereco_completo" value={form.endereco_completo} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="URL do Logo" name="url_logo" value={form.url_logo} onChange={handleChange} fullWidth />
          <Box display="flex" alignItems="center" mt={1}>
            <Typography>Ativo</Typography>
            <Switch name="ativo" checked={form.ativo} onChange={handleChange} />
          </Box>
          {/* Campo técnico: Ativo (apenas leitura) */}
          {editId && (
            <Box mt={2}>
              <TextField
                label="Ativo"
                value={form.ativo === false ? 'Não' : 'Sim'}
                fullWidth
                InputProps={{ readOnly: true }}
                margin="dense"
              />
            </Box>
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

export default EscolasPage;
