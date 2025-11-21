-- Conteudo inicial para o novo projeto Supabase.
-- Rode no SQL Editor ou via `supabase db push` DEPOIS de criar o schema base.
-- Seguro para reexecutar: usa `on conflict do nothing` ou checagens.

-- Materias
insert into public.subjects (slug, name, color_hex, icon)
values
  ('matematica', 'Matematica', '#2563EB', 'calculator-outline'),
  ('ciencias', 'Ciencias da Natureza', '#16A34A', 'flask-outline'),
  ('humanas', 'Ciencias Humanas', '#F59E0B', 'book-outline'),
  ('linguagens', 'Linguagens e Redacao', '#EC4899', 'pencil-outline')
on conflict (slug) do nothing;

-- Aulas (videos + materiais)
with subj as (
  select slug, id from public.subjects
)
insert into public.lessons (
  subject_id, title, module, order_index, duration_minutes, difficulty,
  subject_tag, description, video_url, thumbnail_url, resource_url, is_featured
)
select s.id, data.title, data.module, data.order_index, data.duration_minutes, data.difficulty,
       data.subject_tag, data.description, data.video_url, data.thumbnail_url, data.resource_url, data.is_featured
from subj s
join (
  values
    -- Matematica
    ('matematica', 'Funcao do 1 grau', 'Algebra Basica', 1, 16, 'beginner', 'matematica',
     'Definicao, grafico e como encontrar coeficientes.', 'https://www.youtube.com/watch?v=XtKJzhLQpfA',
     'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=60', null, true),
    ('matematica', 'Equacoes do 2 grau', 'Algebra', 2, 20, 'intermediate', 'matematica',
     'Passo a passo com delta, bhaskara e interpretacao do grafico.', 'https://www.youtube.com/watch?v=pZ2wS5NQMY8',
     'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=60', null, true),
    ('matematica', 'Funcao Quadratica', 'Algebra', 3, 22, 'intermediate', 'matematica',
     'Vertice, concavidade e aplicacoes em problemas do ENEM.', 'https://www.youtube.com/watch?v=q19n2s5NpoE',
     'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=800&q=60', null, false),
    ('matematica', 'PA e PG', 'Matematica Financeira', 4, 18, 'beginner', 'matematica',
     'Progressao aritmetica e geometrica com exemplos de juros.', 'https://www.youtube.com/watch?v=C6QzBe99r3Y',
     'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=60', null, false),

    -- Ciencias
    ('ciencias', 'Sistema Solar', 'Astronomia', 1, 15, 'beginner', 'ciencias',
     'Planetas, luas e perguntas classicas do ENEM.', 'https://www.youtube.com/watch?v=libKVRa01L8',
     'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=800&q=60', null, true),
    ('ciencias', 'Ecologia e ciclos', 'Biologia', 2, 19, 'beginner', 'ciencias',
     'Ciclos da agua, carbono e nitrogenio com questoes comentadas.', 'https://www.youtube.com/watch?v=DhMC1UDeTlE',
     'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=60', null, false),
    ('ciencias', 'Fisica: Cinematica basica', 'Fisica', 3, 17, 'beginner', 'ciencias',
     'MRU e MRUV, tabelas e graficos.', 'https://www.youtube.com/watch?v=kSnpnxm_2tI',
     'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60', null, false),

    -- Humanas
    ('humanas', 'Historia do Brasil - Independencia', 'Historia', 1, 20, 'beginner', 'humanas',
     'Contexto, datas e cobrancas frequentes.', 'https://www.youtube.com/watch?v=DXF_dXvHFGg',
     'https://images.unsplash.com/photo-1457694587812-e8bf29a43845?auto=format&fit=crop&w=800&q=60', null, true),
    ('humanas', 'Geografia: Urbanizacao', 'Geografia', 2, 18, 'beginner', 'humanas',
     'Crescimento das cidades, problemas urbanos e mobilidade.', 'https://www.youtube.com/watch?v=l9nJ0u8a6QY',
     'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=60', null, false),

    -- Linguagens
    ('linguagens', 'Redacao ENEM: estrutura', 'Redacao', 1, 25, 'beginner', 'linguagens',
     'Introducao, desenvolvimento e conclusao com proposta de intervencao.', 'https://www.youtube.com/watch?v=3b1wG3aAKt0',
     'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=60',
     'https://download.inep.gov.br/educacao_basica/enem/guia_do_participante_redacao_enem.pdf', true),
    ('linguagens', 'Interpretacao de texto', 'Linguagens', 2, 16, 'beginner', 'linguagens',
     'Estratégias para acertos rapidos em textos longos.', 'https://www.youtube.com/watch?v=3vR4ekF1C8k',
     'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=60', null, false)
) as data(slug, title, module, order_index, duration_minutes, difficulty, subject_tag, description, video_url, thumbnail_url, resource_url, is_featured)
  on s.slug = data.slug
where not exists (
  select 1 from public.lessons l where l.title = data.title
);

-- Trilhas de estudo
insert into public.study_tracks (slug, title, description, exam, color_hex, cover_url)
values
  ('enem-inicio-rapido', 'ENEM Inicio Rapido', 'Sequencia curta de aulas e PDFs para destravar os primeiros estudos.', 'enem', '#4F46E5', null),
  ('enem-redacao', 'ENEM Redacao Turbo', 'Guias oficiais e video curto para estruturar sua redacao.', 'enem', '#EC4899', null),
  ('ufpr-essencial', 'UFPR Essencial', 'Materiais oficiais e revisao de matematica para UFPR.', 'ufpr', '#0EA5E9', null)
