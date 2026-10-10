import React from 'react';
import { Alert } from '@mui/material';

interface AtrasoAlertaProps {
  diasAtraso: number;
}

const AtrasoAlerta: React.FC<AtrasoAlertaProps> = ({ diasAtraso }) => {
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      Pagamento em atraso há {diasAtraso} dias. O acesso pode ser bloqueado a qualquer momento. Regularize o pagamento para evitar suspensão do sistema.
    </Alert>
  );
};

export default AtrasoAlerta;
