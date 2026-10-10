import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  // DocumentReference,
} from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Responsavel } from '../types/firestore';

export function useResponsaveis(idEscola: string) {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idEscola) {
      setResponsaveis([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'responsaveis'), where('id_escola', '==', idEscola));
    getDocs(q).then((snap) => {
      const data = snap.docs.map((d) => ({ id_documento: d.id, ...d.data() } as Responsavel));
      setResponsaveis(data);
      setLoading(false);
    });
  }, [idEscola]);

  const addResponsavel = async (responsavel: Omit<Responsavel, 'id_documento'>) => {
    const docRef = await addDoc(collection(db, 'responsaveis'), responsavel);
    setResponsaveis((prev) => [...prev, { ...responsavel, id_documento: docRef.id }]);
  };

  const updateResponsavel = async (id: string, responsavel: Omit<Responsavel, 'id_documento'>) => {
    await updateDoc(doc(db, 'responsaveis', id), responsavel);
    setResponsaveis((prev) => prev.map((r) => (r.id_documento === id ? { ...responsavel, id_documento: id } : r)));
  };

  const deleteResponsavel = async (id: string) => {
    await deleteDoc(doc(db, 'responsaveis', id));
    setResponsaveis((prev) => prev.filter((r) => r.id_documento !== id));
  };

  return { responsaveis, loading, addResponsavel, updateResponsavel, deleteResponsavel };
}
