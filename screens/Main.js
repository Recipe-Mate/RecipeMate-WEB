import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../src/context/AuthContext';
// api.service.js 파일에서 apiService import
import apiService from '../src/services/api.service';
import SimpleRecipeDetailModal from './SimpleRecipeDetailModal'; // SimpleRecipeDetailModal import 추가

// 메인 화면 컴포넌트
const Main = ({ navigation }) => {
  // React 상태 정의
  const [foodItems, setFoodItems] = useState([]);
  const [recentRecipes, setRecentRecipes] = useState([]);
  // const [favoriteRecipes, setFavoriteRecipes] = useState([]); // 즐겨찾기 레시피 상태 추가
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // 모달 표시 여부 상태
  const [selectedRecipe, setSelectedRecipe] = useState(null); // 모달에 표시할 레시피 데이터 상태
  // 인증 컨텍스트에서 사용자 정보 가져오기
  const { user } = useAuth();

  // 앱 바 설정
  useEffect(() => {
    navigation.setOptions({
      headerTitle: '홈',
      headerStyle: { backgroundColor: '#ffffff' },
      headerTitleStyle: { fontWeight: 'bold', color: '#333333' },
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 15 }} onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings-outline" size={24} color="#333333" />
        </TouchableOpacity>
      ),
      headerShown: true,
      headerLeft: () => null // 홈에서는 뒤로가기 버튼 없음
    });
  }, [navigation]);

  // 데이터 로드 함수
  const loadData = async () => {
    // 사용자 정보가 없으면 로드를 시도하지 않음
    if (!user || !user.id) {
      console.log('[MainScreen] 사용자 정보 없음, 데이터 로드 건너뜀.');
      setLoading(false); // 로딩 상태 해제
      setRefreshing(false);
      setFoodItems([]); // 기존 데이터 초기화
      setRecentRecipes([]); // 기존 데이터 초기화
      // setFavoriteRecipes([]); // 즐겨찾기 레시피도 초기화
      return;
    }

    setLoading(true);
    try {
      const userId = user.id; // 이제 user.id가 있다고 가정할 수 있음

      // 비동기 호출들을 병렬로 처리
      const [foodResponse, recentResponse /*, favoriteResponse */] = await Promise.all([
        apiService.getIngredients(userId), // userId 전달
        apiService.getRecentRecipes(userId),
        // apiService.getFavoriteRecipes(userId) // 즐겨찾기 레시피 호출 추가
      ]);

      // 사용자 식재료 목록 처리
      if (foodResponse && foodResponse.success && foodResponse.data) {
        setFoodItems(foodResponse.data.slice(0, 5));
      } else {
        setFoodItems([]); 
      }

      // 최근 사용 레시피 처리
      if (recentResponse && recentResponse.success && recentResponse.data) {
        // 최대 5개, 이름 중복 제거
        const uniqueRecentRecipes = [];
        const recipeNames = new Set();
        for (const recipe of recentResponse.data) {
          if (!recipeNames.has(recipe.recipeName)) {
            uniqueRecentRecipes.push(recipe);
            recipeNames.add(recipe.recipeName);
          }
          if (uniqueRecentRecipes.length >= 5) break;
        }
        setRecentRecipes(uniqueRecentRecipes);
      } else {
        setRecentRecipes([]);
      }

      // 즐겨찾기 레시피 처리
      /*
      if (favoriteResponse && favoriteResponse.success && favoriteResponse.data) {
        setFavoriteRecipes(favoriteResponse.data.slice(0, 5));
      } else {
        setFavoriteRecipes([]);
      }
      */

    } catch (error) {
      console.error("[MainScreen] 데이터 로드 실패:", error);
      setFoodItems([]);
      setRecentRecipes([]);
      // setFavoriteRecipes([]); // 오류 발생 시 즐겨찾기 레시피도 초기화
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [user?.id]); // user.id가 변경될 때만 loadData 호출

  // 새로고침 처리
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openRecipeModal = (recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  const closeRecipeModal = () => {
    setModalVisible(false);
    setSelectedRecipe(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 내 식재료 섹션 */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>내 식재료</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('FoodList')}
          >
            <Text style={styles.seeAllText}>모두 보기</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodItemsContainer}>
          {foodItems && foodItems.length > 0 ? (
            foodItems.map((item, index) => (
              <View key={index} style={styles.foodItem}>
                <Icon name="nutrition-outline" size={24} color="#4CAF50" />
                <Text style={styles.foodItemText}>{item.name || '식재료'}</Text>
                {item.quantity && (
                  <Text style={styles.foodItemQuantity}>{item.quantity}</Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>등록된 식재료가 없습니다.</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('AddFood')}
              >
                <Text style={styles.addButtonText}>식재료 추가하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* 최근 레시피 섹션 */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 본 레시피</Text> 
          {/* '모두 보기' 버튼 제거됨 */}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipesContainer}>
          {recentRecipes.length > 0 ? (
            recentRecipes.map((recipe, index) => (
              <TouchableOpacity 
                key={recipe.id || index} // recipe.id가 있다면 그것을 key로 사용 (PK)
                style={styles.recipeCard}
                // CookedRecipeDetailScreen 화면으로 네비게이션하고, recipeData 전체를 전달합니다.
                // onPress={() => navigation.navigate('CookedRecipeDetailScreen', { recipeData: recipe })}
                onPress={() => openRecipeModal(recipe)} // 모달을 열도록 수정
              >
                <View style={styles.recipeImageContainer}>
                  {/* thumbnail 이미지는 attFileNoMk 필드를 사용, 없으면 recipeImage도 확인 */}
                  {(recipe.attFileNoMk || recipe.recipeImage) ? ( 
                    <Image
                      source={{ uri: recipe.attFileNoMk || recipe.recipeImage }}
                      style={{ width: 100, height: 100, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Icon name="restaurant-outline" size={40} color="#FFF" style={styles.placeholderIcon} />
                  )}
                </View>
                <Text style={styles.recipeTitle}>{recipe.recipeName}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>최근에 요리 완료한 레시피가 없습니다.</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* 즐겨찾는 레시피 섹션 */}
      {/*
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>즐겨찾는 레시피</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('ProfileStack', { screen: 'FavoriteRecipes' })} // 수정된 부분
          >
            <Text style={styles.seeAllText}>모두 보기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipesContainer}>
          {favoriteRecipes.length > 0 ? (
            favoriteRecipes.map((recipe, index) => (
              <TouchableOpacity 
                key={recipe.id || index} // recipe.id가 있다면 그것을 key로 사용
                style={styles.recipeCard}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id, recipeData: recipe })}
              >
                <View style={styles.recipeImageContainer}>
                  {(recipe.attFileNoMk || recipe.recipeImage) ? (
                    <Image
                      source={{ uri: recipe.attFileNoMk || recipe.recipeImage }}
                      style={{ width: 100, height: 100, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Icon name="heart-outline" size={40} color="#FFF" style={styles.placeholderIcon} />
                  )}
                </View>
                <Text style={styles.recipeTitle}>{recipe.recipeName}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>즐겨찾는 레시피가 없습니다.</Text>
            </View>
          )}
        </ScrollView>
      </View>
      */}

      {/* 새로고침 버튼 */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Icon name="refresh-outline" size={24} color="#FFF" />
        <Text style={styles.refreshButtonText}>새로고침</Text>
      </TouchableOpacity>

      {selectedRecipe && (
        <SimpleRecipeDetailModal
          visible={modalVisible}
          onClose={closeRecipeModal}
          recipeData={selectedRecipe}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ecf5fc', // #3498db와 어울리는 밝은 배경색
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  sectionContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c6e91', // #3498db와 어울리는 어두운 색상
    marginBottom: 10, // 원래 값으로 유지하거나 필요시 조정
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
  foodItemsContainer: {
    flexDirection: 'row',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#d6eaf8', // #3498db와 어울리는 밝은 색상
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 8,
  },
  foodItemText: {
    fontSize: 16,
    color: '#2c6e91',
  },
  foodItemQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 10,
  },
  emptyText: {
    color: '#999',
    marginBottom: 8,
    fontSize: 14,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3498db',
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recipesContainer: {
    flexDirection: 'row',
    // flexWrap: 'wrap', // wrap 관련 스타일 제거 (또는 주석 처리)
    // justifyContent: 'space-around', // wrap 관련 스타일 제거 (또는 주석 처리)
  },
  recipeCard: {
    width: 150, // 원래 값으로 유지
    marginRight: 12, // 원래 값으로 유지
    marginVertical: 0, // 수평 스크롤이므로 수직 마진은 필요 없을 수 있음 (또는 기존 값 유지)
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recipeImageContainer: {
    height: 100,
    backgroundColor: '#AED581',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    opacity: 0.7,
  },
  recipeTitle: {
    padding: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
    color: '#333',
  },
  refreshButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#3498db',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  welcomeSection: {
    marginTop: 10,
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
});

export default Main;