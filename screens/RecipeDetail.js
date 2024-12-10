import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Button,
  Alert,
} from 'react-native';

const RecipeDetail = () => {
  const [favorites, setFavorites] = useState(false); // 즐겨찾기 상태 관리
  const [ingredients, setIngredients] = useState([
    { id: '1', name: '밀가루', has: true },
    { id: '2', name: '우유', has: false },
    { id: '3', name: '계란', has: true },
  ]);

  const recipeSteps = [
    '1. 재료를 준비합니다.',
    '2. 밀가루와 우유를 섞습니다.',
    '3. 계란을 추가하고 섞어줍니다.',
    '4. 팬에 재료를 붓고 익힙니다.',
  ]; // API에서 가져올 레시피 데이터 예시

  const toggleFavorite = () => {
    setFavorites((prev) => !prev);
    Alert.alert(favorites ? '즐겨찾기 해제' : '즐겨찾기에 추가');
  };

  const completeCooking = () => {
    Alert.alert('냉장고가 업데이트 되었습니다.');
  };

  return (
    <View style={styles.container}>
      {/* 메뉴 이름 */}
      <Text style={styles.menuName}>테스트 화면</Text>

      {/* 알레르기 유발 위험군 */}
      <Text style={styles.allergyWarning}>알레르기 유발군 텍스트</Text>

      {/* 메뉴 사진 및 즐겨찾기 */}
      <View style={styles.imageSection}>
      <Image
        source={require('../images/pancake.png')}
        // 실제 이미지는 API에서 반영
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
        <Text style={styles.sectionTitle}>재료 리스트 텍스트 영역</Text>
        <FlatList
          data={ingredients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.ingredientItem}>
              <Text>{item.name}</Text>
              <Text>{item.has ? '보유' : '미보유'}</Text>
            </View>
          )}
        />
      </View>

      {/* 레시피 내용 */}
      <ScrollView style={styles.recipeSection}>
        <Text style={styles.sectionTitle}>레시피 텍스트 영역</Text>
        {recipeSteps.map((step, index) => (
          <Text key={index} style={styles.recipeStep}>
            {step}
          </Text>
        ))}
      </ScrollView>

      {/* 요리 완료 버튼 */}
      <View style={styles.completeButton}>
        <Button title="요리 완료" onPress={completeCooking} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  menuName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  allergyWarning: {
    fontSize: 14,
    color: 'red',
    marginBottom: 15,
  },
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  menuImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  favoriteButton: {
    padding: 10,
  },
  favoriteButtonText: {
    fontSize: 20,
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  recipeSection: {
    flex: 1,
    marginBottom: 20,
  },
  recipeStep: {
    fontSize: 16,
    marginBottom: 10,
  },
  completeButton: {
    marginBottom: 10,
  },
});

export default RecipeDetail;