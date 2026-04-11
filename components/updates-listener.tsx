// components/UpdatesListener.tsx
import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function UpdatesListener() {
  const {
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    checkError,
    downloadError,
    currentlyRunning,
    availableUpdate,
  } = Updates.useUpdates();

  useEffect(() => {
    if (isUpdatePending) {
      console.log('📥 OTA pronto, recarregando...');
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  useEffect(() => {
    if (isUpdateAvailable) {
      console.log('🔍 OTA disponível, baixando...');
      Updates.fetchUpdateAsync();
    }
  }, [isUpdateAvailable]);

  useEffect(() => {
    if (Updates.isEnabled) {
      Updates.checkForUpdateAsync().catch(() => null);
    }
  }, []);

  const status = (() => {
    if (checkError) return { emoji: '❌', msg: `Erro Checagem: ${checkError.message}` };
    if (downloadError) return { emoji: '❌', msg: `Erro Download: ${downloadError.message}` };
    if (isChecking) return { emoji: '🔍', msg: 'Verificando servidores...' };
    if (isDownloading) return { emoji: '⬇️', msg: 'Baixando pacotes...' };
    if (isUpdatePending) return { emoji: '⚡', msg: 'Aplicando no próximo reload...' };
    if (isUpdateAvailable) return { emoji: '📦', msg: 'Update Encontrado!' };
    return { emoji: '✅', msg: 'Rodando versão mais recente' };
  })();

  // Formata a data do update atual, se existir
  const updateDate = currentlyRunning.createdAt
    ? new Date(currentlyRunning.createdAt).toLocaleString('pt-BR')
    : 'N/A';

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <Text style={styles.title}>🛠️ SNAPLINE - GOD MODE OTA</Text>
        <Text style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>
          Pagina de debug para o desenvolvedor, se vc caio de paraquedas aqui, saiba que isso é normal e não afeta o funcionamento do app. 🚀
        </Text>

        <Section title="STATUS DA REDE">
          <Row label="Status" value={`${status.emoji} ${status.msg}`} />
          <Row label="Novo Update ID" value={availableUpdate?.updateId ?? 'Nenhum pendente'} />
        </Section>

        <Section title="CONFIGURAÇÃO DO EXPO UPDATES">
          <Row label="Updates Ativos?" value={Updates.isEnabled ? 'SIM ✅' : 'NÃO ❌'} />
          <Row label="Canal (Channel)" value={Updates.channel ?? 'VAZIO (⚠️ Perigo)'} />
          <Row label="Runtime Version" value={Updates.runtimeVersion ?? 'VAZIO (⚠️ Perigo)'} />
          <Row label="URL do Update" value={Updates.updateUrl ?? 'VAZIO'} />
        </Section>

        <Section title="O QUE ESTÁ RODANDO AGORA?">
          <Row label="Tipo de Bundle" value={currentlyRunning.isEmbeddedLaunch ? 'Nativo Embutido (App zerado)' : 'OTA Aplicado (Já atualizou antes)'} />
          <Row label="Update ID Atual" value={currentlyRunning.updateId ?? 'Nenhum'} />
          <Row label="Data do Update" value={updateDate} />
          {/* Se isEmergencyLaunch for SIM, o Expo bloqueia novos updates porque o último quebrou o app */}
          <Row label="Modo de Emergência" value={currentlyRunning.isEmergencyLaunch ? 'SIM 🚨' : 'Não ✅'} />
        </Section>

        <Section title="VERSÕES NATIVAS (BINÁRIO)">
          <Row label="Versão App (JS)" value={Constants.expoConfig?.version ?? 'N/A'} />
          <Row label="Versão Nativa (Nome)" value={Constants.nativeAppVersion ?? 'N/A'} />
          <Row label="Código Build (Nativo)" value={Constants.nativeBuildVersion ?? 'N/A'} />
        </Section>

        {(checkError || downloadError) && (
          <View style={styles.errorBox}>
            <Text style={styles.errorHeader}>🚨 LOG DE ERRO NATIVO:</Text>
            <Text selectable style={styles.errorText}>
              {checkError?.message ?? downloadError?.message}
            </Text>
          </View>
        )}
    </ScrollView>
  );
}

// Subcomponente para organizar os blocos de informação
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// Subcomponente de linha
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text selectable style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    margin: 16,
    maxHeight: 500, // Limita a altura para não cobrir a tela toda caso tenha muito conteúdo
    borderRadius: 10,
    backgroundColor: '#0f1520',
    borderWidth: 1,
    borderColor: '#f0b42933',
    top: 100,
  },
  content: {
    padding: 12,
    gap: 12,
  },
  title: {
    color: '#f0b429',
    fontWeight: '900',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  section: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff11',
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#8b9bb4',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
    width: 140, // Deixa as colunas alinhadas
  },
  value: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  errorBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#ff000022',
    borderWidth: 1,
    borderColor: '#ff000066',
  },
  errorHeader: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 11,
    fontFamily: 'monospace', // Útil pra ler logs
  },
});