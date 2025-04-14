import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';

// 레시피 이미지 매핑
const recipeImages = {
  '닭죽': require('../assets/chicken_porridge.png'),
  '김치찌개': require('../assets/kimchi_stew.png'),
  '갈비탕': require('../assets/Galbitang.png'),
  '제육볶음': require('../assets/Stir_fried_pork.png'),
  '된장찌개': require('../assets/soy_bean_paste_soup.png'),
  // 기본 이미지
  'default': require('../assets/chicken_porridge.png')
};

// RecipeResult 컴포넌트: 검색 결과 레시피를 보여주는 화면
const RecipeResult = ({ route, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]); 

  // route.params에서 검색 결과 데이터 가져오기
  const { recipes: searchResults, conditions, ingredients } = route.params || {};
  
  useEffect(() => {
    if (searchResults) {
      // 검색 결과가 있으면 설정
      console.log('[RecipeResult] 검색 결과 수신:', searchResults.length);
      setRecipes(searchResults);
    } else {
      console.log('[RecipeResult] 검색 결과 없음');
      setRecipes([]);
    }
  }, [searchResults]);

  // 레시피 상세 페이지로 이동하는 함수
  const navigateToDetail = (recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  // 레시피 이미지 선택 함수
  const getRecipeImage = (recipeName) => {
    if (!recipeName) return recipeImages.default;
    
    // 제목에 따라 미리 정의된 이미지 반환
    for (const key of Object.keys(recipeImages)) {
      if (recipeName.includes(key)) {
        return recipeImages[key];
      }
    }
    
    // 일치하는 이미지가 없으면 기본 이미지 반환
    return recipeImages.default;
  };

  // 영양 정보 포매팅 함수
  const formatNutritionValue = (value) => {
    if (value === undefined || value === null) return '정보 없음';
    return typeof value === 'number' ? value.toFixed(1) : value;
  };

  // 검색 조건 텍스트 가져오기
  const getConditionText = (conditions) => {
    const texts = [];
    
    if (conditions.calorie === 'LOW') texts.push('저칼로리');
    if (conditions.calorie === 'HIGH') texts.push('고칼로리');
    
    if (conditions.fat === 'LOW') texts.push('저지방');
    if (conditions.fat === 'HIGH') texts.push('고지방');
    
    if (conditions.natrium === 'LOW') texts.push('저나트륨');
    if (conditions.natrium === 'HIGH') texts.push('고나트륨');
    
    if (conditions.protien === 'LOW') texts.push('저단백질');
    if (conditions.protien === 'HIGH') texts.push('고단백질');
    
    if (conditions.carbohydrate === 'LOW') texts.push('저탄수화물');
    if (conditions.carbohydrate === 'HIGH') texts.push('고탄수화물');
    
    return texts.length ? texts.join(', ') : '모든 레시피';
  };

  return (
    <ScrollView style={styles.container}>
      {/* 검색 정보 요약 */}
      <View style={styles.searchSummary}>
        <Text style={styles.searchIngredients}>
          재료: {ingredients?.join(', ') || '없음'}
        </Text>
        <Text style={styles.searchConditions}>
          조건: {getConditionText(conditions || {})}
        </Text>
      </View>

      {/* 화면 제목 */}
      <Text style={styles.title}>
        {recipes.length > 0 
          ? `검색 결과 (${recipes.length}개)` 
          : '검색 결과가 없습니다'}
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>레시피를 불러오는 중...</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image 
            source={require('../assets/soy_bean_paste_soup.png')} 
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>
            검색 결과가 없습니다.{'\n'}다른 재료나 조건으로 다시 검색해보세요.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>다시 검색하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* 추천 레시피 목록 */
        recipes.map((recipe, index) => (
          <TouchableOpacity
            key={recipe.id || index}
            style={styles.recipeCard}
            onPress={() => navigateToDetail(recipe)}
          >
            {/* 레시피 이미지 */}
            <ImageBackground
              source={getRecipeImage(recipe.title)}
              style={styles.recipeImage}
              imageStyle={styles.recipeImageStyle}
            >
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
              </View>
            </ImageBackground>
            
            {/* 간략 영양 정보 */}
            {recipe.nutritionInfo && (
              <View style={styles.nutritionContainer}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>칼로리</Text>
                  <Text style={styles.nutritionValue}>
                    {formatNutritionValue(recipe.nutritionInfo.calorie)} kcal
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>단백질</Text>
                  <Text style={styles.nutritionValue}>
                    {formatNutritionValue(recipe.nutritionInfo.protein)} g
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>지방</Text>
                  <Text style={styles.nutritionValue}>
                    {formatNutritionValue(recipe.nutritionInfo.fat)} g
                  </Text>
                </View>
              </View>
            )}
            
            {/* 재료 정보 */}
            <View style={styles.ingredientsContainer}>
              <Text style={styles.ingredientsTitle}>주요 재료</Text>
              <Text style={styles.ingredientsText}>
                {recipe.ingredients && recipe.ingredients.length > 0 
                  ? recipe.ingredients.slice(0, 4).join(', ') + (recipe.ingredients.length > 4 ? ' 외' : '')
                  : '정보 없음'}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9', // 밝은 배경색
    padding: 10,
  },
  searchSummary: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIngredients: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  searchConditions: {
    fontSize: 15,
    color: '#666',
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
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    marginBottom: 5,
  },
  ingredientsText: {
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    opacity: 0.5,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default RecipeResult; // RecipeResult 컴포넌트를 외부로 내보냄