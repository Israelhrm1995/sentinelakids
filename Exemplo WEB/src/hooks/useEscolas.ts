import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, DocumentData } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Escola {
  id_documento: string;
  nome_instituicao: string;
  cnpj: string;
  ativo: boolean;
  endereco_completo: string;
  url_logo?: string;
  usuario_alteracao?: string;
  uid_criador?: string;
}

export function useEscolas() {
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEscolas = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'escolas'));
    const data = querySnapshot.docs.map((doc) => ({ ...doc.data(), id_documento: doc.id }) as Escola);
    setEscolas(data);
    setLoading(false);
  };

  const addEscola = async (escola: Omit<Escola, 'id_documento'>) => {
    await addDoc(collection(db, 'escolas'), escola);
    await fetchEscolas();
  };

  const updateEscola = async (id: string, escola: Partial<Escola>) => {
    await updateDoc(doc(db, 'escolas', id), escola as DocumentData);
    await fetchEscolas();
  };

  const deleteEscola = async (id: string) => {
    await deleteDoc(doc(db, 'escolas', id));
    await fetchEscolas();
  };

  useEffect(() => {
    fetchEscolas();
  }, []);

  return { escolas, loading, addEscola, updateEscola, deleteEscola, fetchEscolas };
}
