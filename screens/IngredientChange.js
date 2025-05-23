import React, { useState, useEffect } from 'react';
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
  const num = parseFloat(str.replace(/[^\\d.]/g, ''));
  return isNaN(num) ? 0 : num;
};

const IngredientChange = ({ route, navigation }) => {
  const isFocused = useIsFocused();
  // const { ingredients: initialIngredients, userId } = route.params || {};
  const { ingredients: initialIngredients } = route.params || {};
  const { userIngredientsRaw } = useUserIngredients();
  const { user } = useAuth();
  const userId = user?.id || user?.user_id || user?.userId;

  useEffect(() => {
    console.log('[IngredientChange] user:', user);
    console.log('[IngredientChange] userId:', userId);
  }, [user]);

  // useEffect를 사용하여 initialIngredients 로깅
  useEffect(() => {
    console.log('[IngredientChange] Received initialIngredients from route.params:', JSON.stringify(initialIngredients, null, 2));
    if (initialIngredients === undefined) {
      console.warn('[IngredientChange] initialIngredients is undefined. Check navigation parameters.');
    } else if (!Array.isArray(initialIngredients)) {
      console.warn('[IngredientChange] initialIngredients is not an array:', initialIngredients);
    } else if (initialIngredients.length === 0) {
      console.warn('[IngredientChange] initialIngredients is an empty array.');
    }
  }, [initialIngredients]);

  const [ingredients, setIngredients] = useState(
    Array.isArray(initialIngredients) && initialIngredients.length > 0
      ? initialIngredients
          .filter(item => {
            const hasAmount = item.amount !== null && typeof item.amount !== 'undefined';
            const hasUnit = item.unit && String(item.unit).trim() !== '';
            if (!(hasAmount || hasUnit)) {
              console.log('[IngredientChange] Filtering out item due to missing amount/unit:', JSON.stringify(item, null, 2));
            }
            return hasAmount || hasUnit;
          })
          .map((item) => {
            const numericAmount = interpretIngredientAmount(item.amount);
            return {
              ...item,
              changeAmount: numericAmount,
              displayChangeAmount: String(numericAmount),
              id: item.id || item.foodName || Math.random().toString(),
              displayUnit: item.unit ? String(item.unit) : '',
              // 레시피 필요량/단위 원본도 별도 보존
              recipeAmount: item.amount,
              recipeUnit: item.unit,
            };
          })
      : []
  );
  const [loading, setLoading] = useState(false);

  // 화면에 아무것도 안 뜨는 경우: initialIngredients가 undefined/null/빈배열일 때 또는 필터링 후 빈 배열일 때 예외처리
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
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

  // 변화량 입력 핸들러 (텍스트 입력)
  const handleAmountChange = (id, textInputValue) => {
    setIngredients((prevIngredients) =>
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

          // 3. 숫자 값 결정
          let numericValue = 0;
          if (newDisplayValue !== "" && newDisplayValue !== ".") { // 빈 문자열이나 "."만 있는 경우는 0으로 처리
            const parsed = parseFloat(newDisplayValue);
            if (!isNaN(parsed) && parsed >= 0) {
              numericValue = parsed;
            } else {
              // newDisplayValue가 "5." 같은 경우, parseFloat는 5를 반환. 이 경우는 위에서 처리됨.
              // 만약 newDisplayValue가 파싱 불가능한 문자열(거의 없을 것으로 예상)이면 numericValue는 0 유지
            }
          }
          
          return {
            ...item,
            displayChangeAmount: newDisplayValue, // 정제된 문자열을 화면에 표시
            changeAmount: numericValue,           // 실제 숫자 값
          };
        }
        return item;
      })
    );
  };

  // +/- 버튼으로 변화량 조절 핸들러
  const handleChangeAmountWithButtons = (id, operation) => {
    setIngredients((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const currentNumericAmount = Number(item.changeAmount) || 0;
          let step = 1; // 기본 스텝
          const unit = String(item.unit || item.amountUnit || '').toLowerCase();
          
          // 단위에 따른 스텝 설정
          // 이산형 단위 목록 (사용자 정의 가능)
          const discreteUnits = ['개', '장', '쪽', '줄기', '포기', '송이', '톨', '마리', '조각', '캔', '봉지', '병', '팩', '단', '뿌리', '컵', '술', '줌', '알'];
          // 연속형 단위 키워드
          const continuousKeywords = ['g', 'ml', 'kg', 'l', '그램', '미리', '키로', '리터', 'cc'];

          // 단위 문자열에 이산형 단위가 포함되어 있는지 확인
          const isDiscrete = discreteUnits.some(du => unit.includes(du));
          // 단위 문자열에 연속형 단위 키워드가 포함되어 있는지 확인
          const isContinuous = continuousKeywords.some(ck => unit.includes(ck));

          if (isContinuous && !isDiscrete) { // 명확히 연속형으로 판단될 때
            step = 10;
          } else if (isDiscrete) { // 명확히 이산형으로 판단될 때
            step = 1;
          }
          // 그 외 (단위가 없거나 애매한 경우) 기본 step = 1 사용

          let newNumericAmount;
          if (operation === 'increase') {
            newNumericAmount = currentNumericAmount + step;
          } else { // decrease
            newNumericAmount = currentNumericAmount - step;
          }
          newNumericAmount = Math.max(0, newNumericAmount); // 0 미만 방지

          return {
            ...item, 
            changeAmount: newNumericAmount,
            displayChangeAmount: String(newNumericAmount), // 버튼 조작 시 display도 업데이트
          };
        }
        return item;
      })
    );
  };

  // FIFO 소진 로직: 한 재료(ingredient)에 대해 userIngredientsRaw에서 오래된 foodId부터 차감
  function getFifoConsumptionList(ingredient, userIngredientsRaw) {
    if (!userIngredientsRaw) return [];
    const norm = v => (v || '').replace(/\s/g, '').toLowerCase();
    // 단위 표준화: g, kg, ml, l 등 대문자/소문자/한글 모두 소문자 영문으로 통일
    const unitMap = {
      'g': 'g', '그램': 'g', 'G': 'g',
      'kg': 'kg', '킬로그램': 'kg', 'KG': 'kg',
      'ml': 'ml', '밀리리터': 'ml', 'ML': 'ml',
      'l': 'l', '리터': 'l', 'L': 'l',
    };
    const normUnit = u => unitMap[norm(u)] || norm(u);

    const ingName = norm(ingredient.foodName || ingredient.name);
    const ingUnit = normUnit(ingredient.unit);

    // 디버깅: 후보군 추출 전 원본 데이터 로그
    console.log('[FIFO DEBUG] ingredient:', ingName, ingUnit);
    console.log('[FIFO DEBUG] userIngredientsRaw 원본:', userIngredientsRaw);
    userIngredientsRaw.forEach(f => {
      console.log('[FIFO DEBUG] userRaw:', norm(f.foodName), normUnit(f.unit), f.foodId, f.amount, f.unit, f.foodName);
    });

    // 일치하는 식재료만 추출 (이름, 단위 모두 표준화해서 비교)
    const candidates = userIngredientsRaw
      .filter(f => norm(f.foodName) === ingName && normUnit(f.unit) === ingUnit)
      .sort((a, b) => (a.foodId || a.id) - (b.foodId || b.id));

    console.log('[FIFO DEBUG] candidates:', candidates);

    let remain = Number(ingredient.changeAmount) || 0;
    const result = [];
    for (const batch of candidates) {
      if (remain <= 0) break;
      const available = Number(batch.amount || batch.quantity || 0);
      const consume = Math.min(remain, available);
      if (consume > 0) {
        result.push({ foodId: batch.foodId || batch.id, amount: consume });
        remain -= consume;
      }
    }
    return result;
  }

  // AmountUnit enum 변환 함수 (서버와 맞춤)
  function toAmountUnitEnum(unit) {
    const map = {
      'g': 'G', '그램': 'G', 'G': 'G',
      'kg': 'KG', '킬로그램': 'KG', 'KG': 'KG',
      'ml': 'ML', '밀리리터': 'ML', 'ML': 'ML',
      'l': 'L', '리터': 'L', 'L': 'L',
      '개': 'EA', 'ea': 'EA', 'EA': 'EA'
    };
    return map[String(unit).trim().toLowerCase()] || 'EA';
  }

  // 서버에 변경된 식재료 전송
  const handleSendChanges = async () => {
    setLoading(true);
    try {
      // 1. 변화량이 0인 식재료는 제외
      const ingredientsToUpdate = ingredients.filter(
        (ingredient) => ingredient.changeAmount > 0
      );

      if (ingredientsToUpdate.length === 0) {
        Alert.alert('변경사항 없음', '변경된 식재료가 없습니다.');
        setLoading(false);
        return;
      }

      // 2. FIFO 로직에 따라 각 재료별로 userIngredientsRaw 차감
      // → 서버에 일괄 업데이트 API 사용 (updateFoodAmount)
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
          return [];
        }
        // unit 변환 적용
        const amountUnit = toAmountUnitEnum(ingredient.unit);
        return consumptionList.map(consumed => ({
          foodId: consumed.foodId,
          amount: consumed.amount,
          unit: amountUnit
        }));
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
      }
      Alert.alert('성공', '식재료 변경이 완료되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('오류', '예기치 않은 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>식재료 변화량 설정</Text>
      <FlatList
        data={ingredients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <View style={styles.ingredientContainer}>
              <Text style={styles.ingredientName}>{item.foodName}</Text>
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
              <Text style={styles.ingredientUnit}>{item.displayUnit}</Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ingredientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientName: {
    flex: 1,
    fontSize: 18,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  changeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  amountInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 18,
    textAlign: 'center',
  },
  ingredientUnit: {
    width: 50,
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 100,
  },
  confirmButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default IngredientChange;