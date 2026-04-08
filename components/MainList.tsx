import React, { useState } from 'react';
import { Text, View } from './Themed';
import { FlatList, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colorPrymary } from '@/constants/Colors';
import { favoriteList } from '@/utils/List';

interface FormatItem {
  id: number;
  name: string;
}

interface MainListProps {
  onAddItem: (item: string) => void;
}

export default function MainList({ onAddItem }: MainListProps) {
  const colorScheme = useColorScheme();
  const [list, setList] = useState<FormatItem[]>(favoriteList);


  const renderItem = ({ item }: { item: FormatItem }) => (
    <Pressable
      android_ripple={{ color: colorPrymary }}
      style={[styles.pressable, { backgroundColor: colorScheme === 'dark' ? '#1C1C1C' : '#F5F5F5' }]}
      onPress={() => onAddItem(item.name)}
    >
      <FontAwesome name="plus" color={colorScheme === 'dark' ? "white" : colorPrymary} size={12} />
      <Text style={styles.text}>{item.name}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Itens mais procurados da lista</Text>
      <FlatList
        contentContainerStyle={{ alignItems: 'flex-end' }}
        numColumns={2}
        data={[...list].reverse()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  pressable: {
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 12,
    width: '45%',
    maxWidth: 200,
    minWidth: 100,
    alignItems: 'center',
    gap: 15,
    flexDirection: 'row',
  },
  text: {
    fontSize: 15,
    textAlign: 'left',
  },
});