on conflict (slug) do nothing;

-- Itens das trilhas
with tracks as (select slug, id from public.study_tracks),
     lessons as (select title, id from public.lessons)
insert into public.study_track_items (track_id, lesson_id, order_index, kind, title, description, resource_url, estimated_minutes)
select t.id, l.id, data.order_index, data.kind, data.title, data.description, data.resource_url, data.estimated_minutes
from (
  values
    ('enem-inicio-rapido', 'Funcao do 1 grau', 1, 'lesson', null, null, null, 20),
    ('enem-inicio-rapido', 'Equacoes do 2 grau', 2, 'lesson', null, null, null, 25),
    ('enem-inicio-rapido', 'Sistema Solar', 3, 'lesson', null, null, null, 20),
    ('enem-inicio-rapido', null, 4, 'resource', 'ENEM 2023 - 1º dia - Caderno Azul', 'PDF oficial do INEP, 1º dia caderno azul.', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D1_CD1.pdf', 40),
    ('enem-inicio-rapido', null, 5, 'resource', 'ENEM 2023 - 2º dia - Caderno Amarelo', 'PDF oficial do INEP, 2º dia caderno amarelo.', 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D2_CD2.pdf', 40),

    ('enem-redacao', 'Redacao ENEM: estrutura', 1, 'lesson', null, null, null, 30),
    ('enem-redacao', null, 2, 'resource', 'Guia do participante ENEM', 'Guia oficial de redacao do INEP.', 'https://download.inep.gov.br/educacao_basica/enem/guia_do_participante_redacao_enem.pdf', 25),
    ('enem-redacao', null, 3, 'resource', 'Matriz de competencias', 'Documento com competencias e habilidades cobradas.', 'https://download.inep.gov.br/educacao_basica/enem/matriz_referencia_linguagens.pdf', 15),

    ('ufpr-essencial', 'PA e PG', 1, 'lesson', null, null, null, 25),
    ('ufpr-essencial', 'Funcao Quadratica', 2, 'lesson', null, null, null, 25),
    ('ufpr-essencial', null, 3, 'resource', 'Prova UFPR 2023', 'PDF oficial com gabarito.', 'https://www.provar.ufpr.br/portal/wp-content/uploads/2023/10/prova_ufpr_2023.pdf', 45)
) as data(track_slug, lesson_title, order_index, kind, title, description, resource_url, estimated_minutes)
join tracks t on t.slug = data.track_slug
left join lessons l on l.title = data.lesson_title
where not exists (
  select 1 from public.study_track_items i
  where i.track_id = t.id
    and coalesce(i.lesson_id::text, '') = coalesce(l.id::text, '')
    and coalesce(i.title, '') = coalesce(data.title, '')
);

-- Questoes de quiz
insert into public.quiz_questions (exam, subject, difficulty, question, options, correct_option, explanation, reference_url)
values
  ('enem', 'matematica', 'medio',
   'Uma funcao quadratica com delta = 0 possui quantas raizes reais?',
   ARRAY['Nenhuma', 'Uma raiz real dupla', 'Duas raizes distintas', 'Infinitas'], 2,
   'Delta zero -> uma raiz real (raiz dupla).', 'https://www.proenem.com.br/blog/funcao-quadratica'),
  ('enem', 'matematica', 'facil',
   'Em uma PA, a1 = 3 e a4 = 12. Qual a razao r?',
   ARRAY['2', '3', '4', '5'], 3,
   'a4 = a1 + 3r => 12 = 3 + 3r -> r = 3', null),
  ('enem', 'ciencias', 'facil',
   'Qual planeta do sistema solar tem mais luas catalogadas?',
   ARRAY['Terra', 'Marte', 'Jupiter', 'Mercurio'], 3,
   'Jupiter lidera em numero de luas.', 'https://www.nasa.gov/moons'),
  ('enem', 'ciencias', 'medio',
   'No ciclo do nitrogênio, a fixacao do N2 em amonia ocorre principalmente por:',
   ARRAY['Bacterias', 'Luz solar direta', 'Vulcoes', 'Fotossintese de algas'], 1,
   'Bacterias fixadoras convertem N2 em amonia.', null),
  ('enem', 'humanas', 'medio',
   'O modernismo brasileiro teve marco inicial em qual evento?',
   ARRAY['Semana de Arte Moderna de 1922', 'Diretas Ja', 'Proclamacao da Republica', 'Revolucao de 1930'], 1,
   'A Semana de 22 e considerada o marco do modernismo.', null),
  ('enem', 'linguagens', 'facil',
   'Na redacao ENEM, a proposta de intervencao deve conter:',
   ARRAY['Repeticao da introducao', 'Apresentacao de dados estatisticos apenas', 'Acao, agente, meio, efeito e detalhamento', 'Copia do texto motivador'], 3,
   'A proposta precisa trazer acao, agente, meio/modo, efeito/finalidade e detalhamento.', 'https://download.inep.gov.br/educacao_basica/enem/guia_do_participante_redacao_enem.pdf')
on conflict do nothing;
