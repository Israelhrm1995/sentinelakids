import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Usuario } from '../types/firestore';

// Tipagem para os valores do contexto
interface AuthContextType {
  user: User | null;
  userProfile: Usuario | null; // Adicionado perfil do usuário do Firestore
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Usuário logado, buscar perfil no Firestore
        const userDocRef = doc(db, 'usuarios', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          // Solução para aparar espaços em branco das chaves do documento
          const rawData = userDocSnap.data();
          const profileData: { [key: string]: any } = {};
          for (const key in rawData) {
            profileData[key.trim()] = rawData[key];
          }
          // Se não vier tipo_perfil, assumir ADM_ESCOLA
          if (!profileData.tipo_perfil) {
            profileData.tipo_perfil = 'ADM_ESCOLA';
          }
          setUserProfile(profileData as Usuario);
        } else {
          // Perfil não encontrado no Firestore
          setUserProfile(null);
          console.warn(`Perfil não encontrado no Firestore para o UID: ${currentUser.uid}`);
        }
      } else {
        // Usuário deslogado
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass).then(() => {});
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    userProfile, // Expor o perfil
    loading,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

