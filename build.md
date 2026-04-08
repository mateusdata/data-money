eas build --profile production --platform all

eas update --branch production --message "mensagem" --platform all

eas update:list --branch production --json

eas update:delete GROUPID --non-interactive

eas update:roll-back-to-embedded --branch production --message "mensagem" --runtime-version "1.0.0" --non-interactive

eas branch:list --json


report  system
cd android && ./gradlew signingReport 

bunx expo run:android --variant release -d


web
npx expo export -p web
eas deploy --prod   

eas build --local -p android --non-interactive --profile production --output=./release.aab
chmod +x deploy-android.sh

# 1. Instala o Ruby (base do Fastlane)
sudo apt update
sudo apt install ruby-full build-essential -y

# 2. Instala o Fastlane de verdade
sudo gem install fastlane -v 2.212.1 # Versão estável