// Utilitário para garantir o uso de id_escola_master em todos os cadastros e buscas multi-tenant
import { Usuario, Escola, Aluno, PerfilUsuario } from '../types/firestore.d';

// Retorna o id_escola_master correto para qualquer entidade
export function getIdEscolaMaster(ref: { id_escola_master?: string; id_escola?: string; tipo_perfil?: PerfilUsuario }): string | null {
  if (ref.id_escola_master) return ref.id_escola_master;
  // Se for usuário ADM_ESCOLA, o id_escola_master deve estar na escola vinculada
  // Se for SUPER_ADM, retorna o próprio id_escola
  return ref.id_escola || null;
}

// Adiciona id_escola_master ao objeto antes de salvar
export function withTenant<T extends { id_escola_master?: string }>(obj: T, id_escola_master: string): T {
  return { ...obj, id_escola_master };
}

// Exemplo de uso ao salvar:
// addDoc(collection(db, 'alunos'), withTenant(aluno, id_escola_master));
// addDoc(collection(db, 'escolas'), withTenant(escola, id_escola_master));
// addDoc(collection(db, 'usuarios'), withTenant(usuario, id_escola_master));

// Consulta multi-tenant
// query(collection(db, 'alunos'), where('id_escola_master', '==', id_escola_master))
// query(collection(db, 'escolas'), where('id_escola_master', '==', id_escola_master))
// query(collection(db, 'usuarios'), where('id_escola_master', '==', id_escola_master))
