export type OfficialResource = {
  id: string;
  trackSlug: string;
  trackTitle: string;
  trackDescription: string;
  title: string;
  description: string;
  url: string;
  exam: string;
  trackColor: string;
  minutes: number;
};

export const OFFICIAL_RESOURCES: OfficialResource[] = [
  {
    id: 'resource-enem-bank',
    trackSlug: 'enem-inicio-rapido',
    trackTitle: 'ENEM Inicio Rapido (offline)',
    trackDescription: 'Colecao de provas e gabaritos oficiais do ENEM em PDF.',
    title: 'ENEM 2023 - 1º dia - Caderno Azul',
    description: 'PDF oficial (INEP) do 1º dia, caderno azul.',
    url: 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D1_CD1.pdf',
    exam: 'ENEM',
    trackColor: '#F97316',
    minutes: 40,
  },
  {
    id: 'resource-enem-bank-day2',
    trackSlug: 'enem-inicio-rapido',
    trackTitle: 'ENEM Inicio Rapido (offline)',
    trackDescription: 'Colecao de provas e gabaritos oficiais do ENEM em PDF.',
    title: 'ENEM 2023 - 2º dia - Caderno Amarelo',
    description: 'PDF oficial (INEP) do 2º dia, caderno amarelo.',
    url: 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D2_CD2.pdf',
    exam: 'ENEM',
    trackColor: '#F97316',
    minutes: 40,
  },
  {
    id: 'resource-ufpr-simulados',
    trackSlug: 'ufpr-essencial',
    trackTitle: 'UFPR Essencial (offline)',
    trackDescription: 'Paginas e provas oficiais da UFPR com gabarito.',
    title: 'Prova UFPR 2023',
    description: 'PDF oficial com questoes e gabarito.',
    url: 'https://www.provar.ufpr.br/portal/wp-content/uploads/2023/10/prova_ufpr_2023.pdf',
    exam: 'UFPR',
    trackColor: '#0EA5E9',
    minutes: 35,
  },
  {
    id: 'resource-mentoria-lgpd',
    trackSlug: 'guias-legais',
    trackTitle: 'Guias Oficiais',
    trackDescription: 'Documentos publicos importantes para o estudante.',
    title: 'Cartilha LGPD para estudantes',
    description: 'Entenda como funciona a privacidade dos seus dados.',
    url: 'https://www.gov.br/mj/pt-br/assuntos/seus-direitos/lgpd/cartilha-lgpd.pdf',
    exam: 'Guias',
    trackColor: '#8B5CF6',
    minutes: 20,
  },
];
