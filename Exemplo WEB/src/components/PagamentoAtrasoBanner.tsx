import React from 'react';
import { Alert } from '@mui/material';

interface PagamentoAtrasoBannerProps {
  diasAtraso: number;
  dataVencimento: Date;
}

const PagamentoAtrasoBanner: React.FC<PagamentoAtrasoBannerProps> = ({ diasAtraso, dataVencimento }) => {
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      Pagamento em atraso há <b>{diasAtraso}</b> dias (vencimento: {dataVencimento.toLocaleDateString()}). O acesso pode ser bloqueado a qualquer momento. Regularize o pagamento para evitar suspensão do sistema.
    </Alert>
  );
};

export default PagamentoAtrasoBanner;
