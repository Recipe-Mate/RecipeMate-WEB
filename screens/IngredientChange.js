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
  // 숫자가 아닌 문자(소수점 제외) 제거 후 숫자로 변환
  const num = parseFloat(str.replace(/[^\\d.]/g, ''));
  return isNaN(num) ? 0 : num;
};

const IngredientChange = ({ route, navigation }) => {
  const { ingredients: initialIngredients, userId } = route.params || {};

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
          // RecipeDetail에서 이미 필터링된 데이터를 받지만, 안전장치로 amount나 unit 존재 여부 확인 가능
          .filter(item => {
            const hasAmount = item.amount !== null && typeof item.amount !== 'undefined';
            const hasUnit = item.unit && String(item.unit).trim() !== '';
            // 디버깅을 위해 필터링되는 아이템 로그 추가
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
              displayChangeAmount: String(numericAmount), // 화면 표시용 문자열 상태 추가
              id: item.id || item.foodName || Math.random().toString(), 
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

  // 서버로 변화량 반영
  const handleConfirm = async () => {
    setLoading(true);
    try {
      // 디버깅용 콘솔 출력 추가
      console.log('[IngredientChange] initialIngredients (prop):', initialIngredients);
      console.log('[IngredientChange] ingredients (state):', ingredients);
      
      // 서버에 보낼 데이터 구조 맞추기
      // 현재 item.amount는 레시피 양, item.changeAmount는 사용자가 입력한 변화량(소모량)
      // 서버 API가 어떤 값을 기대하는지에 따라 이 부분의 로직이 달라져야 합니다.
      // 예시: 서버가 (기존 보유량 - 소모량)을 기대한다면, 이 화면에서 기존 보유량을 알아야 합니다.
      // 예시: 서버가 순수 소모량(델타값, 음수)을 기대한다면, -item.changeAmount를 보내야 합니다.
      // 현재 코드는 (레시피 양 + 입력된 변화량)을 보내고 있어, 의도와 다를 수 있습니다.
      // 이 부분은 사용자의 확인 및 서버 API 명세에 따른 수정이 필요할 수 있습니다.
      const foodDataList = ingredients.map((item) => {
        return {
          foodName: item.name || item.foodName, 
          // 아래 amount 계산은 서버 요구사항에 따라 달라져야 합니다.
          // 현재는 (레시피에 적힌 양 + 사용자가 입력한 양)으로 계산됩니다.
          amount: (interpretIngredientAmount(item.amount) || 0) + (Number(item.changeAmount) || 0),
        };
      });
      
      console.log('[IngredientChange] 서버로 전송되는 foodDataList:', JSON.stringify(foodDataList, null, 2));
      
      const result = await apiService.updateFoodAmount(userId, foodDataList);
      if (result && result.success) {
        Alert.alert('성공', '식재료 소유량이 업데이트되었습니다.');
        navigation.goBack();
      } else {
        Alert.alert('오류', `업데이트 실패: ${result && result.error ? result.error : '알 수 없는 오류'}`);
      }
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>재료 소진/변화량 수정</Text>
      <FlatList
        data={ingredients}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.ingredientItem}>
            <Text style={styles.ingredientName}>{item.name || item.foodName}</Text>
            <View style={styles.recipeAmountRow}>
              <Text style={styles.label}>레시피 필요량: {interpretIngredientAmount(item.amount)} {item.unit || item.amountUnit}</Text>
            </View>
            <View style={styles.changeAmountControls}>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => handleChangeAmountWithButtons(item.id, 'decrease')}
                disabled={loading}
              >
                <Text style={styles.buttonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={item.displayChangeAmount} // displayChangeAmount 사용
                onChangeText={(value) => handleAmountChange(item.id, value)}
                editable={!loading}
                placeholder="0"
              />
              <TouchableOpacity 
                style={styles.button}
                onPress={() => handleChangeAmountWithButtons(item.id, 'increase')}
                disabled={loading}
              >
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.labelUnit}>{item.unit || item.amountUnit}</Text>
            </View>
          </View>
        )}
        style={styles.list}
      />
      <TouchableOpacity
        style={[styles.confirmButton, loading && { backgroundColor: '#aaa' }]}
        onPress={handleConfirm}
        disabled={loading}
      >
        <Text style={styles.confirmButtonText}>{loading ? '처리 중...' : '확인'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  ingredientItem: {
    backgroundColor: '#f6f8fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  recipeAmountRow: { // 레시피 필요량 표시 스타일
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // 컨트롤과의 간격
  },
  changeAmountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between', // 버튼, 입력 필드, 단위 간격 자동 조절 시
    gap: 8, 
  },
  label: {
    fontSize: 15,
    color: '#555',
  },
  labelUnit: { // 단위 표시용 스타일
    fontSize: 15,
    color: '#555',
    marginLeft: 4, // 입력필드/버튼과의 간격
  },
  amountInput: {
    flex: 1, // 버튼 사이의 공간을 최대한 차지
    height: 42, 
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 18, 
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e9ecef', // 밝은 회색 계열
    paddingVertical: 8,
    paddingHorizontal: 16, // 버튼 크기 조절
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42, // 입력 필드와 높이 맞춤
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  buttonText: {
    fontSize: 20, // 아이콘 대신 텍스트 크기
    fontWeight: 'bold',
    color: '#495057', // 버튼 텍스트 색상
  },
  confirmButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default IngredientChange;