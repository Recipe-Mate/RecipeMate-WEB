import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '@env';


const RecipeDetail = ({ route }) => {
  const { recipeName, dishImg } = route.params;
  const [recipe, setRecipe] = useState(null);

  const fetchRecipeDetail = async (recipeName) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const encodedName = encodeURIComponent(recipeName);

      const response = await fetch(`${SERVER_URL}/recipe/recipe-name?name=${encodedName}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('레시피 상세 정보 요청 실패');
      }

      const data = await response.json();
      console.log('레시피 상세 정보:', data);
      return data;

    } catch (error) {
      console.error('레시피 상세 정보 요청 중 오류:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadRecipe = async () => {
      const data = await fetchRecipeDetail(recipeName);
      if (data) {
        setRecipe(data.recipe);
      }
    };

    loadRecipe();
  }, [recipeName]);

  if (!recipe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A9B5DF" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>레시피를 불러오고 있습니다.</Text>
      </View>
    );
  }

  const completeCooking = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');

    const validImages = recipe.processImage.filter(url => url && url.trim() !== '');
    const lastProcessImage = validImages.length > 0 ? validImages[validImages.length - 1] : null;

    const requestBody = {
      recipeName: recipeName,
      recipeImage: lastProcessImage || dishImg,
    };

    console.log('서버로 전송될 데이터:', JSON.stringify(requestBody));

    const response = await fetch(`${SERVER_URL}/recipe/used`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error('서버 전송 실패');
    }

    const text = await response.text();
    console.log('서버 응답 원본:', text);

    if (text) {
      const result = JSON.parse(text);
      console.log('요리 완료 전송 성공:', result);
    } else {
      console.log('요리 완료 전송 성공 (응답 없음)');
    }
  } catch (error) {
    console.error('요리 완료 전송 중 오류:', error instanceof Error ? error.stack : error);
  }
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{recipe.recipeName}</Text>
      <View style={styles.imageBox}>
        <Image source={{ uri: dishImg }} style={styles.recipeImage} />
      </View>
      <View style={styles.nutritionSection}>
        <Text style={styles.sectionTitle}>영양 정보</Text>
        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>칼로리</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.calorie} kcal` : '정보 없음'}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>탄수화물</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.carbohydrate} g` : '정보 없음'}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>단백질</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.protien} g` : '정보 없음'}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>지방</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.fat} g` : '정보 없음'}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>나트륨</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.natrium} mg` : '정보 없음'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.nutritionSection}>
        <Text style={styles.sectionTitle}>재료</Text>
        {recipe.ingredient.map((item, index) => (
          <Text key={index} style={{marginTop: 3}}>• {item}</Text>
        ))}
      </View>

      <View style={styles.finalBox}>
        <Text style={styles.sectionTitle}>조리 과정</Text>
        {recipe.cookingProcess.map((step, index) => {
          const imageUrl = recipe.processImage[index];
          if (!step) return null;

          return (
            <View key={index} style={styles.stepRow}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.stepImage} />
              ) : (
                <View style={styles.stepImagePlaceholder}>
                  <Text style={styles.stepIndex}>{index + 1}</Text>
                </View>
              )}
              <Text style={styles.stepText}>{step}</Text>
            </View>
          );
        })}
      </View>
      <TouchableOpacity style={styles.completeButton} onPress={completeCooking}>
        <Text style={styles.completeButtonText}>요리 완료</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A9B5DF',
    padding: 10,
  },
  imageBox: {
    backgroundColor: '#EEF1FA',
    padding: 10,
    margin: 5,
    borderRadius: 15,
    marginBottom: 3,
  },
  sectionBox: {
    backgroundColor: '#EEF1FA',
    padding: 15,
    margin: 5,
    borderRadius: 20,
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#2D336B',
    textAlign: 'center'
  },
  recipeImage: {
    height: 170,
    borderRadius: 11,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  nutritionSection: {
    backgroundColor: '#EEF1FA',
    padding: 12,
    margin: 5,
    borderRadius: 15,
  },
  nutritionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  stepImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#000',  // 테두리 색상
  },
  stepImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepIndex: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  finalBox: {
    backgroundColor: '#EEF1FA',
    padding: 15,
    margin: 5,
    borderRadius: 15,
  },
  completeButton: {
    backgroundColor: '#2D336B',
    borderRadius: 15,
    padding: 15,
    margin: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  completeButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
})

export default RecipeDetail;