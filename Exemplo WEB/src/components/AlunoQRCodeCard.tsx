import React from 'react';
import QRCode from 'qrcode.react';

interface AlunoQRCodeCardProps {
  nome: string;
  sala?: string;
  id: string;
}

// Tamanho A7: 74mm x 105mm (em px: 279 x 397 @96dpi, mas usaremos mm para impressão)
const AlunoQRCodeCard: React.FC<AlunoQRCodeCardProps> = ({ nome, sala, id }) => {
  return (
    <div style={{
      width: '74mm',
      height: '105mm',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #ccc',
      pageBreakInside: 'avoid',
      boxSizing: 'border-box',
      padding: '8mm 0',
      background: '#fff',
    }}>
      <QRCode value={id} size={120} includeMargin={true} renderAs="svg" />
      <div style={{ marginTop: '12mm', fontSize: '18pt', fontWeight: 600, textAlign: 'center', wordBreak: 'break-word' }}>{nome}</div>
      {sala && <div style={{ fontSize: '14pt', marginTop: '2mm', textAlign: 'center', color: '#444' }}>{sala}</div>}
    </div>
  );
};

export default AlunoQRCodeCard;
