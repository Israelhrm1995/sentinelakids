import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Alert } from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import { useUsuarios } from '../hooks/useUsuarios';
import InputAdornment from '@mui/material/InputAdornment';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CadastroEscolaMasterDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [telefoneError, setTelefoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const { addUsuario } = useUsuarios();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen(true);
    // Validação de telefone
    const telefoneRegex = /^\d{10,11}$/;
    if (!telefoneRegex.test(telefone.replace(/\D/g, ''))) {
      setTelefoneError('Informe um telefone válido (apenas números, 10 ou 11 dígitos).');
      setConfirmOpen(false);
      return;
    } else {
      setTelefoneError('');
    }
    // Validação de email
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Informe um e-mail válido.');
      setConfirmOpen(false);
      return;
    } else {
      setEmailError('');
    }
  };

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      // Datas de carência e vencimento
      const now = new Date();
      const dataUltimoPagamento = Timestamp.fromDate(now);
      const dataProximoVencimento = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()));
      await addUsuario({
        email,
        senha,
        nome_completo: email,
        tipo_perfil: 'ESCOLA_MASTER',
        id_escola: null,
        data_criacao: Timestamp.fromDate(now),
        usuario_alteracao: '',
        ativo: true,
        data_ultimo_pagamento: dataUltimoPagamento,
        data_proximo_vencimento: dataProximoVencimento,
        valor_por_escola: 0,
        telefone_master: telefone,
        telefone_comprovante: '',
        chave_pix: '',
        quantidade_escolas: 0,
      });
      setLoading(false);
      setConfirmOpen(false);
      onSuccess();
    } catch (err: any) {
      setError('Erro ao cadastrar. Tente novamente.');
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  // Função para aplicar máscara de telefone
  function maskTelefone(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      // (99) 9999-9999
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    } else {
      // (99) 99999-9999
      return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Adquirir Sistema</DialogTitle>
      <DialogContent>
        <TextField margin="dense" label="E-mail" value={email} onChange={e => setEmail(e.target.value)} fullWidth required error={!!emailError} helperText={emailError} />
        <TextField margin="dense" label="Senha" value={senha} onChange={e => setSenha(e.target.value)} type="password" fullWidth required />
        <TextField margin="dense" label="Telefone do Master" value={maskTelefone(telefone)}
          onChange={e => setTelefone(e.target.value)} fullWidth required error={!!telefoneError}
          helperText={telefoneError || 'Informe o telefone do responsável master.'}
          InputProps={{ startAdornment: <InputAdornment position="start">📞</InputAdornment> }}
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Avançar</Button>
      </DialogActions>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmação</DialogTitle>
        <DialogContent>
          <Typography>Confirma os dados para criar o usuário master?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} variant="contained" disabled={loading}>Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default CadastroEscolaMasterDialog;
