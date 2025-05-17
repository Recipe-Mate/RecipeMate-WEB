import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const dummyIngredients = [
  { id: '1', name: '감자', has: true },
  { id: '2', name: '양파', has: true },
  { id: '3', name: '당근', has: false },
  { id: '4', name: '돼지고기', has: true },
  { id: '5', name: '대파', has: true },
];

const dummyNutrition = {
  calorie: '350kcal',
  carbohydrate: '40g',
  protein: '18g',
  fat: '12g',
  natrium: '800mg',
};

const dummySteps = [
  '1. 감자, 양파, 당근을 깍둑썰기한다.',
  '2. 냄비에 돼지고기를 볶다가 채소를 넣고 함께 볶는다.',
  '3. 물을 붓고 끓인다.',
  '4. 대파를 넣고 간을 맞춘다.',
  '5. 완성된 찌개를 그릇에 담아낸다.',
];

const RecipeDetatilDummy = () => {
  const handleFavorite = () => {
    Alert.alert('즐겨찾기', '이 레시피를 즐겨찾기에 추가했습니다!');
  };

  return (
    <ScrollView style={styles.container}>
      {/* 썸네일 */}
      <Image
        source={require('../assets/icon.png')}
        style={styles.menuImage}
      />
      {/* 제목 */}
      <Text style={styles.menuName}>감자돼지찌개</Text>
      {/* 영양정보 */}
      <View style={styles.nutritionBox}>
        <Text style={styles.nutritionTitle}>영양정보</Text>
        <Text style={styles.nutritionText}>칼로리: {dummyNutrition.calorie}</Text>
        <Text style={styles.nutritionText}>탄수화물: {dummyNutrition.carbohydrate}</Text>
        <Text style={styles.nutritionText}>단백질: {dummyNutrition.protein}</Text>
        <Text style={styles.nutritionText}>지방: {dummyNutrition.fat}</Text>
        <Text style={styles.nutritionText}>나트륨: {dummyNutrition.natrium}</Text>
      </View>
      {/* 재료 리스트 */}
      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>재료 리스트</Text>
        {dummyIngredients.map((item) => (
          <View
            key={item.id}
            style={[
              styles.ingredientItem,
              { backgroundColor: item.has ? '#e0f7ff' : '#ffe0e0' },
            ]}
          >
            <Text style={styles.ingredientText}>{item.name}</Text>
            <Text
              style={[
                styles.ingredientStatus,
                { color: item.has ? '#3498db' : '#e74c3c' },
              ]}
            >
              {item.has ? '보유' : '미보유'}
            </Text>
          </View>
        ))}
      </View>
      {/* 조리 과정 */}
      <View style={styles.recipeSection}>
        <Text style={styles.sectionTitle}>조리 과정</Text>
        {dummySteps.map((step, index) => (
          <Text key={index} style={styles.recipeStep}>
            {step}
          </Text>
        ))}
      </View>
      {/* 즐겨찾기 버튼 */}
      <TouchableOpacity style={styles.favoriteButton} onPress={handleFavorite}>
        <Text style={styles.favoriteButtonText}>⭐ 즐겨찾기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  menuImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  menuName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  nutritionBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2D336B',
  },
  nutritionText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 2,
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
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
  ingredientStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipeSection: {
    marginBottom: 20,
  },
  recipeStep: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    paddingVertical: 10,
  },
  favoriteButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  favoriteButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RecipeDetatilDummy;
