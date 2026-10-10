import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Evento } from '../types/evento';

export function useEventos(id_escola: string, filtros: {
  dataInicio?: Date;
  dataFim?: Date;
  nomeAluno?: string;
  cpfAluno?: string;
  nomeUsuario?: string;
  tipoFiltro?: 'aluno' | 'usuario' | 'data';
}) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventos = async () => {
      setLoading(true);
      let q = query(collection(db, 'eventos'));
      // Filtros por data
      if (filtros.tipoFiltro === 'data' && filtros.dataInicio && filtros.dataFim) {
        q = query(q, where('data_hora', '>=', Timestamp.fromDate(filtros.dataInicio)), where('data_hora', '<=', Timestamp.fromDate(filtros.dataFim)));
      }
      // Filtros por aluno
      if (filtros.tipoFiltro === 'aluno' && (filtros.nomeAluno || filtros.cpfAluno)) {
        // Filtro será aplicado no lado do cliente após buscar os eventos da escola
      }
      // Filtros por usuário operador
      if (filtros.tipoFiltro === 'usuario' && filtros.nomeUsuario) {
        // Filtro será aplicado no lado do cliente após buscar os eventos da escola
      }
      const querySnapshot = await getDocs(q);
      let data = querySnapshot.docs.map((doc) => ({ ...doc.data(), id_documento: doc.id }) as Evento);
      // Aqui você pode filtrar por id_escola, nome/cpf do aluno, nome do usuário operador
      // ...
      setEventos(data);
      setLoading(false);
    };
    fetchEventos();
  }, [id_escola, JSON.stringify(filtros)]);

  return { eventos, loading };
}
