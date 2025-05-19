import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import apiService from '../src/services/api.service';
import apiConfig from '../config/api.config';
import { useAuth } from '../src/context/AuthContext';

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
  const [randomSearch, setRandomSearch] = useState(false); // 랜덤 검색 옵션 상태
  const { user } = useAuth(); // 사용자 정보 가져오기

  // "나만의 레시피" 추천 로딩 상태
  const [myRecipeLoading, setMyRecipeLoading] = useState(false);

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
    switch(option) {
      case ValueOption.HIGH: return '높음';
      case ValueOption.LOW: return '낮음';
      case ValueOption.NONE: return '상관없음';
      default: return '상관없음';
    }
  };

  // 값 옵션에 따른 UI 표시 색상
  const getOptionColor = (option) => {
    switch(option) {
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
      const searchParams = {
        ingredients: ingredients,
        ...conditions,
        startIndex: 1,
        endIndex: resultCount,
        exactMatch,
        randomSearch, // 랜덤 검색 옵션 추가
      };
      console.log('[RecipeSearch] 검색 매개변수:', searchParams);
      const response = await apiService.searchRecipes(searchParams);
      console.log('[RecipeSearch] 검색 결과:', response);
      if (response && response.success && Array.isArray(response.data)) {
        navigation.navigate('RecipeResult', {
          recipes: response.data,
          conditions: conditions,
          ingredients: ingredients, // 재료 배열도 함께 전달
        });
      } else {
        Alert.alert('검색 실패', '레시피를 찾을 수 없습니다.');
      }
    } catch (err) {
      setError('레시피 검색 중 오류가 발생했습니다.');
      Alert.alert('오류', '레시피 검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 나만의 레시피(내 식재료 기반 추천) 버튼 핸들러
  const handleMyRecipeRecommend = async () => {
    if (!user || !user.id) {
      Alert.alert('로그인 필요', '로그인 후 이용 가능합니다.');
      return;
    }
    setMyRecipeLoading(true);
    setError('');
    try {
      // 내 식재료 불러오기
      const ingRes = await apiService.getIngredients();
      if (!ingRes.success || !Array.isArray(ingRes.data) || ingRes.data.length === 0) {
        Alert.alert('식재료 없음', '등록된 내 식재료가 없습니다.');
        setMyRecipeLoading(false);
        return;
      }
      // 식재료명만 추출 (foodName 또는 name)
      const ingredientNames = ingRes.data.map(item => item.foodName || item.name).filter(Boolean);
      if (ingredientNames.length === 0) {
        Alert.alert('식재료 없음', '식재료명 정보가 없습니다.');
        setMyRecipeLoading(false);
        return;
      }
      // 기존 조건도 반영 (영양조건 등)
      const searchParams = {
        ingredients: ingredientNames,
        ...conditions,
        startIndex: 1,
        endIndex: resultCount,
        exactMatch,
        randomSearch,
      };
      const response = await apiService.searchRecipes(searchParams);
      if (response && response.success && Array.isArray(response.data)) {
        navigation.navigate('RecipeResult', {
          recipes: response.data,
          conditions: conditions,
          ingredients: ingredientNames,
        });
      } else {
        Alert.alert('추천 실패', '추천 레시피를 찾을 수 없습니다.');
      }
    } catch (err) {
      setError('추천 레시피 검색 중 오류가 발생했습니다.');
      Alert.alert('오류', '추천 레시피 검색 중 오류가 발생했습니다.');
    } finally {
      setMyRecipeLoading(false);
    }
  };

  const conditionLabels = ['탄수화물', '단백질', '지방', '칼로리'];
  const conditionKeys = ['carbohydrate', 'protien', 'fat', 'calorie'];
  
  // 조건 아이템 렌더링 함수
  const renderConditionItems = () => {
    return conditionKeys.map((key, index) => (
      <View key={index} style={styles.conditionItem}>
        <Text style={styles.conditionText}>{conditionLabels[index]}</Text>
        <TouchableOpacity 
          style={[styles.optionButton, {backgroundColor: getOptionColor(conditions[key])}]} 
          onPress={() => toggleCondition(key)}
        >
          <Text style={styles.optionButtonText}>{getOptionText(conditions[key])}</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  // 완전히 일치/랜덤 검색 옵션 렌더링
  const renderOptionsRow = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
      <Switch
        value={exactMatch}
        onValueChange={setExactMatch}
        trackColor={{ false: '#d1d5db', true: '#2D336B' }}
        thumbColor={exactMatch ? '#4FC3F7' : '#f4f3f4'}
      />
      <Text style={{ marginLeft: 10, fontSize: 16, color: exactMatch ? '#2D336B' : '#333', fontWeight: exactMatch ? 'bold' : 'normal' }}>
        완전히 일치
      </Text>
      <View style={{ width: 24 }} />
      <Switch
        value={randomSearch}
        onValueChange={setRandomSearch}
        trackColor={{ false: '#d1d5db', true: '#50C4B7' }}
        thumbColor={randomSearch ? '#50C4B7' : '#f4f3f4'}
      />
      <Text style={{ marginLeft: 10, fontSize: 16, color: randomSearch ? '#50C4B7' : '#333', fontWeight: randomSearch ? 'bold' : 'normal' }}>
        랜덤 검색
      </Text>
    </View>
  );

  // 결과 개수 선택 UI
  const renderResultCountSelector = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5, }}>
      <Text style={{ fontSize: 16, marginRight: 10 }}>결과 개수:</Text>
      {[5, 15, 30].map((count) => (
        <TouchableOpacity
          key={count}
          style={{
            backgroundColor: resultCount === count ? '#2D336B' : '#fff',
            paddingVertical: 6,
            paddingHorizontal: 16,
            borderRadius: 16,
            marginRight: 8,
          }}
          onPress={() => setResultCount(count)}
        >
          <Text style={{ color: resultCount === count ? '#fff' : '#333', fontWeight: 'bold' }}>{count}개</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // 헤더 부분 렌더링 함수 (FlatList의 ListHeaderComponent로 사용)
  const renderHeader = () => (
    <>
      {/* 화면 제목 */}
      <Text style={styles.title}>레시피 검색</Text>
      {/* 조건 섹션 */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>영양성분 기준</Text>
        {renderConditionItems()}
      </View>
      {/* <View style={styles.sectionDivider} />  // '재료 추가' 위 구분선 제거 */}
      <Text style={styles.sectionTitle}>재료 추가</Text>
      {renderOptionsRow()}
      <View style={styles.sectionDivider} />
      {renderResultCountSelector()}
      <View style={styles.sectionDivider} />
    </>
  );

  // 푸터 부분 렌더링 함수 (FlatList의 ListFooterComponent로 사용)
  const renderFooter = () => (
    <>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="재료를 입력하세요"
          value={newIngredient}
          onChangeText={setNewIngredient}
          onSubmitEditing={addIngredient}
          blurOnSubmit={false}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 버튼 */}
      <TouchableOpacity 
        style={[styles.searchButton, loading && styles.disabledButton]}
        onPress={searchRecipes}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.searchButtonText}>레시피 검색</Text>
        )}
      </TouchableOpacity>

      {/* 나만의 레시피 버튼 */}
      <TouchableOpacity
        style={[styles.searchButton, myRecipeLoading && styles.disabledButton, { marginTop: 8, backgroundColor: '#7886C7' }]}
        onPress={handleMyRecipeRecommend}
        disabled={myRecipeLoading}
      >
        {myRecipeLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.searchButtonText}>나만의 레시피</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingBottom: 40 }} // 좌우+하단 공간 확보
      >
        {renderHeader()}
        {/* 재료 리스트 수동 렌더링 */}
        {ingredients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 추가된 재료가 없습니다</Text>
          </View>
        ) : (
          ingredients.map((item, index) => (
            <View key={index} style={styles.ingredientItem}>
              <Text style={styles.ingredientText}>{item}</Text>
              <TouchableOpacity onPress={() => deleteIngredient(index)}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        {renderFooter()}
      </ScrollView>
    </View>
  );
};

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EBFC', // Toss 스타일 밝은 배경
    padding: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold', // 얇은 폰트
    color: '#222',
    textAlign: 'left',
    paddingLeft: 5,
    marginTop: 15,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  sectionBox: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 0,
    marginTop: 16,
    marginBottom: 18,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    letterSpacing: 0.1,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  conditions: {
    marginBottom: 20,
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  conditionText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  withSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F4',
  },
  ingredients: {
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff', // 카드 느낌
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F1F4',
  },
  ingredientText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  deleteButton: {
    fontSize: 18,
    color: '#B0B8C1',
    paddingHorizontal: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F1F4',
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'transparent',
    color: '#222',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  addButton: {
    height: 40,
    width: 40,
    backgroundColor: '#2D336B', // Toss 민트
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  searchButton: {
    backgroundColor: '#2D336B', // Toss 민트
    height: 54,
    borderRadius: 16,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 0,
  },
  searchButtonText: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#B0B8C1',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  listContainer: {
    paddingBottom: 20,
  },
  optionButton: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#F0F1F4',
    minWidth: 70,
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButtonText: {
    fontSize: 15,
    color: '#222',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  disabledButton: {
    backgroundColor: '#E5E8EB',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#C7CCEA',
    marginVertical: 10,
    width: '100%',
  },
});

export default RecipeSearch; // RecipeSearch 컴포넌트를 외부로 내보냄