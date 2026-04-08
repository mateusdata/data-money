import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  FlatList,
  useColorScheme,
  ToastAndroid,
  View as RNView,
  TouchableOpacity,
  ScrollView,
  Platform,
  UIManager,
  LayoutAnimation
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { colorPrymary } from '@/constants/Colors';
import { ads, useAds } from '@/contexts/ads-provider';
import { ThemedText } from '@/components/ThemedText';
import { favoriteList } from '@/utils/List';

// Habilita animações fluidas no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const addItem = (item: string, isFromList: boolean = false) => {
    if (item.trim() === '') return;

    if (state.items.includes(item)) {
      ToastAndroid.show('Este item já está na lista.', ToastAndroid.SHORT);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Animação suave ao adicionar
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updatedItems = [item, ...state.items]; // Adiciona no topo da lista (UX melhor)

    setState((prev) => ({ ...prev, items: updatedItems, newItem: '' }));
    saveItems(updatedItems);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isPro && isFromList) {
      if (Math.random() > 0.8) {
        showInterstitial();
      }
    }
  };

  const removeItem = (index: number) => {
    // Animação suave ao remover
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updatedItems = state.items.filter((_, i) => i !== index);

    setState((prev) => ({ ...prev, items: updatedItems }));
    saveItems(updatedItems);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Componente de Empty State (Estado Vazio)
  const renderEmptyState = () => (
    <RNView style={styles.emptyStateContainer}>
      <RNView style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1E1E1E' : '#F0F0F0' }]}>
        <Ionicons name="basket-outline" size={48} color={isDark ? '#555' : '#CCC'} />
      </RNView>
      <ThemedText style={[styles.emptyTitle, { color: isDark ? '#E2E8F0' : '#334155' }]}>
        Sua lista está vazia
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#94A3B8' }]}>
        Adicione itens acima ou escolha nas sugestões rápidas para começar suas compras.
      </ThemedText>
    </RNView>
  );

  return (
    <RNView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F8F8F8' }]}>
      <Stack.Screen options={{
        headerTitle: `DataMoney ${isPro ? "Pro" : 'Free'}`,
        headerStyle: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
        headerTintColor: isDark ? '#FFFFFF' : '#111111',
        headerShadowVisible: false, // Tira a linha do header para um visual mais limpo
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

      {/* Área Fixa Superior (Input + Sugestões Rápidas) */}
      <RNView style={[styles.topSection, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <TextInput
          placeholder="O que você precisa comprar?"
          value={state.newItem}
          onChangeText={(text) => setState((prev) => ({ ...prev, newItem: text }))}
          onSubmitEditing={() => addItem(state.newItem, false)}
          returnKeyType="done"
          mode="outlined"
          style={styles.input}
          outlineStyle={{ borderRadius: 16, borderColor: isDark ? '#333' : '#E0E0E0' }}
          contentStyle={{ backgroundColor: isDark ? '#121212' : '#F8F8F8', color: isDark ? '#FFF' : '#111' }}
          placeholderTextColor={isDark ? '#888' : '#AAA'}
          activeOutlineColor={colorPrymary}
          left={<TextInput.Icon icon="magnify" color={isDark ? '#888' : '#AAA'} />}
          right={
            state.newItem.length > 0 ? (
              <TextInput.Icon
                icon="plus-circle"
                color={colorPrymary}
                onPress={() => addItem(state.newItem, false)}
              />
            ) : null
          }
        />

        {/* Chips de Adição Rápida (Horizontal Scroll) */}
        {favoriteList && favoriteList.length > 0 && (
          <RNView style={styles.quickAddContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAddScroll}>
              {favoriteList.map((item) => (
                <TouchableOpacity
                  key={item.id.toString()}
                  style={[styles.chip, { backgroundColor: isDark ? 'rgba(37, 211, 102, 0.15)' : 'rgba(37, 211, 102, 0.1)' }]}
                  activeOpacity={0.7}
                  onPress={() => addItem(item.name, true)}
                >
                  <Ionicons name="add" size={16} color={colorPrymary} />
                  <ThemedText style={[styles.chipText, { color: colorPrymary }]}>{item.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </RNView>
        )}
      </RNView>

      {/* Lista Principal */}
      <FlatList
        data={state.items}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item, index }) => (
          <RNView style={[styles.menuGroup, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <RNView style={styles.menuItem}>
              <RNView style={styles.menuContent}>
                {/* Botão de Check/Concluir em vez de ícone estático de carrinho */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => removeItem(index)}
                  activeOpacity={0.6}
                >
                  <RNView style={[styles.checkbox, { borderColor: isDark ? '#444' : '#CCC' }]} />
                </TouchableOpacity>

                <RNView style={styles.menuTextContainer}>
                  <ThemedText style={[styles.menuLabel, { color: isDark ? '#F0F0F0' : '#334155' }]}>
                    {item}
                  </ThemedText>
                </RNView>
              </RNView>
            </RNView>
          </RNView>
        )}
      />

      {/* Área do Banner Inferior */}
      {!isPro ? (
        <RNView style={styles.bannerContainer}>
          <BannerAd unitId={ads.banner} size={BannerAdSize.FULL_BANNER} />
        </RNView>
      ) : (
        <RNView style={styles.proFooter}>
          <ThemedText style={{ fontSize: 12, color: colorPrymary, fontWeight: '700' }}>
            ✨ DataMoney Pro Ativo
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
  },
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    zIndex: 10,
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
  input: {
    marginBottom: 12,
  },
  quickAddContainer: {
    marginHorizontal: -20, // Faz o scroll ir até a borda da tela
  },
  quickAddScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Espaço pro banner
    gap: 12,
  },
  menuGroup: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    marginRight: 16,
    padding: 4, // Área de toque maior
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  proFooter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 30,
    paddingTop: 20,
  },
});