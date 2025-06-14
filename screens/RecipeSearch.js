import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { SERVER_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useUserIngredients } from '../src/context/UserIngredientsContext';

// ValueOption enum - 서버 API와 동일한 값 사용
const ValueOption = {
  HIGH: 'HIGH',
  LOW: 'LOW',
  NONE: 'NONE'
};

// RecipeSearch 컴포넌트: 조건과 재료를 입력하여 레시피를 검색하는 화면을 제공
const RecipeSearch = ({ navigation }) => {
  // 영양소 조건 상태 관리
  const [conditions, setConditions] = useState({
    carbohydrate: ValueOption.NONE, // 탄수화물
    protien: ValueOption.NONE,     // 단백질
    fat: ValueOption.NONE,         // 지방
    calorie: ValueOption.NONE      // 칼로리
  });

  const [ingredients, setIngredients] = useState([]); // 재료 목록 상태 관리
  const [foodNameState, setFoodName] = useState('');
  const { userIngredientsRaw } = useUserIngredients();
  const [modalVisible, setModalVisible] = useState(false);

  // 조건 토글 함수 - 순환 형태(NONE -> HIGH -> LOW -> NONE)로 변경
  const toggleCondition = (key) => {
    setConditions((prev) => {
      const currentValue = prev[key];
      let nextValue;

      // 값을 순환시킴: NONE -> HIGH -> LOW -> NONE
      if (currentValue === ValueOption.NONE) {
        nextValue = ValueOption.HIGH;
      } else if (currentValue === ValueOption.HIGH) {
        nextValue = ValueOption.LOW;
      } else {
        nextValue = ValueOption.NONE;
      }

      return { ...prev, [key]: nextValue };
    });
  };

  // 값 옵션에 따른 UI 표시 텍스트
  const getOptionText = (option) => {
    switch (option) {
      case ValueOption.HIGH: return '높음';
      case ValueOption.LOW: return '낮음';
      case ValueOption.NONE: return '상관없음';
      default: return '상관없음';
    }
  };

  // 값 옵션에 따른 UI 표시 색상
  const getOptionColor = (option) => {
    switch (option) {
      case ValueOption.HIGH: return '#e74c3c';
      case ValueOption.LOW: return '#3498db';
      case ValueOption.NONE: return '#888';
      default: return '#888';
    }
  };

  const searchRecipes = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');

      const requestBody = {
        foodName: foodNameState,
        calorie: conditions.calorie,
        fat: conditions.fat,
        natrium: "NONE",
        protien: conditions.protien,
        carbohydrate: conditions.carbohydrate
      };

      console.log('서버에 보낼 데이터:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${SERVER_URL}/recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('레시피 전송 실패');
      }

      const result = await response.json();
      console.log('레시피 전송 성공:', result);

      navigation.navigate('RecipeResult', {
        recipes: result.recipeList,
        conditions: conditions,
        ingredients: foodNameState
      });

    } catch (err) {
      console.error('레시피 전송 중 오류 발생:', err);
    }
  };

  const conditionLabels = ['탄수화물', '단백질', '지방', '칼로리'];
  const conditionKeys = ['carbohydrate', 'protien', 'fat', 'calorie'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#2D336B", "#A9B5DF"]}
        style={styles.background}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 50, paddingTop: 8 }}>
        <Text style={styles.title}>레시피 검색</Text>
      </View>
      <ScrollView>
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>영양성분 기준</Text>
          {conditionKeys.map((key, index) => (
            <View
              key={index}
              style={[
                styles.conditionItem,
                index !== conditionKeys.length - 1 && styles.withSeparator
              ]}
            >
              <Text style={styles.conditionText}>{conditionLabels[index]}</Text>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: getOptionColor(conditions[key]) }]}
                onPress={() => toggleCondition(key)}
              >
                <Text style={styles.optionButtonText}>{getOptionText(conditions[key])}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.box}>
          <Text style={styles.sectionTitle}>사용할 재료</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="재료를 입력하세요"
              placeholderTextColor="#7886C7"
              value={foodNameState}
              onChangeText={setFoodName}
            />
            {/*
            <TouchableOpacity
              style={styles.ingredientListButton}
              onPress={() => setModalVisible(true)}
            >
              <Icon name="list" size={28} color="#2D336B" />
            </TouchableOpacity>
            */}
          </View>
          <TouchableOpacity
            style={styles.btnArea}
            onPress={() => searchRecipes(ingredients[0])}
          >
            <Text style={styles.searchButtonText}>레시피 검색</Text>
          </TouchableOpacity>
        </View>
        {/* 식재료 리스트 모달 */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>내 식재료 목록</Text>
              <FlatList
                data={userIngredientsRaw}
                keyExtractor={(item, idx) => item.foodName ? item.foodName + idx : String(idx)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setFoodName(item.foodName);
                      setModalVisible(false);
                    }}
                  >
                    <View style={styles.modalItemRow}>
                      <Text style={styles.modalItemText}>{item.foodName}</Text>
                      {item.amount !== undefined && item.unit ? (
                        <Text style={styles.modalItemSub}>{`  (${item.amount} ${/^[A-Za-z]+$/.test(item.unit) ? item.unit.toLowerCase() : item.unit})`}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.modalEmpty}>보유 식재료가 없습니다.</Text>}
              />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  box: {
    backgroundColor: '#EEF1FA',
    padding: 15,
    margin: 10,
    borderRadius: 20,
    marginBottom: 13,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  header: {
    height: 40,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    paddingLeft: 15,
  },
  sectionBox: {
    backgroundColor: '#EEF1FA',
    padding: 15,
    margin: 10,
    borderRadius: 20,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D336B',
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  conditionText: {
    fontSize: 18,
    color: '#2D336B',
  },
  withSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: '#A9B5DF',
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  ingredientText: {
    fontSize: 18,
    color: '#2D336B',
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  deleteButton: {
    fontSize: 16,
    color: '#e74c3c',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // 입력창과 버튼 하단 기준 정렬
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#7886C7',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    fontSize: 18,
    backgroundColor: '#fff',
    height: 45, // 버튼과 동일한 높이로 고정
  },
  ingredientListButton: {
    marginLeft: 8,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
    width: 45,
    borderWidth: 1,
    borderColor: '#A9B5DF',
    // 그림자 제거
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.08,
    // shadowRadius: 2,
    // elevation: 2,
  },
  addButton: {
    height: 45,
    width: 45,
    backgroundColor: '#2D336B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 30,
  },
  btnArea: {
    backgroundColor: '#2D336B',
    height: 50,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  // 모달 관련 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D336B',
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1FA',
    width: '100%',
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 18,
    color: '#2D336B',
  },
  modalItemSub: {
    fontSize: 15,
    color: '#888',
    marginLeft: 4,
  },
  modalEmpty: {
    color: '#888',
    fontSize: 16,
    marginVertical: 20,
    textAlign: 'center',
  },
  modalCloseBtn: {
    marginTop: 18,
    backgroundColor: '#2D336B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecipeSearch;