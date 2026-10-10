import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useUsuarios } from '../hooks/useUsuarios';
import { Usuario } from '../types/firestore';
import { Timestamp } from 'firebase/firestore';
import { useEscolas } from '../hooks/useEscolas';
import { useAuth } from '../context/AuthContext';

const initialForm: Omit<Usuario, 'uid'> & { senha: string } = {
  email: '',
  nome_completo: '',
  tipo_perfil: 'ADM_ESCOLA',
  id_escola: '',
  senha: '',
  data_criacao: Timestamp.now(),
};


// import { fetchSignInMethodsForEmail } from 'firebase/auth';
// import { auth } from '../firebase/config';

const UsuariosPage: React.FC = () => {
  const { userProfile } = useAuth();
  // Alerta de e-mail já existente
  const [emailExists, setEmailExists] = useState(false);

  // Permite acesso para ESCOLA_MASTER e SUPER_ADM
  if (userProfile?.tipo_perfil !== 'SUPER_ADM' && userProfile?.tipo_perfil !== 'ESCOLA_MASTER') return <Typography>Acesso restrito.</Typography>;

  const { usuarios, loading, addUsuario, updateUsuario, deleteUsuario } = useUsuarios();
  const { logout } = useAuth();
  const { fetchEscolas } = useEscolas();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [alertSenha, setAlertSenha] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);


  const handleOpen = async (usuario?: Usuario) => {
    await fetchEscolas(); // sempre busca as escolas mais recentes
    if (usuario) {
      setForm({ ...usuario, senha: '' }); // senha não é exibida ao editar
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
    setAlertSenha(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };


  // No cadastro de ADM_ESCOLA, exige id_escola preenchido
  const handleSubmit = async () => {
    setEmailExists(false);
    if (form.tipo_perfil === 'ADM_ESCOLA' && (!form.id_escola || form.id_escola.trim() === '')) {
      alert('Selecione a escola para o usuário ADM_ESCOLA!');
      return;
    }
    // Salva data_proximo_vencimento como Firestore Timestamp
    let dataVenc = form.data_proximo_vencimento;
    if (typeof dataVenc === 'string' && dataVenc.length >= 10) {
      // Assume formato yyyy-mm-dd, converte para Timestamp UTC
      const [year, month, day] = dataVenc.split('-').map(Number);
      dataVenc = Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day, 3, 0, 0)));
    }
    if (editId) {
      const { senha, ...rest } = form;
      await updateUsuario(editId, { ...rest, data_proximo_vencimento: dataVenc });
      setAlertSenha(true);
      handleClose();
    } else {
      try {
        let usuarioParaSalvar = { ...form, data_proximo_vencimento: dataVenc };
        if (userProfile?.tipo_perfil === 'ESCOLA_MASTER' && form.tipo_perfil === 'ADM_ESCOLA') {
          usuarioParaSalvar.uid_criador = userProfile.uid;
        }
        await addUsuario(usuarioParaSalvar);
        setShowLogoutAlert(true);
      } catch (err: any) {
        if (err.message === 'EMAIL_EXISTS') {
          setEmailExists(true);
        } else {
          alert('Erro ao cadastrar usuário: ' + err.message);
        }
      }
    }
  };

  // Título e botão de novo usuário dependem do perfil
  const isSuperAdm = userProfile?.tipo_perfil === 'SUPER_ADM';
  const isEscolaMaster = userProfile?.tipo_perfil === 'ESCOLA_MASTER';

  // Filtrar usuários: SUPER_ADM vê todos, ESCOLA_MASTER vê todos que criou (uid_criador = seu uid) e a si mesmo
  let usuariosFiltrados = usuarios;
  if (userProfile?.tipo_perfil === 'ESCOLA_MASTER') {
    usuariosFiltrados = usuarios.filter(u =>
      u.uid === userProfile.uid || u.uid_criador === userProfile.uid || (u.tipo_perfil === 'ESCOLA_MASTER' && u.id_escola === userProfile.id_escola)
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          {isSuperAdm ? 'Escolas Master (ESCOLA_MASTER)' : 'Usuários'}
        </Typography>
        {isEscolaMaster && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Novo Usuário</Button>
        )}
      </Box>
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
            {usuariosFiltrados
              .filter(u => u.tipo_perfil === 'ESCOLA_MASTER' && (userProfile?.tipo_perfil !== 'ESCOLA_MASTER' || u.usuario_alteracao === userProfile?.uid))
              .map((usuario: Usuario) => (
              <TableRow key={usuario.uid}>
                <TableCell>{usuario.nome_completo}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{usuario.telefone_comprovante || '-'}</TableCell>
                <TableCell>{usuario.chave_pix || '-'}</TableCell>
                <TableCell>{
                  usuario.valor_por_escola !== undefined && usuario.valor_por_escola !== null && !isNaN(Number(usuario.valor_por_escola))
                    ? `R$ ${Number(usuario.valor_por_escola).toFixed(2)}`
                    : '-'
                }</TableCell>
                <TableCell>{usuario.data_proximo_vencimento
                  ? (() => {
                      const d: any = usuario.data_proximo_vencimento;
                      if (!d) return '-';
                      if (typeof d === 'string') {
                        const dateObj = new Date(d);
                        return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString();
                      }
                      if (d instanceof Timestamp) {
                        return d.toDate().toLocaleDateString();
                      }
                      if (d && typeof d === 'object' && 'seconds' in d) {
                        const dateObj = new Date(d.seconds * 1000);
                        return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString();
                      }
                      return '-';
                    })()
                  : '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(usuario)}><EditIcon /></IconButton>
                  {/* SUPER_ADM pode deletar ESCOLA_MASTER se necessário */}
                  <IconButton onClick={() => deleteUsuario(usuario.uid)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Nome Completo" name="nome_completo" value={form.nome_completo} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Email" name="email" value={form.email} onChange={handleChange} fullWidth required />
          <TextField margin="dense" label="Senha" name="senha" value={form.senha} onChange={handleChange} type="password" fullWidth required={!editId} helperText={editId ? 'Deixe em branco para não alterar' : ''} />
          {(userProfile?.tipo_perfil === 'SUPER_ADM' || form.tipo_perfil === 'ESCOLA_MASTER') && (
            <TextField
              margin="dense"
              label="Valor por Escola (R$)"
              name="valor_por_escola"
              value={form.valor_por_escola || ''}
              onChange={handleChange}
              type="number"
              fullWidth
              required={form.tipo_perfil === 'ESCOLA_MASTER'}
              inputProps={{ min: 0, step: 0.01 }}
            />
          )}
          {/* Campo Próx. Vencimento (apenas para SUPER_ADM e ESCOLA_MASTER) */}
          {(userProfile?.tipo_perfil === 'SUPER_ADM' || form.tipo_perfil === 'ESCOLA_MASTER') && (
            <TextField
              margin="dense"
              label="Próx. Vencimento"
              name="data_proximo_vencimento"
              type="date"
              value={(() => {
                if (!form.data_proximo_vencimento) return '';
                if (typeof form.data_proximo_vencimento === 'string') return form.data_proximo_vencimento.slice(0, 10);
                if (form.data_proximo_vencimento instanceof Timestamp) return form.data_proximo_vencimento.toDate().toISOString().slice(0, 10);
                if (form.data_proximo_vencimento.seconds) return new Date(form.data_proximo_vencimento.seconds * 1000).toISOString().slice(0, 10);
                return '';
              })()}
              onChange={e => setForm((prev: any) => ({ ...prev, data_proximo_vencimento: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Data limite para acesso ao sistema."
            />
          )}
          {/* Campo Telefone de Contato Master (obrigatório para ESCOLA_MASTER) */}
          {form.tipo_perfil === 'ESCOLA_MASTER' && (
            <TextField
              margin="dense"
              label="Telefone de Contato do Master"
              name="telefone_master"
              value={form.telefone_master || ''}
              onChange={handleChange}
              fullWidth
              required
              inputProps={{ maxLength: 20 }}
              helperText="Este telefone será usado para contato administrativo."
            />
          )}
          {emailExists && (
            <Typography color="error" variant="body2" mb={1}>
              Já existe um usuário com este e-mail. Escolha outro e-mail.
            </Typography>
          )}
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
      {alertSenha && (
        <Box mt={2}>
          <Typography color="warning.main" variant="body2">
            A senha só pode ser alterada pelo próprio usuário via "Esqueci minha senha" na tela de login.
          </Typography>
        </Box>
      )}
      {showLogoutAlert && (
        <Dialog open={showLogoutAlert}>
          <DialogTitle>Você foi desconectado</DialogTitle>
          <DialogContent>
            <Typography color="error" variant="body1">
              Por segurança, após cadastrar um novo usuário, você foi desconectado. Faça login novamente como SUPER ADM para continuar.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={async () => { await logout(); window.location.href = '/login'; }}>OK</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default UsuariosPage;
