import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import apiService from '../src/services/api.service';
import apiConfig from '../config/api.config';
import { LinearGradient } from 'react-native-linear-gradient';

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
  const [newIngredient, setNewIngredient] = useState(''); // 새로운 재료 입력 상태 관리
  const [loading, setLoading] = useState(false); // 로딩 상태 관리
  const [error, setError] = useState(''); // 에러 상태 관리
  const [resultCount, setResultCount] = useState(15); // 기본값 15개
  const [exactMatch, setExactMatch] = useState(false); // 완전히 일치 옵션 상태

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

  // 재료 추가 함수
  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]); // 입력된 재료를 추가
      setNewIngredient(''); // 입력 필드를 초기화
    } else {
      Alert.alert('입력 오류', '재료를 입력하세요.');
    }
  };

  // 재료 삭제 함수
  const deleteIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index)); // 선택한 재료를 삭제
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

  // 레시피 검색 함수
  const searchRecipes = async () => {
    if (ingredients.length === 0) {
      Alert.alert('입력 오류', '최소 한 개 이상의 재료를 입력하세요.');
      return;
    }

    setLoading(true);

    try {
      // 검색 매개변수 구성
      const searchParams = {
        foodName: ingredients[0], // 첫 번째 재료를 주 재료로 사용
        ...conditions,
        startIndex: 1,
        endIndex: resultCount,
        exactMatch, // 완전히 일치 옵션 추가
      };

      console.log('[RecipeSearch] 검색 매개변수:', searchParams);

      // API 호출
      const response = await apiService.searchRecipes(searchParams);
      console.log('[RecipeSearch] 검색 결과:', response);

      // 검색 결과 화면으로 이동 (RecipeResult로)
      if (response && response.success && Array.isArray(response.data)) {
        navigation.navigate('RecipeResult', {
          recipes: response.data,
          conditions: conditions,
          ingredients: ingredients
        });
      } else {
        setError('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('[RecipeSearch] 검색 오류:', error);
      Alert.alert(
        '검색 오류',
        '레시피 검색 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
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

        {/* 조건 섹션 */}
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

        {/* 재료 추가 섹션 */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>재료 추가</Text>

          {/* 완전히 일치 옵션 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
            <Switch
              value={exactMatch}
              onValueChange={setExactMatch}
              trackColor={{ false: '#bbb', true: '#2D336B' }}
              thumbColor={exactMatch ? '#A9B5DF' : '#999'}
            />
            <Text style={{
              marginLeft: 10,
              fontSize: 16,
              color: exactMatch ? '#2D336B' : '#2D336B',
              fontWeight: exactMatch ? 'bold' : 'normal'
            }}>
              완전히 일치
            </Text>
          </View>

          {/* 구분선 */}
          <View style={styles.sectionDivider} />

          {/* 결과 개수 선택 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', }}>
            <Text style={{ fontSize: 16, marginRight: 10, color: '#2D336B' }}>결과 개수:</Text>
            {[5, 15, 30].map((count) => (
              <TouchableOpacity
                key={count}
                style={{
                  backgroundColor: resultCount === count ? '#2D336B' : '#A9B5DF',
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  borderRadius: 13,
                  marginRight: 8,
                }}
                onPress={() => setResultCount(count)}
              >
                <Text style={{ color: resultCount === count ? '#fff' : '#333', fontWeight: 'bold' }}>{count}개</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 구분선 */}
          <View style={styles.sectionDivider} />
        </View>
        <View style={styles.box}>
          <FlatList
            data={ingredients}
            renderItem={({ item, index }) => (
              <View style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>{item}</Text>
                <TouchableOpacity onPress={() => deleteIngredient(index)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="재료를 입력하세요"
              placeholderTextColor="#7886C7"
              value={newIngredient}
              onChangeText={setNewIngredient}
            />
            <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btnArea, loading && styles.disabledButton]}
            onPress={() => {
              if (!loading) searchRecipes();
            }}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>레시피 검색</Text>
            )}
          </TouchableOpacity>

        </View>
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
    marginBottom: 3,
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
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#7886C7',
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    backgroundColor: '#fff',
    marginRight: 10,
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
});

export default RecipeSearch; // RecipeSearch 컴포넌트를 외부로 내보냄