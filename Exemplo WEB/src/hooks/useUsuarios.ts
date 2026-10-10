import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, DocumentData, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { Usuario } from '../types/firestore';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    const data = querySnapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id }) as Usuario);
    setUsuarios(data);
    setLoading(false);
  };

  // usuario: { ...campos, senha }
  const addUsuario = async (usuario: Omit<Usuario, 'uid'> & { senha?: string }) => {
    // Garante que data_proximo_vencimento seja Timestamp
    let usuarioCorrigido = { ...usuario };
    if (
      usuarioCorrigido.data_proximo_vencimento &&
      typeof usuarioCorrigido.data_proximo_vencimento === 'string' &&
      typeof (usuarioCorrigido.data_proximo_vencimento as string).split === 'function'
    ) {
      const [year, month, day] = (usuarioCorrigido.data_proximo_vencimento as string).split('-').map(Number);
      usuarioCorrigido.data_proximo_vencimento = Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day, 3, 0, 0)));
    }
    // Cria no Auth primeiro
    if (usuarioCorrigido.senha) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, usuarioCorrigido.email, usuarioCorrigido.senha);
        // Salva no Firestore com o uid do Auth como ID do documento
        const { senha, ...rest } = usuarioCorrigido;
        await setDoc(doc(db, 'usuarios', cred.user.uid), {
          ...rest,
          uid: cred.user.uid,
          data_criacao: new Date(),
        });
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          throw new Error('EMAIL_EXISTS');
        }
        throw err;
      }
    } else {
      // fallback: só Firestore
      await addDoc(collection(db, 'usuarios'), usuarioCorrigido);
    }
    await fetchUsuarios();
  };

  const updateUsuario = async (id: string, usuario: Partial<Usuario>) => {
    let usuarioCorrigido = { ...usuario };
    if (
      usuarioCorrigido.data_proximo_vencimento &&
      typeof usuarioCorrigido.data_proximo_vencimento === 'string' &&
      typeof (usuarioCorrigido.data_proximo_vencimento as string).split === 'function'
    ) {
      const [year, month, day] = (usuarioCorrigido.data_proximo_vencimento as string).split('-').map(Number);
      usuarioCorrigido.data_proximo_vencimento = Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day, 3, 0, 0)));
    }
    await updateDoc(doc(db, 'usuarios', id), usuarioCorrigido as DocumentData);
    await fetchUsuarios();
  };

  const deleteUsuario = async (id: string) => {
    await deleteDoc(doc(db, 'usuarios', id));
    // Tenta remover do Auth se for o usuário logado (limitação do client SDK)
    try {
      if (auth.currentUser && auth.currentUser.uid === id) {
        await deleteUser(auth.currentUser);
      }
      // Para outros usuários, a exclusão do Auth deve ser feita via backend/admin SDK
    } catch (e) {
      // Apenas loga, pois pode não ser possível pelo client
      console.warn('Falha ao remover do Auth (apenas backend pode remover outros usuários):', e);
    }
    await fetchUsuarios();
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return { usuarios, loading, addUsuario, updateUsuario, deleteUsuario, fetchUsuarios };
}
