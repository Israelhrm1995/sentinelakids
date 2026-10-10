import React, { useState } from 'react';
import { Box, Typography, CircularProgress, TextField } from '@mui/material';
import TableWithPagination, { TableColumn } from '../components/TableWithPagination';
import { useEventos } from '../hooks/useEventos';
import { useAuth } from '../context/AuthContext';
import { useAlunos } from '../hooks/useAlunos';
import { useUsuarios } from '../hooks/useUsuarios';


const EntradaSaidaPage: React.FC = () => {
  const { userProfile } = useAuth();
  const idEscola = userProfile?.id_escola || '';
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [nomeAluno, setNomeAluno] = useState('');
  const [cpfAluno, setCpfAluno] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [salaAluno, setSalaAluno] = useState('');

  const filtros = {
    tipoFiltro: 'data' as 'data',
    dataInicio: dataInicio ? new Date(dataInicio) : undefined,
    dataFim: dataFim ? new Date(dataFim) : undefined,
    nomeAluno,
    cpfAluno,
    nomeUsuario,
    salaAluno,
  };
  const { eventos, loading } = useEventos(idEscola, filtros);
  const { alunos } = useAlunos(idEscola);
  const { usuarios } = useUsuarios();

  // Adicione um fallback para evitar tela em branco caso eventos, alunos ou usuarios estejam undefined
  if (!eventos || !alunos || !usuarios) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Carregando dados...</Typography>
      </Box>
    );
  }


  // Filtra eventos para ESCOLA_MASTER e ADM_ESCOLA verem apenas eventos dos alunos das suas escolas
  let eventosFiltrados = eventos;
  if (userProfile?.tipo_perfil === 'ESCOLA_MASTER') {
    const alunosDoGrupo = alunos.filter(a => a.id_escola === userProfile.uid).map(a => a.id_documento);
    eventosFiltrados = eventos.filter(ev => alunosDoGrupo.includes(ev.id_aluno));
  } else if (userProfile?.tipo_perfil === 'ADM_ESCOLA') {
    const alunosDaEscola = alunos.map(a => a.id_documento);
    eventosFiltrados = eventos.filter(ev => alunosDaEscola.includes(ev.id_aluno));
  }
  // Filtro adicional por sala do aluno
  if (salaAluno && salaAluno.trim() !== '') {
    const alunosSala = alunos.filter(a => (a.sala || '').toLowerCase().includes(salaAluno.toLowerCase())).map(a => a.id_documento);
    eventosFiltrados = eventosFiltrados.filter(ev => alunosSala.includes(ev.id_aluno));
  }

  // Prepara os dados para a tabela unificada
  const eventosComInfo = eventosFiltrados.map(ev => {
    const aluno = alunos.find(a => a.id_documento === ev.id_aluno);
    const usuario = usuarios.find(u => u.uid === ev.id_usuario_operador);
    let responsavelNome = '-';
    let parentesco = '-';
    if (aluno && Array.isArray(aluno.responsaveis)) {
      const vinculo = aluno.responsaveis.find(r => r.cpf === ev.id_responsavel);
      if (vinculo) {
        responsavelNome = vinculo.nome;
        parentesco = vinculo.parentesco;
      }
    }
    return {
      ...ev,
      nome_aluno: aluno?.nome_completo || '-',
      cpf_aluno: aluno?.cpf || '-',
      responsavel_nome: responsavelNome,
      parentesco,
      usuario_nome: usuario?.nome_completo || '-',
      data_hora_str: ev.data_hora?.toDate().toLocaleString() || '-',
      tipo_str: ev.tipo === 'E' ? 'Entrada' : 'Saída',
    };
  });

  const columns: TableColumn<any>[] = [
    { label: 'Tipo', field: 'tipo_str', filterable: true, sortable: true },
    { label: 'Data/Hora', field: 'data_hora_str', sortable: true },
    { label: 'Aluno', field: 'nome_aluno', filterable: true, sortable: true },
    { label: 'CPF Aluno', field: 'cpf_aluno', filterable: true },
    { label: 'Responsável', field: 'responsavel_nome', filterable: true },
    { label: 'Parentesco', field: 'parentesco', filterable: true },
    { label: 'Usuário Operador', field: 'usuario_nome', filterable: true },
  ];

  // Log para depuração do userProfile e datas
  console.log('userProfile', userProfile);
  if (userProfile?.tipo_perfil === 'ESCOLA_MASTER') {
    console.log('ESCOLA_MASTER - id_escola:', userProfile.id_escola);
    // Se existir vencimento, loga, senão avisa
    if ('vencimento' in userProfile) {
      console.log('ESCOLA_MASTER - vencimento:', (userProfile as any).vencimento);
    } else {
      console.warn('ESCOLA_MASTER - vencimento NÃO EXISTE no userProfile');
    }
  }

  return (
    <Box>
      <Typography variant="h5" mb={2}>Entradas/Saídas</Typography>
      <Box display="flex" gap={2} mb={2}>
        <TextField label="Data Início" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} InputLabelProps={{ shrink: true }} required sx={{ minWidth: 140 }} />
        <TextField label="Data Fim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} InputLabelProps={{ shrink: true }} required sx={{ minWidth: 140 }} />
        <TextField label="Sala do Aluno" value={salaAluno} onChange={e => setSalaAluno(e.target.value)} sx={{ minWidth: 140 }} />
        <TextField label="Nome do Aluno" value={nomeAluno} onChange={e => setNomeAluno(e.target.value)} sx={{ minWidth: 140 }} />
        <TextField label="CPF do Aluno" value={cpfAluno} onChange={e => setCpfAluno(e.target.value)} sx={{ minWidth: 140 }} />
        <TextField label="Nome do Usuário" value={nomeUsuario} onChange={e => setNomeUsuario(e.target.value)} sx={{ minWidth: 140 }} />
      </Box>
      {loading ? <CircularProgress /> : (
        <TableWithPagination
          columns={columns}
          data={eventosComInfo}
          rowsPerPage={50}
          rowStyle={row => ({ backgroundColor: row.tipo === 'E' ? 'rgba(56, 203, 137, 0.15)' : 'rgba(255, 99, 71, 0.15)' })}
        />
      )}
    </Box>
  );
};

export default EntradaSaidaPage;
