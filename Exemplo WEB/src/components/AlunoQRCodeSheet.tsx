import React from 'react';
import AlunoQRCodeCard from './AlunoQRCodeCard';

interface Aluno {
  uid: string;
  nome_completo: string;
  sala?: string;
}

interface AlunoQRCodeSheetProps {
  alunos: Aluno[];
}


// Layout: 2 colunas x 4 linhas (A7 em A4)
const AlunoQRCodeSheet: React.FC<AlunoQRCodeSheetProps> = ({ alunos }) => {
  // Preenche até 8 cartões por folha
  const cards: (Aluno | null)[] = [...alunos];
  while (cards.length < 8) cards.push(null);

  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: '0',
        background: '#fff',
        pageBreakAfter: 'always',
      }}
    >
      {cards.map((aluno, idx) => (
        <div key={idx} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {aluno && <AlunoQRCodeCard nome={aluno.nome_completo} sala={aluno.sala} id={aluno.uid} />}
        </div>
      ))}
    </div>
  );
};

export default AlunoQRCodeSheet;
