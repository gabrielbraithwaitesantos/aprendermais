import { Recurso, Trilha } from '../types/models';

// Trilhas de fallback offline (usadas quando nao ha dados no backend)
export const trilhas: Trilha[] = [
  {
    id: 'matematica-fundamentos',
    nome: 'Matematica - Fundamentos',
    descricao: 'Rota curta para revisar algebra e porcentagem.',
    imgCoverUrl: undefined,
    areas: ['matematica'],
  },
  {
    id: 'enem-provas-oficiais',
    nome: 'ENEM - Provas Oficiais',
    descricao: 'Provas e gabaritos oficiais do INEP (PDF).',
    imgCoverUrl: undefined,
    exames: ['enem'],
  },
  {
    id: 'ufpr-oficial',
    nome: 'UFPR - Portal Oficial',
    descricao: 'Acesso aos portais institucionais da UFPR.',
    imgCoverUrl: undefined,
    exames: ['ufpr'],
  },
];

export const recursos: Recurso[] = [
  {
    id: 'enem-2025-d1-cd1-prova',
    trilhaId: 'enem-provas-oficiais',
    tipo: 'PDF_OFICIAL',
    titulo: 'ENEM 2025 - 1º dia - Caderno 1 Azul (prova)',
    urlOficial: 'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_PV_impresso_D1_CD1.pdf',
    origem: 'INEP',
    observacao: 'PDF oficial do INEP.',
  },
  {
    id: 'enem-2025-d1-cd1-gabarito',
    trilhaId: 'enem-provas-oficiais',
    tipo: 'PDF_OFICIAL',
    titulo: 'ENEM 2025 - 1º dia - Caderno 1 Azul (gabarito)',
    urlOficial: 'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D1_CD1.pdf',
    origem: 'INEP',
  },
  {
    id: 'enem-2024-d1-cd1-prova',
    trilhaId: 'enem-provas-oficiais',
    tipo: 'PDF_OFICIAL',
    titulo: 'ENEM 2024 - 1º dia - Caderno 1 Azul (prova)',
    urlOficial: 'https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D1_CD1.pdf',
    origem: 'INEP',
  },
  {
    id: 'enem-2024-d1-cd1-gabarito',
    trilhaId: 'enem-provas-oficiais',
    tipo: 'PDF_OFICIAL',
    titulo: 'ENEM 2024 - 1º dia - Caderno 1 Azul (gabarito)',
    urlOficial: 'https://download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D1_CD1.pdf',
    origem: 'INEP',
  },
  {
    id: 'enem-2023-d2-cd5-prova',
    trilhaId: 'enem-provas-oficiais',
    tipo: 'PDF_OFICIAL',
    titulo: 'ENEM 2023 - 2º dia - Caderno 5 Amarelo (prova)',
    urlOficial: 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D2_CD5.pdf',
    origem: 'INEP',
  },
  {
    id: 'enem-2023-d2-cd5-gabarito',
    trilhaId: 'enem-provas-oficiais',
    tipo: 'PDF_OFICIAL',
    titulo: 'ENEM 2023 - 2º dia - Caderno 5 Amarelo (gabarito)',
    urlOficial: 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D2_CD5.pdf',
    origem: 'INEP',
  },
  {
    id: 'video-funcao-1-grau',
    trilhaId: 'matematica-fundamentos',
    tipo: 'YOUTUBE',
    titulo: 'Funcao do 1o grau - aula completa',
    urlOficial: 'https://www.youtube.com/watch?v=1I7Dckv0zAU',
    origem: 'YouTube',
    observacao: 'Video educacional com foco em vestibulares.',
  },
  {
    id: 'video-porcentagem-enem',
    trilhaId: 'matematica-fundamentos',
    tipo: 'YOUTUBE',
    titulo: 'Porcentagem no ENEM - exercicios',
    urlOficial: 'https://www.youtube.com/watch?v=r_Rm_8GMgcw',
    origem: 'YouTube',
  },
  {
    id: 'ufpr-portal-nc',
    trilhaId: 'ufpr-oficial',
    tipo: 'SITE',
    titulo: 'NC UFPR - Portal oficial',
    urlOficial: 'https://www.nc.ufpr.br/',
    origem: 'UFPR',
  },
  {
    id: 'ufpr-portal-institucional',
    trilhaId: 'ufpr-oficial',
    tipo: 'SITE',
    titulo: 'UFPR - Portal institucional',
    urlOficial: 'https://www.ufpr.br/portalufpr/',
    origem: 'UFPR',
  },
];

export const getRecursosByTrilha = (trilhaId: string) =>
  recursos.filter((r) => r.trilhaId === trilhaId);

export const getRecursoById = (id: string) => recursos.find((r) => r.id === id);
