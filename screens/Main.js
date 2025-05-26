import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, SafeAreaView, Image, Modal
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SERVER_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setMergedUserIngredients } from '../src/utils/userIngredientsStore';
import { useUserIngredients } from '../src/context/UserIngredientsContext';
import { useIsFocused } from '@react-navigation/native';

const Main = ({ navigation }) => {
  const [foodNameList, setFoodNameList] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { setUserIngredientsRaw } = useUserIngredients();
  const isFocused = useIsFocused();

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  const fetchFoodList = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return;

      const response = await fetch(`${SERVER_URL}/food/ownlist`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      const data = await response.json();
      console.log('[Main] 서버에서 받은 식재료 원본 데이터:', data); // 추가된 로그
      
      // null/undefined 안전성 체크
      const ownFoodList = data?.ownFoodList || [];
      setUserIngredientsRaw(ownFoodList); // Context에 원본 저장
      
      if (ownFoodList.length === 0) {
        setFoodNameList([]);
        await AsyncStorage.setItem('num_of_items', '0');
        return;
      }

      const parsedItems = ownFoodList.map(item => ({
        id: item?.foodId || 0,
        name: item?.foodName || '알 수 없음',
        unit: item?.unit || '',
        imageUrl: item?.imgUrl || null,
        amount: item?.amount || 0,
      }));

      // 동일한 이름+단위의 식재료를 합산하여 하나로 묶기
      const mergedMap = {};
      ownFoodList.forEach(item => {
        if (!item || !item.foodName) return; // null/undefined 아이템 스킵
        
        const key = (item.foodName || '') + '|' + (item.unit || '');
        if (!mergedMap[key]) {
          mergedMap[key] = {
            id: item.foodId || 0, // 대표 id(첫번째)
            name: item.foodName || '알 수 없음',
            unit: item.unit || '',
            imageUrl: item.imgUrl || null,
            amount: 0,
          };
        }
        mergedMap[key].amount += Number(item.amount) || 0;      });
      const mergedItems = Object.values(mergedMap).filter(item => item.amount > 0); // 양이 0인 식재료 제거
      setFoodNameList(mergedItems);
      await AsyncStorage.setItem('num_of_items', mergedItems.length.toString());
    } catch (error) {
      console.error('Food List 요청 실패:', error);
    }
  };
  // 이름+단위별 합산 함수 (RecipeDetail.js와 동일)
  function mergeUserIngredients(ingredientList) {
    if (!Array.isArray(ingredientList) || ingredientList.length === 0) {
      return [];
    }
    
    const merged = {};
    for (const item of ingredientList) {
      if (!item || !item.name) continue; // null/undefined 아이템 스킵
      
      const normName = (item.name || '').replace(/\s/g, '').toLowerCase();
      const normUnit = (item.unit || '').replace(/\s/g, '').toLowerCase();
      const key = `${normName}__${normUnit}`;
      if (!merged[key]) {
        merged[key] = {
          name: normName,
          unit: normUnit,
          quantity: 0,
        };
      }
      merged[key].quantity += Number(item.amount || 0);
    }
    return Object.values(merged);
  }
  useEffect(() => {
    fetchFoodList();
  }, []);

  // 화면이 포커스될 때마다 식재료 리스트 새로고침 (양이 0인 항목 자동 제거)
  useEffect(() => {
    if (isFocused) {
      fetchFoodList();
    }
  }, [isFocused]);
  // Main화면 진입 시마다 합산 리스트 로그 출력
  useEffect(() => {
    if (Array.isArray(foodNameList) && foodNameList.length > 0) {
      const merged = mergeUserIngredients(foodNameList);
      setMergedUserIngredients(merged); // 전역 저장
      console.log('[Main] 사용자 식재료 합산 리스트:', merged);
    } else {
      // 빈 배열이거나 null인 경우에도 빈 배열로 초기화
      setMergedUserIngredients([]);
      console.log('[Main] 사용자 식재료 합산 리스트: 빈 배열로 초기화');
    }
  }, [foodNameList]);

  const handleDelete = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${SERVER_URL}/food`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'accept': '*/*',
        },
        body: JSON.stringify({
          foodIdList: [itemToDelete.id]
        }),
      });

      if (!response.ok) throw new Error('삭제 실패');

      setFoodNameList(prev => prev.filter(item => item.id !== itemToDelete.id));
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('삭제 중 오류 발생:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFoodList().finally(() => setRefreshing(false));
  };
  const handleRecipeDetail = (recipe) => {
    // foodNameList가 null/undefined일 때 안전 처리
    const safeIngredientList = Array.isArray(foodNameList) ? foodNameList : [];
    navigation.navigate('RecipeDetail', {
      recipe,
      mergedUserIngredients: mergeUserIngredients(safeIngredientList),
    });
  };

  const unitMap = {
    KG: 'kg',
    G: 'g',
    MG: 'mg',
    ML: 'ml',
    L: 'L',
    EA: '개',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#2D336B", "#A9B5DF"]} style={styles.background} />
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 50, paddingTop: 9 }}>
        <Text style={styles.title}>식재료 목록</Text>
        <View style={styles.icon}>
          <TouchableOpacity style={styles.badge_button} onPress={() => navigation.navigate('AddIngredient')}>
            <Icon name='add' size={40} color='#fff' />
          </TouchableOpacity>
          <TouchableOpacity style={styles.badge_button} onPress={toggleEditMode}>
            {isEditMode ? <Text style={{ color: '#fff', fontSize: 17 }}>완료</Text> : <Icon name='edit' size={30} color='#fff' />}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.box}>
        <FlatList
          data={Array.isArray(foodNameList) ? foodNameList : []}
          keyExtractor={(item, index) => item?.id?.toString?.() ?? index.toString()}
          showsVerticalScrollIndicator={false}
          numColumns={3}
          renderItem={({ item }) => {
            // item null 체크
            if (!item) return null;
            
            return (
              <View style={styles.gridItem}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text>이미지 없음</Text>
                  </View>
                )}
                <Text style={styles.name}>{item.name || '알 수 없음'}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={styles.category}>{item.amount || 0}</Text>
                  <Text style={styles.category}>{unitMap[item.unit] || item.unit || ''}</Text>
                </View>
                {isEditMode && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      setItemToDelete(item);
                      setDeleteModalVisible(true);
                    }}>
                    <Icon name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>

      {/* 삭제 확인 모달 */}
      {deleteModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>정말 삭제하시겠습니까?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.addButton]} onPress={handleDelete}>
                <Text style={styles.buttonText1}>삭제</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.buttonText2}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#186FF2",
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    paddingLeft: 15,
  },
  icon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingRight: 20,
  },
  doneText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  badge_button: {
    marginLeft: 5,
  },
  box: {
    flex: 11,
    backgroundColor: '#ffffff',
    padding: 10,
    margin: 10,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    marginBottom: -15,
  },
  gridItem: {
    width: '33%',
    padding: 8,
    position: 'relative',
  },
  photo: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    borderColor: '#A9B5DF',
    borderWidth: 1,
  },
  photoPlaceholder: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
    marginTop: 5,
  },
  category: {
    color: '#7886C7',
    marginLeft: 3,
    fontSize: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 15,
  },
  button: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  addButton: {
    backgroundColor: '#333f50',
  },
  cancelButton: {
    backgroundColor: '#ccc',
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
