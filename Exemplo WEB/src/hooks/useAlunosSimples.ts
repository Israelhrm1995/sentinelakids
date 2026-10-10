import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Aluno } from '../types/firestore';

export function useAlunosSimples(idEscola: string) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idEscola) {
      setAlunos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'alunos'), where('id_escola', '==', idEscola));
    getDocs(q).then((snap) => {
      const data = snap.docs.map((d) => ({ id_documento: d.id, ...d.data() } as Aluno));
      setAlunos(data);
      setLoading(false);
    });
  }, [idEscola]);

  return { alunos, loading };
}
