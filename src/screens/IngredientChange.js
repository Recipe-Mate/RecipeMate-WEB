import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
  TouchableOpacity,
} from 'react-native';

const IngredientChange = ({ route, navigation }) => {
  const { ingredients: initialIngredients } = route.params || {};
  const [ingredients, setIngredients] = useState(initialIngredients);

  const toggleSwitch = (id) => {
    setIngredients((prevIngredients) =>
      prevIngredients.map((ingredient) =>
        ingredient.id === id
          ? { ...ingredient, has: !ingredient.has }
          : ingredient
      )
    );
  };

  const handleConfirm = () => {
    console.log('Updated Ingredients:', ingredients);
    navigation.goBack(); // 이전 화면으로 돌아가기
  };

  return (
    <View style={styles.container}>
      {/* 화면 제목 */}
      <Text style={styles.title}>재료 소진 체크</Text>

      {/* 재료 리스트 */}
      <FlatList
        data={ingredients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.ingredientItem,
              { backgroundColor: item.has ? '#e6f7e9' : '#fdecea' },
            ]}
          >
            <Text style={[
              styles.ingredientName,
              { color: item.has ? '#27ae60' : '#c0392b' },
            ]}>
              {item.name || '알 수 없는 재료'}
            </Text>
            <Switch
              trackColor={{ false: '#e74c3c', true: '#2ecc71' }}
              thumbColor={item.has ? '#ffffff' : '#ffffff'}
              ios_backgroundColor="#e74c3c"
              onValueChange={() => toggleSwitch(item.id)}
              value={item.has}
            />
          </View>
        )}
        style={styles.list}
      />

      {/* 확인 버튼 */}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>확인</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default IngredientChange;