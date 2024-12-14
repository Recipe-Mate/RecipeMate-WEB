import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const RecipeResult = ({ route, navigation }) => {
  const [recipes, setRecipes] = useState([]); // 추천 레시피 목록 상태

  // 사용자 입력값 (route.params에서 전달받음)
  const { conditions, ingredients } = route.params || {};

  // API로부터 추천 레시피 데이터 가져오기 (더미 데이터 사용)
  useEffect(() => {
    // 임시 데이터
    setRecipes([
      {
        id: '1',
        title: '김치찌개',
        image: require('../assets/kimchi_stew.png'),
        steps: ['참기름에 돼지고기와 김치 볶기', '멸치 육수 넣고 끓이기'],
      },
      {
        id: '2',
        title: '닭죽',
        image: require('../assets/chicken_porridge.png'),
        steps: ['닭과 물을 넣고 끓이기', '쌀 넣고 저으면서 끓이기'],
      },
      {
        id: '3',
        title: '햄버거',
        image: require('../assets/burger.png'),
        steps: ['고기 패티 중불에 굽기'],
      },
    ]);
  }, []);

  const navigateToDetail = (recipe) => {
    // 선택한 레시피 상세 페이지로 이동
    navigation.navigate('RecipeDetail', { recipe });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>추천 레시피</Text>
      {recipes.map((recipe) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.recipeCard}
          onPress={() => navigateToDetail(recipe)}
        >
          <ImageBackground
            source={recipe.image}
            style={styles.recipeImage}
            imageStyle={styles.recipeImageStyle} // 살짝 흐린 효과 적용
          >
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeTitle}>{recipe.title}</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9', // 약간 밝은 배경색
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333', // 약간 어두운 텍스트 색상
  },
  recipeCard: {
    marginBottom: 20,
    borderRadius: 15, // 카드 둥근 모서리
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, // 안드로이드 그림자
    backgroundColor: 'white', // 카드 배경
  },
  recipeImage: {
    height: 180, // 이미지 높이
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeImageStyle: {
    borderRadius: 10,
    opacity: 0.9, // 살짝 흐리게 처리
  },
  recipeInfo: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // 이전보다 불투명하게 설정
    padding: 10,
  },
  recipeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RecipeResult;