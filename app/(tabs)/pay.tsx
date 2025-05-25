import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { usePayment } from '@/contexts/PaymentProvider';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomerInfo } from 'react-native-purchases';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');
const PayScreen = () => {
  const { payment, packages, hasPlan, currentPlan } = usePayment();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';



  useEffect(() => {
    console.log('Packages:', packages);
  }, [packages]);



  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Text style={[styles.title, isDarkMode && styles.titleDark]}>
        Assinatura DataMoney
      </Text>

      {hasPlan ? (
        <View
          style={[
            styles.card,
            styles.activePlanContainer,
            isDarkMode && styles.cardDark,
          ]}
        >
          <MaterialIcons
            name="verified-user"
            size={48}
            color={isDarkMode ? '#4caf50' : '#388e3c'}
            style={{ marginBottom: 12 }}
          />
          <Text style={[styles.activePlanText, isDarkMode && styles.textDark]}>
            Você é assinante do plano:
          </Text>
          <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>
            Plano Básico
          </Text>

          <ScrollView>
            <Text style={[styles.cardText, isDarkMode && styles.textDark,{marginTop: 10}]}>
            Sua assinatura renova em: {dayjs(currentPlan?.allExpirationDates?.['id_plano_basico:idplanobasico']).locale('pt-br').format('dddd, DD/MM/YYYY')}
            </Text>
          </ScrollView>
        </View>
      ) : (
        <>
          <Text style={[styles.subtitle, isDarkMode && styles.textDark]}>
            Escolha um plano para assinar:
          </Text>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {packages.map((pack, index) => (
              <View
                key={index}
                style={[styles.card, isDarkMode && styles.cardDark]}
              >
                <Text style={[styles.cardTitle, isDarkMode && styles.textDark]}>
                  {pack.product.title}
                </Text>
                <Text style={[styles.cardText, isDarkMode && styles.textDark]}>
                  {pack.product.description}
                </Text>
                <Text style={[styles.cardPrice, isDarkMode && styles.textDark]}>
                  {pack.product.priceString}
                </Text>
                <Button
                  title="Comprar"
                  onPress={() => payment(pack)}
                  color={isDarkMode ? '#1A1A1A' : '#1A1A1A'}
                />
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: '#f2f2f2',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#222',
    marginBottom: 10,
  },
  titleDark: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#444',
  },
  textDark: {
    color: '#ccc',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#1e1e1e',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  activePlanContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  activePlanText: {
    fontSize: 18,
    marginBottom: 8,
    color: '#2e7d32',
  },
});

export default PayScreen;
