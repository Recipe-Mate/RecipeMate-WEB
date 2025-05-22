import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

const RecipeResult = ({ route, navigation }) => {
  const { recipes: passedRecipes, conditions, ingredients } = route.params || {};
  const [recipes, setRecipes] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRecipes(passedRecipes || []);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!recipes) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>레시피를 불러오고 있습니다.</Text>
      </View>
    );
  }
  const getConditionText = (conditions) => {
    const texts = [];

    if (conditions.calorie === 'LOW') texts.push('저칼로리');
    if (conditions.calorie === 'HIGH') texts.push('고칼로리');

    if (conditions.fat === 'LOW') texts.push('저지방');
    if (conditions.fat === 'HIGH') texts.push('고지방');

    if (conditions.protien === 'LOW') texts.push('저단백질');
    if (conditions.protien === 'HIGH') texts.push('고단백질');

    if (conditions.carbohydrate === 'LOW') texts.push('저탄수화물');
    if (conditions.carbohydrate === 'HIGH') texts.push('고탄수화물');

    return texts.length ? texts.join(', ') : '모든 레시피';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchSummary}>
        <Text style={styles.title}>
          {ingredients}을 사용한 레시피
        </Text>
        <Text style={styles.recipeNumber}>
          총 레시피 개수: {recipes.length}개
        </Text>
        <Text style={styles.conditionText}>
          조건: {getConditionText(conditions)}
        </Text>
      </View>
      {recipes.map((recipe, index) => (
        <TouchableOpacity
          key={index}
          style={styles.recipeCard}
          onPress={() =>
            navigation.navigate('RecipeDetail', {
              recipeName: recipe.recipeName,
              dishImg: recipe.dishImg,
            })
          }
        >
          <View style={styles.recipeContainer}>
            <Image
              source={{ uri: recipe.dishImg }}
              style={styles.recipeImage}
            />
            <Text style={styles.recipeTitle}>{recipe.recipeName}</Text>
          </View>
          <View style={styles.divider}></View>
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>칼로리</Text>
              <Text style={styles.nutritionValue}>
                {recipe.calorie} kcal
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>단백질</Text>
              <Text style={styles.nutritionValue}>
                {recipe.protien} g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>지방</Text>
              <Text style={styles.nutritionValue}>
                {recipe.fat} g
              </Text>
            </View>
          </View>
          <View style={styles.divider}></View>
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsTitle}>주요 재료</Text>
            <Text>{recipe.ingredient.join(', ')}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A9B5DF', // 밝은 배경색
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A9B5DF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  searchSummary: {
    backgroundColor: '#fff',
    paddingLeft: 15,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  searchSummary: {
    backgroundColor: '#fff',
    paddingLeft: 15,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#2D336B',
  },
  conditionText: {
    color: 'gray',
    fontSize: 15,
    marginTop: 2,
  },
  recipeNumber: {
    fontSize: 17,
  },
  recipeContainer: {
    flexDirection: 'column', // 수직 정렬
    alignItems: 'center', // 가운데 정렬 (필요시)
  },
  recipeImage: {
    width: '95%',
    height: 170,
    borderRadius: 10,
    marginTop: 10,
  },
  recipeTitle: {
    marginTop: 8, // 이미지와 텍스트 사이 간격
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2D336B',
  },
  recipeCard: {
    marginBottom: 10,
    borderRadius: 15, // 카드 모서리 둥글게 처리
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, // 그림자 설정 (안드로이드)
    backgroundColor: 'white',
  },
  divider: {
    height: 0.8,
    width: '95%',
    backgroundColor: '#C3CBE9',
    marginVertical: 10,
    alignSelf: 'center'
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ingredientsContainer: {
    padding: 12,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 2,
    marginTop: -15,
  },
})

export default RecipeResult;