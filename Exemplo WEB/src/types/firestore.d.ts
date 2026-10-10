import { Timestamp } from "firebase/firestore";

export type PerfilUsuario = "SUPER_ADM" | "ADM_ESCOLA" | "PORTARIA" | "ESCOLA_MASTER";

export interface Usuario {
  uid: string;
  email: string;
  nome_completo: string;
  tipo_perfil: PerfilUsuario;
  id_escola: string | null;
  data_criacao: Timestamp;
  usuario_alteracao?: string; // UID do usuário que fez a última alteração
  ativo?: boolean;
  data_ultimo_pagamento?: Timestamp | null;
  data_proximo_vencimento?: Timestamp | null;
  valor_por_escola?: number;
  telefone_comprovante?: string;
  chave_pix?: string;
  quantidade_escolas?: number;
  nome_recebedor?: string;
  cidade_recebedor?: string;
  telefone_master?: string;
  uid_criador?: string; // Adicionado para evitar erro TS2339
}

export interface Escola {
  id_documento: string;
  nome_instituicao: string;
  cnpj: string;
  ativo: boolean;
  endereco_completo: string;
  url_logo: string;
  usuario_alteracao?: string; // UID do usuário que fez a última alteração
}

export interface Responsavel {
  id_documento: string;
  nome_completo: string;
  cpf: string;
  rg: string;
  /**
   * URL da foto do responsável (Firebase Storage). Opcional.
   */
  url_foto?: string;
  telefones: string[];
  ids_alunos_vinculados: string[];
}


export interface Evento {
  id_documento: string;
  tipo: 'E' | 'S';
  data_hora: Timestamp;
  id_responsavel: string;
  id_usuario_operador: string;
  id_aluno: string;
}

export interface ResponsavelAluno {
  nome: string;
  parentesco: string;
  cpf: string;
  telefone: string;
  url_foto?: string;
}

export interface Aluno {
  id_documento: string;
  id_escola: string;
  id_escola_master: string;
  nome_completo: string;
  sala: string;
  cpf: string;
  data_nascimento: string; // ou Timestamp, dependendo de como será salvo
  /**
   * URL da foto do aluno (Firebase Storage). Opcional.
   */
  url_foto?: string;
  hash_qrcode: string;
  responsaveis: ResponsavelAluno[];
  usuario_alteracao?: string; // UID do usuário que fez a última alteração
  ativo?: boolean;
}
