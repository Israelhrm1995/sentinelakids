import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, DocumentData, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ResponsavelAluno } from '../types/firestore';
import { useAuth } from '../context/AuthContext';

export interface Aluno {
  id_documento: string;
  id_escola: string;
  nome_completo: string;
  sala: string;
  cpf: string;
  data_nascimento: string;
  url_foto?: string;
  hash_qrcode: string;
  responsaveis: ResponsavelAluno[];
}

export function useAlunos(id_escola: string) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  const fetchAlunos = async () => {
    setLoading(true);
    let q;
    if (userProfile?.tipo_perfil === 'ESCOLA_MASTER') {
      // Busca todos alunos do tenant
      q = query(collection(db, 'alunos'), where('id_escola_master', '==', userProfile.uid));
    } else if (id_escola) {
      // Busca alunos da escola
      q = query(collection(db, 'alunos'), where('id_escola', '==', id_escola));
    } else {
      setAlunos([]);
      setLoading(false);
      return;
    }
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({ ...doc.data(), id_documento: doc.id }) as Aluno);
    setAlunos(data);
    setLoading(false);
  };

  const addAluno = async (aluno: Omit<Aluno, 'id_documento'>) => {
    await addDoc(collection(db, 'alunos'), aluno);
    await fetchAlunos();
  };

  const updateAluno = async (id: string, aluno: Partial<Aluno>) => {
    await updateDoc(doc(db, 'alunos', id), aluno as DocumentData);
    await fetchAlunos();
  };

  const deleteAluno = async (id: string) => {
    await deleteDoc(doc(db, 'alunos', id));
    await fetchAlunos();
  };

  useEffect(() => {
    if (id_escola) {
      fetchAlunos();
    } else {
      setAlunos([]);
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [id_escola]);

  return { alunos, loading, addAluno, updateAluno, deleteAluno, fetchAlunos };
}
