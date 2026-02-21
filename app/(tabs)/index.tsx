import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, useColorScheme, ToastAndroid, View as RNView } from 'react-native';
import { TextInput, List, IconButton } from 'react-native-paper';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useInterstitialAd, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import * as Haptics from 'expo-haptics';

import { colorBlack, colorPrymary } from '@/constants/Colors';
import { adUnitId, bannerAdUnitId } from '@/utils/adUnitId';
import MainList from '@/components/MainList';
import { Text, View } from '@/components/Themed';
import { usePayment } from '@/contexts/PaymentProvider';

interface State {
  items: string[];
  newItem: string;
  addCount: number;
}

const ShoppingListScreen: React.FC = () => {
  const [state, setState] = useState<State>({ items: [], newItem: '', addCount: 0 });
  const [freeItemLimit] = useState<number>(5);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { hasPlan } = usePayment();
  const { isLoaded, isClosed, load, show } = useInterstitialAd(adUnitId);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedItems, storedAddCount] = await Promise.all([
          AsyncStorage.getItem('shoppingItems'),
          AsyncStorage.getItem('addCount'),
        ]);
        setState({
          items: storedItems ? JSON.parse(storedItems) : [],
          newItem: '',
          addCount: storedAddCount ? Number(storedAddCount) : 0,
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }

      load();
    };

    loadData();
  }, [load]);

  useEffect(() => {
    if (isClosed) load();
  }, [isClosed, load]);

  const saveItems = async (items: string[]) => {
    try {
      await AsyncStorage.setItem('shoppingItems', JSON.stringify(items));
    } catch (error) {
      console.error('Erro ao salvar itens:', error);
    }
  };

  const saveAddCount = async (count: number) => {
    try {
      await AsyncStorage.setItem('addCount', JSON.stringify(count));
    } catch (error) {
      console.error('Erro ao salvar contagem de adições:', error);
    }
  };

  const addItem = (item: string) => {
    if (item.trim() === '') return;

    if (state.items.includes(item)) {
      ToastAndroid.show('Este item já está na lista.', ToastAndroid.SHORT);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const updatedItems = [...state.items, item];
    const newAddCount = state.addCount + 1;

    setState({ items: updatedItems, newItem: '', addCount: newAddCount });
    saveItems(updatedItems);
    saveAddCount(newAddCount);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!hasPlan && newAddCount % freeItemLimit === 0 && isLoaded) {
      show();
    } else if (!hasPlan && !isLoaded) {
      load();
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = state.items.filter((_, i) => i !== index);
    setState((prev) => ({ ...prev, items: updatedItems }));
    saveItems(updatedItems);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        headerTitle: `DataMoney ${hasPlan ? "Premium" : 'Free'}`,
       
      }} />

      <TextInput
        placeholder="Adicionar item"
        value={state.newItem}
        onChangeText={(text) => setState((prev) => ({ ...prev, newItem: text }))}
        onSubmitEditing={() => addItem(state.newItem)}
        returnKeyType="done"
        mode="flat"
        style={styles.input}
        contentStyle={{
          backgroundColor: isDark ? colorBlack : '#fff',
          color: isDark ? '#fff' : '#000',
        }}
        activeOutlineColor={colorPrymary}
      />

      <FlatList
        data={state.items}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={<MainList onAddItem={addItem} />}
        renderItem={({ item, index }) => (
          <RNView
            style={[
              styles.listItem,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#fff',
                borderColor: isDark ? '#333' : '#ddd',
                shadowColor: isDark ? '#fff' : '#000',
              },
            ]}
          >
            <List.Item
              title={`${index + 1}. ${item}`}
              titleStyle={{ ...styles.itemTitle, color: isDark ? '#fff' : '#000' }}
              right={() => (
                <IconButton icon="delete" iconColor="#FF7F7F" onPress={() => removeItem(index)} />
              )}
            />
          </RNView>
        )}
      />

      {false && (
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.FULL_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 80,
  },
  listItem: {
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ShoppingListScreen;
