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
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../src/context/AuthContext';
import apiService from '../src/services/api.service';
import apiConfig from '../config/api.config'; // apiConfig 추가
import { useFocusEffect } from '@react-navigation/native';

const FoodList = ({ navigation, route }) => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  // 컴포넌트 마운트 상태를 추적하는 ref 추가
  const isMountedRef = useRef(true);
  
  // 모달 상태 관리 추가
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFoodName, setSelectedFoodName] = useState(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 ref를 true로 설정
    isMountedRef.current = true;
    
    // 초기 로드
    loadFoodItems();
    
    // 화면으로 돌아올 때 데이터 로드
    const unsubscribe = navigation.addListener('focus', () => {
      // route 파라미터 확인 - route가 undefined일 수 있으므로 옵셔널 체이닝 사용
      const refreshParam = route?.params?.refresh;
      const timestamp = route?.params?.timestamp || Date.now();
      const newItem = route?.params?.newItem;
      
      console.log(`[FoodList] 화면 포커스, 갱신 파라미터:`, { refreshParam, timestamp, newItem });
      
      if (newItem) {
        // 새 아이템이 있으면 현재 목록에 추가하여 즉시 UI에 반영
        console.log('[FoodList] 새 식재료 항목 수신:', newItem);
        setFoodItems(prev => {
          // 중복 방지 (동일 ID가 있으면 교체)
          const exist = prev.some(item => item.id === newItem.id);
          if (exist) {
            return prev.map(item => item.id === newItem.id ? newItem : item);
          } else {
            return [newItem, ...prev];
          }
        });
      }
      
      // 항상 데이터를 새로 로드하도록 변경 (캐시 문제 방지)
      loadFoodItems();
      
      // 파라미터 초기화 (연속 네비게이션에서 중복 로드 방지)
      navigation.setParams({ refresh: undefined, timestamp: undefined, newItem: undefined });
    });
    
    // 컴포넌트 언마운트 시 ref를 false로 설정
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [navigation, route]);

  // 식재료명에서 단위/수량/괄호 등 제거 (예: "오렌지 100g(1/2개)" → "오렌지")
  const extractPureName = (name) => name.replace(/\s*\d+[a-zA-Z가-힣()\/\.]*|\([^)]*\)/g, '').trim();

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      // userId는 더 이상 필요 없음, JWT 기반 인증만 사용
      console.log('[FoodList] 식재료 목록 로드 시작 (JWT 기반 인증)');
      
      // apiService.getIngredients() 사용 권장 (공통화)
      // const url = `${apiConfig.getApiUrl()}/food/ownlist`;
      // const response = await fetch(url, { ... });
      const data = await apiService.getIngredients();
      console.log('[FoodList] 서버 응답 데이터:', data);

      // 서버 응답이 foodList 필드로 객체 배열을 반환하도록 파싱
      let foodArray = [];
      if (Array.isArray(data.foodList)) {
        foodArray = data.foodList;
      } else if (Array.isArray(data.ownFoodNameList)) {
        // (이전 호환) 문자열 배열일 경우 임시 객체로 변환
        foodArray = data.ownFoodNameList.map((name, idx) => ({
          id: idx,
          foodName: name,
          quantity: '',
        }));
      } else if (Array.isArray(data)) {
        foodArray = data;
      } else if (data && typeof data === 'object') {
        // 혹시 모를 다른 배열 필드가 있을 경우
        const arrField = Object.values(data).find(v => Array.isArray(v));
        if (arrField) foodArray = arrField;
      }

      if (!foodArray || !Array.isArray(foodArray)) {
        foodArray = [];
      }

      // 서버에서 반환된 실제 ID를 사용하여 각 항목 정규화
      const normalizedData = foodArray.map(item => ({
        id: item.id, // 서버에서 반환한 실제 ID 사용
        name: extractPureName(item.foodName || '이름 없음'), // 순수 식재료명만 사용
        quantity: item.quantity || '',
        unit: item.unit || '',
        expiryDate: item.expiryDate || '',
        category: item.category || '기타'
      }));

      console.log('[FoodList] 정규화된 식재료 목록:', normalizedData);
      
      if (isMountedRef.current) {
        setFoodItems(normalizedData);
      }
    } catch (error) {
      console.error('[FoodList] 데이터 로드 오류:', error);
      Alert.alert('오류', '식재료 목록을 불러오는 데 실패했습니다.');
      // 오류 발생 시 빈 배열 설정하여 UI 초기화
      setFoodItems([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFoodItems();
  };

  const handleDeleteFood = (foodName) => {
    setSelectedFoodName(foodName);
    setModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedFoodName) return;
    
    try {
      setLoading(true);
      setModalVisible(false); // 모달 닫기
      
      console.log(`[FoodList] 식재료 삭제 진행 중, Name: ${selectedFoodName}`);
      const response = await apiService.deleteFood(user.id, selectedFoodName);
      console.log('[FoodList] 식재료 삭제 응답:', response);
      
      // 삭제 성공 시 목록에서 제거
      if (response?.success) {
        console.log('[FoodList] 식재료 삭제 성공');
        const updatedItems = foodItems.filter(item => item.name !== selectedFoodName);
        setFoodItems(updatedItems);
      } else {
        console.error('[FoodList] 식재료 삭제 실패:', response);
      }
    } catch (error) {
      console.error('[FoodList] 식재료 삭제 중 오류:', error);
    } finally {
      setLoading(false);
      setSelectedFoodName(null);
    }
  };

  // Toss 스타일: 식재료 카드 렌더링
  const renderFoodItem = ({ item }) => (
    <View style={styles.foodItem}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        {(item.quantity || item.unit) && (
          <Text style={styles.foodQuantity}>
            {item.quantity}
            {item.unit ? ` ${item.unit}` : ''}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.deleteButton, loading && styles.disabledButton]}
        onPress={() => !loading && handleDeleteFood(item.name)}
        disabled={loading}
        activeOpacity={0.7}
      >
        <View style={styles.deleteButtonInner}>
          <Icon name="delete" size={22} color={loading ? "#CCCCCC" : "#FFA07A"} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // 뒤로가기(헤더/하드웨어) 시 항상 Main으로 replace
  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        navigation.replace('Main');
        return true;
      };
      navigation.setOptions({
        headerLeft: () => (
          <TouchableOpacity onPress={onBack} style={{ paddingHorizontal: 16 }}>
            <Icon name="arrow-back" size={24} color="#3498db" />
          </TouchableOpacity>
        )
      });
      // 무한루프 방지: beforeRemove에서 replace 호출 전 리스너 해제
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        e.preventDefault();
        unsubscribe();
        navigation.replace('Main');
      });
      return () => unsubscribe();
    }, [navigation])
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
      {/* Toss 스타일: 식재료 리스트 */}
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
              colors={["#50C4B7"]}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="shopping-basket" size={72} color="#F6F8FA" />
          <Text style={styles.emptyText}>등록된 식재료가 없습니다.</Text>
          <TouchableOpacity
            style={styles.addFoodButton}
            onPress={() => navigation.navigate('AddFood')}
            activeOpacity={0.8}
          >
            <Text style={styles.addFoodButtonText}>식재료 추가하기</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* 플로팅 추가 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddFood')}
        activeOpacity={0.85}
      >
        <Icon name="add" size={30} color="#FFF" />
      </TouchableOpacity>
      {/* 삭제 확인 모달 */}
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
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={confirmDelete}
                activeOpacity={0.8}
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
    backgroundColor: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F8FA',
    borderRadius: 20,
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 17,
    color: '#1E1E1E',
    fontWeight: '400',
    fontFamily: 'Pretendard-Regular',
    marginBottom: 2,
  },
  foodQuantity: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '400',
    fontFamily: 'Pretendard-Regular',
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
  deleteButtonInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,160,122,0.12)', // soft warm accent
  },
  disabledButton: {
    opacity: 0.4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#8E8E93',
    fontFamily: 'Pretendard-Regular',
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 18,
    marginBottom: 28,
    fontFamily: 'Pretendard-Regular',
    fontWeight: '400',
  },
  addFoodButton: {
    backgroundColor: '#50C4B7',
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 18,
    marginTop: 8,
    shadowColor: '#50C4B7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  addFoodButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
  },
  fab: {
    position: 'absolute',
    right: 28,
    bottom: 36,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#50C4B7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#50C4B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,30,30,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '82%',
    backgroundColor: '#F6F8FA',
    borderRadius: 22,
    padding: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 10,
    fontFamily: 'Pretendard-SemiBold',
  },
  modalText: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 22,
    fontFamily: 'Pretendard-Regular',
    fontWeight: '400',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 14,
    marginLeft: 8,
    backgroundColor: '#E5E8EB',
  },
  cancelButton: {
    backgroundColor: '#E5E8EB',
  },
  cancelButtonText: {
    color: '#1E1E1E',
    fontWeight: '500',
    fontFamily: 'Pretendard-Regular',
  },
  deleteModalButton: {
    backgroundColor: '#FFA07A',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Pretendard-SemiBold',
  },
});

export default FoodList;