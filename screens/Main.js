import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const { user } = useAuth(); // user 객체를 AuthContext에서 받아옴
  // React 상태 정의
  const [foodItems, setFoodItems] = useState([]);
  const [recentRecipes, setRecentRecipes] = useState([]);
  // const [favoriteRecipes, setFavoriteRecipes] = useState([]); // 즐겨찾기 레시피 상태 추가
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // 모달 표시 여부 상태
  const [selectedRecipe, setSelectedRecipe] = useState(null); // 모달에 표시할 레시피 데이터 상태
  const [emojiMap, setEmojiMap] = useState({}); // { 식재료명: 이모지 }
  const [emojiLoading, setEmojiLoading] = useState({}); // { 식재료명: boolean }

  // 앱 시작 시 캐시된 이모지 불러오기
  useEffect(() => {
    (async () => {
      try {
        const cache = await AsyncStorage.getItem('foodEmojiCache');
        if (cache) setEmojiMap(JSON.parse(cache));
      } catch (e) {}
    })();
  }, []);

  // 캐시 저장 함수
  const saveEmojiCache = async (newMap) => {
    try {
      await AsyncStorage.setItem('foodEmojiCache', JSON.stringify(newMap));
    } catch (e) {}
  };

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

  // Gemini AI로 식재료별 이모지 추천 받아오기 (캐시 우선)
  const fetchEmojiForFood = async (foodName) => {
    if (!foodName || emojiMap[foodName] || emojiLoading[foodName]) return;
    // 캐시 확인
    try {
      const cache = await AsyncStorage.getItem('foodEmojiCache');
      if (cache) {
        const parsed = JSON.parse(cache);
        if (parsed[foodName]) {
          setEmojiMap((prev) => ({ ...prev, [foodName]: parsed[foodName] }));
          return;
        }
      }
    } catch (e) {}
    setEmojiLoading((prev) => ({ ...prev, [foodName]: true }));
    try {
      const res = await apiService.getAlternativeFood('식재료', foodName + '에 어울리는 이모지 하나만 추천해줘. 음식 종류라면 대표 이모지, 채소/과일/육류 등은 그에 맞는 이모지. 텍스트 없이 이모지 하나만.');
      let emoji = '';
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        // 응답에서 이모지(유니코드)만 추출, 없으면 첫 글자 사용
        const raw = res.data[0].trim();
        const match = raw.match(/([\p{Emoji}\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD-\u25FE\u2614-\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA-\u26AB\u26BD-\u26BE\u26C4-\u26C5\u26CE\u26D4\u26EA\u26F2-\u26F3\u26F5\u26FA\u26FD\u2705\u270A-\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B-\u2B1C\u2B50\u2B55\u1F004\u1F0CF\u1F18E\u1F191-\u1F19A\u1F1E6-\u1F1FF\u1F201-\u1F202\u1F21A\u1F22F\u1F232-\u1F23A\u1F250-\u1F251\u1F300-\u1F320\u1F32D-\u1F335\u1F337-\u1F37C\u1F37E-\u1F393\u1F3A0-\u1F3CA\u1F3CF-\u1F3D3\u1F3E0-\u1F3F0\u1F3F4\u1F3F8-\u1F43E\u1F440\u1F442-\u1F4FC\u1F4FF-\u1F53D\u1F54B-\u1F54E\u1F550-\u1F567\u1F57A\u1F595-\u1F596\u1F5A4\u1F5FB-\u1F64F\u1F680-\u1F6C5\u1F6CC\u1F6D0\u1F6D1-\u1F6D2\u1F6EB-\u1F6EC\u1F6F4-\u1F6F8\u1F910-\u1F93A\u1F93C-\u1F93E\u1F940-\u1F945\u1F947-\u1F94C\u1F950-\u1F96B\u1F980-\u1F997\u1F9C0\u1F9D0-\u1F9E6])/u);
        emoji = match ? match[1] : raw[0];
      } else if (res && res.success && typeof res.data === 'string') {
        const raw = res.data.trim();
        const match = raw.match(/([\p{Emoji}\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD-\u25FE\u2614-\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA-\u26AB\u26BD-\u26BE\u26C4-\u26C5\u26CE\u26D4\u26EA\u26F2-\u26F3\u26F5\u26FA\u26FD\u2705\u270A-\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B-\u2B1C\u2B50\u2B55\u1F004\u1F0CF\u1F18E\u1F191-\u1F19A\u1F1E6-\u1F1FF\u1F201-\u1F202\u1F21A\u1F22F\u1F232-\u1F23A\u1F250-\u1F251\u1F300-\u1F320\u1F32D-\u1F335\u1F337-\u1F37C\u1F37E-\u1F393\u1F3A0-\u1F3CA\u1F3CF-\u1F3D3\u1F3E0-\u1F3F0\u1F3F4\u1F3F8-\u1F43E\u1F440\u1F442-\u1F4FC\u1F4FF-\u1F53D\u1F54B-\u1F54E\u1F550-\u1F567\u1F57A\u1F595-\u1F596\u1F5A4\u1F5FB-\u1F64F\u1F680-\u1F6C5\u1F6CC\u1F6D0\u1F6D1-\u1F6D2\u1F6EB-\u1F6EC\u1F6F4-\u1F6F8\u1F910-\u1F93A\u1F93C-\u1F93E\u1F940-\u1F945\u1F947-\u1F94C\u1F950-\u1F96B\u1F980-\u1F997\u1F9C0\u1F9D0-\u1F9E6])/u);
        emoji = match ? match[1] : raw[0];
      }
      if (!emoji) emoji = '🍽️'; // fallback
      setEmojiMap((prev) => {
        const newMap = { ...prev, [foodName]: emoji };
        saveEmojiCache(newMap);
        return newMap;
      });
    } catch (e) {
      setEmojiMap((prev) => {
        const newMap = { ...prev, [foodName]: '🍽️' };
        saveEmojiCache(newMap);
        return newMap;
      });
    } finally {
      setEmojiLoading((prev) => ({ ...prev, [foodName]: false }));
    }
  };

  // 식재료 미리보기 목록이 바뀔 때마다 이모지 요청
  useEffect(() => {
    foodItems.forEach(item => {
      if (!emojiMap[item.name || item.foodName]) fetchEmojiForFood(item.name || item.foodName);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodItems]);

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
                {/* Gemini 추천 이모지 */}
                <Text style={{ fontSize: 20, marginRight: 6 }}>
                  {emojiLoading[item.name || item.foodName] ? '⏳' : (emojiMap[item.name || item.foodName] || '🍽️')}
                </Text>
                <Text style={styles.foodItemText}>{item.name || item.foodName || '식재료'}</Text>
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
                      style={styles.recipeThumbnail}
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
    backgroundColor: '#fff',
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 18,
    fontSize: 16,
    color: '#1E1E1E',
    fontWeight: '400',
    fontFamily: 'Pretendard-Regular',
  },
  sectionContainer: {
    marginTop: 24,
    marginHorizontal: 18,
    padding: 0,
    backgroundColor: '#F6F8FA',
    borderRadius: 20,
    // Toss 스타일: 그림자 최소화
    shadowColor: 'transparent',
    elevation: 0,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1E1E1E',
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 0,
    letterSpacing: 0.1,
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#50C4B7',
  },
  seeAllText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
  },
  foodItemsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingBottom: 18,
    marginBottom: 8,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginRight: 14,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#F0F1F4',
  },
  foodItemText: {
    fontSize: 15,
    color: '#1E1E1E',
    fontWeight: '400',
    fontFamily: 'Pretendard-Regular',
    marginLeft: 8,
  },
  foodItemQuantity: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 6,
    fontWeight: '400',
    fontFamily: 'Pretendard-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 18,
  },
  emptyText: {
    color: '#8E8E93',
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Pretendard-Regular',
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: '#50C4B7',
    borderRadius: 16,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
  },
  recipesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingBottom: 18,
    marginBottom: 8,
  },
  recipeCard: {
    width: 140,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F1F4',
    elevation: 0,
  },
  recipeImageContainer: {
    height: 100,
    backgroundColor: '#F6F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  recipeThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  placeholderIcon: {
    opacity: 0.4,
  },
  recipeTitle: {
    padding: 14,
    fontWeight: '400',
    textAlign: 'center',
    fontSize: 15,
    color: '#1E1E1E',
    fontFamily: 'Pretendard-Regular',
  },
  refreshButton: {
    margin: 32,
    padding: 16,
    backgroundColor: '#50C4B7',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
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
  safeArea: {
    backgroundColor: "#186FF2",
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 28, // 더 크고 두드러지게
    fontWeight: 'bold',
    color: '#fff',
    paddingLeft: 18,
    letterSpacing: 1.2,
    textShadowColor: '#2D336B',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  icon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingRight: 24,
  },
  badge_button: {
    marginLeft: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  box: {
    flex: 11,
    backgroundColor: '#f7f8fa',
    padding: 14,
    margin: 12,
    borderTopRightRadius: 28,
    borderTopLeftRadius: 28,
    marginBottom: -15,
    elevation: 4,
    shadowColor: '#2D336B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  gridItem: {
    width: '33%',
    padding: 10,
    position: 'relative',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#A9B5DF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderColor: '#A9B5DF',
    borderWidth: 1,
    backgroundColor: '#f0f0f0',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e0e3ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
    fontSize: 17,
    marginTop: 7,
    color: '#2D336B',
    textAlign: 'center',
  },
  category: {
    color: '#7886C7',
    marginLeft: 3,
    fontSize: 15,
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff4d4f',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    elevation: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContainer: {
    width: '82%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    elevation: 6,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 22,
    color: '#2D336B',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 18,
  },
  button: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 7,
    marginHorizontal: 7,
  },
  addButton: {
    backgroundColor: '#333f50',
  },
  cancelButton: {
    backgroundColor: '#e0e3ee',
  },
  buttonText1: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonText2: {
    color: '#333f50',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default Main;