import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '@env';
import apiService from '../src/services/api.service';
import { useAuth } from '../src/context/AuthContext';
import { useRoute } from '@react-navigation/native'; // useRoute 임포트
import { getMergedUserIngredients } from '../src/utils/userIngredientsStore'; // 전역 상태 관리 유틸 임포트


const RecipeDetail = ({ route: propRoute, navigation }) => {
  const { recipeName, dishImg } = propRoute.params;
  // 모든 훅 선언을 최상단에 모음
  const [recipe, setRecipe] = useState(null);
  const [userIngredients, setUserIngredients] = useState([]);
  const [userIngredientsRaw, setUserIngredientsRaw] = useState([]); // 원본 데이터
  const { user } = useAuth();
  const route = useRoute();
  const mergedUserIngredients = getMergedUserIngredients();
  // 대체 식재료 관련 상태
  const [showAlternativeModal, setShowAlternativeModal] = useState(false);
  const [alternativeList, setAlternativeList] = useState([]);
  const [alternativeLoading, setAlternativeLoading] = useState(false);
  const [selectedIngredientName, setSelectedIngredientName] = useState('');

  // 식재료명에서 단위/수량/괄호 등 제거 (예: "오렌지 100g(1/2개)" → "오렌지")
  const extractPureName = (name) => name.replace(/\s*\d+[a-zA-Z가-힣()\/.]*|\([^)]*\)/g, '').trim();

  // 사용자 식재료 불러오기
  useEffect(() => {
    const fetchUserIngredients = async () => {
      try {
        const result = await apiService.getIngredients();
        let foodArray = [];
        if (Array.isArray(result.data)) {
          foodArray = result.data;
        } else if (Array.isArray(result.foodList)) {
          foodArray = result.foodList;
        } else if (Array.isArray(result.ownFoodNameList)) {
          foodArray = result.ownFoodNameList.map((name, idx) => ({ name, unit: '' }));
        } else if (Array.isArray(result)) {
          foodArray = result;
        } else if (result && typeof result === 'object') {
          const arrField = Object.values(result).find(v => Array.isArray(v));
          if (arrField) foodArray = arrField;
        }
        setUserIngredientsRaw(foodArray); // 원본 저장
        // 정규화
        const normalized = foodArray.map(item => ({
          name: extractPureName(item.foodName || item.name || ''),
          quantity: item.quantity || item.amount || '',
          unit: item.unit || '',
        })).filter(f => f.name);
        setUserIngredients(normalized);
      } catch (e) {
        setUserIngredients([]);
        setUserIngredientsRaw([]);
      }
    };
    fetchUserIngredients();
  }, []);

  const fetchRecipeDetail = async (recipeName) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const encodedName = encodeURIComponent(recipeName);

      const response = await fetch(`${SERVER_URL}/recipe/recipe-name?name=${encodedName}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('레시피 상세 정보 요청 실패');
      }

      const data = await response.json();
      console.log('레시피 상세 정보:', data);
      return data;

    } catch (error) {
      console.error('레시피 상세 정보 요청 중 오류:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadRecipe = async () => {
      const data = await fetchRecipeDetail(recipeName);
      if (data) {
        setRecipe(data.recipe);
      }
    };

    loadRecipe();
  }, [recipeName]);

  useEffect(() => {
    if (recipe && Array.isArray(recipe.ingredient)) {
      const parsedList = recipe.ingredient
        .filter(item => /\(.+\)/.test(item))
        .map(item => parseIngredientString(item));
      console.log('레시피 정제된 ingredient 리스트:', parsedList);
    }
  }, [recipe]);

  if (!recipe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A9B5DF" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>레시피를 불러오고 있습니다.</Text>
      </View>
    );
  }

  const completeCooking = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const validImages = recipe.processImage.filter(url => url && url.trim() !== '');
      const lastProcessImage = validImages.length > 0 ? validImages[validImages.length - 1] : null;
      const requestBody = {
        recipeName: recipeName,
        recipeImage: lastProcessImage || dishImg,
      };
      console.log('서버로 전송될 데이터:', JSON.stringify(requestBody));
      const response = await fetch(`${SERVER_URL}/recipe/used`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error('서버 전송 실패');
      }
      const text = await response.text();
      console.log('서버 응답 원본:', text);

      // 서버 응답과 상관없이 재료 소진 화면으로 이동
      // 레시피 ingredient(원본)와 userIngredientsRaw, userId를 넘김
      navigation.navigate('IngredientChange', {
        ingredients: recipe.ingredient
          .filter(item => /\(.+\)/.test(item))
          .map((item, idx) => {
            // 괄호 앞의 순수명, 괄호 안의 수량/단위 추출
            const match = item.match(/^([^\(]+)/);
            const pureName = match ? extractPureName(match[1]) : extractPureName(item);
            const bracket = item.match(/\(([^)]+)\)/);
            let amount = '', unit = '';
            if (match) {
              // 괄호 앞에서 수량/단위 추출 (예: '100g')
              const beforeBracket = match[1].trim();
              const beforeMatch = beforeBracket.match(/([\d\./]+)\s*([a-zA-Z가-힣]+)/);
              if (beforeMatch) {
                amount = beforeMatch[1];
                unit = beforeMatch[2];
              }
            }
            if ((!amount || !unit) && bracket) {
              // 괄호 안에서 수량/단위 추출 (예: '1/2개')
              const parts = bracket[1].split(/\s+/);
              if (parts.length === 2) {
                if (!amount) amount = parts[0];
                if (!unit) unit = parts[1];
              } else if (parts.length === 1) {
                const numMatch = parts[0].match(/([\d\./]+)([a-zA-Z가-힣]+)/);
                if (numMatch) {
                  if (!amount) amount = numMatch[1];
                  if (!unit) unit = numMatch[2];
                } else {
                  if (!amount) amount = parts[0];
                }
              }
            }
            // name, foodName 모두 순수명으로 정제해서 넘김
            return {
              id: idx + '_' + pureName + '_' + unit,
              name: pureName,
              foodName: pureName,
              amount,
              unit,
            };
          }),
        userIngredientsRaw: userIngredientsRaw,
        userId: user && (user.id || user.user_id),
      });
    } catch (error) {
      console.error('요리 완료 전송 중 오류:', error instanceof Error ? error.stack : error);
      // 서버 오류여도 재료 소진 화면으로 이동
      navigation.navigate('IngredientChange', {
        ingredients: recipe.ingredient
          .filter(item => /\(.+\)/.test(item))
          .map((item, idx) => {
            const match = item.match(/^([^\(]+)/);
            const pureName = match ? extractPureName(match[1]) : extractPureName(item);
            const bracket = item.match(/\(([^)]+)\)/);
            let amount = '', unit = '';
            if (bracket) {
              // 예: '100g(1/2개)' 또는 '100g 1/2개' 등 다양한 케이스 처리
              // 1. 괄호 앞쪽(예: '100g')에서 단위 추출
              const beforeBracket = match ? match[1].trim() : '';
              const beforeUnitMatch = beforeBracket.match(/([\d\./]+)\s*([a-zA-Z가-힣]+)/);
              let beforeUnit = '';
              if (beforeUnitMatch) {
                beforeUnit = beforeUnitMatch[2];
              }
              // 2. 괄호 안쪽(예: '1/2개')에서 단위 추출
              const parts = bracket[1].split(/\s+/);
              let bracketAmount = '', bracketUnit = '';
              if (parts.length === 2) {
                bracketAmount = parts[0];
                bracketUnit = parts[1];
              } else if (parts.length === 1) {
                const numMatch = parts[0].match(/([\d\./]+)([a-zA-Z가-힣]+)/);
                if (numMatch) {
                  bracketAmount = numMatch[1];
                  bracketUnit = numMatch[2];
                } else {
                  bracketAmount = parts[0];
                }
              }
              // 3. amount/unit 결정: 앞쪽 단위가 있으면 그걸 우선 사용
              if (beforeUnit) {
                amount = beforeBracket.match(/[\d\./]+/)?.[0] || '';
                unit = beforeUnit;
              } else if (bracketUnit) {
                amount = bracketAmount;
                unit = bracketUnit;
              } else {
                amount = beforeBracket.match(/[\d\./]+/)?.[0] || bracketAmount;
                unit = beforeUnit || bracketUnit;
              }
            }
            return {
              id: idx + '_' + pureName + '_' + unit,
              name: pureName,
              amount,
              unit,
            };
          }),
        userIngredientsRaw: userIngredientsRaw,
        userId: user && (user.id || user.user_id),
      });
    }
  };

  // 사용자 식재료 합산(이름+단위별 수량 합침, 단위는 소문자+trim으로 일반화)
  function mergeUserIngredients(ingredientList) {
    const merged = {};
    for (const item of ingredientList) {
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
      merged[key].quantity += Number(item.quantity || item.amount || 0);
    }
    return Object.values(merged);
  }

  // ingredient 문자열을 {name, stdAmount, stdUnit, amount, unit} 객체로 파싱하는 함수
  function parseIngredientString(ingredientStr) {
    // 예: '당근 100g(1/2개)' → name: '당근', stdAmount: '100', stdUnit: 'g', amount: '1/2', unit: '개'
    const match = ingredientStr.match(/^([^\(]+)/);
    const pureName = match ? extractPureName(match[1]) : extractPureName(ingredientStr);
    const beforeBracket = match ? match[1].trim() : '';
    let stdAmount = '', stdUnit = '';
    const beforeUnitMatch = beforeBracket.match(/([\d\./]+)\s*([a-zA-Z가-힣]+)/);
    if (beforeUnitMatch) {
      stdAmount = beforeUnitMatch[1];
      stdUnit = beforeUnitMatch[2];
    }
    const bracket = ingredientStr.match(/\(([^)]+)\)/);
    let amount = '', unit = '';
    if (bracket) {
      const parts = bracket[1].split(/\s+/);
      if (parts.length === 2) {
        amount = parts[0];
        unit = parts[1];
      } else if (parts.length === 1) {
        const numMatch = parts[0].match(/([\d\./]+)([a-zA-Z가-힣]+)/);
        if (numMatch) {
          amount = numMatch[1];
          unit = numMatch[2];
        } else {
          amount = parts[0];
        }
      }
    }
    return { name: pureName, stdAmount, stdUnit, amount, unit };
  }

  // getIngredientStatus는 {name, stdAmount, stdUnit, amount, unit} 객체를 받아서 비교
  const getIngredientStatus = ({ name, stdAmount, stdUnit, amount, unit }) => {
    const pureName = (name || '').replace(/\s/g, '').toLowerCase();
    const neededAmount = amount;
    const neededUnit = unit;
    const neededStdAmount = stdAmount;
    const neededStdUnit = stdUnit;
    const norm = v => (v || '').replace(/\s/g, '').toLowerCase();
    // [디버깅] 비교 직전 로그
    console.log('[비교-DEBUG] pureName:', pureName, 'neededUnit:', neededUnit, 'neededStdUnit:', neededStdUnit, 'mergedUserIngredients:', mergedUserIngredients);
    // 1. 이름+단위 일치
    const userItem = mergedUserIngredients.find(f => f.name === pureName && norm(f.unit) === norm(neededUnit));
    if (userItem) {
      if (neededAmount && neededUnit && userItem.unit && userItem.quantity) {
        if (norm(userItem.unit) === norm(neededUnit)) {
          const parseNum = (v) => {
            if (typeof v !== 'string') return Number(v) || 0;
            if (v.includes('/')) {
              const [a, b] = v.split('/').map(Number);
              return b ? a / b : a;
            }
            return parseFloat(v);
          };
          const need = parseNum(neededAmount);
          const have = parseNum(userItem.quantity);
          console.log(`[비교] 이름+단위: ${pureName} ${neededAmount}${neededUnit} vs 사용자 ${have}${userItem.unit}`);
          if (!isNaN(need) && !isNaN(have)) {
            if (have >= need) return { status: '보유', color: '#50C4B7' };
            else return { status: '부족', color: '#FFD600' };
          }
        }
      }
      return { status: '보유', color: '#50C4B7' };
    }
    // 2. 이름+stdUnit 일치 (정량 단위로도 비교)
    if (neededStdUnit) {
      const userStdItem = mergedUserIngredients.find(f => f.name === pureName && norm(f.unit) === norm(neededStdUnit));
      if (userStdItem && neededStdAmount) {
        const parseNum = (v) => {
          if (typeof v !== 'string') return Number(v) || 0;
          if (v.includes('/')) {
            const [a, b] = v.split('/').map(Number);
            return b ? a / b : a;
          }
          return parseFloat(v);
        };
        const need = parseNum(neededStdAmount);
        const have = parseNum(userStdItem.quantity);
        console.log(`[비교] 이름+정량단위: ${pureName} ${neededStdAmount}${neededStdUnit} vs 사용자 ${have}${userStdItem.unit}`);
        if (!isNaN(need) && !isNaN(have)) {
          if (have >= need) return { status: '보유', color: '#50C4B7' };
          else return { status: '부족', color: '#FFD600' };
        }
        return { status: '보유', color: '#50C4B7' };
      }
    }
    // 3. 이름만 일치하는 사용자 식재료(단위 다름)도 찾아서 변환 시도 (기존 로직 유지)
    const userItemNameOnly = mergedUserIngredients.find(f => f.name === pureName);
    if (userItemNameOnly && neededAmount && neededUnit && userItemNameOnly.unit && userItemNameOnly.quantity) {
      console.log(`[비교] 이름만 일치: ${pureName} (${neededAmount}${neededUnit}) vs 사용자 ${userItemNameOnly.quantity}${userItemNameOnly.unit}`);
      // 단위 변환 테이블 활용 등 추가 로직 필요시 여기에 작성
      // 일단 '보유' 처리
      return { status: '보유', color: '#50C4B7' };
    }
    console.log(`[비교] 미보유: ${pureName} (${neededAmount}${neededUnit} / ${neededStdAmount}${neededStdUnit})`);
    return { status: '미보유', color: '#E0E0E0' };
  };

  // 대체 식재료 API 호출 함수
  const fetchAlternativeIngredients = async (ingredientName) => {
    if (!recipeName || !ingredientName) return;
    setAlternativeLoading(true);
    setAlternativeList([]);
    setShowAlternativeModal(true);
    setSelectedIngredientName(ingredientName);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const url = `${SERVER_URL}/recipe/alternative-food?menu=${encodeURIComponent(recipeName)}&replaceFood=${encodeURIComponent(ingredientName)}`;
      // 로그 추가
      console.log('[대체식재료 요청] URL:', url);
      console.log('[대체식재료 요청] Authorization:', accessToken);
      console.log('[대체식재료 요청] menu:', recipeName, 'replaceFood:', ingredientName);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('대체 식재료 조회 실패');
      const data = await response.json();
      setAlternativeList(Array.isArray(data.replacableFoodNames) ? data.replacableFoodNames : []);
    } catch (e) {
      setAlternativeList([]);
      Alert.alert('오류', '대체 식재료 정보를 불러오지 못했습니다.');
    } finally {
      setAlternativeLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{recipe.recipeName}</Text>
      <View style={styles.imageBox}>
        <Image source={{ uri: dishImg }} style={styles.recipeImage} />
      </View>
      <View style={styles.nutritionSection}>
        <Text style={styles.sectionTitle}>영양 정보</Text>
        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>칼로리</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.calorie} kcal` : '정보 없음'}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>탄수화물</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.carbohydrate} g` : '정보 없음'}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>단백질</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.protien} g` : '정보 없음'}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>지방</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.fat} g` : '정보 없음'}
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>나트륨</Text>
            <Text style={styles.nutritionValue}>
              {recipe.calorie ? `${recipe.natrium} mg` : '정보 없음'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.nutritionSection}>
        <Text style={styles.sectionTitle}>재료</Text>
        <View style={styles.ingredientListContainer}>
          {recipe.ingredient
            .filter(item => /\(.+\)/.test(item))
            .map((item, index) => {
              const parsed = parseIngredientString(item);
              const { status, color } = getIngredientStatus(parsed);
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => fetchAlternativeIngredients(parsed.name)}
                  style={[
                    styles.ingredientChip,
                    { width: '100%', justifyContent: 'space-between' },
                    status === '보유'
                      ? { backgroundColor: '#e0f7ff' }
                      : status === '부족'
                      ? { backgroundColor: '#fffbe0' }
                      : { backgroundColor: '#ffe0e0' },
                  ]}
                >
                  <Text style={[styles.ingredientName, { flex: 1, textAlign: 'left' }]}>• {item}</Text>
                  <Text style={[styles.statusText, { backgroundColor: color, color: '#222', marginLeft: 8, textAlign: 'right', flexShrink: 0 }]}>{status}</Text>
                </TouchableOpacity>
              );
            })}
        </View>
      </View>

      <View style={styles.finalBox}>
        <Text style={styles.sectionTitle}>조리 과정</Text>
        {recipe.cookingProcess.map((step, index) => {
          const imageUrl = recipe.processImage[index];
          if (!step) return null;

          return (
            <View key={index} style={styles.stepRow}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.stepImage} />
              ) : (
                <View style={styles.stepImagePlaceholder}>
                  <Text style={styles.stepIndex}>{index + 1}</Text>
                </View>
              )}
              <Text style={styles.stepText}>{step}</Text>
            </View>
          );
        })}
      </View>
      <TouchableOpacity style={styles.completeButton} onPress={completeCooking}>
        <Text style={styles.completeButtonText}>요리 완료</Text>
      </TouchableOpacity>

      {/* 대체 식재료 모달 */}
      <Modal
        visible={showAlternativeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlternativeModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', maxHeight: '70%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{selectedIngredientName}의 대체 식재료</Text>
            {alternativeLoading ? (
              <ActivityIndicator size="large" color="#2D336B" style={{ marginVertical: 20 }} />
            ) : alternativeList.length > 0 ? (
              alternativeList.map((alt, idx) => (
                <Text key={idx} style={{ fontSize: 16, marginBottom: 8, color: '#2D336B' }}>• {alt}</Text>
              ))
            ) : (
              <Text style={{ color: '#888', fontSize: 15, marginVertical: 20 }}>대체 식재료를 찾을 수 없습니다.</Text>
            )}
            <TouchableOpacity onPress={() => setShowAlternativeModal(false)} style={{ marginTop: 18, alignSelf: 'center', backgroundColor: '#2D336B', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 24 }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A9B5DF',
    padding: 10,
  },
  imageBox: {
    backgroundColor: '#EEF1FA',
    padding: 10,
    margin: 5,
    borderRadius: 15,
    marginBottom: 3,
  },
  sectionBox: {
    backgroundColor: '#EEF1FA',
    padding: 15,
    margin: 5,
    borderRadius: 20,
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#2D336B',
    textAlign: 'center'
  },
  recipeImage: {
    height: 170,
    borderRadius: 11,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  nutritionSection: {
    backgroundColor: '#EEF1FA',
    padding: 12,
    margin: 5,
    borderRadius: 15,
  },
  nutritionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    marginTop: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  stepImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#000',  // 테두리 색상
  },
  stepImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepIndex: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  finalBox: {
    backgroundColor: '#EEF1FA',
    padding: 15,
    margin: 5,
    borderRadius: 15,
  },
  completeButton: {
    backgroundColor: '#2D336B',
    borderRadius: 15,
    padding: 15,
    margin: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  completeButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 13,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
    overflow: 'hidden',
    minWidth: 44,
    textAlign: 'center',
  },
  ingredientListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginTop: 5,
    backgroundColor: '#F6F8FA',
    borderColor: '#000',
    borderWidth: 0.4
  },
  ingredientName: {
    fontSize: 15,
    color: '#1E1E1E',
    fontWeight: '500',
    marginRight: 6,
    // flex, textAlign 인라인에서 적용
  },
})

export default RecipeDetail;