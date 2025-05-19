import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { GOOGLE_API_KEY, GOOGLE_CX } from '../config/api.config';

// Google 이미지 검색 함수
async function fetchGoogleImageUrl(query) {
  try {
    // API 키가 설정되어 있지 않으면 null 반환
    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      console.log('Google API 키 또는 CX가 설정되지 않았습니다. 로컬 이미지만 사용합니다.');
      return null;
    }

    const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_CX}&key=${GOOGLE_API_KEY}&searchType=image&num=1`;
    const response = await fetch(apiUrl);

    // 응답이 성공적이지 않으면 로그 출력
    if (!response.ok) {
      console.warn(`Google 이미지 검색 API 응답 오류: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      console.log(`[RecipeResult] 레시피 '${query}' 이미지 URL 찾음:`, data.items[0].link);
      return data.items[0].link;
    } else {
      console.log(`[RecipeResult] 레시피 '${query}'에 대한 이미지를 찾을 수 없습니다.`);
    }
  } catch (error) {
    console.warn('Google 이미지 검색 실패:', error);
  }
  return null;
}

// RecipeResult 컴포넌트: 검색 결과 레시피를 보여주는 화면
const RecipeResult = ({ route, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [loadingErrors, setLoadingErrors] = useState({}); // 이미지 로딩 오류 상태 추가

  // route.params에서 검색 결과 데이터 가져오기
  const { recipes: searchResults, conditions, ingredients } = route.params || {};

  useEffect(() => {
    if (searchResults) {
      // 검색 결과가 있으면 설정
      console.log('[RecipeResult] 검색 결과 수신:', searchResults.length);
      setRecipes(searchResults);
      // 각 레시피별 이미지 URL 비동기 로딩
      (async () => {
        setLoading(true);
        try {
          const urls = {};
          for (const r of searchResults) {
            // 이미지 매칭 키를 title > recipeName > name 순으로 통일
            const key = r.title || r.recipeName || r.name || '기본 레시피';
            console.log(`[RecipeResult] 레시피 이미지 로딩 중: ${key}`);
            const imgSrc = await fetchGoogleImageUrl(key + ' 음식 사진');
            urls[key] = imgSrc;
            console.log(`[RecipeResult] 이미지 로딩 결과:`, typeof imgSrc === 'string' ? '외부 URL' : '로컬 이미지');
          }
          console.log('[RecipeResult] 모든 이미지 로딩 완료');
          setImageUrls(urls);
        } catch (error) {
          console.error('[RecipeResult] 이미지 로딩 오류:', error);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      console.log('[RecipeResult] 검색 결과 없음');
      setRecipes([]);
      setLoading(false);
    }
  }, [searchResults]);

  // 레시피 상세 페이지로 이동하는 함수
  const navigateToDetail = (recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  // 썸네일 추출 함수 (http/https URL 우선, 빈 값/비정상 값 무시)
  const getRecipeThumbnail = (recipe) => {
    const candidates = [
      recipe.thumbnail,
      recipe.image,
      recipe.ATT_FILE_NO_MK,
      recipe.ATT_FILE_NO_MAIN,
      Array.isArray(recipe.processImage) && recipe.processImage.length > 0 ? recipe.processImage[0] : null
    ];
    for (const url of candidates) {
      if (typeof url === 'string' && url.trim().length > 0 && (url.startsWith('http://') || url.startsWith('https://'))) {
        return { uri: url };
      }
    }
    // 기본 이미지 없음(null 반환)
    return null;
  };

  // 영양 정보 포매팅 함수
  const formatNutritionValue = (value) => {
    if (value === undefined || value === null) return '정보 없음';
    return typeof value === 'number' ? value.toFixed(1) : value;
  };

  // 이미지 로딩 오류 처리 함수
  const handleImageError = (recipeName) => {
    console.log(`[RecipeResult] 이미지 로딩 실패: ${recipeName}`);
    setLoadingErrors(prev => ({
      ...prev,
      [recipeName]: true
    }));
  };

  // 검색 조건 텍스트 가져오기
  const getConditionText = (conditions) => {
    if (!conditions || Object.keys(conditions).length === 0) return '없음';
    const texts = [];
    if (conditions.calorie === 'LOW') texts.push('저칼로리');
    if (conditions.calorie === 'HIGH') texts.push('고칼로리');
    if (conditions.fat === 'LOW') texts.push('저지방');
    if (conditions.fat === 'HIGH') texts.push('고지방');
    if (conditions.natrium === 'LOW') texts.push('저나트륨');
    if (conditions.natrium === 'HIGH') texts.push('고나트륨');
    if (conditions.protien === 'LOW' || conditions.protein === 'LOW') texts.push('저단백질');
    if (conditions.protien === 'HIGH' || conditions.protein === 'HIGH') texts.push('고단백질');
    if (conditions.carbohydrate === 'LOW') texts.push('저탄수화물');
    if (conditions.carbohydrate === 'HIGH') texts.push('고탄수화물');
    return texts.length ? texts.join(', ') : '없음';
  };

  return (
    <ScrollView style={styles.container}>
      {/* 검색 정보 요약 */}
      <View style={styles.searchSummary}>
        <Text style={styles.searchIngredients}>
          재료: {Array.isArray(ingredients) && ingredients.length > 0 ? ingredients.join(', ') : '없음'}
        </Text>
        <Text style={styles.searchConditions}>
          조건: {getConditionText(conditions)}
        </Text>
      </View>

      {/* 화면 제목 */}
      <Text style={styles.title}>
        {recipes.length > 0
          ? `${recipes.length}개의 검색 결과 `
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
            source={require('../assets/icon.png')}
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
        recipes.map((recipe, index) => (
          <TouchableOpacity
            key={recipe.id || index}
            style={styles.recipeCard}
            onPress={() => navigateToDetail(recipe)}
          >
            {loadingErrors[recipe.name] ? (
              <View style={[styles.recipeImage, styles.noImageContainer]}>
                <Text style={styles.noImageText}>이미지 로딩에 실패했습니다</Text>
              </View>
            ) : (
              getRecipeThumbnail(recipe) && getRecipeThumbnail(recipe).uri ? (
                <View style={styles.cardContainer}>
                  <Image
                    source={getRecipeThumbnail(recipe)}
                    style={styles.recipeImage}
                    onError={() => handleImageError(recipe.name)}
                  />
                  <Text style={styles.recipeTitle}>
                    {recipe.recipeName || recipe.title || '이름 없음'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.recipeImage, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                  <Text style={styles.noImageText}>미리보기 이미지가 존재하지 않습니다</Text>
                </View>
              )
            )}
            <View style={styles.divider}></View>
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
            <View style={styles.divider}></View>
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
    backgroundColor: '#A9B5DF', // 밝은 배경색
    padding: 10,
    paddingTop: 0,
  },
  divider: {
    height: 0.8,
    width: '95%',
    backgroundColor: '#C3CBE9',
    marginVertical: 10,
    alignSelf: 'center'
  },
  searchSummary: {
    backgroundColor: '#fff',
    paddingLeft: 15,
    paddingVertical: 8,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
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
    marginBottom: 10,
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
  recipeContainer: {
    flexDirection: 'column', // 수직 정렬
    alignItems: 'center', // 가운데 정렬 (필요시)
  },
  recipeCardContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
  },
  recipeImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
    borderRadius: 8,
    overflow: 'hidden',
  },
  recipeTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  recipeImageStyle: {
    borderRadius: 10,
    opacity: 0.9, // 이미지 살짝 흐리게 설정
  },
  recipeInfo: {
    position: 'absolute', // 하단에 정보 표시
    bottom: 0,
    width: '100%',
    padding: 10,
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
  ingredientsText: {
    fontSize: 14,
    color: '#777',
    lineHeight: 21,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#2D336B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingVertical: 100,
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
    color: '#2D336B',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 25,
  },
  backButton: {
    backgroundColor: '#2D336B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  noImageText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    textAlign: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default RecipeResult; // RecipeResult 컴포넌트를 외부로 내보냄