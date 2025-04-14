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

// 메인 화면 컴포넌트
const Main = ({ navigation }) => {
  // AsyncStorage 대신 React 상태 사용
  const [foodItems, setFoodItems] = useState([]);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  
  // 인증 컨텍스트에서 사용자 정보 가져오기
  const { user } = useAuth();
  
  // 컴포넌트 마운트될 때 앱 바 설정 - headerShown을 false로 설정
  useEffect(() => {
    // 앱 바 타이틀과 옵션 설정
    navigation.setOptions({
      headerTitle: '홈',
      headerStyle: {
        backgroundColor: '#ffffff',
      },
      headerTitleStyle: {
        fontWeight: 'bold',
        color: '#333333',
      },
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 15 }}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings-outline" size={24} color="#333333" />
        </TouchableOpacity>
      ),
      headerShown: false // 헤더를 보이지 않도록 설정
    });
  }, [navigation]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 데이터 로드 함수
  const loadData = async () => {
    setLoading(true);
    try {
      // 사용자 식재료 목록 가져오기 (미리보기만 표시)
      const userId = user?.id || 3;
      console.log('[Main] 사용자 식재료 데이터 로드 시작, userId:', userId);
      
      try {
        // 실제 API 호출로 대체하거나, 서버 연결 실패시 임시 데이터 사용
        let foodData = [];
        
        try {
          // 실제 서버 API 호출 시도
          const foodResponse = await apiService.getIngredients(userId);
          console.log('[Main] 식재료 API 응답:', foodResponse);
          
          if (foodResponse && foodResponse.success && foodResponse.data) {
            // Main 화면에서는 최대 5개만 미리보기로 표시 (중복 UI 방지)
            foodData = foodResponse.data.slice(0, 5);
          }
        } catch (apiError) {
          console.error('[Main] API 호출 실패, 임시 데이터 사용:', apiError);
          // API 호출 실패시 임시 데이터 사용
          const mockResponse = apiService.getMockData('ingredients');
          foodData = mockResponse.data.slice(0, 5); // 최대 5개만
        }
        
        setFoodItems(foodData);
        
      } catch (foodError) {
        console.error('[Main] 식재료 데이터 처리 오류:', foodError);
        setFoodItems([]);
      }
      
      // 최근 레시피 목록도 비슷하게 처리
      try {
        // 실제 API 호출 시도
        const recipesResponse = await apiService.getRecommendedRecipes(userId);
        if (recipesResponse && recipesResponse.success && recipesResponse.data) {
          setRecentRecipes(recipesResponse.data);
        } else {
          // 임시 데이터 사용
          const mockRecipes = apiService.getMockData('recipes');
          setRecentRecipes(mockRecipes.data);
        }
      } catch (recipeError) {
        console.error('[Main] 레시피 데이터 처리 오류:', recipeError);
        // 임시 데이터 사용
        const mockRecipes = apiService.getMockData('recipes');
        setRecentRecipes(mockRecipes.data);
      }
    } catch (error) {
      console.error('[Main] 데이터 불러오기 실패:', error);
      setFoodItems([]);
      setRecentRecipes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 새로고침 처리
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // 사용자의 식재료 목록 가져오기
  useEffect(() => {
    const fetchIngredients = async () => {
      if (!user || !user.id) return;
      
      try {
        setLoading(true);
        const result = await apiService.getIngredients(user.id);
        
        if (result && result.success && result.data) {
          setIngredients(result.data.slice(0, 5)); // 최대 5개만 표시
        } else {
          setIngredients([]);
        }
      } catch (error) {
        console.error('식재료 목록 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredients();
  }, [user]);

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
      {/*}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>안녕하세요, {user?.name || '사용자'}님!</Text>
        <Text style={styles.subtitleText}>오늘은 무엇을 요리해볼까요?</Text>
      </View>
        */}
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
          <Text style={styles.sectionTitle}>최근 레시피</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('RecipeSearch')}
          >
            <Text style={styles.seeAllText}>모두 보기</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipesContainer}>
          {recentRecipes.map((recipe, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.recipeCard}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
            >
              <View style={styles.recipeImageContainer}>
                <Icon name="restaurant-outline" size={40} color="#FFF" style={styles.placeholderIcon} />
              </View>
              <Text style={styles.recipeTitle}>{recipe.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 새로고침 버튼 */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Icon name="refresh-outline" size={24} color="#FFF" />
        <Text style={styles.refreshButtonText}>새로고침</Text>
      </TouchableOpacity>
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
    marginBottom: 10,
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
  },
  recipeCard: {
    width: 150,
    marginRight: 12,
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