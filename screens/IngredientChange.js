import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
// import { API_BASE_URL } from '../config/api.config'; // API_BASE_URL은 현재 파일에서 사용되지 않음
import apiService from '../src/services/api.service';
import { useIsFocused } from '@react-navigation/native';
import { useUserIngredients } from '../src/context/UserIngredientsContext';
import { useAuth } from '../src/context/AuthContext';

// 문자열 형태의 양을 숫자로 변환하는 헬퍼 함수 (예: "1/2" -> 0.5, "30" -> 30)
const interpretIngredientAmount = (amountStr) => {
  if (amountStr === null || typeof amountStr === 'undefined') return 0;
  const str = String(amountStr).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1])) && Number(parts[1]) !== 0) {
      return Number(parts[0]) / Number(parts[1]);
    }
    return 0; // 잘못된 분수 형태
  }
  // 숫자가 아닌 문자(소수점 제외) 제거 후 숫으로 변환
  const num = parseFloat(str.replace(/[^\d.]/g, ''));
  return isNaN(num) ? 0 : num;
};

// 단위 정규화 함수 (RecipeDetail.js와 동일)
const normalizeUnit = (unit) => {
  const normalized = (unit || '').trim().toLowerCase();
  const unitMap = {
    'ea': 'ea', '개': 'ea', 'pcs': 'ea', 'piece': 'ea', 'pieces': 'ea',
    'g': 'g', '그램': 'g', 'gram': 'g', 'grams': 'g',
    'kg': 'kg', '킬로그램': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
    'ml': 'ml', '밀리리터': 'ml', 'milliliter': 'ml', 'milliliters': 'ml',
    'l': 'l', '리터': 'l', 'liter': 'l', 'liters': 'l',
    'tsp': 'tsp', '티스푼': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
    'tbsp': 'tbsp', '테이블스푼': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
    'cup': 'cup', '컵': 'cup', 'cups': 'cup',
  };
  return unitMap[normalized] || normalized;
};

