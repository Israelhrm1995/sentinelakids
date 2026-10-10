
import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Checkbox, ListItemText, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import ImageUpload from '../components/ImageUpload';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';
import { useResponsaveis } from '../hooks/useResponsaveis';
import { useAlunosSimples } from '../hooks/useAlunosSimples';
import { Responsavel } from '../types/firestore';

const initialForm: Omit<Responsavel, 'id_documento'> = {
  nome_completo: '',
  cpf: '',
  rg: '',
  url_foto: '',
  telefones: [],
  ids_alunos_vinculados: [],
  // id_escola: '',
};

const ResponsaveisPage: React.FC = () => {
  const { userProfile } = useAuth();
  const idEscola = userProfile?.id_escola || '';
  const { responsaveis, loading, addResponsavel, updateResponsavel, deleteResponsavel } = useResponsaveis(idEscola);
  const { alunos } = useAlunosSimples(idEscola);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);

  const handleOpen = (responsavel?: Responsavel) => {
    if (responsavel) {
      setForm({ ...responsavel });
      setEditId(responsavel.id_documento);
    } else {
      setForm({ ...initialForm });
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Novo handler para upload de imagem do responsável
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 200 * 1024) {
        alert('Imagem muito grande! Máximo 200KB.');
        return;
      }
      if (form.url_foto) {
        try {
          const prevRef = ref(storage, `/escolas/${idEscola}/responsaveis/${form.cpf || 'temp'}.jpg`);
          await deleteObject(prevRef);
        } catch {}
      }
      const storageRef = ref(storage, `/escolas/${idEscola}/responsaveis/${form.cpf || Date.now()}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, url_foto: url }));
    }
  };

  const handleRemoveImage = async () => {
    try {
      const imgRef = ref(storage, `/escolas/${idEscola}/responsaveis/${form.cpf || 'temp'}.jpg`);
      await deleteObject(imgRef);
    } catch {}
    setForm((prev) => ({ ...prev, url_foto: '' }));
  };

  const handleTelefonesChange = (idx: number, value: string) => {
    setForm((prev) => {
      const novos = [...prev.telefones];
      novos[idx] = value;
      return { ...prev, telefones: novos };
    });
  };
  const handleAddTelefone = () => {
    setForm((prev) => ({ ...prev, telefones: [...prev.telefones, ''] }));
  };
  const handleRemoveTelefone = (idx: number) => {
    setForm((prev) => {
      const novos = [...prev.telefones];
      novos.splice(idx, 1);
      return { ...prev, telefones: novos };
    });
  };

  const handleAlunosChange = (event: any) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, ids_alunos_vinculados: value }));
  };

  const handleSubmit = async () => {
    if (editId) {
      await updateResponsavel(editId, form);
    } else {
      await addResponsavel(form);
    }
    handleClose();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Responsáveis</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Novo Responsável</Button>
      </Box>
      {loading ? <CircularProgress /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CPF</TableCell>
              <TableCell>RG</TableCell>
              <TableCell>Telefones</TableCell>
              <TableCell>Alunos Vinculados</TableCell>
              <TableCell>Foto</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {responsaveis.map((r) => (
              <TableRow key={r.id_documento}>
                <TableCell>{r.nome_completo}</TableCell>
                <TableCell>{r.cpf}</TableCell>
                <TableCell>{r.rg}</TableCell>
                <TableCell>{r.telefones.join(', ')}</TableCell>
                <TableCell>
                  {r.ids_alunos_vinculados.map((id) => {
                    const aluno = alunos.find((a) => a.id_documento === id);
                    return aluno ? (
                      <span key={id}>{aluno.nome_completo}<br /></span>
                    ) : null;
                  })}
                </TableCell>
                <TableCell>
                  {r.url_foto && <img src={r.url_foto} alt="Foto" width={40} style={{ borderRadius: 8 }} />}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(r)}><EditIcon /></IconButton>
                  <IconButton onClick={() => deleteResponsavel(r.id_documento)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Editar Responsável' : 'Novo Responsável'}</DialogTitle>
        <DialogContent>
          <TextField 
            margin="dense" 
            label="Nome Completo" 
            name="nome_completo" 
            value={form.nome_completo} 
            onChange={handleChange} 
            fullWidth 
            required 
            inputProps={{ maxLength: 80 }} 
            helperText={form.nome_completo.length < 5 ? "Mínimo 5 caracteres" : "Até 80 caracteres"} 
            error={form.nome_completo.length < 5 || form.nome_completo.length > 80}
          />
          <TextField margin="dense" label="CPF" name="cpf" value={form.cpf} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="RG" name="rg" value={form.rg} onChange={handleChange} fullWidth required />
          <ImageUpload
            label="Foto do Responsável"
            previewUrl={form.url_foto ? form.url_foto : null}
            onSelect={handleImageChange}
            onRemove={handleRemoveImage}
            maxSizeKB={200}
          />
          <Box mt={2} mb={2}>
            <Typography variant="subtitle1">Telefones</Typography>
            {form.telefones.map((tel, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                <TextField label="Telefone" value={tel} onChange={e => handleTelefonesChange(idx, e.target.value)} size="small" />
                <Button onClick={() => handleRemoveTelefone(idx)} color="error">Remover</Button>
              </Box>
            ))}
            <Button onClick={handleAddTelefone} variant="outlined" size="small">Adicionar Telefone</Button>
          </Box>
          <FormControl fullWidth margin="dense">
            <InputLabel id="alunos-label">Alunos Vinculados</InputLabel>
            <Select
              labelId="alunos-label"
              multiple
              value={form.ids_alunos_vinculados}
              onChange={handleAlunosChange}
              renderValue={(selected) =>
                (selected as string[]).map(id => {
                  const aluno = alunos.find(a => a.id_documento === id);
                  return aluno ? aluno.nome_completo : id;
                }).join(', ')
              }
            >
              {alunos.map((aluno) => (
                <MenuItem key={aluno.id_documento} value={aluno.id_documento}>
                  <Checkbox checked={form.ids_alunos_vinculados.includes(aluno.id_documento)} />
                  <ListItemText primary={aluno.nome_completo} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResponsaveisPage;
