import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Dimensions, useColorScheme, Pressable } from 'react-native';
import { TextInput } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { Stack } from 'expo-router';
import { useInterstitialAd } from 'react-native-google-mobile-ads';
import { adUnitId } from '@/utils/adUnitId';
import { colorPrymary } from '@/constants/Colors';
import { usePayment } from '@/contexts/PaymentProvider';

const RuleOfThree = () => {
  const [inputs, setInputs] = useState({ a: '', b: '', c: '', result: 'X' });
  const [error, setError] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { hasPlan } = usePayment();
  const { isLoaded, isClosed, load, show } = useInterstitialAd(adUnitId);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isClosed) load();
  }, [isClosed, load]);

  const calculate = () => {
    const { a, b, c } = inputs;

    if (!a || !b || !c) {
      setInputs((prev) => ({ ...prev, result: 'X' }));
      setError('');
      return;
    }

    const numA = parseFloat(a);
    const numB = parseFloat(b);
    const numC = parseFloat(c);

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
    if (!hasPlan && isLoaded) show();
    else if (!hasPlan) load();
  };

  const handleChange = (key: keyof typeof inputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  // Format number as Brazilian Real (R$)
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
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#fff' }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.body}>
        <Text style={[styles.subtitle, { color: isDark ? '#fff' : '#000' }]}>
          Regra de Três
        </Text>

        <View style={styles.row}>
          <TextInput
            placeholder="A"
            keyboardType="numeric"
            value={inputs.a}
            onChangeText={(text) => handleChange('a', text)}
            mode="outlined"
            style={styles.input}
            contentStyle={{
              borderWidth: 0.5,
              backgroundColor: isDark ? '#1e1e1e' : '#fff',
            }}
            theme={{ colors: { text: isDark ? '#fff' : '#000' }, roundness: 8 }}
            activeOutlineColor={colorPrymary}
          />
          <AntDesign name="arrowright" size={30} color="orange" style={styles.icon} />
          <TextInput
            placeholder="B"
            keyboardType="numeric"
            value={inputs.b}
            onChangeText={(text) => handleChange('b', text)}
            mode="outlined"
            style={styles.input}
            contentStyle={{
              borderWidth: 0.5,
              backgroundColor: isDark ? '#1e1e1e' : '#fff',
            }}
            theme={{ colors: { text: isDark ? '#fff' : '#000' }, roundness: 8 }}
            activeOutlineColor={colorPrymary}
          />
        </View>

        <Text style={[styles.label, { color: isDark ? '#ccc' : '#333' }]}>
          ASSIM COMO
        </Text>

        <View style={styles.row}>
          <TextInput
            placeholder="C"
            keyboardType="numeric"
            value={inputs.c}
            onChangeText={(text) => handleChange('c', text)}
            mode="outlined"
            style={styles.input}
            contentStyle={{
              borderWidth: 0.5,
              backgroundColor: isDark ? '#1e1e1e' : '#fff',
            }}
            theme={{ colors: { text: isDark ? '#fff' : '#000' }, roundness: 8 }}
            activeOutlineColor={colorPrymary}
          />
          <AntDesign name="arrowright" size={30} color="orange" style={styles.icon} />
          <TextInput
            placeholder="Resultado (R$)"
            value={inputs.result}
            editable={false}
            mode="outlined"
            style={styles.result}
            contentStyle={{
              borderWidth: 0.5,
              backgroundColor: isDark ? '#1e1e1e' : '#fff',
              color: 'orange',
            }}
            theme={{ colors: { text: 'orange' }, roundness: 8 }}
            outlineColor={inputs.result !== 'X' && !error ? 'green' : undefined}
          />
        </View>

        {inputs.result !== 'X' && !error && inputs.a && inputs.b && inputs.c && (
          <View
            style={[
              styles.resultCard,
              { backgroundColor: isDark ? '#2e2e2e' : '#f0f0f0' },
            ]}
          >
            <Text
              style={[styles.resultText, { color: isDark ? '#fff' : '#333' }]}
            >
              {`${inputs.a} kilos de Arroz ${formatCurrency(
                inputs.b
              )}, assim como ${inputs.c} kilos de Arroz ${formatCurrency(
                inputs.result
              )}`}
            </Text>
          </View>
        )}

        {inputs.result === 'X' && !error && (
          <View
            style={[
              styles.resultCard,
              { backgroundColor: isDark ? '#2e2e2e' : '#f0f0f0' },
            ]}
          >
            <Text
              style={[styles.resultText, { color: isDark ? '#fff' : '#333' }]}
            >
              Exemplo:{'\n'}
              Se 2 kilos de Arroz R$ 10,00,{'\n'}
              quanto custam 5 unidades?{'\n'}
              Insira 2 em A, 10 em B e 5 em C para calcular o resultado.
            </Text>
          </View>
        )}

        {(inputs.a || inputs.b || inputs.c) && (
          <Pressable
            onPress={clearInputs}
            style={[styles.button, { backgroundColor: isDark ? '#2980b9' : '#3cb371' }]}
          >
            <Text style={styles.buttonText}>Limpar</Text>
          </Pressable>
        )}

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <Stack.Screen
        options={{ headerTitle: 'Regra de Três Simples', headerTitleAlign: 'center' }}
      />
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    paddingVertical: 30,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
    flexWrap: 'wrap',
  },
  input: {
    width: width * 0.35,
    maxWidth: 150,
    height: 50,
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 5,
  },
  result: {
    width: width * 0.35,
    maxWidth: 150,
    height: 50,
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 5,
  },
  icon: {
    marginHorizontal: 5,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    marginVertical: 10,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  resultCard: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '90%',
    maxWidth: 500,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24, // Added for better readability
  },
});

export default RuleOfThree;