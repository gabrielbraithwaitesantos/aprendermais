#!/bin/bash

# Script para ativar GitHub Pages via API do GitHub
# Requer autenticação do GitHub CLI (gh auth login)

OWNER="gabrielbraithwaitesantos"
REPO="aprendermais"

echo "Ativando GitHub Pages para $OWNER/$REPO..."

# Tentar ativar GitHub Pages com GitHub Actions como source
gh api repos/$OWNER/$REPO/pages \
  --input - << 'EOF' 2>/dev/null
{
  "source": {
    "branch": "gh-pages",
    "path": "/"
  },
  "build_type": "workflow"
}
EOF

if [ $? -eq 0 ]; then
  echo "✅ GitHub Pages ativado com sucesso!"
  echo "📍 Seu site estará em: https://$OWNER.github.io/$REPO/"
else
  echo "⚠️  Não foi possível ativar via API"
  echo "🔗 Por favor, ative manualmente em:"
  echo "   https://github.com/$OWNER/$REPO/settings/pages"
  echo ""
  echo "Passos:"
  echo "1. Na seção 'Build and deployment'"
  echo "2. Em 'Source', selecione: GitHub Actions"
  echo "3. Clique em 'Save'"
fi
