import { Timestamp } from "firebase/firestore";

export interface Evento {
  id_documento: string;
  tipo: "E" | "S";
  data_hora: Timestamp;
  id_responsavel: string;
  id_usuario_operador: string;
  id_aluno: string;
}
