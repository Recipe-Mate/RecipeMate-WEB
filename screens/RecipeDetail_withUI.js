import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const RecipeDetail = ({ navigation }) => {
  const [favorites, setFavorites] = useState(false);
  const [ingredients, setIngredients] = useState([
    { id: '1', name: '김치', has: true },
    { id: '2', name: '돼지고기', has: false },
    { id: '3', name: '두부', has: true },
    { id: '4', name: '대파', has: true },
    { id: '5', name: '고춧가루', has: true },
    { id: '6', name: '멸치 육수', has: false },
  ]);

  const recipeSteps = [
    '1. 냄비에 참기름을 두르고 돼지고기와 김치를 볶습니다.',
    '2. 고기가 익으면 멸치 육수를 넣고 끓입니다.',
    '3. 두부를 먹기 좋게 썰어 냄비에 넣습니다.',
    '4. 대파와 고춧가루를 추가하고 한소끔 더 끓입니다.',
    '5. 맛을 보고 간을 맞춘 후 완성합니다.',
  ];

  const toggleFavorite = () => {
    setFavorites((prev) => !prev);
    Alert.alert(favorites ? '즐겨찾기 해제' : '즐겨찾기에 추가');
  };

  const completeCooking = () => {
    navigation.navigate('IngredientChange', { ingredients });
  };

  return (
    <View style={styles.container}>
      {/* 메뉴 이름 */}
      <Text style={styles.menuName}>김치찌개</Text>

      {/* 알레르기 유발 위험군 */}
      <Text style={styles.allergyWarning}>알레르기 유발군: 고춧가루</Text>

      {/* 메뉴 사진 및 즐겨찾기 */}
      <View style={styles.imageSection}>
        <Image
          source={require('../assets/kimchi_stew.png')}
          style={styles.menuImage}
        />
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Text style={styles.favoriteButtonText}>
            {favorites ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 재료 리스트 */}
      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>재료 리스트</Text>
        <ScrollView style={styles.scrollableList}>
          {ingredients.map((item) => (
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
        </ScrollView>
      </View>

      {/* 레시피 내용 */}
      <View style={styles.recipeSection}>
        <Text style={styles.sectionTitle}>레시피</Text>
        <ScrollView style={styles.scrollableList}>
          {recipeSteps.map((step, index) => (
            <Text key={index} style={styles.recipeStep}>
              {step}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* 요리 완료 버튼 */}
      <TouchableOpacity style={styles.completeButton} onPress={completeCooking}>
        <Text style={styles.completeButtonText}>요리 완료</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  menuName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  allergyWarning: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 15,
  },
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  menuImage: {
    width: 200,
    height: 100,
    borderRadius: 10,
  },
  favoriteButton: {
    padding: 10,
    backgroundColor: '#3498db',
    borderRadius: 50,
  },
  favoriteButtonText: {
    fontSize: 24,
    color: '#fff',
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
  scrollableList: {
    maxHeight: 150, // 스크롤 가능한 고정 높이
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginVertical: 10, // 리스트 컨테이너의 위아래 마진
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
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
    paddingVertical: 10, // 개별 레시피 단계 텍스트의 위아래 마진
  },
  completeButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RecipeDetail;