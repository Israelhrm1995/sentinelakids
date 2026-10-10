import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { QrReader } from '@blackbox-vision/react-qr-reader';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';


const QrScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const remountKey = location.state?.remountKey || Date.now();
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  // Limpa o estado ao montar e ao mudar remountKey
  React.useEffect(() => {
    setLastCode(null);
    setError(null);
  }, [remountKey]);

  // Se acessar /scan com id na URL, força reset
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname.startsWith('/aluno/')) {
      navigate('/scan', { replace: true, state: { remountKey: Date.now() } });
    }
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" color="secondary" size="small" onClick={handleLogout}>
          Sair
        </Button>
      </Box>
      <Typography variant="h6" align="center" gutterBottom>
        Escaneie o QR Code do aluno
      </Typography>
      <Box sx={{ maxWidth: 350, margin: '0 auto' }}>
        <QrReader
          key={remountKey}
          constraints={{ facingMode: 'environment' }}
          onResult={(res, err) => {
            if (!!res) {
              const code = res.getText();
              if (code && code !== lastCode) {
                setLastCode(code);
                setError(null); // limpa erro anterior
                navigate(`/aluno/${code}`);
              }
            } else if (!!err && !lastCode) {
              setError('Erro ao ler QRCode');
            }
          }}
          containerStyle={{ width: '100%' }}
        />
      </Box>
      {/* Não exibe mais o último QR code lido, só mantém scanner ativo */}
      {error && (
        <Box sx={{ color: 'red', mt: 2 }}>{error}</Box>
      )}
    </Box>
  );
};

export default QrScannerPage;
