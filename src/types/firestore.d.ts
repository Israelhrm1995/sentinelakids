import { Timestamp } from "firebase/firestore";

export type PerfilUsuario = "SUPER_ADM" | "ADM_ESCOLA" | "PORTARIA";

export interface Usuario {
  uid: string;
  email: string;
  nome_completo: string;
  tipo_perfil: PerfilUsuario;
  id_escola: string | null;
  data_criacao: Timestamp;
}

export interface Escola {
  id_documento: string;
  id_escola_master: string; // ID do tenant (Escola Master)
  nome_instituicao: string;
  cnpj: string;
  ativo: boolean;
  endereco_completo: string;
  url_logo: string;
}

export interface ResponsavelAluno {
  nome: string;
  parentesco: string;
  cpf: string;
  telefone?: string;
  /**
   * URL da foto do responsável (Firebase Storage). Opcional.
   */
  url_foto?: string;
}

export interface Aluno {
  id_documento: string;
  id_escola: string;
  id_escola_master: string; // ID do tenant (Escola Master)
  nome_completo: string;
  cpf: string;
  data_nascimento: string; // ou Timestamp, dependendo de como será salvo
  /**
   * URL da foto do aluno (Firebase Storage). Opcional.
   */
  url_foto?: string;
  hash_qrcode: string;
  responsaveis: ResponsavelAluno[];
}
