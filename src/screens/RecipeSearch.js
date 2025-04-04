import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, Switch, ScrollView, SafeAreaView, } from 'react-native';

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
      Alert.alert('재료를 입력하세요.');
    }
  };

  const deleteIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const navigateToDetail = () => {
    navigation.navigate('RecipeResult');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#2D336B", "#A9B5DF"]}
        style={styles.background}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 40 }}>
        <Text style={styles.title}>레시피 검색</Text>
      </View>
      <ScrollView>
        <View style={styles.box}>
          <Text style={styles.sectionTitle}>조건 선택</Text>
          <View style={{marginBottom: -10}}>
            {Object.keys(conditions).map((key, index, array) => (
              <View
                key={index}
                style={[
                  styles.conditionItem,
                  index === array.length - 1 && { borderBottomWidth: 0 },
                ]}>
                <Text style={styles.conditionText}>{`조건 ${index + 1}`}</Text>
                <Switch
                  value={conditions[key]}
                  onValueChange={() => toggleCondition(key)}
                />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.box}>
          <View>
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
                placeholderTextColor="#7886C7"
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

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
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
    fontSize: 28,
    fontWeight: 'bold',
    alignItems: 'center',
    color: '#fff',
    paddingLeft: 15,
  },
  box: {
    backgroundColor: '#EEF1FA',
    padding: 15,
    margin: 10,
    borderRadius: 20,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D336B',
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#A9B5DF',
  },
  conditionText: {
    fontSize: 18,
    color: '#2D336B',
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  ingredientText: {
    fontSize: 18,
    color: '#2D336B',
  },
  deleteButton: {
    fontSize: 16,
    color: '#e74c3c',
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#7886C7',
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  addButton: {
    height: 40,
    backgroundColor: '#2D336B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 30,
  },
  btnArea: {
    backgroundColor: '#2D336B',
    height: 50,
    borderRadius: 20,
    margin: 10,
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