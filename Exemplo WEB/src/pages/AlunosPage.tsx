import React, { useState } from 'react';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { MAX_IMAGE_SIZE_BYTES } from '../utils/constants';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, CircularProgress, Chip, Checkbox } from '@mui/material';
import ImageUpload from '../components/ImageUpload';
import TableWithPagination from '../components/TableWithPagination';
import AlunoQRCodeSheet from '../components/AlunoQRCodeSheet';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAlunos } from '../hooks/useAlunos';
import { ResponsavelAluno } from '../types/firestore';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode.react';


type AlunoForm = {
  id_escola: string;
  nome_completo: string;
  sala: string;
  cpf: string;
  data_nascimento: string;
  url_foto?: string;
  hash_qrcode: string;
  responsaveis: ResponsavelAluno[];
  usuario_alteracao?: string;
  ativo?: boolean;
};

const initialForm: AlunoForm = {
  id_escola: '',
  nome_completo: '',
  sala: '',
  cpf: '',
  data_nascimento: '',
  url_foto: '',
  hash_qrcode: '',
  responsaveis: [],
  usuario_alteracao: '',
  ativo: true,
};

const AlunosPage: React.FC = () => {
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [selectedAlunos, setSelectedAlunos] = useState<string[]>([]);
    // Seleção múltipla
    const handleSelectAluno = (id: string) => {
      setSelectedAlunos((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
  const { userProfile } = useAuth();
  const isSuperAdm = userProfile?.tipo_perfil === 'SUPER_ADM';
  const isEscolaMaster = userProfile?.tipo_perfil === 'ESCOLA_MASTER';
  const idEscola = userProfile?.id_escola || '';
  const { alunos, loading, addAluno, updateAluno, deleteAluno } = useAlunos(idEscola);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroSala, setFiltroSala] = useState('');
  const [filtroCpf, setFiltroCpf] = useState('');
  const [open, setOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<AlunoForm>(initialForm);
  // Não precisamos mais de previewFoto, preview sempre será form.url_foto
  const [editId, setEditId] = useState<string | null>(null);

  // Gera hash_qrcode simples (UUID pode ser melhor)
  
    // Validação de telefone brasileiro simples
    function validarTelefone(telefone: string) {
      // Aceita formatos (xx) xxxxx-xxxx, (xx) xxxx-xxxx, xxxxxxxxxxx, xxxxxxxxxx
      const cleaned = telefone.replace(/\D/g, '');
      return cleaned.length === 10 || cleaned.length === 11;
    }
  const generateHash = () => Math.random().toString(36).substring(2, 12) + Date.now();

  const handleOpen = (aluno?: any) => {
    if (isSuperAdm) return; // SUPER ADM não pode cadastrar/editar
    if (aluno) {
      setForm({
        id_escola: aluno.id_escola,
        nome_completo: aluno.nome_completo,
        sala: aluno.sala || '',
        cpf: aluno.cpf,
        data_nascimento: aluno.data_nascimento,
        url_foto: aluno.url_foto || '',
        hash_qrcode: aluno.hash_qrcode,
        responsaveis: Array.isArray(aluno.responsaveis) ? aluno.responsaveis : [],
      });
      setEditId(aluno.id_documento);
    } else {
      setForm({ ...initialForm, id_escola: idEscola, hash_qrcode: generateHash() });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
    setEditId(null);
  };

  // Handler para outros campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para upload/remover imagem
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        alert(`Imagem muito grande! Máximo ${Math.round(MAX_IMAGE_SIZE_BYTES/1024)}KB.`);
        return;
      }
      if (form.url_foto) {
        try {
          const prevRef = ref(storage, `/escolas/${form.id_escola}/alunos/${form.hash_qrcode || 'temp'}.jpg`);
          await deleteObject(prevRef);
        } catch (e) {}
      }
      const storageRef = ref(storage, `/escolas/${form.id_escola}/alunos/${form.hash_qrcode || 'temp'}.jpg`);
      uploadBytes(storageRef, file).then(async () => {
        const url = await getDownloadURL(storageRef);
        setForm((prev) => ({ ...prev, url_foto: url }));
        if (editId) await updateAluno(editId, { url_foto: url });
      });
    }
  };

  const handleRemoveImage = async () => {
    try {
      const imgRef = ref(storage, `/escolas/${form.id_escola}/alunos/${form.hash_qrcode || 'temp'}.jpg`);
      await deleteObject(imgRef);
    } catch {}
    setForm((prev) => ({ ...prev, url_foto: '' }));
    if (editId) {
      await updateAluno(editId, { url_foto: '' });
    }
  };


  // Manipulação dos responsáveis (com imagem)
  const handleResponsavelChange = (idx: number, field: keyof ResponsavelAluno, value: string) => {
    setForm((prev) => {
      const novos = [...prev.responsaveis];
      novos[idx] = { ...novos[idx], [field]: value };
      return { ...prev, responsaveis: novos };
    });
  };
  const handleAddResponsavel = () => {
    setForm((prev) => {
      if (prev.responsaveis.length >= 5) return prev;
      return { ...prev, responsaveis: [...prev.responsaveis, { nome: '', parentesco: '', cpf: '', telefone: '', url_foto: '' }] };
    });
  };
  const handleRemoveResponsavel = (idx: number) => {
    setForm((prev) => {
      const novos = [...prev.responsaveis];
      novos.splice(idx, 1);
      return { ...prev, responsaveis: novos };
    });
  };

  // Upload de imagem individual para cada responsável
  const handleResponsavelImageChange = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 200 * 1024) {
        alert('Imagem muito grande! Máximo 200KB.');
        return;
      }
      const r = form.responsaveis[idx];
      // Remove imagem anterior se existir
      if (r.url_foto) {
        try {
          const prevRef = ref(storage, `/escolas/${form.id_escola}/responsaveis/${r.cpf || 'temp'}_${idx}.jpg`);
          await deleteObject(prevRef);
        } catch {}
      }
      const storageRef = ref(storage, `/escolas/${form.id_escola}/responsaveis/${r.cpf || Date.now()}_${idx}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev) => {
        const novos = [...prev.responsaveis];
        novos[idx] = { ...novos[idx], url_foto: url };
        return { ...prev, responsaveis: novos };
      });
    }
  };

  const handleResponsavelRemoveImage = async (idx: number) => {
    const r = form.responsaveis[idx];
    try {
      const imgRef = ref(storage, `/escolas/${form.id_escola}/responsaveis/${r.cpf || 'temp'}_${idx}.jpg`);
      await deleteObject(imgRef);
    } catch {}
    setForm((prev) => {
      const novos = [...prev.responsaveis];
      novos[idx] = { ...novos[idx], url_foto: '' };
      return { ...prev, responsaveis: novos };
    });
  };

  // Validação de CPF simples
  function validarCPF(cpf: string) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  }

  const handleSubmit = async () => {
    if (isSuperAdm) return; // SUPER ADM não pode cadastrar/editar
    // Validação de CPF do aluno
    if (!validarCPF(form.cpf)) {
      alert('CPF do aluno inválido!');
      return;
    }
    // Garante vínculo automático do aluno à escola do ADM ESCOLA
    // Adiciona usuario_alteracao, ativo e id_escola_master
    const usuarioAlteracao = userProfile?.uid || '';
    // Determina o id_escola_master: se o usuário logado é ESCOLA_MASTER, usa seu uid; se é ADM_ESCOLA, usa o uid_criador
    let idEscolaMaster = '';
    if (userProfile?.tipo_perfil === 'ESCOLA_MASTER') {
      idEscolaMaster = userProfile.uid;
    } else if (userProfile?.tipo_perfil === 'ADM_ESCOLA' && userProfile?.uid_criador) {
      idEscolaMaster = userProfile.uid_criador;
    }
    const alunoData = {
      ...form,
      id_escola: idEscola,
      id_escola_master: idEscolaMaster,
      usuario_alteracao: usuarioAlteracao,
      ativo: form.ativo !== undefined ? form.ativo : true,
    };
    if (editId) {
      await updateAluno(editId, alunoData);
    } else {
      await addAluno(alunoData);
    }
    handleClose();
  };

  // ADM_ESCOLA vê apenas alunos da sua escola
  const alunosFiltrados = alunos.filter((aluno: any) => {
    if (userProfile?.tipo_perfil === 'ADM_ESCOLA') {
      return aluno.id_escola === userProfile.id_escola;
    }
    return false;
  }).filter((aluno: any) => {
    const nomeMatch = filtroNome ? aluno.nome_completo.toLowerCase().includes(filtroNome.toLowerCase()) : true;
    const salaMatch = filtroSala ? (aluno.sala || '').toLowerCase().includes(filtroSala.toLowerCase()) : true;
    const cpfMatch = filtroCpf ? aluno.cpf.replace(/\D/g, '').includes(filtroCpf.replace(/\D/g, '')) : true;
    return nomeMatch && salaMatch && cpfMatch;
  });

  if (isSuperAdm || isEscolaMaster) {
    return <Typography>Acesso restrito.</Typography>;
  }

  return (
    <Box>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <Box border={2} borderColor="#1976d2" borderRadius={3} p={2} bgcolor="#f8fafd">
          <DialogTitle sx={{ p: 0, mb: 2 }}>{editId ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
          <DialogContent sx={{ p: 0 }}>
          <TextField margin="dense" label="Nome Completo" name="nome_completo" value={form.nome_completo} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Sala" name="sala" value={form.sala} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="CPF" name="cpf" value={form.cpf} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Data de Nascimento" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} fullWidth required type="date" InputLabelProps={{ shrink: true }} />
          <ImageUpload
            label="Imagem Aluno"
            previewUrl={form.url_foto ? form.url_foto : null}
            onSelect={handleImageChange}
            onRemove={handleRemoveImage}
            maxSizeKB={Math.round(MAX_IMAGE_SIZE_BYTES/1024)}
          />
          <Box mt={2}>
            <Typography variant="subtitle1">Responsáveis (máx. 5)</Typography>
            {form.responsaveis.map((r: ResponsavelAluno, idx: number) => (
              <Box key={idx} display="flex" alignItems="flex-start" gap={2} mb={2} p={2} border={2} borderColor="#90caf9" borderRadius={2}>
                <Box display="flex" flexDirection="column" alignItems="center" minWidth={140}>
                  <Typography variant="subtitle2" mb={1}>{`Foto do Responsável ${idx + 1}`}</Typography>
                  <ImageUpload
                    label="Selecionar Foto"
                    previewUrl={r.url_foto || null}
                    onSelect={e => handleResponsavelImageChange(idx, e)}
                    onRemove={() => handleResponsavelRemoveImage(idx)}
                    maxSizeKB={200}
                  />
                </Box>
                <Box flex={1} display="flex" flexDirection="column" gap={1}>
                  <TextField label="Nome" value={r.nome} onChange={e => handleResponsavelChange(idx, 'nome', e.target.value)} required />
                  <TextField label="Parentesco" value={r.parentesco} onChange={e => handleResponsavelChange(idx, 'parentesco', e.target.value)} required />
                  <TextField label="Telefone" value={r.telefone} onChange={e => handleResponsavelChange(idx, 'telefone', e.target.value)} required />
                  <TextField label="CPF" value={r.cpf} onChange={e => handleResponsavelChange(idx, 'cpf', e.target.value)} required />
                  <Button color="error" onClick={() => handleRemoveResponsavel(idx)} sx={{ alignSelf: 'flex-start', mt: 1 }}>Remover</Button>
                </Box>
              </Box>
            ))}
            {form.responsaveis && form.responsaveis.length < 5 && (
              <Button onClick={handleAddResponsavel} variant="outlined" size="small">Adicionar Responsável</Button>
            )}
          </Box>
          <Box mt={2}>
            <Typography variant="subtitle2">QR Code do Aluno</Typography>
            {form.hash_qrcode && <QRCode value={form.hash_qrcode} size={96} />}
          </Box>
          {/* Campos técnicos: usuario_alteracao e ativo */}
          {editId && (
            <Box mt={2}>
              <TextField
                label="Usuário da Última Alteração"
                value={form.usuario_alteracao || ''}
                fullWidth
                InputProps={{ readOnly: true }}
                margin="dense"
              />
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
        </Box>
      </Dialog>
      {loading ? <CircularProgress /> : (
        <TableWithPagination
          columns={[
            {
              label: '',
              field: 'checkbox',
              render: (aluno: any) => (
                <Checkbox
                  checked={selectedAlunos.includes(aluno.id_documento)}
                  onChange={() => handleSelectAluno(aluno.id_documento)}
                />
              ),
              align: 'center',
            },
            { label: 'Nome', field: 'nome_completo', sortable: true, filterable: true },
            { label: 'Sala', field: 'sala', sortable: true, filterable: true },
            { label: 'CPF', field: 'cpf', sortable: true, filterable: true },
            { label: 'Data Nasc.', field: 'data_nascimento', sortable: true, filterable: true },
            {
              label: 'QR Code',
              field: 'hash_qrcode',
              render: (aluno: any) => <QRCode value={aluno.hash_qrcode} size={48} />, align: 'center',
            },
            {
              label: 'Responsáveis',
              field: 'responsaveis',
              render: (aluno: any) => Array.isArray(aluno.responsaveis) && aluno.responsaveis.map((r: ResponsavelAluno, idx: number) => (
                <Chip key={idx} label={`${r.nome} (${r.parentesco})`} sx={{ mr: 0.5 }} />
              )),
            },
            {
              label: 'Ações',
              field: 'acoes',
              render: (aluno: any) => (
                <>
                  <IconButton onClick={() => handleOpen(aluno)}><EditIcon /></IconButton>
                  <IconButton onClick={() => setConfirmDeleteId(aluno.id_documento)}><DeleteIcon /></IconButton>
                      {/* Diálogo de confirmação de exclusão */}
                      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
                        <DialogTitle>Confirmar exclusão</DialogTitle>
                        <DialogContent>Tem certeza que deseja excluir este aluno? Esta ação não poderá ser desfeita.</DialogContent>
                        <DialogActions>
                          <Button onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                          <Button onClick={async () => {
                            if (confirmDeleteId) await deleteAluno(confirmDeleteId);
                            setConfirmDeleteId(null);
                          }} color="error" variant="contained">Excluir</Button>
                        </DialogActions>
                      </Dialog>
                </>
              ),
              align: 'center',
            },
          ]}
          data={alunosFiltrados}
          rowsPerPage={50}
          extraToolbar={
            <Box display="flex" alignItems="center" gap={2} width="100%">
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (selectedAlunos.length === alunosFiltrados.length) {
                    setSelectedAlunos([]);
                  } else {
                    setSelectedAlunos(alunosFiltrados.map(a => a.id_documento));
                  }
                }}
                disabled={alunosFiltrados.length === 0}
                sx={{ mr: 1 }}
              >
                {selectedAlunos.length === alunosFiltrados.length ? 'Desselecionar Todos' : 'Selecionar Todos'}
              </Button>
              <TextField label="Filtrar por Nome" value={filtroNome} onChange={e => setFiltroNome(e.target.value)} size="small" sx={{ minWidth: 180 }} />
              <TextField label="Filtrar por Sala" value={filtroSala} onChange={e => setFiltroSala(e.target.value)} size="small" sx={{ minWidth: 140 }} />
              <TextField label="Filtrar por CPF" value={filtroCpf} onChange={e => setFiltroCpf(e.target.value)} size="small" sx={{ minWidth: 140 }} />
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                Novo Aluno
              </Button>
            </Box>
          }
        />
      )}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>{editId ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Nome Completo" name="nome_completo" value={form.nome_completo} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Sala" name="sala" value={form.sala} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="CPF" name="cpf" value={form.cpf} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Data de Nascimento" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} fullWidth required type="date" InputLabelProps={{ shrink: true }} />
          <ImageUpload
            label="Imagem Aluno"
            previewUrl={form.url_foto ? form.url_foto : null}
            onSelect={handleImageChange}
            onRemove={handleRemoveImage}
            maxSizeKB={Math.round(MAX_IMAGE_SIZE_BYTES/1024)}
          />
          <Box mt={2}>
            <Typography variant="subtitle1">Responsáveis (máx. 5)</Typography>
            {form.responsaveis.map((r: ResponsavelAluno, idx: number) => (
              <Box key={idx} display="flex" alignItems="flex-start" gap={2} mb={2} p={2} border="1px solid #eee" borderRadius={2}>
                <ImageUpload
                  label={`Foto do Responsável ${idx + 1}`}
                  previewUrl={r.url_foto || null}
                  onSelect={e => handleResponsavelImageChange(idx, e)}
                  onRemove={() => handleResponsavelRemoveImage(idx)}
                  maxSizeKB={200}
                />
                <Box flex={1} display="flex" flexDirection="column" gap={1}>
                  <TextField label="Nome" value={r.nome} onChange={e => handleResponsavelChange(idx, 'nome', e.target.value)} required />
                  <TextField label="Parentesco" value={r.parentesco} onChange={e => handleResponsavelChange(idx, 'parentesco', e.target.value)} required />
                  <TextField label="Telefone" value={r.telefone} onChange={e => handleResponsavelChange(idx, 'telefone', e.target.value)} required />
                  <TextField label="CPF" value={r.cpf} onChange={e => handleResponsavelChange(idx, 'cpf', e.target.value)} required />
                  <Button color="error" onClick={() => handleRemoveResponsavel(idx)}>Remover</Button>
                </Box>
              </Box>
            ))}
            {form.responsaveis && form.responsaveis.length < 5 && (
              <Button onClick={handleAddResponsavel} variant="outlined" size="small">Adicionar Responsável</Button>
            )}
          </Box>
          <Box mt={2}>
            <Typography variant="subtitle2">QR Code do Aluno</Typography>
            {form.hash_qrcode && <QRCode value={form.hash_qrcode} size={96} />}
          </Box>
          {/* Campos técnicos: usuario_alteracao e ativo */}
          {editId && (
            <Box mt={2}>
              <TextField
                label="Usuário da Última Alteração"
                value={form.usuario_alteracao || ''}
                fullWidth
                InputProps={{ readOnly: true }}
                margin="dense"
              />
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

export default AlunosPage;
