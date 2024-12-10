import React, { useState } from 'react'; // React와 useState 훅을 가져옴
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  Switch,
  Button,
  ScrollView,
} from 'react-native'; // React Native의 UI 구성 요소를 가져옴

// React Navigation을 통해 navigation 객체 사용
const RecipeSearch = ({ navigation }) => {
  // 레시피 검색 조건을 저장하는 상태. 초기값은 모두 false
  const [conditions, setConditions] = useState({
    condition1: false,
    condition2: false,
    condition3: false,
    condition4: false,
  });

  // 현재 추가된 재료 목록과 새로운 재료를 관리하는 상태
  const [ingredients, setIngredients] = useState(''); // 재료 리스트
  const [newIngredient, setNewIngredient] = useState(''); // 새로 입력 중인 재료

  // 조건 스위치를 토글하는 함수
  const toggleCondition = (key) => {
    setConditions((prev) => ({ ...prev, [key]: !prev[key] })); // 선택한 조건의 상태를 반전시킴
  };

  // 새 재료를 추가하는 함수
  const addIngredient = () => {
    if (newIngredient.trim()) { // 공백만 입력되었는지 확인
      setIngredients([...ingredients, newIngredient.trim()]); // 새로운 재료를 기존 리스트에 추가
      setNewIngredient(''); // 입력 필드를 초기화
    } else {
      Alert.alert('Error', '재료를 입력하세요.'); // 유효하지 않은 입력 경고
    }
  };

  // 특정 인덱스의 재료를 삭제하는 함수
  const deleteIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index)); // 해당 인덱스를 제외한 새 리스트를 만듦
  };

  // RecipeDetail 화면으로 이동
  const navigateToDetail = () => {
    navigation.navigate('RecipeDetail'); // RecipeDetail 화면으로 네비게이션
  };

  // JSX로 화면 구성 요소 반환
  return (
    <View style={styles.container}>
      <ScrollView> {/* 화면 스크롤을 가능하게 만듦 */}
        <Text style={styles.title}>레시피 검색</Text> {/* 타이틀 텍스트 */}
        
        {/* 검색 조건 */}
        <View style={styles.conditions}>
          {Object.keys(conditions).map((key) => ( // 조건 상태를 반복적으로 표시
            <View key={key} style={styles.conditionItem}>
              <Text>{key}</Text> {/* 조건 키를 텍스트로 표시 */}
              <Switch
                value={conditions[key]} // 조건 상태 값
                onValueChange={() => toggleCondition(key)} // 상태를 토글하는 함수 연결
              />
            </View>
          ))}
        </View>

        {/* 재료 입력 및 리스트 */}
        <View style={styles.ingredients}>
          <Text style={styles.sectionTitle}>재료 리스트</Text> {/* 섹션 제목 */}
          <FlatList
            data={ingredients} // 리스트 데이터로 ingredients 배열 사용
            renderItem={({ item, index }) => ( // 재료 리스트의 각 아이템 렌더링
              <View style={styles.ingredientItem}>
                <Text>{item}</Text> {/* 재료 이름 */}
                <TouchableOpacity onPress={() => deleteIngredient(index)}> {/* 삭제 버튼 */}
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()} // 각 아이템의 고유 키로 인덱스 사용
          />
          <TextInput
            style={styles.input}
            placeholder="재료를 입력하세요" // 입력 필드의 플레이스홀더
            value={newIngredient} // 입력 필드의 값
            onChangeText={setNewIngredient} // 텍스트 변경 시 상태 업데이트
          />
          <Button title="+ 재료 추가" onPress={addIngredient} /> {/* 재료 추가 버튼 */}
        </View>

        {/* 검색 버튼 */}
        <View style={styles.searchButton}>
          <Button title="검색" onPress={navigateToDetail} /> {/* 검색 버튼 */}
        </View>
      </ScrollView>
    </View>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ffffff', // 배경색
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center', // 텍스트를 가운데 정렬
    marginVertical: 10, // 상하 여백
  },
  conditions: {
    marginVertical: 10, // 상하 여백
  },
  conditionItem: {
    flexDirection: 'row', // 가로 배치
    justifyContent: 'space-between', // 요소 사이 간격을 균등하게 배치
    alignItems: 'center', // 세로축 중앙 정렬
    marginBottom: 10, // 아래 여백
  },
  ingredients: {
    marginVertical: 20, // 상하 여백
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10, // 아래 여백
  },
  ingredientItem: {
    flexDirection: 'row', // 가로 배치
    justifyContent: 'space-between', // 요소 사이 간격을 균등하게 배치
    alignItems: 'center', // 세로축 중앙 정렬
    backgroundColor: '#f8f9fa', // 아이템 배경색
    padding: 10, // 내부 여백
    borderRadius: 5, // 둥근 모서리
    marginBottom: 5, // 아래 여백
  },
  deleteButton: {
    color: 'red', // 삭제 버튼 색상
    fontSize: 16, // 글자 크기
  },
  input: {
    borderColor: '#ccc', // 테두리 색상
    borderWidth: 1, // 테두리 두께
    borderRadius: 5, // 둥근 모서리
    padding: 8, // 내부 여백
    marginBottom: 10, // 아래 여백
  },
  searchButton: {
    marginVertical: 20, // 상하 여백
  },
});

export default RecipeSearch; // 컴포넌트 내보내기
