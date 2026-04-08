#!/bin/bash

# 1. Carregar as variáveis do seu .env.local
source .env.local

# 2. SE VIRA NO PATH (Garantia para Linux achar o Fastlane)
export PATH="$PATH:/usr/local/bin:$(gem environment gemdir)/bin"

# 3. Validar se a chave existe
[ ! -f "$GOOGLE_PLAY_JSON_KEY_PATH" ] && echo "❌ Erro: Chave JSON não encontrada!" && exit 1

# 4. Varredura de Build
echo "🔍 Verificando builds..."
LATEST_AAB=$(ls -t *.aab 2>/dev/null | head -n 1)

if [ -z "$LATEST_AAB" ]; then
    echo "📦 Iniciando EAS Build Local..."
    eas build --local -p android --non-interactive --output=./prod-release.aab
    LATEST_AAB="./prod-release.aab"
else
    echo "✅ Usando build existente: $LATEST_AAB"
fi

# 5. O ENVIO (Configurado para ALPHA - Teste Fechado)
echo "🚀 ENVIANDO PARA O GOOGLE PLAY: $ANDROID_PACKAGE_NAME"

# --- GUIA RÁPIDO DE TRACKS (Mude o --track abaixo conforme a necessidade) ---
# --track "internal"   -> Teste Interno (Lança na hora para seus testadores)
# --track "alpha"      -> Teste Fechado (O que você quer agora)
# --track "beta"       -> Teste Aberto
# --track "production" -> Loja Oficial (Público)
# ----------------------------------------------------------------------------

fastlane supply \
  --package_name "$ANDROID_PACKAGE_NAME" \
  --aab "$LATEST_AAB" \
  --json_key "$GOOGLE_PLAY_JSON_KEY_PATH" \
  --track "production" \
  --release_status "completed" \
  --skip_upload_images true \
  --skip_upload_screenshots true \
  --skip_upload_metadata true

UPLOAD_STATUS=$?

# 6. FAXINA
if [ $UPLOAD_STATUS -eq 0 ]; then
    echo "✅ SUCESSO! Build enviado para o Produção (production)."
    echo "🗑️  Removendo $LATEST_AAB..."
    rm -f "$LATEST_AAB"
else
    echo "❌ O upload falhou. Verifique se o app já tem o primeiro upload manual feito no painel."
    exit 1
fi