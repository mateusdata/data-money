import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, useColorScheme, Pressable, View as RNView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Stack } from 'expo-router';
import { colorPrymary } from '@/constants/Colors';
import { ads, useAds } from '@/contexts/ads-provider';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

const RuleOfThree = () => {
  const [inputs, setInputs] = useState({ a: '', b: '', c: '', result: 'X' });
  const [error, setError] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const { isPro, showInterstitial } = useAds();

  const calculate = () => {
    const { a, b, c } = inputs;

    if (!a || !b || !c) {
      setInputs((prev) => ({ ...prev, result: 'X' }));
      setError('');
      return;
    }

    const numA = parseFloat(a.replace(',', '.'));
    const numB = parseFloat(b.replace(',', '.'));
    const numC = parseFloat(c.replace(',', '.'));

    if (isNaN(numA) || isNaN(numB) || isNaN(numC)) {
      setError('Insira apenas números válidos');
      setInputs((prev) => ({ ...prev, result: 'X' }));
      return;
    }

    if (numA === 0) {
      setError('O valor de A não pode ser zero');
      setInputs((prev) => ({ ...prev, result: 'X' }));
      return;
    }

    const result = ((numB * numC) / numA).toFixed(2);
    setInputs((prev) => ({ ...prev, result }));
    setError('');
  };

  useEffect(() => {
    calculate();
  }, [inputs.a, inputs.b, inputs.c]);

  const clearInputs = () => {
    setInputs({ a: '', b: '', c: '', result: 'X' });
    setError('');
    if (!isPro) {
      showInterstitial();
    }
  };

  const handleChange = (key: keyof typeof inputs, value: string) => {
    // Permite digitar números e vírgula/ponto
    const formattedValue = value.replace(/[^0-9.,]/g, '');
    setInputs((prev) => ({ ...prev, [key]: formattedValue }));
  };

  const formatCurrency = (value: string) => {
    if (value === 'X') return 'X';
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F8F8F8' }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Stack.Screen
          options={{
            headerTitle: `Calculadora ${isPro ? "Pro" : "Free"}`,
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
            headerTintColor: isDark ? '#FFFFFF' : '#111111',
            headerShadowVisible: false,
          }}
        />

        <RNView style={styles.body}>
          <ThemedText style={[styles.subtitle, { color: isDark ? '#fff' : '#111' }]}>
            Regra de Três
          </ThemedText>

          {/* Card Principal da Calculadora */}
          <RNView style={[styles.cardContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>

            <RNView style={styles.row}>
              <TextInput
                placeholder="Se tenho (A)"
                keyboardType="numeric"
                value={inputs.a}
                onChangeText={(text) => handleChange('a', text)}
                mode="outlined"
                style={styles.input}
                contentStyle={{ backgroundColor: isDark ? '#1E1E1E' : '#FFF', color: isDark ? '#FFF' : '#111' }}
                outlineStyle={{ borderRadius: 16, borderColor: isDark ? '#333' : '#E0E0E0' }}
                placeholderTextColor={isDark ? '#888' : '#AAA'}
                activeOutlineColor={colorPrymary}
              />

              <Ionicons name="arrow-forward-outline" size={24} color={isDark ? '#555' : '#CCC'} style={styles.icon} />

              <TextInput
                placeholder="Isso vale (B)"
                keyboardType="numeric"
                value={inputs.b}
                onChangeText={(text) => handleChange('b', text)}
                mode="outlined"
                style={styles.input}
                contentStyle={{ backgroundColor: isDark ? '#1E1E1E' : '#FFF', color: isDark ? '#FFF' : '#111' }}
                outlineStyle={{ borderRadius: 16, borderColor: isDark ? '#333' : '#E0E0E0' }}
                placeholderTextColor={isDark ? '#888' : '#AAA'}
                activeOutlineColor={colorPrymary}
              />
            </RNView>

            <RNView style={styles.dividerContainer}>
              <RNView style={[styles.dividerLine, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
              <ThemedText style={[styles.label, { color: isDark ? '#888' : '#AAA' }]}>
                ASSIM COMO
              </ThemedText>
              <RNView style={[styles.dividerLine, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
            </RNView>

            <RNView style={styles.row}>
              <TextInput
                placeholder="Se eu tiver (C)"
                keyboardType="numeric"
                value={inputs.c}
                onChangeText={(text) => handleChange('c', text)}
                mode="outlined"
                style={styles.input}
                contentStyle={{ backgroundColor: isDark ? '#1E1E1E' : '#FFF', color: isDark ? '#FFF' : '#111' }}
                outlineStyle={{ borderRadius: 16, borderColor: isDark ? '#333' : '#E0E0E0' }}
                placeholderTextColor={isDark ? '#888' : '#AAA'}
                activeOutlineColor={colorPrymary}
              />

              <Ionicons name="arrow-forward-outline" size={24} color={colorPrymary} style={styles.icon} />

              <TextInput
                placeholder="Resultado"
                value={inputs.result !== 'X' ? formatCurrency(inputs.result) : ''}
                editable={false}
                mode="outlined"
                style={styles.input}
                contentStyle={{
                  backgroundColor: isDark ? 'rgba(37,211,102,0.1)' : 'rgba(37,211,102,0.05)',
                  color: colorPrymary,
                  fontWeight: 'bold'
                }}
                outlineStyle={{
                  borderRadius: 16,
                  borderColor: inputs.result !== 'X' && !error ? colorPrymary : (isDark ? '#333' : '#E0E0E0')
                }}
              />
            </RNView>
          </RNView>

          {/* Tratamento de Erros */}
          {error !== '' && (
            <RNView style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color="#FF4757" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </RNView>
          )}

          {/* Resultado Explicativo */}
          {inputs.result !== 'X' && !error && inputs.a && inputs.b && inputs.c && (
            <RNView
              style={[
                styles.resultCard,
                { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: colorPrymary, borderWidth: 1 },
              ]}
            >
              <RNView style={styles.iconCircle}>
                <Ionicons name="checkmark-done" size={24} color={colorPrymary} />
              </RNView>
              <ThemedText style={[styles.resultText, { color: isDark ? '#F0F0F0' : '#111' }]}>
                {`Se ${inputs.a} está para ${formatCurrency(inputs.b)},\nentão ${inputs.c} está para `}
                <ThemedText style={{ color: colorPrymary, fontWeight: 'bold', fontSize: 18 }}>
                  {formatCurrency(inputs.result)}
                </ThemedText>
              </ThemedText>
            </RNView>
          )}

          {/* Exemplo / Placeholder Inicial */}
          {inputs.result === 'X' && !error && (
            <RNView
              style={[
                styles.resultCard,
                { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
              ]}
            >
              <RNView style={[styles.iconCircle, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}>
                <Ionicons name="bulb-outline" size={24} color={isDark ? '#AAA' : '#666'} />
              </RNView>
              <ThemedText style={[styles.resultText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                <ThemedText style={{ fontWeight: 'bold', color: isDark ? '#FFF' : '#111' }}>Exemplo de uso:{'\n'}</ThemedText>
                Se 2 kg de Arroz custam R$ 10,00,{'\n'}
                quanto custam 5 kg?{'\n\n'}
                Insira <ThemedText style={{ fontWeight: 'bold' }}>2</ThemedText> em A, <ThemedText style={{ fontWeight: 'bold' }}>10</ThemedText> em B e <ThemedText style={{ fontWeight: 'bold' }}>5</ThemedText> em C.
              </ThemedText>
            </RNView>
          )}

          {/* Botão Limpar */}
          {(inputs.a || inputs.b || inputs.c) && (
            <Pressable
              onPress={clearInputs}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: isDark ? '#333' : '#E0E0E0',
                  opacity: pressed ? 0.7 : 1
                }
              ]}
            >
              <Ionicons name="trash-outline" size={20} color={isDark ? '#FFF' : '#111'} style={{ marginRight: 8 }} />
              <ThemedText style={[styles.buttonText, { color: isDark ? '#FFF' : '#111' }]}>Limpar Campos</ThemedText>
            </Pressable>
          )}

        </RNView>
      </ScrollView>
      {/* Área do Banner Inferior */}
      {!isPro ? (
        <RNView style={{ alignItems: 'center', paddingBottom: 4 }}>
          <BannerAd unitId={ads.banner} size={BannerAdSize.FULL_BANNER} />
        </RNView>
      ) : (
        <RNView style={{ alignItems: 'center', paddingBottom: 30 }}>
          <ThemedText style={{ fontSize: 13, color: colorPrymary, fontWeight: '700' }}>
            DataMoney Pro
          </ThemedText>
        </RNView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  body: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  cardContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10, // Adicionado gap para responsividade limpa
  },
  input: {
    flex: 1, // Faz com que os inputs dividam o espaço igualmente independente da tela
    height: 54,
    fontSize: 16,
    textAlign: 'center',
  },
  icon: {
    paddingHorizontal: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#FF4757',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RuleOfThree;