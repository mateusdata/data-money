import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, useColorScheme, ToastAndroid, View as RNView, TouchableOpacity } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { colorPrymary } from '@/constants/Colors';
import { ads, useAds } from '@/contexts/ads-provider';
import { ThemedText } from '@/components/ThemedText';
import { favoriteList } from '@/utils/List';

interface State {
  items: string[];
  newItem: string;
}

const ShoppingListScreen: React.FC = () => {
  const [state, setState] = useState<State>({ items: [], newItem: '' });

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const { isPro, showInterstitial } = useAds();

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedItems = await AsyncStorage.getItem('shoppingItems');
        setState({
          items: storedItems ? JSON.parse(storedItems) : [],
          newItem: '',
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    loadData();
  }, []);

  const saveItems = async (items: string[]) => {
    try {
      await AsyncStorage.setItem('shoppingItems', JSON.stringify(items));
    } catch (error) { }
  };

  // Adicionada a flag "isFromList" para saber a origem da ação
  const addItem = (item: string, isFromList: boolean = false) => {
    if (item.trim() === '') return;

    if (state.items.includes(item)) {
      ToastAndroid.show('Este item já está na lista.', ToastAndroid.SHORT);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const updatedItems = [...state.items, item];

    setState((prev) => ({ ...prev, items: updatedItems, newItem: '' }));
    saveItems(updatedItems);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Lógica nova: Só chama anúncio se veio da lista rápida e se o rand for > 0.80
    if (!isPro && isFromList) {
      if (Math.random() > 0.8) {
        showInterstitial();
      }
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = state.items.filter((_, i) => i !== index);
    setState((prev) => ({ ...prev, items: updatedItems }));
    saveItems(updatedItems);
  };

  const renderFavoritesList = () => {
    if (!favoriteList || favoriteList.length === 0) return null;

    return (
      <RNView style={styles.favoritesContainer}>
        {state.items.length > 0 && <RNView style={[styles.divider, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />}

        <ThemedText style={styles.sectionTitle}>
          Itens mais procurados da lista
        </ThemedText>

        {favoriteList.map((item) => (
          <RNView key={item.id.toString()} style={[styles.menuGroup, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', marginBottom: 12 }]}>
            <RNView style={styles.menuItem}>
              <RNView style={styles.menuContent}>
                <RNView style={styles.menuIconContainer}>
                  <Ionicons name="pricetag-outline" size={20} color={colorPrymary} />
                </RNView>
                <RNView style={styles.menuTextContainer}>
                  <ThemedText style={[styles.menuLabel, { color: isDark ? '#F0F0F0' : '#111' }]}>
                    {item.name}
                  </ThemedText>
                </RNView>
              </RNView>
              <IconButton
                icon="plus"
                iconColor={colorPrymary}
                size={22}
                onPress={() => addItem(item.name, true)} // true = veio da lista (ativa a chance de anúncio)
              />
            </RNView>
          </RNView>
        ))}
      </RNView>
    );
  };

  return (
    <RNView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F8F8F8' }]}>
      <Stack.Screen options={{
        headerTitle: `DataMoney ${isPro ? "Pro" : 'Free'}`,
        headerStyle: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
        headerTintColor: isDark ? '#FFFFFF' : '#111111',
        headerRight: () => (
          !isPro ? (
            <TouchableOpacity
              onPress={() => router.push('/subscription')}
              style={styles.premiumButton}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={12} color="#FFF" style={{ marginRight: 4 }} />
              <ThemedText style={styles.premiumButtonText}>Assinar PRO</ThemedText>
            </TouchableOpacity>
          ) : null
        ),
      }} />

      <RNView style={styles.sectionContainer}>
        <TextInput
          placeholder="Adicionar item"
          value={state.newItem}
          onChangeText={(text) => setState((prev) => ({ ...prev, newItem: text }))}
          onSubmitEditing={() => addItem(state.newItem, false)} // false = digitado manualmente (sem anúncio)
          returnKeyType="done"
          mode="outlined"
          style={styles.input}
          outlineStyle={{ borderRadius: 16, borderColor: isDark ? '#333' : '#E0E0E0' }}
          contentStyle={{ backgroundColor: isDark ? '#1E1E1E' : '#FFF', color: isDark ? '#FFF' : '#000' }}
          placeholderTextColor={isDark ? '#888' : '#AAA'}
          activeOutlineColor={colorPrymary}
        />
      </RNView>

      <FlatList
        data={state.items}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderFavoritesList}
        renderItem={({ item, index }) => (
          <RNView style={[styles.menuGroup, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', marginBottom: 12 }]}>
            <RNView style={styles.menuItem}>
              <RNView style={styles.menuContent}>
                <RNView style={styles.menuIconContainer}>
                  <Ionicons name="cart-outline" size={20} color={colorPrymary} />
                </RNView>
                <RNView style={styles.menuTextContainer}>
                  <ThemedText style={[styles.menuLabel, { color: isDark ? '#F0F0F0' : '#111' }]}>
                    {item}
                  </ThemedText>
                </RNView>
              </RNView>
              <IconButton icon="trash-can-outline" iconColor="#FF4757" size={22} onPress={() => removeItem(index)} />
            </RNView>
          </RNView>
        )}
      />

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
    </RNView>
  );
};

export default ShoppingListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorPrymary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 22,
  },
  input: {
    marginBottom: 8,
  },
  listContainer: {
    paddingBottom: 20, // Reduzi para dar espaço ao banner sem cortar
  },
  menuGroup: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 8,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  favoritesContainer: {
    marginTop: 10,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});