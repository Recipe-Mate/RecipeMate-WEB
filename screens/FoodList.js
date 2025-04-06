import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal  // 추가된 import
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../src/context/AuthContext';
import apiService from '../src/services/api.service';

const FoodList = ({ navigation }) => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  // 컴포넌트 마운트 상태를 추적하는 ref 추가
  const isMountedRef = useRef(true);
  
  // 모달 상태 관리 추가
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 ref를 true로 설정
    isMountedRef.current = true;
    
    // 초기 로드
    loadFoodItems();
    
    // 화면으로 돌아올 때 데이터 로드
    const unsubscribe = navigation.addListener('focus', () => {
      // 파라미터 확인, route 객체에서 직접 params 접근
      const refreshParam = route.params?.refresh;
      console.log('[FoodList] 화면 포커스, 갱신 파라미터:', refreshParam);
      
      if (refreshParam) {
        console.log('[FoodList] 새로고침 파라미터 감지됨, 데이터 다시 로드');
        loadFoodItems();
        // 파라미터 초기화 (연속 네비게이션에서 중복 로드 방지)
        navigation.setParams({ refresh: undefined });
      }
    });
    
    // 컴포넌트 언마운트 시 ref를 false로 설정
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [navigation, route]);

  const loadFoodItems = async () => {
    const userId = user?.id || 3; // 실제 로그인 사용자 ID 또는 기본값
    
    try {
      setLoading(true);
      console.log('[FoodList] 식재료 목록 로드 시작, userId:', userId);
      
      // getIngredients 함수 사용
      const response = await apiService.getIngredients(userId);
      console.log('[FoodList] 식재료 목록 응답:', response);
      
      let foodData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          foodData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          foodData = response.data.data;
        } else if (response.data.foods && Array.isArray(response.data.foods)) {
          // GetOwnFoodResponse 형식도 처리
          foodData = response.data.foods.map((name, index) => ({
            id: index + 1,
            name: name
          }));
        }
      }
      
      console.log('[FoodList] 처리된 식재료 데이터:', foodData);
      setFoodItems(foodData);
    } catch (error) {
      console.error('[FoodList] 데이터 로드 오류:', error);
      Alert.alert('오류', '식재료 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFoodItems();
  };

  const handleDeleteFood = (foodId) => {
    // Alert 대신 모달 사용
    setSelectedFoodId(foodId);
    setModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedFoodId) return;
    
    try {
      setLoading(true);
      setModalVisible(false); // 모달 닫기
      
      console.log(`[FoodList] 식재료 삭제 진행 중, ID: ${selectedFoodId}`);
      const response = await apiService.deleteFood(selectedFoodId);
      console.log('[FoodList] 식재료 삭제 응답:', response);
      
      // 삭제 성공 시 목록에서 제거
      if (response?.data?.success) {
        console.log('[FoodList] 식재료 삭제 성공');
        const updatedItems = foodItems.filter(item => item.id !== selectedFoodId);
        setFoodItems(updatedItems);
      } else {
        console.error('[FoodList] 식재료 삭제 실패:', response);
      }
    } catch (error) {
      console.error('[FoodList] 식재료 삭제 중 오류:', error);
    } finally {
      setLoading(false);
      setSelectedFoodId(null);
    }
  };

  const renderFoodItem = ({ item }) => (
    <View style={styles.foodItem}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        {item.quantity && (
          <Text style={styles.foodQuantity}>{item.quantity}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={[styles.deleteButton, loading && styles.disabledButton]}
        onPress={() => !loading && handleDeleteFood(item.id)}
        disabled={loading}
        activeOpacity={0.7} // 터치 피드백 개선
      >
        <View style={styles.deleteButtonInner}>
          <Icon name="delete" size={24} color={loading ? "#CCCCCC" : "#FF5252"} />
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>식재료 목록을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 식재료 목록</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFood')}
        >
          <Icon name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {foodItems.length > 0 ? (
        <FlatList
          data={foodItems}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="shopping-basket" size={80} color="#E0E0E0" />
          <Text style={styles.emptyText}>등록된 식재료가 없습니다.</Text>
          <TouchableOpacity
            style={styles.addFoodButton}
            onPress={() => navigation.navigate('AddFood')}
          >
            <Text style={styles.addFoodButtonText}>식재료 추가하기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 삭제 확인 모달 추가 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>식재료 삭제</Text>
            <Text style={styles.modalText}>정말 이 식재료를 삭제하시겠습니까?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  foodQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    width: 44,  // 터치 영역 확대
    height: 44, // 터치 영역 확대
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)', // 배경색 추가로 시각적 피드백 강화
  },
  disabledButton: {
    opacity: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  addFoodButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFoodButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default FoodList;