const IngredientChange = ({ route, navigation }) => {
  const isFocused = useIsFocused();
  const { ingredients: recipeIngredients, userIngredientsRaw, recipeId } = route.params;
  const [userIngredients, setUserIngredients] = useState([]);
  const [changedIngredients, setChangedIngredients] = useState([]);

  useEffect(() => {
    console.log('IngredientChange: Received recipeIngredients:', JSON.stringify(recipeIngredients, null, 2));
    console.log('IngredientChange: Received userIngredientsRaw:', JSON.stringify(userIngredientsRaw, null, 2));
    console.log('IngredientChange: Received recipeId:', recipeId);

    if (userIngredientsRaw && Array.isArray(userIngredientsRaw)) {
      const processedUserIngredients = userIngredientsRaw.map(item => ({
        id: item.id, // Ensure id is included
        name: item.ingredientName, 
        quantity: item.quantity,
        // Add other necessary fields from userIngredientsRaw if they exist
      }));
      setUserIngredients(processedUserIngredients);
      console.log('IngredientChange: Processed userIngredients:', JSON.stringify(processedUserIngredients, null, 2));
    } else {
      console.log('IngredientChange: userIngredientsRaw is null, undefined, or not an array');
      setUserIngredients([]);
    }
  }, [recipeIngredients, userIngredientsRaw, recipeId]);

  // 화면에 아무것도 안 뜨는 경우: initialIngredients가 undefined/null/빈배열일 때 또는 필터링 후 빈 배열일 때 예외처리
  if (!Array.isArray(recipeIngredients) || recipeIngredients.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>변경할 식재료가 없습니다.</Text>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.confirmButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getMatchingUserIngredient = useCallback((recipeIngredientName) => {
    // console.log('IngredientChange: Searching for:', recipeIngredientName, 'in', JSON.stringify(userIngredients, null, 2));
    if (!userIngredients || userIngredients.length === 0) return null;
    const match = userIngredients.find(userIng => userIng.name.toLowerCase() === recipeIngredientName.toLowerCase());
    // console.log('IngredientChange: Match found:', match);
    return match;
  }, [userIngredients]);

  useEffect(() => {
    if (!recipeIngredients || !Array.isArray(recipeIngredients) || !userIngredients || userIngredients.length === 0) {
      console.log('IngredientChange: recipeIngredients or userIngredients are not ready for diffing.');
      setChangedIngredients([]);
      return;
    }

    console.log('IngredientChange: Starting ingredient diffing.');
    const changes = [];
    recipeIngredients.forEach(recipeIng => {
      const matchingUserIng = getMatchingUserIngredient(recipeIng.name);
      if (matchingUserIng) {
        const quantityChange = parseFloat(matchingUserIng.quantity) - parseFloat(recipeIng.quantity);
        console.log(`IngredientChange: Comparing ${recipeIng.name}: UserQ ${matchingUserIng.quantity}, RecipeQ ${recipeIng.quantity}, Change ${quantityChange}`);
        if (quantityChange !== 0) {
          changes.push({
            id: matchingUserIng.id, // Use the id from userIngredients for updates
            name: recipeIng.name,
            originalQuantity: parseFloat(matchingUserIng.quantity),
            consumedQuantity: parseFloat(recipeIng.quantity),
            remainingQuantity: quantityChange,
            unit: recipeIng.unit, // Assuming unit comes from recipe ingredient
          });
        }
      } else {
        // This case should ideally not happen if ingredients are consumed from existing ones
        // Or it means the user didn't have the ingredient at all.
        // For now, we are focusing on changes to existing ingredients.
        console.log(`IngredientChange: No matching user ingredient for ${recipeIng.name}`);
      }
    });
    console.log('IngredientChange: Calculated changes:', JSON.stringify(changes, null, 2));
    setChangedIngredients(changes.filter(c => c.remainingQuantity < 0 || c.consumedQuantity > 0)); // Filter for actual changes
  }, [recipeIngredients, userIngredients, getMatchingUserIngredient]);

  // 변화량 입력 핸들러 (텍스트 입력)
  const handleAmountChange = (id, textInputValue) => {
    setChangedIngredients((prevIngredients) =>
      prevIngredients.map((item) => {
        if (item.id === id) {
          let newDisplayValue = textInputValue;
          // 1. 숫자와 소수점 하나만 허용하도록 정제
          newDisplayValue = newDisplayValue.replace(/[^\d.]/g, ""); 
          const dotIndex = newDisplayValue.indexOf('.');
          if (dotIndex !== -1) {
            newDisplayValue = newDisplayValue.substring(0, dotIndex + 1) + newDisplayValue.substring(dotIndex + 1).replace(/\./g, '');
          }
          // 2. 비정상적인 선행 '0' 처리 (예: "05" -> "5", 단 "0." 또는 "0"은 유지)
          if (newDisplayValue.length > 1 && newDisplayValue.startsWith('0') && !newDisplayValue.startsWith('0.')) {
            newDisplayValue = newDisplayValue.substring(1);
          }
          // 사용자가 '.'으로 시작하는 입력을 하면 (예: ".5") 앞에 "0"을 붙여줌 ("0.5")
          if (newDisplayValue.startsWith('.')) {
            newDisplayValue = '0' + newDisplayValue;
          }
          return {
            ...item,
            displayChangeAmount: newDisplayValue,
            changeAmount: parseFloat(newDisplayValue) || 0,
          };
        }
        return item;
      })
    );
  };

  // 버튼으로 변화량 조절
  const handleChangeAmountWithButtons = (id, type) => {
    setChangedIngredients((prevIngredients) =>
      prevIngredients.map((item) => {
        if (item.id === id) {
          let newAmount = parseFloat(item.displayChangeAmount) || 0;
          if (type === 'increase') newAmount += 1;
          else if (type === 'decrease' && newAmount > 0) newAmount -= 1;
          return {
            ...item,
            displayChangeAmount: String(newAmount),
            changeAmount: newAmount,
          };
        }
        return item;
      })
    );
  };

  // 서버로 변화량 전송
  const handleSendChanges = async () => {
    setLoading(true);
    try {
      // 1. 변화량이 0인 식재료는 제외
      const ingredientsToUpdate = changedIngredients.filter(
        (ingredient) => ingredient.changeAmount > 0
      );

      if (ingredientsToUpdate.length === 0) {
        Alert.alert('변경사항 없음', '변경된 식재료가 없습니다.');
        setLoading(false);
        return;
      }      // 2. FIFO 로직에 따라 각 재료별로 userIngredientsRaw 차감
      // → 서버에 일괄 업데이트 API 사용 (updateFoodAmount)
      // 서버 API가 새로운 설정량을 요구하므로, 현재 보유량에서 차감량을 뺀 값을 전송
      let overConsume = false;
      const foodDataList = ingredientsToUpdate.flatMap((ingredient) => {
        const consumptionList = getFifoConsumptionList(ingredient, userIngredientsRaw);
        const totalRequested = Number(ingredient.changeAmount) || 0;
        const totalConsumable = consumptionList.reduce((sum, c) => sum + c.amount, 0);
        if (totalConsumable < totalRequested) {
          overConsume = true;
          Alert.alert(
            '차감 불가',
            `${ingredient.foodName}의 보유량보다 많은 양을 차감할 수 없습니다.`
          );
          return [];        }
        // unit 변환 적용 - API 전송용 원본 단위 사용
        const amountUnit = toAmountUnitEnum(ingredient.apiUnit || ingredient.unit);
        // 각 배치에서 차감 후 남은 양을 계산하여 서버에 전송
        return consumptionList.map(consumed => {
          // 원본에서 consumed.amount만큼 차감한 새로운 양 계산
          const originalBatch = userIngredientsRaw.find(batch => 
            (batch.foodId || batch.id) === consumed.foodId
          );
          const originalAmount = Number(originalBatch?.amount || originalBatch?.quantity || 0);
          const newAmount = Math.max(0, originalAmount - consumed.amount);
          
          return {
            foodId: consumed.foodId,
            amount: newAmount, // 차감 후 남은 양 (새로운 설정량)
            unit: amountUnit
          };
        });
      });

      if (overConsume) {
        setLoading(false);
        return;
      }

      if (foodDataList.length === 0) {
        Alert.alert('변경사항 없음', '차감할 식재료가 없습니다.');
        setLoading(false);
        return;
      }

      console.log('[IngredientChange] 최종 서버 전송 foodDataList:', JSON.stringify(foodDataList));
      console.log('[IngredientChange] userId:', userId);

      if (!userId) {
        console.log('[IngredientChange] user is missing or has no id:', user);
        Alert.alert('오류', '유저 정보가 없습니다. 다시 로그인해 주세요.');
        setLoading(false);
        return;
      }

      // 실제 서버 API 호출 (updateFoodAmount)
      let result;
      try {
        result = await apiService.updateFoodAmount(foodDataList);
        console.log('[IngredientChange] updateFoodAmount 응답:', result);
      } catch (apiError) {
        console.error('[IngredientChange] updateFoodAmount 예외:', apiError);
        if (apiError && apiError.response) {
          try {
            const text = await apiError.response.text();
            console.error('[IngredientChange] 서버 에러 응답 본문:', text);
          } catch (e) {
            console.error('[IngredientChange] 서버 에러 응답 파싱 실패:', e);
          }
        }
        Alert.alert('오류', 'API 호출 중 예외가 발생했습니다: ' + apiError.message);
        setLoading(false);
        return;
      }
      if (!result.success) {
        console.error('Error updating ingredients:', result);
        if (result && result.error) {
          console.error('[IngredientChange] 서버 에러 메시지:', result.error);
        }
        Alert.alert('오류', result.error || '식재료 업데이트에 실패했습니다.');
        setLoading(false);
        return;
      }      Alert.alert('성공', '식재료 변경이 완료되었습니다.', [
        { 
          text: '확인', 
          onPress: () => {
            // Recipe 스택을 초기화하여 RecipeSearch로 돌아가기
            navigation.reset({
              index: 0,
              routes: [{ name: 'RecipeSearch' }],
            });
          }
        },
      ]);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('오류', '예기치 않은 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (!changedIngredients || changedIngredients.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>변경할 식재료</Text>
        <Text>변경할 식재료가 없습니다. '요리 완료' 시 레시피에 사용된 식재료가 없었거나, 보유한 식재료와 일치하는 항목이 없었습니다.</Text>
        <Button title="돌아가기" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>식재료 변화량 설정</Text>
      <FlatList
        data={changedIngredients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <View style={styles.ingredientContainer}>
              <Text style={styles.ingredientName}>{item.name}</Text>
              <View style={styles.amountContainer}>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => handleChangeAmountWithButtons(item.id, 'decrease')}
                >
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.amountInput}
                  value={item.displayChangeAmount}
                  onChangeText={(text) => handleAmountChange(item.id, text)}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => handleChangeAmountWithButtons(item.id, 'increase')}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.ingredientUnit}>{item.unit}</Text>
            </View>
          );
        }}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleSendChanges}
        disabled={loading}
      >
        <Text style={styles.confirmButtonText}>
          {loading ? '저장 중...' : '변경 사항 저장'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#EEF1FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ingredientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    elevation: 2,
  },
  ingredientName: {
    flex: 2,
    fontSize: 18,
    fontWeight: '500',
    color: '#2D336B',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'center',
  },
  changeButton: {
    backgroundColor: '#D7DDF0',
    borderRadius: 8,
    padding: 6,
    marginHorizontal: 4,
  },
  buttonText: {
    fontSize: 18,
    color: '#2D336B',
    fontWeight: 'bold',
  },
  amountInput: {
    width: 50,
    height: 32,
    borderWidth: 1,
    borderColor: '#9A9FC3',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 4,
    backgroundColor: '#F5F6FA',
  },
  ingredientUnit: {
    flex: 1,
    fontSize: 16,
    color: '#525C99',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#2D336B',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default IngredientChange;