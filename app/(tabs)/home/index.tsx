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
  LayoutAnimation,
  Modal,
  Dimensions
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// Animações e Gestos
import Animated, {
  FadeOut,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { colorPrymary } from '@/constants/Colors';
import { ads, useAds } from '@/contexts/ads-provider';
import { ThemedText } from '@/components/ThemedText';
import { favoriteList } from '@/utils/List';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.25;
const ITEM_HEIGHT = 64;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

interface State {
  items: ShoppingItem[];
  newItem: string;
}

// ─── COMPONENTE ANIMADO (SWIPE TO DELETE + CHECKBOX) ──────────────────────────────
const AnimatedListItem = ({
  item,
  onRemove,
  onToggle,
  isDark
}: {
  item: ShoppingItem;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  isDark: boolean;
}) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(ITEM_HEIGHT);
  const marginB = useSharedValue(12);
  const opacity = useSharedValue(1);

  // Configuração do gesto: O activeOffsetX impede que o arrasto lateral roube o scroll vertical da lista
  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((event) => {
      // Só permite arrastar pra esquerda
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd(() => {
      const shouldDismiss = translateX.value < SWIPE_THRESHOLD;
      if (shouldDismiss) {
        translateX.value = withTiming(-SCREEN_WIDTH, undefined, () => {
          itemHeight.value = withTiming(0);
          marginB.value = withTiming(0);
          opacity.value = withTiming(0, undefined, () => {
            runOnJS(onRemove)(item.id);
          });
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rContainerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    marginBottom: marginB.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={rContainerStyle}>
      {/* Fundo Vermelho só aparece quando arrasta! */}
      <RNView style={styles.deleteBackground}>
        <Ionicons name="trash" size={24} color="#FFF" />
      </RNView>

      <GestureDetector gesture={pan}>
        <Animated.View style={[
          styles.menuGroup,
          { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
          // Aqui está o ajuste perfeito de cor pro Modo Dark:
          item.checked && { backgroundColor: isDark ? '#262626' : '#F4F4F4' },
          rStyle
        ]}>
          <RNView style={styles.menuItem}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => onToggle(item.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <RNView style={[
                styles.checkbox,
                { borderColor: item.checked ? colorPrymary : (isDark ? '#555' : '#CCC') },
                item.checked && { backgroundColor: colorPrymary }
              ]}>
                {item.checked && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </RNView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuTextContainer}
              onPress={() => onToggle(item.id)}
              activeOpacity={0.7}
            >
              <ThemedText style={[
                styles.menuLabel,
                { color: isDark ? '#F0F0F0' : '#334155' },
                item.checked && { textDecorationLine: 'line-through', color: isDark ? '#7A7A7A' : '#94A3B8' }
              ]}>
                {item.name}
              </ThemedText>
            </TouchableOpacity>
          </RNView>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};
// ──────────────────────────────────────────────────────────────────────────────────

const ShoppingListScreen: React.FC = () => {
  const [state, setState] = useState<State>({ items: [], newItem: '' });
  const [showSuccess, setShowSuccess] = useState(false);

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const { isPro, showInterstitial, showRewardedInterstitial } = useAds();

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedItems = await AsyncStorage.getItem('shoppingItems');
        if (storedItems) {
          const parsed = JSON.parse(storedItems);

          if (parsed.length > 0 && typeof parsed[0] === 'string') {
            const migratedItems = parsed.map((name: string, index: number) => ({
              id: Date.now().toString() + index,
              name: name,
              checked: false
            }));
            setState({ items: migratedItems, newItem: '' });
            saveItems(migratedItems);
          } else {
            setState({ items: parsed, newItem: '' });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    loadData();
  }, []);

  const saveItems = async (items: ShoppingItem[]) => {
    try {
      await AsyncStorage.setItem('shoppingItems', JSON.stringify(items));
    } catch (error) { }
  };

  const addItem = (name: string, isFromList: boolean = false) => {
    if (name.trim() === '') return;

    if (state.items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      ToastAndroid.show('Este item já está na lista.', ToastAndroid.SHORT);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name,
      checked: false
    };

    const updatedItems = [newItem, ...state.items];
    setState((prev) => ({ ...prev, items: updatedItems, newItem: '' }));
    saveItems(updatedItems);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isPro && isFromList) {
      if (Math.random() > 0.8) {
        showInterstitial();
      }
    }
  };

  const toggleItemCheck = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedItems = state.items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setState((prev) => ({ ...prev, items: updatedItems }));
    saveItems(updatedItems);
  };

  const removeItem = (id: string) => {
    const updatedItems = state.items.filter(item => item.id !== id);
    setState((prev) => ({ ...prev, items: updatedItems }));
    saveItems(updatedItems);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const finishShopping = () => {
    const hasCheckedItems = state.items.some(i => i.checked);

    if (!hasCheckedItems) {
      ToastAndroid.show('Marque pelo menos um item para concluir.', ToastAndroid.SHORT);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const remainingItems = state.items.filter(item => !item.checked);
      setState((prev) => ({ ...prev, items: remainingItems }));
      saveItems(remainingItems);

      if (!isPro) showRewardedInterstitial();
    }, 1800);
  };

  const renderEmptyState = () => (
    <RNView style={styles.emptyStateContainer}>
      <RNView style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <Ionicons name="basket-outline" size={48} color={isDark ? '#555' : '#CCC'} />
      </RNView>
      <ThemedText style={[styles.emptyTitle, { color: isDark ? '#E2E8F0' : '#334155' }]}>
        Sua lista está vazia
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
        Adicione itens acima ou escolha nas sugestões rápidas para começar suas compras.
      </ThemedText>
    </RNView>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RNView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F8F8F8' }]}>
        <Stack.Screen options={{
          headerTitle: `DataMoney ${isPro ? "Pro" : 'Free'}`,
          headerStyle: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
          headerTintColor: isDark ? '#FFFFFF' : '#111111',
          headerShadowVisible: false,
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

        {/* Input Moderno com Searchbar adaptada e Chips */}
        <RNView style={[styles.topSection, { backgroundColor: isDark ? '#121212' : '#F8F8F8' }]}>

          <Searchbar
            placeholder="O que você precisa comprar?"
            onChangeText={(text) => setState((prev) => ({ ...prev, newItem: text }))}
            value={state.newItem}
            onSubmitEditing={() => addItem(state.newItem, false)}
            mode='bar'
            icon="cart-plus"
            iconColor={colorPrymary}
            selectionColor={colorPrymary}
            cursorColor={colorPrymary}
            onClearIconPress={() => setState((prev) => ({ ...prev, newItem: '' }))}
            style={[styles.searchBar, { backgroundColor: isDark ? '#1E1E1E' : '#E9ECEF' }]}
            inputStyle={{ color: isDark ? '#FFFFFF' : '#111111', fontSize: 16 }}
            placeholderTextColor={isDark ? '#888888' : '#94A3B8'}
            elevation={0}
          />

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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => (
            <AnimatedListItem
              item={item}
              onRemove={removeItem}
              onToggle={toggleItemCheck}
              isDark={isDark}
            />
          )}
          ListFooterComponent={
            state.items.length > 0 ? (
              <TouchableOpacity
                style={[styles.finishButton, { backgroundColor: colorPrymary }]}
                activeOpacity={0.8}
                onPress={finishShopping}
              >
                <Ionicons name="checkmark-done-circle-outline" size={24} color="#FFF" />
                <ThemedText style={styles.finishButtonText}>Concluir Compra</ThemedText>
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Banner Inferior (só se não for Pro) */}
        {!isPro && (
          <RNView style={styles.bannerContainer}>
            <BannerAd unitId={ads.banner} size={BannerAdSize.FULL_BANNER} />
          </RNView>
        )}

        {/* Modal Suave de Sucesso */}
        {showSuccess && (
          <Modal transparent animationType="fade">
            <RNView style={styles.successOverlay}>
              <Animated.View entering={ZoomIn.duration(400)} exiting={FadeOut.duration(300)} style={[styles.successCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
                <RNView style={styles.successIconCircle}>
                  <Ionicons name="cart" size={40} color="#FFF" />
                </RNView>
                <ThemedText style={[styles.successTitle, { color: isDark ? '#FFF' : '#111' }]}>
                  Compra Concluída!
                </ThemedText>
                <ThemedText style={[styles.successSubtitle, { color: isDark ? '#94A3B8' : '#64748b' }]}>
                  Os itens marcados foram guardados no seu armário e retirados da lista.
                </ThemedText>
              </Animated.View>
            </RNView>
          </Modal>
        )}
      </RNView>
    </GestureHandlerRootView>
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
  searchBar: {
    marginBottom: 12,
    borderRadius: 16,
    height: 52,
  },
  quickAddContainer: {
    marginHorizontal: -20,
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
    paddingBottom: 100,
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF4757',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    marginBottom: 12,
  },
  menuGroup: {
    borderRadius: 16,
    height: ITEM_HEIGHT,
    justifyContent: 'center',
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
    paddingHorizontal: 16,
  },
  checkboxContainer: {
    marginRight: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  finishButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
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
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colorPrymary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});