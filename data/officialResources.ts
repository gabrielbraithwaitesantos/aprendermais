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

const ENEM_CADERNOS = [
  { day: 1 as const, cd: 1, caderno: 1, color: 'Azul', hex: '#2563EB' },
  { day: 1 as const, cd: 2, caderno: 2, color: 'Amarelo', hex: '#F59E0B' },
  { day: 1 as const, cd: 3, caderno: 3, color: 'Branco', hex: '#9CA3AF' },
  { day: 1 as const, cd: 4, caderno: 4, color: 'Verde', hex: '#16A34A' },
  { day: 2 as const, cd: 5, caderno: 5, color: 'Amarelo', hex: '#F59E0B' },
  { day: 2 as const, cd: 6, caderno: 6, color: 'Cinza', hex: '#9CA3AF' },
  { day: 2 as const, cd: 7, caderno: 7, color: 'Azul', hex: '#2563EB' },
  { day: 2 as const, cd: 8, caderno: 8, color: 'Verde', hex: '#16A34A' },
];

const buildEnemYearResources = (
  year: number,
  trackSlug: string,
  trackTitle: string,
  trackDescription: string
): OfficialResource[] =>
  ENEM_CADERNOS.flatMap((item) => {
    const dayLabel = item.day === 1 ? '1º' : '2º';

    return [
      {
        id: `resource-enem-${year}-d${item.day}-cd${item.cd}-prova`,
        trackSlug,
        trackTitle,
        trackDescription,
        title: `ENEM ${year} - ${dayLabel} dia - Caderno ${item.caderno} ${item.color} (prova)`,
        description: `Prova oficial do ENEM ${year}, ${dayLabel} dia, caderno ${item.color.toLowerCase()}.`,
        url: `https://download.inep.gov.br/enem/provas_e_gabaritos/${year}_PV_impresso_D${item.day}_CD${item.cd}.pdf`,
        exam: 'ENEM',
        trackColor: item.hex,
        minutes: 40,
      },
      {
        id: `resource-enem-${year}-d${item.day}-cd${item.cd}-gabarito`,
        trackSlug,
        trackTitle,
        trackDescription,
        title: `ENEM ${year} - ${dayLabel} dia - Caderno ${item.caderno} ${item.color} (gabarito)`,
        description: `Gabarito oficial do ENEM ${year}, ${dayLabel} dia, caderno ${item.color.toLowerCase()}.`,
        url: `https://download.inep.gov.br/enem/provas_e_gabaritos/${year}_GB_impresso_D${item.day}_CD${item.cd}.pdf`,
        exam: 'ENEM',
        trackColor: item.hex,
        minutes: 10,
      },
    ];
  });

export const OFFICIAL_RESOURCES: OfficialResource[] = [
  ...buildEnemYearResources(
    2025,
    'enem-2025-completo',
    'ENEM 2025 (Provas Oficiais)',
    'Colecao completa de provas e gabaritos oficiais do ENEM 2025.'
  ),
  ...buildEnemYearResources(
    2024,
    'enem-2024-completo',
    'ENEM 2024 (Provas Oficiais)',
    'Colecao completa de provas e gabaritos oficiais do ENEM 2024.'
  ),
  ...buildEnemYearResources(
    2023,
    'enem-2023-completo',
    'ENEM 2023 (Provas Oficiais)',
    'Colecao completa de provas e gabaritos oficiais do ENEM 2023.'
  ),
  {
    id: 'resource-ufpr-portal-nc',
    trackSlug: 'ufpr-oficial',
    trackTitle: 'UFPR (Portal Oficial)',
    trackDescription: 'Portal oficial do NC/UFPR para acompanhar editais e vestibulares.',
    title: 'NC UFPR - Portal oficial',
    description: 'Acesse o portal oficial do NC/UFPR para informacoes do vestibular.',
    url: 'https://www.nc.ufpr.br/',
    exam: 'UFPR',
    trackColor: '#0EA5E9',
    minutes: 15,
  },
  {
    id: 'resource-ufpr-portal-institucional',
    trackSlug: 'ufpr-oficial',
    trackTitle: 'UFPR (Portal Oficial)',
    trackDescription: 'Portal oficial do NC/UFPR para acompanhar editais e vestibulares.',
    title: 'UFPR - Portal institucional',
    description: 'Portal institucional da UFPR com noticias e acessos oficiais.',
    url: 'https://www.ufpr.br/portalufpr/',
    exam: 'UFPR',
    trackColor: '#0EA5E9',
    minutes: 15,
  },
];
