import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import apiService from '../src/services/api.service';

// 레시피 이미지 매핑 (RecipeResult와 동일하게 유지)
const recipeImages = {
  '닭죽': require('../assets/chicken_porridge.png'),
  '김치찌개': require('../assets/kimchi_stew.png'),
  '갈비탕': require('../assets/Galbitang.png'),
  '제육볶음': require('../assets/Stir_fried_pork.png'),
  '된장찌개': require('../assets/soy_bean_paste_soup.png'),
  // 기본 이미지
  'default': require('../assets/chicken_porridge.png')
};

// RecipeDetail 컴포넌트: 레시피 상세 정보를 보여줌
const RecipeDetail = ({ route, navigation }) => {
  const [favorites, setFavorites] = useState(false); // 즐겨찾기 상태 관리
  const [ingredients, setIngredients] = useState([]); // 레시피 재료 목록
  const [recipeSteps, setRecipeSteps] = useState([]); // 레시피 단계
  const [recipeTitle, setRecipeTitle] = useState(''); // 레시피 제목
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [nutritionInfo, setNutritionInfo] = useState(null); // 영양 정보
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const { user } = useAuth();
  const [userIngredients, setUserIngredients] = useState([]); // 사용자 식재료 리스트

  // route.params에서 레시피 정보 가져오기
  const { recipe } = route?.params || {};

  useEffect(() => {
    // 레시피 정보가 있으면 설정
    if (recipe) {
      console.log('[RecipeDetail] 레시피 데이터 수신:', recipe.title || '제목 없음');
      
      // 레시피 제목 설정
      setRecipeTitle(recipe.title || '레시피');
      
      // 레시피 단계 설정
      setRecipeSteps(
        Array.isArray(recipe.steps) 
          ? recipe.steps.map((step, index) => `${index + 1}. ${step}`)
          : ['조리법 정보가 없습니다.']
      );
      
      // 재료 목록 설정 (보유 여부는 임의로 설정)
      if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        const ingredientItems = recipe.ingredients.map((ingredient, index) => ({
          id: String(index),
          name: ingredient,
          // 예시로 짝수 인덱스는 보유, 홀수 인덱스는 미보유로 설정
          has: index % 2 === 0
        }));
        setIngredients(ingredientItems);
      } else {
        setIngredients([{ id: '0', name: '재료 정보 없음', has: false }]);
      }
      
      // 영양 정보 설정
      if (recipe.nutritionInfo) {
        setNutritionInfo(recipe.nutritionInfo);
      }
      
      setLoading(false);
    } else {
      console.log('[RecipeDetail] 레시피 데이터 없음, 기본값 설정');
      // 기본값 설정
      setRecipeTitle('레시피 정보 없음');
      setRecipeSteps(['레시피 정보가 없습니다.']);
      setIngredients([{ id: '0', name: '재료 정보 없음', has: false }]);
      setLoading(false);
    }
  }, [recipe]);

  // 사용자 식재료 불러오기
  useEffect(() => {
    const fetchUserIngredients = async () => {
      if (!user || !user.id) return;
      try {
        const result = await apiService.getIngredients(user.id);
        if (result && result.success && result.data) {
          setUserIngredients(result.data);
        } else {
          setUserIngredients([]);
        }
      } catch (e) {
        setUserIngredients([]);
      }
    };
    fetchUserIngredients();
  }, [user]);

  // 즐겨찾기 토글 함수
  const toggleFavorite = () => {
    setFavorites((prev) => !prev);
    Alert.alert(
      favorites ? '즐겨찾기 해제' : '즐겨찾기에 추가', 
      favorites ? '즐겨찾기에서 삭제되었습니다.' : '즐겨찾기에 추가되었습니다.'
    );
  };

  // 요리 완료 버튼 클릭 시 실행되는 함수
  const completeCooking = () => {
    navigation.navigate('IngredientChange', { ingredients });
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

  // 레시피 재료와 사용자 식재료 매칭 및 상태 구분
  const getIngredientStatusList = () => {
    if (!Array.isArray(recipe?.ingredients)) return [];
    return recipe.ingredients.map((ingredient, index) => {
      // 예: "양파 100g" 또는 "양파"
      const match = ingredient.match(/([가-힣a-zA-Z0-9]+)\s*([\d.,]+\s*[a-zA-Z가-힣]*)?/);
      const name = match ? match[1] : ingredient;
      const needAmount = match && match[2] ? match[2].trim() : null;
      // 사용자 식재료 중 이름이 포함되는 항목 찾기(부분일치 허용)
      const userItem = userIngredients.find(ui => name && ui.name && ui.name.replace(/\s/g,"").includes(name.replace(/\s/g,"")));
      let status = '미보유';
      let display = ingredient;
      if (userItem) {
        if (needAmount && userItem.quantity) {
          // 숫자만 비교(단위가 같다고 가정)
          const needNum = parseFloat(needAmount);
          const ownNum = parseFloat(userItem.quantity);
          if (!isNaN(needNum) && !isNaN(ownNum)) {
            if (ownNum < needNum) {
              status = '부족';
              display = `${name} ${userItem.quantity}/${needAmount}`;
            } else {
              status = '보유';
              display = `${name} ${userItem.quantity}`;
            }
          } else {
            status = '보유';
            display = `${name} ${userItem.quantity}`;
          }
        } else {
          status = '보유';
          display = userItem.quantity ? `${name} ${userItem.quantity}` : name;
        }
      }
      return {
        id: String(index),
        name,
        display,
        status,
      };
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>레시피 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 32}}>
      {/* 메뉴 이름 */}
      <Text style={styles.menuName}>{recipeTitle}</Text>

      {/* 알레르기 정보는 데이터가 없어서 일단 생략 */}
      
      {/* 메뉴 사진 및 즐겨찾기 */}
      <View style={styles.imageSection}>
        <Image
          source={getRecipeImage(recipeTitle)}
          style={styles.menuImage}
        />
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Text style={styles.favoriteButtonText}>
            {favorites ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 영양 정보 섹션 (있을 경우에만 표시) */}
      {nutritionInfo && (
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>영양 정보</Text>
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>칼로리</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.calorie)} kcal
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>탄수화물</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.carbohydrate)} g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>단백질</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.protein)} g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>지방</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.fat)} g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>나트륨</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.natrium)} mg
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 재료 리스트 */}
      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>재료 리스트</Text>
        <ScrollView style={styles.scrollableList} nestedScrollEnabled={true}>
          {getIngredientStatusList().map((item) => (
            <View
              key={item.id}
              style={[
                styles.ingredientItem,
                item.status === '보유'
                  ? { backgroundColor: '#e0f7ff' }
                  : item.status === '부족'
                  ? { backgroundColor: '#fffbe0' }
                  : { backgroundColor: '#ffe0e0' },
              ]}
            >
              <Text style={styles.ingredientText}>{item.display}</Text>
              <Text
                style={[
                  styles.ingredientStatus,
                  item.status === '보유'
                    ? { color: '#3498db' }
                    : item.status === '부족'
                    ? { color: '#f39c12' }
                    : { color: '#e74c3c' },
                ]}
              >
                {item.status === '보유' ? '보유' : item.status === '부족' ? '부족' : '미보유'}
              </Text>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.detailButton} onPress={() => setShowIngredientsModal(true)}>
          <Text style={styles.detailButtonText}>전체 재료 자세히 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 레시피 내용 */}
      <View style={styles.recipeSection}>
        <Text style={styles.sectionTitle}>레시피</Text>
        <ScrollView style={styles.scrollableList} nestedScrollEnabled={true}>
          {recipeSteps.map((step, index) => (
            <Text key={index} style={styles.recipeStep}>
              {step}
            </Text>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.detailButton} onPress={() => setShowRecipeModal(true)}>
          <Text style={styles.detailButtonText}>전체 레시피 자세히 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 요리 완료 버튼 */}
      <TouchableOpacity style={styles.completeButton} onPress={completeCooking}>
        <Text style={styles.completeButtonText}>요리 완료</Text>
      </TouchableOpacity>

      {/* 재료 모달 */}
      <Modal
        visible={showIngredientsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIngredientsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>전체 재료 리스트</Text>
            <ScrollView style={styles.modalScroll}>
              {getIngredientStatusList().map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.ingredientItem,
                    item.status === '보유'
                      ? { backgroundColor: '#e0f7ff' }
                      : item.status === '부족'
                      ? { backgroundColor: '#fffbe0' }
                      : { backgroundColor: '#ffe0e0' },
                  ]}
                >
                  <Text style={styles.ingredientText}>{item.display}</Text>
                  <Text
                    style={[
                      styles.ingredientStatus,
                      item.status === '보유'
                        ? { color: '#3498db' }
                        : item.status === '부족'
                        ? { color: '#f39c12' }
                        : { color: '#e74c3c' },
                    ]}
                  >
                    {item.status === '보유' ? '보유' : item.status === '부족' ? '부족' : '미보유'}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowIngredientsModal(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 레시피 모달 */}
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>전체 레시피</Text>
            <ScrollView style={styles.modalScroll}>
              {recipeSteps.map((step, index) => (
                <Text key={index} style={styles.recipeStep}>{step}</Text>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowRecipeModal(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// 스타일 정의함
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
    height: 150, // 명확히 고정
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginVertical: 10, // 리스트 컨테이너의 위아래 마진
    overflow: 'hidden', // 섹션을 벗어나지 않도록
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  nutritionSection: {
    marginBottom: 20,
  },
  nutritionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    marginBottom: 10,
  },
  nutritionLabel: {
    fontSize: 16,
    color: '#555',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detailButton: {
    backgroundColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  detailButtonText: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalScroll: {
    width: '100%',
    marginBottom: 16,
    maxHeight: 350,
  },
  closeButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecipeDetail; // RecipeDetail 컴포넌트를 외부로 내보냄