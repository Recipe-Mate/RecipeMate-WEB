import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';

// RecipeSearch 컴포넌트: 조건과 재료를 입력하여 레시피를 검색하는 화면을 제공함
const RecipeSearch = ({ navigation }) => {
  const [conditions, setConditions] = useState({
    condition1: false, // 조건 1 상태 관리함
    condition2: false, // 조건 2 상태 관리함
    condition3: false, // 조건 3 상태 관리함
    condition4: false, // 조건 4 상태 관리함
  });

  const [ingredients, setIngredients] = useState([]); // 재료 목록 상태 관리함
  const [newIngredient, setNewIngredient] = useState(''); // 새로운 재료 입력 상태 관리함

  // 조건 토글 함수
  const toggleCondition = (key) => {
    setConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 재료 추가 함수
  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]); // 입력된 재료를 추가함
      setNewIngredient(''); // 입력 필드를 초기화함
    } else {
      Alert.alert('Error', '재료를 입력하세요.'); // 경고 메시지 표시함
    }
  };

  // 재료 삭제 함수
  const deleteIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index)); // 선택한 재료를 삭제함
  };

  // 레시피 검색 결과 페이지로 이동함
  const navigateToDetail = () => {
    navigation.navigate('RecipeResult');
  };

  const conditionLabels = ['탄수화물', '단백질', '지방', '칼로리'];

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* 화면 제목 */}
        <Text style={styles.title}>레시피 검색</Text>

        {/* 조건 섹션 */}
        <View style={styles.conditions}>
          <Text style={styles.sectionTitle}>조건 선택</Text>
          {Object.keys(conditions).map((key, index) => (
            <View key={index} style={styles.conditionItem}>
              <Text style={styles.conditionText}>{conditionLabels[index]}</Text>
              <Switch
                value={conditions[key]}
                onValueChange={() => toggleCondition(key)}
              />
            </View>
          ))}
        </View>

        {/* 재료 입력 및 리스트 */}
        <View style={styles.ingredients}>
          <Text style={styles.sectionTitle}>재료 추가</Text>
          <FlatList
            data={ingredients}
            renderItem={({ item, index }) => (
              <View style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>{item}</Text>
                <TouchableOpacity onPress={() => deleteIngredient(index)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="재료를 입력하세요"
              value={newIngredient}
              onChangeText={setNewIngredient}
            />
            <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 검색 버튼 */}
        <TouchableOpacity style={styles.searchButton} onPress={navigateToDetail}>
          <Text style={styles.searchButtonText}>레시피 검색</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  conditions: {
    marginBottom: 20,
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  conditionText: {
    fontSize: 16,
    color: '#444',
  },
  ingredients: {
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    fontSize: 16,
    color: '#e74c3c',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RecipeSearch; // RecipeSearch 컴포넌트를 외부로 내보냄