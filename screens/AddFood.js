import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Keyboard
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../src/context/AuthContext';
import apiService from '../src/services/api.service';
import UnitPicker from './UnitPicker';
import { useFocusEffect } from '@react-navigation/native';

const AddFood = ({ navigation }) => {
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(null); // UnitPicker에 맞게 null 초기화
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // 자동완성 관련 상태
  const [userFoods, setUserFoods] = useState([]); // 내 식재료명+단위 목록
  const [showAuto, setShowAuto] = useState(false);
  const [filteredFoods, setFilteredFoods] = useState([]);

  useEffect(() => {
    // 내 식재료명+단위 목록 불러오기 (최초 1회)
    const fetchFoods = async () => {
      try {
        const data = await apiService.getIngredients();
        console.log('[AddFood][fetchFoods] API 응답:', data); // 원본 응답 로그
        let foodArray = [];
        if (Array.isArray(data.data)) {
          foodArray = data.data;
        } else if (Array.isArray(data.foodList)) {
          foodArray = data.foodList;
        } else if (Array.isArray(data.ownFoodNameList)) {
          foodArray = data.ownFoodNameList.map((name, idx) => ({ name, unit: '' }));
        } else if (Array.isArray(data)) {
          foodArray = data;
        } else if (data && typeof data === 'object') {
          const arrField = Object.values(data).find(v => Array.isArray(v));
          if (arrField) foodArray = arrField;
        }
        // [{ name, unit }] 형태로 변환
        const foods = foodArray.map(item => ({
          name: extractPureName(item.foodName || item.name || ''),
          unit: item.unit || ''
        })).filter(f => f.name);
        console.log('[AddFood][fetchFoods] userFoods:', foods); // 파싱 후 배열 로그
        // 중복 제거 (name 기준)
        const uniqueFoods = foods.filter((f, idx, arr) => arr.findIndex(x => x.name === f.name) === idx);
        setUserFoods(uniqueFoods);
      } catch (e) {
        setUserFoods([]);
      }
    };
    fetchFoods();
  }, []);

  // 식재료명 입력 시 자동완성 후보 필터링
  useEffect(() => {
    if (foodName.trim().length === 0) {
      setFilteredFoods([]);
      setShowAuto(false);
      return;
    }
    const keyword = foodName.trim();
    const filtered = userFoods.filter(f => f.name.includes(keyword));
    setFilteredFoods(filtered.map(f => f.name));
    setShowAuto(filtered.length > 0);
  }, [foodName, userFoods]);

  useEffect(() => {
    console.log('[AddFood][useEffect] foodName:', foodName, 'unit:', unit);
  }, [foodName, unit]);

  useEffect(() => {
    console.log('[AddFood][useEffect] userFoods:', userFoods);
  }, [userFoods]);

  const getUserId = () => {
    if (!user) return null;
    if (user.id) return user.id; // PK 우선
    if (user.user_id) return user.user_id;
    if (user.user && user.user.user_id) return user.user.user_id;
    return null;
  };

  // 식재료명에서 단위/수량/괄호 등 제거 (예: "오렌지 100g(1/2개)" → "오렌지")
  const extractPureName = (name) => name.replace(/\s*\d+[a-zA-Z가-힣()\/\.]*|\([^)]*\)/g, '').trim();

  const handleAddFood = async () => {
    console.log('[AddFood] user:', user);
    // access_token이 있으면 항상 등록
    if (user && user.access_token) {
      apiService.setToken(user.access_token);
      console.log('[AddFood] access_token set:', user.access_token);
    }
    const userId = getUserId();
    if (!foodName.trim()) {
      Alert.alert('입력 오류', '식재료 이름을 입력해주세요.');
      return;
    }
    if (!quantity.trim()) {
      Alert.alert('입력 오류', '수량을 입력해주세요.');
      return;
    }
    if (isNaN(Number(quantity.trim()))) {
      Alert.alert('입력 오류', '수량은 숫자만 입력 가능합니다.');
      return;
    }
    if (!unit || !unit.trim()) {
      Alert.alert('입력 오류', '단위를 선택하거나 입력해주세요.');
      return;
    }
    if (!userId) {
      Alert.alert('로그인 필요', '식재료 추가는 로그인 후 이용 가능합니다.');
      return;
    }
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      Alert.alert('유저 정보 오류', '유저 ID가 올바르지 않습니다. 다시 로그인해 주세요.');
      return;
    }
    setIsLoading(true);
    try {
      const foodData = {
        foodNameList: [extractPureName(foodName.trim())],
        quantityList: [quantity.trim()],
        unitList: [unit.trim()]
      };
      // headers 확인용 로그
      const headers = apiService._getCommonHeaders();
      console.log('[AddFood] 식재료 추가 요청:', JSON.stringify(foodData));
      console.log('[AddFood] 요청 헤더:', headers);
      const response = await apiService.addFood(numericUserId, foodData);
      console.log('[AddFood] 응답:', JSON.stringify(response));
      if (response.success) {
        Alert.alert(
          '추가 성공',
          '식재료가 성공적으로 추가되었습니다.',
          [{ 
            text: '확인', 
            onPress: () => {
              navigation.navigate('FoodList', { 
                refresh: true, 
                timestamp: Date.now()
              });
            }
          }]
        );
      } else {
        throw new Error(response.error || '식재료 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('[AddFood] 오류:', error);
      let errorMessage = '식재료 추가 중 오류가 발생했습니다.';
      if (error.message) {
        if (error.message.includes('405')) {
          errorMessage = '서버에서 요청을 처리할 수 없습니다. (메소드 허용되지 않음)';
        } else if (error.message.includes('400')) {
          errorMessage = '잘못된 요청입니다. 입력 데이터를 확인해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      Alert.alert('오류 발생', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 자동완성 선택 시 단위까지 자동 입력
  const handleAutoSelect = (selectedName) => {
    console.log('[AddFood][handleAutoSelect] 선택된 식재료명:', selectedName);
    setFoodName(selectedName);
    const found = userFoods.find(f => f.name === selectedName);
    console.log('[AddFood][handleAutoSelect] userFoods에서 찾은 객체:', found);
    if (found && found.unit) {
      console.log('[AddFood][handleAutoSelect] setUnit 호출, 단위:', found.unit);
      setUnit(found.unit);
    } else {
      console.log('[AddFood][handleAutoSelect] setUnit 호출, 단위 없음(null)');
      setUnit('');
    }
    setShowAuto(false);
    Keyboard.dismiss();
  };

  // 뒤로가기(헤더/하드웨어) 시 항상 FoodList로 replace
  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        navigation.replace('FoodList');
        return true; // 기본 동작 막기
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
        navigation.replace('FoodList');
      });
      return () => unsubscribe();
    }, [navigation])
  );

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        {/* screens_m/AddIngredient와 동일하게 순서 및 UI 구성 */}
        <Text style={styles.label}>재료명</Text>
        <View>
          <TextInput
            style={styles.input}
            placeholder="예: 감자, 양파, 당근 등"
            value={foodName}
            onChangeText={setFoodName}
            onFocus={() => setShowAuto(filteredFoods.length > 0)}
            onBlur={() => setTimeout(() => setShowAuto(false), 150)}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {showAuto && filteredFoods.length > 0 && (
            <View style={styles.autoDropdown}>
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={filteredFoods}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.autoItem}
                    onPress={() => handleAutoSelect(item)}
                  >
                    <Text style={styles.autoItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 150 }}
              />
            </View>
          )}
        </View>
        <Text style={styles.label}>양</Text>
        <TextInput
          style={styles.input}
          placeholder="숫자를 입력하세요"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        <Text style={styles.label}>단위</Text>
        <UnitPicker onSelect={setUnit} value={unit} />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddFood}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Icon name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>식재료 추가</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {/* TIP 메시지 영역 완전 제거 */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // 연한 초록 계열 배경
  },
  formContainer: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#3498db',
  },
  input: {
    backgroundColor: '#f9fdf9',
    borderWidth: 1,
    borderColor: '#3498db', 
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 6,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  infoContainer: {
    padding: 16,
    margin: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3498db', // 약간 어두운 초록
  },
  infoText: {
    fontSize: 14,
    color: '#3498db',
    lineHeight: 20,
  },
  autoDropdown: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 10,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autoItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  autoItemText: {
    fontSize: 16,
    color: '#3498db',
  },
});

export default AddFood;
