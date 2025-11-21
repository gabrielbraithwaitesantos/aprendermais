import { Recurso, Trilha } from '../types/models';

// Trilhas (mock) para fallback offline
export const trilhas: Trilha[] = [
  {
    id: 'matematica-funcoes',
    nome: 'Matematica - Funcoes',
    descricao: 'Aulas selecionadas de funcoes de 1o e 2o grau.',
    imgCoverUrl: undefined,
    areas: ['matematica'],
  },
  {
    id: 'enem-base',
    nome: 'ENEM - Base oficial',
    descricao: 'Materiais oficiais do INEP para praticar com provas reais.',
    imgCoverUrl: undefined,
    exames: ['enem'],
  },
  {
    id: 'vestibular-ufpr',
    nome: 'Vestibular UFPR',
    descricao: 'Paginas e provas oficiais da UFPR para consulta.',
    imgCoverUrl: undefined,
    exames: ['ufpr'],
  },
];

// Recursos (mock)
export const recursos: Recurso[] = [
  {
    id: 'enem-2023-caderno-azul',
    trilhaId: 'enem-base',
    tipo: 'PDF_OFICIAL',
    titulo: 'ENEM 2023 - Caderno Azul (1o dia) - Prova Objetiva',
    urlOficial:
      'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D1_CD1.pdf',
    origem: 'INEP',
    observacao: 'Link oficial publico do INEP.',
  },
  {
    id: 'video-funcoes-1-grau',
    trilhaId: 'matematica-funcoes',
    tipo: 'YOUTUBE',
    titulo: 'Funcao do 1o grau - Aula completa',
    urlOficial: 'https://www.youtube.com/watch?v=XtKJzhLQpfA',
    origem: 'YouTube',
    observacao: 'Tocado via player oficial do YouTube.',
  },
  {
    id: 'ufpr-provas-editais',
    trilhaId: 'vestibular-ufpr',
    tipo: 'SITE',
    titulo: 'Provas e editais - UFPR (oficial)',
    urlOficial: 'https://www.nc.ufpr.br/concursos_institucionais/ufpr/ufpr_provas.html',
    origem: 'UFPR',
  },
];

export const getRecursosByTrilha = (trilhaId: string) =>
  recursos.filter((r) => r.trilhaId === trilhaId);

export const getRecursoById = (id: string) => recursos.find((r) => r.id === id);
