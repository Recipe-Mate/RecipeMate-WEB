import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// RecipeResult 컴포넌트: 사용자 조건에 맞는 추천 레시피를 보여주는 화면
const RecipeResult = ({ route, navigation }) => {
  const [recipes, setRecipes] = useState([]); // 추천 레시피 목록 상태

  // 사용자 입력값 (route.params에서 전달받음)
  const { conditions, ingredients } = route.params || {};

  // API로부터 추천 레시피 데이터 가져오기 (현재 더미 데이터 사용)
  useEffect(() => {
    // 임시 데이터 설정
    setRecipes([
      {
        id: '1',
        title: '김치찌개',
        image: require('../assets/kimchi_stew.png'),
        steps: ['참기름에 돼지고기와 김치 볶기', '멸치 육수 넣고 끓이기'],
      },
      {
        id: '2',
        title: '제육볶음',
        image: require('../assets/Stir_fried_pork.png'),
        steps: ['닭과 물을 넣고 끓이기', '쌀 넣고 저으면서 끓이기'],
      },
      {
        id: '3',
        title: '갈비탕',
        image: require('../assets/Galbitang.png'),
        steps: ['고기 패티 중불에 굽기'],
      },
    ]);
  }, []);

  // 레시피 상세 페이지로 이동하는 함수
  const navigateToDetail = (recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  return (
    <ScrollView style={styles.container}>
      {/* 화면 제목 */}
      <Text style={styles.title}>추천 레시피</Text>

      {/* 추천 레시피 목록 */}
      {recipes.map((recipe) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.recipeCard}
          onPress={() => navigateToDetail(recipe)}
        >
          {/* 레시피 이미지 */}
          <ImageBackground
            source={recipe.image}
            style={styles.recipeImage}
            imageStyle={styles.recipeImageStyle} // 이미지 스타일 적용
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

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9', // 밝은 배경색
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333', // 제목 텍스트 색상
  },
  recipeCard: {
    marginBottom: 20,
    borderRadius: 15, // 카드 모서리 둥글게 처리
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, // 그림자 설정 (안드로이드)
    backgroundColor: 'white',
  },
  recipeImage: {
    height: 180, // 이미지 높이 설정
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeImageStyle: {
    borderRadius: 10,
    opacity: 0.9, // 이미지 살짝 흐리게 설정
  },
  recipeInfo: {
    position: 'absolute', // 하단에 정보 표시
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // 반투명 배경
    padding: 10,
  },
  recipeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RecipeResult; // RecipeResult 컴포넌트를 외부로 내보냄