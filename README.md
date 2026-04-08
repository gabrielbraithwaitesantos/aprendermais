# AprenderMais

Aplicativo Expo/React Native para estudo de ENEM e vestibulares, com autenticacao Firebase, trilhas, videos, quiz e recursos oficiais.

## Requisitos

- Node.js 22.x
- npm >= 10

## Configuracao inicial

1. Instale dependencias:

```bash
npm ci
```

2. Crie o arquivo de ambiente a partir do exemplo:

```bash
cp .env.example .env
```

3. Preencha as variaveis do Firebase/Google no arquivo `.env`.

## Comandos principais

- Desenvolvimento: `npm run dev`
- Web: `npm run web`
- Android: `npm run android`
- iOS: `npm run ios`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Validacao completa: `npm run check`

## Build web

```bash
npm run build:web
```

Para GitHub Pages:

```bash
npm run build:web:gh-pages
```

## Deploy automatico

O workflow em `.github/workflows/deploy-github-pages.yml` roda:

1. instalacao de dependencias
2. lint
3. typecheck
4. build web
5. deploy no GitHub Pages

## Estrutura de dados

O app usa Firebase (Auth + Firestore) e possui fallback local/seed para trilhas, questoes e recursos em caso de indisponibilidade do backend.
