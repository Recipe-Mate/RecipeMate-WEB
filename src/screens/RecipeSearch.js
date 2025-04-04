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

const RecipeSearch = ({ navigation }) => {
  const [conditions, setConditions] = useState({
    condition1: false,
    condition2: false,
    condition3: false,
    condition4: false,
  });

  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState('');

  const toggleCondition = (key) => {
    setConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    } else {
      Alert.alert('Error', '재료를 입력하세요.');
    }
  };

  const deleteIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const navigateToDetail = () => {
    navigation.navigate('RecipeResult');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}></View>
      
      <Text style={styles.title}>레시피 검색</Text>

      <ScrollView>
        {/* 조건 섹션 */}
        <View style={styles.conditionView}>
          <View style={styles.conditions}>
            <Text style={styles.sectionTitle}>조건 선택</Text>
            {Object.keys(conditions).map((key, index) => (
              <View key={index} style={styles.conditionItem}>
                <Text style={styles.conditionText}>{`조건 ${index + 1}`}</Text>
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
        </View>
        


        

        {/* 검색 버튼 */}
        <View style={styles.btnArea}>
          <TouchableOpacity style={styles.searchButton} onPress={navigateToDetail}>
            <Text style={styles.searchButtonText}>레시피 검색</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  header: {
    height: 40,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    alignItems: 'center'
  },
  conditionView: {
    //padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
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
    backgroundColor: '#333f50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  btnArea: {
    backgroundColor: '#333f50',
    height: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchButtonText: {
    fontSize: '20',
    fontWeight: 'bold',
    color: '#ffffff'
  },
});

export default RecipeSearch;