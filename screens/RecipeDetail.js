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
  const extractPureName = (name) => {
    // 1. 괄호 제거: (1/2개) 등
    let cleaned = name.replace(/\([^)]*\)/g, '').trim();
    // 2. 끝에 있는 숫자+단위 제거: 100g, 1개 등
    cleaned = cleaned.replace(/\s+\d+(\.\d+)?[a-zA-Z가-힣]+$/g, '').trim();
    // 3. 남은 공백 정리
    return cleaned.trim();
  };

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
  // 사용자 식재료 합산(이름+단위별 수량 합침, 단위는 정규화)
  function mergeUserIngredients(ingredientList) {
    const merged = {};
    for (const item of ingredientList) {
      const normName = (item.name || '').replace(/\s/g, '').toLowerCase();
      const normUnit = normalizeUnit(item.unit || ''); // 단위 정규화 적용
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
    const bracketMatch = ingredientStr.match(/\(([^)]+)\)/); // 예: (1/2개)
    const mainPart = ingredientStr.replace(/\s*\(([^)]+)\)/, '').trim(); // 예: "당근 100g" 또는 "숙주 100g"

    let name = mainPart;
    let stdAmount = '', stdUnit = '';

    // "당근 100g" 또는 "숙주 100g" 에서 "100g" 추출 시도 (문자열 끝에 위치한 양과 단위)
    const unitRegex = /(.+?)\s+([\d\.\/]+)\s*([a-zA-Z가-힣]+)$/;
    const mainPartUnitMatch = mainPart.match(unitRegex);

    if (mainPartUnitMatch) {
        name = mainPartUnitMatch[1].trim(); // "당근" 또는 "숙주"
        stdAmount = mainPartUnitMatch[2]; // "100"
        stdUnit = mainPartUnitMatch[3]; // "g"
    } else {
        // 단위 정보가 없는 경우, 전체를 이름으로 간주 (예: "대파")
        name = mainPart.trim();
    }
    
    // 순수 이름 한번 더 정제 (extractPureName은 숫자, 단위, 괄호를 모두 제거하므로, 이미 분리된 name에 적용)
    const finalPureName = extractPureName(name);

    let amount = '', unit = '';
    if (bracketMatch) { // 예: (1/2개)
        const bracketContent = bracketMatch[1]; // "1/2개"
        const bracketUnitMatch = bracketContent.match(/([\d\.\/]+)\s*([a-zA-Z가-힣]+)/); // "1/2", "개"
        if (bracketUnitMatch) {
            amount = bracketUnitMatch[1]; // "1/2"
            unit = bracketUnitMatch[2]; // "개"
        } else { 
            amount = bracketContent; // 예: (선택)
        }
    }
    return { name: finalPureName || name, stdAmount, stdUnit, amount, unit };
  }  // 단위 변환 테이블
  const UNIT_CONVERSION_TABLE = {
    '오렌지': { 'ea': { 'g': 150 }, 'g': { 'ea': 1/150 } },
    '당근': { 'ea': { 'g': 100 }, 'g': { 'ea': 1/100 } },
    '계란': { 'ea': { 'g': 50 }, 'g': { 'ea': 1/50 } },
    '감자': { 'ea': { 'g': 200 }, 'g': { 'ea': 1/200 } },
    '양파': { 'ea': { 'g': 150 }, 'g': { 'ea': 1/150 } },
    '사과': { 'ea': { 'g': 200 }, 'g': { 'ea': 1/200 } },
    '토마토': { 'ea': { 'g': 120 }, 'g': { 'ea': 1/120 } },
  };// 단위 정규화 함수 - EA와 개를 같은 단위로 처리
  const normalizeUnit = (unit) => {
    if (!unit) return '';
    const normalized = unit.toLowerCase().trim();
    // EA와 개를 모두 'ea'로 통일
    if (normalized === 'ea' || normalized === '개') return 'ea';
    if (normalized === 'g' || normalized === '그램') return 'g';
    if (normalized === 'kg' || normalized === '킬로그램') return 'kg';
    if (normalized === 'ml' || normalized === '밀리리터') return 'ml';
    if (normalized === 'l' || normalized === '리터') return 'l';
    return normalized;
  };  // 단위 변환 함수 (단순화)
  const convertUnit = (ingredientName, amount, fromUnit, toUnit) => {
    // 단위 정규화
    const normalizedFrom = normalizeUnit(fromUnit);
    const normalizedTo = normalizeUnit(toUnit);
    
    console.log(`[단위변환] ${ingredientName}: ${fromUnit}(${normalizedFrom}) → ${toUnit}(${normalizedTo})`);
    
    // 같은 단위면 그대로 반환
    if (normalizedFrom === normalizedTo) {
      console.log(`[단위변환] 같은 단위: ${parseFloat(amount)}`);
      return parseFloat(amount);
    }
    
    // 수량이 유효하지 않으면 null 반환
    let num = null;
    try {
      num = eval(String(amount));
    } catch {
      num = parseFloat(amount);
    }
    
    if (isNaN(num)) {
      console.log(`[단위변환] 수량 파싱 실패: ${amount}`);
      return null;
    }
    
    // 변환 테이블 확인
    const table = UNIT_CONVERSION_TABLE[ingredientName];
    if (table && table[normalizedFrom] && table[normalizedFrom][normalizedTo]) {
      const ratio = table[normalizedFrom][normalizedTo];
      const result = num * ratio;
      console.log(`[단위변환] 성공(테이블): ${num} × ${ratio} = ${result}`);
      return result;
    }
    
    // 테이블에 없는 경우 기본 변환 규칙 적용
    const defaultRatio = getDefaultConversionRatio(normalizedFrom, normalizedTo);
    if (defaultRatio !== null) {
      const result = num * defaultRatio;
      console.log(`[단위변환] 성공(기본규칙): ${num} × ${defaultRatio} = ${result}`);
      return result;
    }
    
    console.log(`[단위변환] 변환 경로 없음: ${normalizedFrom} → ${normalizedTo}`);
    return null;
  };

  // 기본 변환 비율 함수
  const getDefaultConversionRatio = (fromUnit, toUnit) => {
    // ea ↔ g 변환 (일반적인 중간 크기 식재료 기준: 1개 = 100g)
    if (fromUnit === 'ea' && toUnit === 'g') return 100;
    if (fromUnit === 'g' && toUnit === 'ea') return 1/100;
    
    // 기본 무게 단위 변환
    if (fromUnit === 'kg' && toUnit === 'g') return 1000;
    if (fromUnit === 'g' && toUnit === 'kg') return 1/1000;
    
    // 기본 부피 단위 변환
    if (fromUnit === 'l' && toUnit === 'ml') return 1000;
    if (fromUnit === 'ml' && toUnit === 'l') return 1/1000;
    
    return null;
  };

  // getIngredientStatus는 {name, stdAmount, stdUnit, amount, unit} 객체를 받아서 비교
  const getIngredientStatus = ({ name, stdAmount, stdUnit, amount, unit }) => {
    const pureName = (name || '').replace(/\s/g, '').toLowerCase();

    let neededAmount = amount; // 괄호 안 수량 우선
    let neededUnit = unit;   // 괄호 안 단위 우선
    let referenceUnitType = "괄호 단위";

    if ((!neededAmount || !neededUnit) && stdAmount && stdUnit) { // 괄호 안 정보가 없거나 불완전하면 표준(괄호 밖) 정보 사용
        neededAmount = stdAmount;
        neededUnit = stdUnit;
        referenceUnitType = "표준 단위";
    }

    if (!neededAmount || !neededUnit) { // 최종적으로 유효한 양/단위 정보가 없으면 비교 불가
         console.log(`[비교] 유효한 양/단위 정보 없음: ${pureName}`);
         return { status: '', color: '#F6F8FA' }; // 상태 없음, 기본 배경색
    }

    const norm = v => (v || '').replace(/\s/g, '').toLowerCase();
    console.log(`[비교-DEBUG] pureName: ${pureName}, neededAmount: ${neededAmount}, neededUnit: ${neededUnit} (출처: ${referenceUnitType}), mergedUserIngredients:`, mergedUserIngredients);
    
    // 1. 먼저 단위가 정확히 일치하는 경우 확인
    const userItem = mergedUserIngredients.find(f => f.name === pureName && norm(f.unit) === norm(neededUnit));
    if (userItem) {
        const userQuantity = parseFloat(String(userItem.quantity).replace(',', '.'));
        const requiredQuantity = parseFloat(String(neededAmount).replace(',', '.'));

        if (isNaN(userQuantity) || isNaN(requiredQuantity)) {
             console.log(`[비교] 수량 변환 실패: user(${userItem.quantity}), required(${neededAmount})`);
             return { status: '정보오류', color: '#FFA500' };
        }
        if (userQuantity >= requiredQuantity) {
            console.log(`[비교] 보유: ${pureName} (${neededAmount}${neededUnit})`);
            return { status: '보유', color: '#D4EFDF' };
        } else {
            console.log(`[비교] 부족: ${pureName} (${neededAmount}${neededUnit}), 보유량: ${userQuantity}${userItem.unit}`);
            return { status: '부족', color: '#FADBD8' };
        }
    }

  // 2. 단위가 일치하지 않는 경우 단위 변환을 통해 확인
    const userItemWithDifferentUnit = mergedUserIngredients.find(f => f.name === pureName);
    if (userItemWithDifferentUnit) {
        const userUnit = norm(userItemWithDifferentUnit.unit);
        const requiredUnit = norm(neededUnit);
        
        console.log(`[비교-단위변환] ${pureName}: 보유단위=${userUnit}, 필요단위=${requiredUnit}`);
        console.log(`[비교-단위변환] 단위변환테이블 확인: ${pureName}의 변환표존재:`, UNIT_CONVERSION_TABLE[pureName] ? '있음' : '없음');
        
        // 정확한 식재료명으로 단위 변환 테이블 검색
        let conversionKey = null;
        for (const key in UNIT_CONVERSION_TABLE) {
            if (key === pureName || pureName.includes(key) || key.includes(pureName)) {
                conversionKey = key;
                console.log(`[비교-단위변환] 변환테이블 키 매칭: ${pureName} → ${conversionKey}`);
                break;
            }
        }
        
        // 사용자 보유량을 필요한 단위로 변환
        const convertedUserAmount = conversionKey ? 
            convertUnit(conversionKey, userItemWithDifferentUnit.quantity, userUnit, requiredUnit) :
            convertUnit(pureName, userItemWithDifferentUnit.quantity, userUnit, requiredUnit);
        
        console.log(`[비교-단위변환] 변환결과: ${convertedUserAmount}, 사용된키: ${conversionKey || pureName}`);
        
        if (convertedUserAmount !== null) {
            const requiredQuantity = parseFloat(String(neededAmount).replace(',', '.'));
            
            if (isNaN(requiredQuantity)) {
                console.log(`[비교-단위변환] 필요량 변환 실패: required(${neededAmount})`);
                return { status: '정보오류', color: '#FFA500' };
            }
            
            console.log(`[비교-단위변환] ${pureName}: 보유량=${userItemWithDifferentUnit.quantity}${userUnit} → ${convertedUserAmount}${requiredUnit}, 필요량=${requiredQuantity}${requiredUnit}`);
            
            if (convertedUserAmount >= requiredQuantity) {
                console.log(`[비교-단위변환] 보유: ${pureName} (변환 후)`);
                return { status: '보유', color: '#D4EFDF' };
            } else {
                console.log(`[비교-단위변환] 부족: ${pureName} (변환 후)`);
                return { status: '부족', color: '#FADBD8' };
            }
        } else {
            console.log(`[비교-단위변환] 변환 실패: ${pureName}, ${userUnit} → ${requiredUnit}`);
        }
    }

    // 3. 괄호 단위로 못 찾았고, 사용된 단위가 "괄호 단위"였으며, 표준 단위 정보가 존재하고, 표준 단위가 괄호 단위와 다를 경우 표준 단위로 추가 검색
    if (referenceUnitType === "괄호 단위" && stdAmount && stdUnit && (norm(stdUnit) !== norm(unit) || stdAmount !== amount)) {
        console.log(`[비교-DEBUG] 표준 단위로 추가 검색: pureName: ${pureName}, stdAmount: ${stdAmount}, stdUnit: ${stdUnit}`);
        const userItemStd = mergedUserIngredients.find(f => f.name === pureName && norm(f.unit) === norm(stdUnit));
        if (userItemStd) {
            const userQuantityStd = parseFloat(String(userItemStd.quantity).replace(',', '.'));
            const requiredQuantityStd = parseFloat(String(stdAmount).replace(',', '.'));
            if (isNaN(userQuantityStd) || isNaN(requiredQuantityStd)) {
                console.log(`[비교] 표준 단위 수량 변환 실패: user(${userItemStd.quantity}), required(${stdAmount})`);
                return { status: '정보오류', color: '#FFA500' };
            }
            if (userQuantityStd >= requiredQuantityStd) {
                console.log(`[비교] 보유 (표준단위): ${pureName} (${stdAmount}${stdUnit})`);
                return { status: '보유', color: '#D4EFDF' };
            } else {
                console.log(`[비교] 부족 (표준단위): ${pureName} (${stdAmount}${stdUnit}), 보유량: ${userQuantityStd}${userItemStd.unit}`);
                return { status: '부족', color: '#FADBD8' };
            }
        }
        
        // 표준 단위로도 단위 변환 시도
        const userItemStdDifferentUnit = mergedUserIngredients.find(f => f.name === pureName);
        if (userItemStdDifferentUnit) {
            const userUnit = norm(userItemStdDifferentUnit.unit);
            const stdRequiredUnit = norm(stdUnit);
            
            const convertedUserAmount = convertUnit(pureName, userItemStdDifferentUnit.quantity, userUnit, stdRequiredUnit);
            
            if (convertedUserAmount !== null) {
                const requiredQuantityStd = parseFloat(String(stdAmount).replace(',', '.'));
                
                if (!isNaN(requiredQuantityStd) && convertedUserAmount >= requiredQuantityStd) {
                    console.log(`[비교-표준단위변환] 보유: ${pureName} (표준단위 변환 후)`);
                    return { status: '보유', color: '#D4EFDF' };
                } else if (!isNaN(requiredQuantityStd)) {
                    console.log(`[비교-표준단위변환] 부족: ${pureName} (표준단위 변환 후)`);
                    return { status: '부족', color: '#FADBD8' };
                }
            }
        }
    }

    console.log(`[비교] 미보유: ${pureName} (${neededAmount}${neededUnit} / 백업: ${stdAmount}${stdUnit})`);
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
          {recipe.ingredient.map((item, index) => {
            // 단위 정보 (예: "100g", "1개") 또는 괄호가 있는지 확인
            const hasUnitInfo = /(\s\d+(\.\d+)?\s*[a-zA-Z가-힣]+)$/.test(item) || /\(.+\)/.test(item);
            
            let statusDisplay = null;
            let chipBackgroundColor = styles.ingredientChip.backgroundColor; // 기본 배경색
            let onPressAction = () => {};
            let isDisabled = true;
            let parsedIngredientName = extractPureName(item); // 기본 이름 추출

            if (hasUnitInfo) {
              const parsedIngredient = parseIngredientString(item);
              parsedIngredientName = parsedIngredient.name; // 파싱된 순수 이름으로 업데이트
              console.log('Raw item:', item, 'Parsed for status:', parsedIngredient);
              const ingredientStatusResult = getIngredientStatus(parsedIngredient);
              console.log('IngredientStatusResult for', item, ':', ingredientStatusResult);

              if (ingredientStatusResult && ingredientStatusResult.status && ingredientStatusResult.color) {
                statusDisplay = (
                  <Text style={[styles.statusText, { backgroundColor: ingredientStatusResult.color, color: '#222', marginLeft: 8, textAlign: 'right', flexShrink: 0 }]}>
                    {ingredientStatusResult.status}
                  </Text>
                );
                chipBackgroundColor = ingredientStatusResult.color;
                onPressAction = () => fetchAlternativeIngredients(parsedIngredient.name);
                isDisabled = false;
              } else {
                // 상태 정보가 유효하지 않거나 (예: 양 정보 없는 "대파"), getIngredientStatus가 빈 상태 반환
                statusDisplay = null;
                // chipBackgroundColor는 기본값 유지
                // onPressAction, isDisabled는 기본값 유지 (탭 불가)
              }
            } else {
              // 단위 정보가 없는 재료 (예: "후추 약간") - 탭 불가, 기본 스타일
              statusDisplay = null;
              // chipBackgroundColor, onPressAction, isDisabled는 기본값 유지
            }
            console.log('Rendering item:', item, 'statusDisplay:', statusDisplay);
            // const displayItem = String(item); // item이 항상 문자열임을 보장

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={isDisabled ? 1 : 0.7} // 비활성화 시 투명도 효과 없음
                onPress={onPressAction}
                disabled={isDisabled}
                style={[
                  styles.ingredientChip,
                  { 
                    width: '100%', 
                    justifyContent: 'space-between',
                    backgroundColor: chipBackgroundColor 
                  }
                ]}
              >
                <Text style={[styles.ingredientName, { flex: 1, textAlign: 'left' }]}>• {String(item)}</Text>
                {statusDisplay}
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
    marginBottom: 3,
    backgroundColor: '#F6F8FA',
    // width, justifyContent는 인라인에서 적용
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