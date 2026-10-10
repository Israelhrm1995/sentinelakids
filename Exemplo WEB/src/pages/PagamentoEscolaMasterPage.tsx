import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';
import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAuth } from '../context/AuthContext';
import { useEscolas } from '../hooks/useEscolas';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

// Função para gerar payload PIX EMV conforme padrão Febraban/Banco Central
function gerarPayloadPixComValor({ chave, nome, cidade, valor }: { chave: string; nome: string; cidade: string; valor: number }) {
  // Limpeza e truncamento dos campos obrigatórios
  nome = nome.slice(0, 25).toUpperCase().normalize('NFD').replace(/[^A-Z0-9 ]/g, '');
  cidade = cidade.slice(0, 15).toUpperCase().normalize('NFD').replace(/[^A-Z0-9 ]/g, '');
  chave = chave.trim();
  // Merchant Account Information (campo 26)
  const gui = 'BR.GOV.BCB.PIX';
  const guiField = `00${gui.length.toString().padStart(2, '0')}${gui}`;
  const chaveField = `01${chave.length.toString().padStart(2, '0')}${chave}`;
  // (opcional) descrição: const descField = `02${desc.length.toString().padStart(2, '0')}${desc}`;
  const merchantAccountInfoValue = guiField + chaveField;
  const merchantAccountInfo = `26${merchantAccountInfoValue.length.toString().padStart(2, '0')}${merchantAccountInfoValue}`;
  // Reference label aleatório (txid)
  const refLabel = Math.random().toString(36).substring(2, 27).toUpperCase(); // até 25 chars
  const refField = `05${refLabel.length.toString().padStart(2, '0')}${refLabel}`;
  const additionalDataField = `62${refField.length.toString().padStart(2, '0')}${refField}`;
  // Montagem do payload EMV
  let payload = '';
  payload += '000201'; // Payload Format Indicator (fixo)
  payload += merchantAccountInfo; // Campo 26
  payload += '52040000'; // Merchant Category Code (0000 = default)
  payload += '5303986'; // Moeda (986 = BRL)
  if (valor > 0) {
    const valorStr = valor.toFixed(2);
    payload += `54${valorStr.length.toString().padStart(2, '0')}${valorStr}`;
  }
  payload += '5802BR'; // País
  payload += `59${nome.length.toString().padStart(2, '0')}${nome}`; // Nome recebedor
  payload += `60${cidade.length.toString().padStart(2, '0')}${cidade}`; // Cidade recebedor
  payload += additionalDataField; // Campo 62 (txid)
  // Função CRC16-CCITT (XModem)
  function crc16(str: string) {
    let crc = 0xFFFF;
    for (let c of str) {
      crc ^= c.charCodeAt(0) << 8;
      for (let i = 0; i < 8; i++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      }
      crc &= 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  // Campo 63 (CRC16)
  const payloadComCRC = payload + '6304';
  const crc = crc16(payloadComCRC);
  return payloadComCRC + crc;
}

const PagamentoEscolaMasterPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { escolas } = useEscolas();
  const [pixConfig, setPixConfig] = useState<{
    chavePix: string;
    nomeRecebedor: string;
    cidadeRecebedor: string;
    telefoneRecebedor: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback seguro para userProfile não carregado
  if (!userProfile) {
    return (
      <Box maxWidth={500} mx="auto" mt={4}>
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body1">Carregando usuário...</Typography>
        </Paper>
      </Box>
    );
  }
  // Permitir acesso apenas para ESCOLA_MASTER
  if (userProfile?.tipo_perfil !== 'ESCOLA_MASTER') {
    return (
      <Box maxWidth={500} mx="auto" mt={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error">Acesso restrito</Typography>
          <Typography variant="body1">Esta página é exclusiva para usuários do tipo ESCOLA_MASTER.</Typography>
        </Paper>
      </Box>
    );
  }

  // Buscar config global do Firestore
  useEffect(() => {
    async function fetchPixConfig() {
      setLoading(true);
      try {
        const docRef = doc(db, 'config', 'pagamento');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setPixConfig({
            chavePix: snap.data().chavePix || '',
            nomeRecebedor: snap.data().nomeRecebedor || '',
            cidadeRecebedor: snap.data().cidadeRecebedor || '',
            telefoneRecebedor: snap.data().telefoneRecebedor || '',
          });
        } else {
          setPixConfig(null);
        }
      } catch {
        setPixConfig(null);
      } finally {
        setLoading(false);
      }
    }
    fetchPixConfig();
  }, []);

  // Dados globais ou fallback default
  const PIX_KEY = pixConfig?.chavePix || '7f14003c-66a2-42a2-99af-34fab8c8f316';
  const NOME_RECEBEDOR = pixConfig?.nomeRecebedor || 'ISRAEL HENRIQUE REIS SILVA MOURA';
  const CIDADE_RECEBEDOR = pixConfig?.cidadeRecebedor || 'UBERLANDIA';
  const TELEFONE = pixConfig?.telefoneRecebedor || '34 9 9169-5921';
  const TELEFONE_MASTER = userProfile?.telefone_master || '';
  const VALOR_POR_ESCOLA = Number(userProfile?.valor_por_escola) || 100;
  const EMAIL = userProfile?.email || '';
  // Quantidade de escolas cadastradas por este usuário
  const QTD_ESCOLAS = escolas.filter(e => e.usuario_alteracao === userProfile?.uid).length;
  const VALOR_TOTAL = QTD_ESCOLAS > 0 ? VALOR_POR_ESCOLA * QTD_ESCOLAS : 0;

  // Gera payload PIX dinâmico com valor e campo 62
  const payloadPix = gerarPayloadPixComValor({
    chave: PIX_KEY,
    nome: NOME_RECEBEDOR,
    cidade: CIDADE_RECEBEDOR,
    valor: VALOR_TOTAL
  });
  // Datas de pagamento
  const DATA_ULTIMO_PAGAMENTO = userProfile?.data_ultimo_pagamento ? new Date(userProfile.data_ultimo_pagamento.seconds * 1000) : null;
  const DATA_PROXIMO_VENCIMENTO = userProfile?.data_proximo_vencimento ? new Date(userProfile.data_proximo_vencimento.seconds * 1000) : null;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(payloadPix);
  };
  const handleAbrirWhatsapp = () => {
    window.open(`https://wa.me/55${TELEFONE.replace(/\D/g, '')}?text=Comprovante%20de%20pagamento%20do%20login%20${EMAIL}`);
  };
  if (loading) {
    return (
      <Box maxWidth={500} mx="auto" mt={4}>
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body1">Carregando informações de pagamento...</Typography>
        </Paper>
      </Box>
    );
  }
  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Pagamento do Sistema</Typography>
        <Typography variant="body1" mb={2}>
          Para continuar utilizando o sistema, realize o pagamento via PIX e envie o comprovante para o WhatsApp abaixo.
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1">Data do último pagamento:</Typography>
        <Typography variant="body2">{DATA_ULTIMO_PAGAMENTO ? DATA_ULTIMO_PAGAMENTO.toLocaleDateString() : '-'}</Typography>
        <Typography variant="subtitle1" mt={2}>Data do próximo vencimento:</Typography>
        <Typography variant="body2">{DATA_PROXIMO_VENCIMENTO ? DATA_PROXIMO_VENCIMENTO.toLocaleDateString() : '-'}</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1">PIX Copia e Cola:</Typography>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{payloadPix}</Typography>
          <Button onClick={handleCopyPix} startIcon={<ContentCopyIcon />} sx={{ ml: 2 }}>Copiar</Button>
        </Box>
        <Typography variant="subtitle1">Nome do Recebedor:</Typography>
        <Typography variant="body2">{NOME_RECEBEDOR}</Typography>
        <Typography variant="subtitle1">Cidade do Recebedor:</Typography>
        <Typography variant="body2">{CIDADE_RECEBEDOR}</Typography>
        <Typography variant="subtitle1">Telefone de Recebimento:</Typography>
        <Typography variant="body2">{TELEFONE}</Typography>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <QRCode value={payloadPix} size={160} />
          <Typography variant="caption" color="text.secondary" mt={1}>Escaneie para pagar via PIX</Typography>
        </Box>
        <Typography variant="subtitle1">Telefone para envio do comprovante:</Typography>
        <Button variant="outlined" color="success" onClick={handleAbrirWhatsapp} sx={{ my: 1 }}>{TELEFONE} (WhatsApp)</Button>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1">Valor por escola cadastrada:</Typography>
        <Typography variant="body2">R$ {VALOR_POR_ESCOLA.toFixed(2)}</Typography>
        <Typography variant="subtitle1" mt={2}>Quantidade de escolas cadastradas:</Typography>
        <Typography variant="body2">{QTD_ESCOLAS}</Typography>
        <Typography variant="subtitle1" mt={2}>Valor total a pagar:</Typography>
        <Typography variant="h6" color="primary">R$ {VALOR_TOTAL.toFixed(2)}</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Envie o comprovante com seu e-mail de login para que possamos atualizar o pagamento e o próximo mês de vencimento.
        </Typography>
        {TELEFONE_MASTER && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1">Telefone contato Master:</Typography>
            <Typography variant="body2">{TELEFONE_MASTER}</Typography>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default PagamentoEscolaMasterPage;
