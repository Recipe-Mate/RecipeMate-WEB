import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList // FlatList 추가
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import apiService from '../src/services/api.service';
import { LinearGradient } from 'react-native-linear-gradient';

// 레시피 이미지 매핑 (RecipeResult와 동일하게 유지)
const recipeImages = {
  '닭죽': require('../assets/chicken_porridge.png'),
  '김치찌개': require('../assets/kimchi_stew.png'),
  '갈비탕': require('../assets/Galbitang.png'),
  '제육볶음': require('../assets/Stir_fried_pork.png'),
  '된장찌개': require('../assets/soy_bean_paste_soup.png'),
  // 기본 이미지
  'default': require('../assets/chicken_porridge.png')
};

// Helper function to parse an ingredient line string
const parseIngredientString = (line) => {
  line = String(line || '').trim();
  if (!line) return null;

  // 괄호 안 값도 추출 (예: 100g(1/2개) → bracketAmount: '1/2', bracketUnit: '개')
  let bracketAmount = null, bracketUnit = null;
  const bracketMatch = line.match(/\(([^)]+)\)/);
  if (bracketMatch) {
    const inner = bracketMatch[1].trim(); // 예: "1/2개"
    const match = inner.match(/^([\d./]+)\s*([a-zA-Z가-힣μ]+)?$/);
    if (match) {
      bracketAmount = match[1];
      bracketUnit = match[2] || '';
    }
  }

  // 괄호 밖 값 추출 (예: 100g)
  const regex = /^(.*?)\s*([\d./]+)\s*([a-zA-Z가-힣μ]+)?/;
  const match = line.replace(/\(.*\)/, '').match(regex);

  if (match) {
    const name = (match[1] || '').trim();
    const amount = (match[2] || '').trim();
    const unit = (match[3] || '').trim();
    return { name, amount, unit, bracketAmount, bracketUnit };
  }
  // 괄호 안만 있는 경우
  if (bracketAmount && bracketUnit) {
    const name = line.replace(/\(.*\)/, '').trim();
    return { name, amount: bracketAmount, unit: bracketUnit, bracketAmount, bracketUnit };
  }
  return null;
};

// 단위 변환 테이블 (예시: 1개=100g, 1개=150g 등)
const UNIT_CONVERT_TABLE = {
  // 식재료명: { fromUnit: { toUnit: 환산값(1 fromUnit당 toUnit 몇 g) } }
  '계란': { '개': { 'g': 50 }, 'g': { '개': 1/50 } },
  '오렌지': { '개': { 'g': 150 }, 'g': { '개': 1/150 } },
  '당근': { '개': { 'g': 100 }, 'g': { '개': 1/100 } },
  // 필요시 추가
};

// 단위 변환 함수
function convertUnit(ingredientName, amount, fromUnit, toUnit) {
  if (!ingredientName || !fromUnit || !toUnit || fromUnit.toLowerCase() === toUnit.toLowerCase()) return parseFloat(amount);
  const table = UNIT_CONVERT_TABLE[ingredientName];
  if (!table) return null;
  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();
  // 변환 테이블의 키도 소문자로 normalize
  const normalizedTable = {};
  for (const f in table) {
    normalizedTable[f.toLowerCase()] = {};
    for (const t in table[f]) {
      normalizedTable[f.toLowerCase()][t.toLowerCase()] = table[f][t];
    }
  }
  if (!normalizedTable[from] || !normalizedTable[from][to]) return null;
  let num = null;
  try {
    num = eval(String(amount));
  } catch {
    num = parseFloat(amount);
  }
  if (isNaN(num)) return null;
  return num * normalizedTable[from][to];
}

// RecipeDetail 컴포넌트: 레시피 상세 정보를 보여줌
const RecipeDetail = ({ route, navigation }) => {
  const [ingredients, setIngredients] = useState([]); // 레시피 재료 목록
  const [recipeSteps, setRecipeSteps] = useState([]); // 레시피 단계
  const [recipeTitle, setRecipeTitle] = useState(''); // 레시피 제목
  const [recipeImageUri, setRecipeImageUri] = useState(null); // 레시피 이미지 URI
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [nutritionInfo, setNutritionInfo] = useState(null); // 영양 정보
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showAlternativeIngredientsModal, setShowAlternativeIngredientsModal] = useState(false); // 대체 식재료 모달 상태
  const [alternativeIngredients, setAlternativeIngredients] = useState([]); // 대체 식재료 목록
  const [selectedIngredientForReplacement, setSelectedIngredientForReplacement] = useState(null); // 선택된 재료
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false); // 대체 식재료 로딩 상태

  const { user } = useAuth();
  const [userIngredients, setUserIngredients] = useState([]); // 사용자 식재료 리스트

  // route.params에서 레시피 정보 가져오기
  // recipeData 대신 recipe를 사용하도록 변경 (RecipeResult.js에서 전달하는 파라미터 이름)
  const { recipe } = route?.params || {}; 

  useEffect(() => {
    if (recipe) {
      setRecipeTitle(recipe.recipeName || recipe.title || '레시피 정보 없음');
      setRecipeImageUri(recipe.thumbnail || recipe.image || recipe.ATT_FILE_NO_MK || recipe.ATT_FILE_NO_MAIN || null);
      setRecipeSteps(
        Array.isArray(recipe.steps) && recipe.steps.length > 0
          ? recipe.steps
          : Array.isArray(recipe.cookingProcess) && recipe.cookingProcess.length > 0
          ? recipe.cookingProcess
          : Array.isArray(recipe.manual) && recipe.manual.length > 0
          ? recipe.manual.filter(m => m && (m.MANUAL_DESC || m.MANUAL_IMG_URL)).map((m, idx) => `${idx+1}. ${m.MANUAL_DESC || '이미지 참고'}`)
          : ['조리법 정보가 없습니다.']
      );
      if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        const ingredientItems = recipe.ingredients.map((ing, index) => ({
          id: String(index),
          name: typeof ing === 'string' ? ing : (ing.IRDNT_NM || '알 수 없는 재료'),
          has: userIngredients.some(userIng =>
            typeof ing === 'string' && userIng.name && ing.toLowerCase().includes(userIng.name.toLowerCase()) ||
            (ing.IRDNT_NM && userIng.name && ing.IRDNT_NM.toLowerCase().includes(userIng.name.toLowerCase()))
          ),
        }));
        setIngredients(ingredientItems);
      } else {
        setIngredients([{ id: '0', name: '재료 정보 없음', has: false }]);
      }
      // 영양정보를 recipe.nutritionInfo, recipe, 그리고 INFO_ENG 등 모든 필드에서 추출
      const getNum = v => {
        if (v === undefined || v === null) return null;
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      };
      const nutritionData = {
        calorie: getNum(recipe.nutritionInfo?.calorie) ?? getNum(recipe.calorie) ?? getNum(recipe.INFO_ENG),
        carbohydrate: getNum(recipe.nutritionInfo?.carbohydrate) ?? getNum(recipe.carbohydrate) ?? getNum(recipe.INFO_CAR),
        protein: getNum(recipe.nutritionInfo?.protein) ?? getNum(recipe.protein) ?? getNum(recipe.INFO_PRO),
        fat: getNum(recipe.nutritionInfo?.fat) ?? getNum(recipe.fat) ?? getNum(recipe.INFO_FAT),
        natrium: getNum(recipe.nutritionInfo?.natrium) ?? getNum(recipe.natrium) ?? getNum(recipe.INFO_NA),
      };
      setNutritionInfo(nutritionData);
      setLoading(false);
    } else {
      setRecipeTitle('레시피 정보 없음');
      setRecipeImageUri(null);
      setRecipeSteps(['레시피 정보가 없습니다.']);
      setIngredients([{ id: '0', name: '재료 정보 없음', has: false }]);
      setNutritionInfo(null);
      setLoading(false);
    }
  }, [recipe, user]); // userIngredients 제거

  // 사용자 식재료 불러오기
  useEffect(() => {
    const fetchUserIngredients = async () => {
      if (!user || !user.id) return;
      try {
        const result = await apiService.getIngredients(user.id);
        if (result && result.success && result.data) {
          setUserIngredients(result.data);
        } else {
          setUserIngredients([]);
        }
      } catch (e) {
        setUserIngredients([]);
      }
    };
    fetchUserIngredients();
  }, [user]);

  // 대체 식재료 가져오기 함수 (API 호출)
  const fetchAlternativeIngredients = async (recipeName, ingredientName) => {
    if (!recipeName || !ingredientName) {
      Alert.alert("오류", "레시피 이름과 재료 이름이 필요합니다.");
      return;
    }
    setIsLoadingAlternatives(true);
    setSelectedIngredientForReplacement(ingredientName); // 어떤 재료에 대한 대체품인지 알 수 있도록 저장

    try {
      // 백엔드 API 엔드포인트 및 요청 방식은 실제 구현에 따라 달라집니다.
      // 예시: GET /api/external/gemini/alternatives?menuName=레시피이름&replaceFood=재료이름
      // apiService.js 에 해당 함수를 만들어야 합니다.
      console.log(`[RecipeDetail] 대체 식재료 요청: 레시피="${recipeName}", 재료="${ingredientName}"`);
      const response = await apiService.getAlternativeFood(recipeName, ingredientName);

      if (response && response.success && Array.isArray(response.data)) {
        setAlternativeIngredients(response.data);
        if (response.data.length === 0) {
          Alert.alert("알림", `${ingredientName}의 대체 식재료를 찾을 수 없습니다.`);
          setShowAlternativeIngredientsModal(false); // 데이터 없으면 모달 안띄움
        } else {
          setShowAlternativeIngredientsModal(true); // 데이터 있으면 모달 띄움
        }
      } else {
        setAlternativeIngredients([]);
        Alert.alert("오류", response.message || "대체 식재료를 가져오는 데 실패했습니다.");
        setShowAlternativeIngredientsModal(false);
      }
    } catch (error) {
      console.error("[RecipeDetail] 대체 식재료 API 호출 오류:", error);
      setAlternativeIngredients([]);
      Alert.alert("오류", "대체 식재료 정보를 가져오는 중 문제가 발생했습니다.");
      setShowAlternativeIngredientsModal(false);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  // 요리 완료 버튼 클릭 시 실행되는 함수
  const completeCooking = async () => {
    if (!user || !user.id) {
      Alert.alert('로그인 필요', '로그인 후 이용해 주세요.');
      return;
    }

    const recipeIdentifier = recipe?.rcpSeq || recipe?.id;

    if (!recipeIdentifier) {
      Alert.alert('오류', '레시피 ID가 없어 저장할 수 없습니다.');
      return;
    }    // PostUsedRecipeRequest.java DTO에 맞게 페이로드 구성
    const usedRecipePayload = {
      id: String(recipeIdentifier), // rcpSeq를 String으로 변환하여 id로 사용
      rcpSeq: String(recipeIdentifier), // rcpSeq를 String으로 변환
      title: recipe?.recipeName || recipe?.title || '이름 없는 레시피',
      ingredients: Array.isArray(recipe?.ingredients)
        ? recipe.ingredients.map(ing => {
            if (typeof ing === 'string') return ing;
            if (ing && typeof ing.IRDNT_NM === 'string') { // 공공데이터 API 형식
              return `${ing.IRDNT_NM}${ing.IRDNT_CPCTY ? ' (' + ing.IRDNT_CPCTY + ')' : ''}`;
            }
            if (ing && typeof ing.name === 'string') { // 내부적으로 사용하는 객체 형식
              return `${ing.name}${ing.amount ? ' (' + ing.amount + (ing.unit || '') + ')' : ''}`;
            }
            return '알 수 없는 재료';
          })
        : [],
      steps: Array.isArray(recipe?.steps)
        ? recipe.steps
        : Array.isArray(recipe?.cookingProcess)
        ? recipe.cookingProcess
        : Array.isArray(recipe?.manual)
        ? recipe.manual
            .filter(m => m && (m.MANUAL_DESC || m.MANUAL_IMG_URL))
            .map((m, idx) => `${idx + 1}. ${m.MANUAL_DESC || '이미지 참고'}`)
        : [],
      // thumbnail 우선순위: recipe.thumbnail -> recipe.ATT_FILE_NO_MK -> recipe.image -> recipe.ATT_FILE_NO_MAIN
      thumbnail: recipe?.thumbnail || recipe?.ATT_FILE_NO_MK || recipe?.image || recipe?.ATT_FILE_NO_MAIN || '',
      // 영양 정보 필드 설정 - 서버에서 저장되도록 함
      calorie: nutritionInfo?.calorie || null,
      carbohydrate: nutritionInfo?.carbohydrate || null,
      protein: nutritionInfo?.protein || null,
      fat: nutritionInfo?.fat || null,
      natrium: nutritionInfo?.natrium || null,
    };

    console.log('[RecipeDetail] 요리 완료 저장 데이터 (to apiService.addUsedRecipe):', JSON.stringify(usedRecipePayload, null, 2));

    try {
      // apiService.addUsedRecipe는 userId와 payload를 받도록 수정되었거나, 수정 필요.
      // 현재는 userId를 첫 번째 인자로, payload를 두 번째 인자로 전달합니다.
      const result = await apiService.addUsedRecipe(user.id, usedRecipePayload);

      if (result && result.success) {
        setTimeout(() => {
          Alert.alert('요리 완료', '레시피 사용 기록이 저장되었습니다.', [
            {
              text: '확인',
              onPress: () => {
                const ingredientsToPass = Array.isArray(recipe?.ingredients)
                  ? recipe.ingredients.flatMap((ingEntry, index) => {
                      const parsedIngredients = [];
                      if (typeof ingEntry === 'string') {
                        const lines = ingEntry.split('\n'); // Split multi-line strings
                        lines.forEach((line, lineIdx) => {
                          const trimmedLine = line.trim();
                          if (trimmedLine) { // 비어있지 않은 라인만 처리
                            const parsed = parseIngredientString(trimmedLine);
                            if (parsed) {
                              parsedIngredients.push({
                                id: `parsed-str-ing-${index}-${lineIdx}-${Date.now()}`, // Unique ID
                                name: parsed.name,
                                foodName: parsed.name,
                                amount: parsed.amount,
                                unit: parsed.unit,
                              });
                            }
                          }
                        });
                      } else if (typeof ingEntry === 'object' && ingEntry !== null) {
                        let parsableString = '';
                        if (ingEntry.IRDNT_NM) { // 공공데이터 포털 형식
                          parsableString = `${ingEntry.IRDNT_NM} ${ingEntry.IRDNT_CPCTY || ''}`.trim();
                        } else if (ingEntry.name) { // 내부 객체 형식
                          parsableString = `${ingEntry.name} ${ingEntry.amount || ''} ${ingEntry.unit || ''}`.trim();
                        }

                        if (parsableString) {
                          const parsed = parseIngredientString(parsableString);
                          if (parsed) {
                            parsedIngredients.push({
                              id: ingEntry.id || ingEntry.IRDNT_SN || `obj-ing-${index}-${Date.now()}`,
                              name: parsed.name,
                              foodName: parsed.name,
                              amount: parsed.amount,
                              unit: parsed.unit,
                            });
                          }
                        }
                      }
                      return parsedIngredients; // flatMap을 위해 배열 반환
                    })
                  : [];

                if (ingredientsToPass.length > 0) {
                  console.log('[RecipeDetail] Navigating to IngredientChange with (ingredients):', JSON.stringify(ingredientsToPass, null, 2));
                  navigation.navigate('IngredientChange', {
                    ingredients: ingredientsToPass,
                    userId: user.id,
                  });
                } else {
                  console.warn('[RecipeDetail] No valid ingredients found in recipe to pass to IngredientChange.');
                  Alert.alert("알림", "변경할 수 있는 식재료 항목이 없습니다.");
                  navigation.goBack(); // 요리 완료 후 재료 변경할 것이 없으면 이전 화면으로
                }
              }
            }
          ]);
        }, 0);
      } else {
        Alert.alert('저장 실패', result.message || result.error || '레시피 사용 기록 저장에 실패했습니다.');
      }
    } catch (e) {
      console.error('[RecipeDetail] 요리 완료 처리 중 오류:', e);
      Alert.alert('오류', e.message || '레시피 사용 기록 저장 중 오류가 발생했습니다.');
    }
  };

  // 레시피 이미지 선택 함수
  const getRecipeImage = (recipeName) => {
    // If recipeImageUri is directly available from recipeData, use it.
    if (recipeImageUri) {
        return { uri: recipeImageUri };
    }
    // Fallback to local images if recipeImageUri is null and recipeName matching is desired
    if (!recipeName) return recipeImages.default;
    for (const key of Object.keys(recipeImages)) {
      if (recipeName.includes(key)) {
        return recipeImages[key];
      }
    }
    return recipeImages.default;
  };  // 영양 정보 포매팅 함수
  const formatNutritionValue = (value, unit = '') => {
    if (value === undefined || value === null || value === '' || Number.isNaN(Number(value))) return '';
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue % 1 === 0 ? numValue.toString() + (unit ? ` ${unit}` : '') : numValue.toFixed(1) + (unit ? ` ${unit}` : '');
  };

  // 레시피 재료와 사용자 식재료 매칭 및 상태 구분
  const getIngredientStatusList = () => {
    if (!Array.isArray(recipe?.ingredients)) return [];

    return recipe.ingredients
      .flatMap((ingredientItem, index) => {
        const parsedEntries = [];
        if (typeof ingredientItem === 'string') {
          const lines = ingredientItem.split('\n');
          lines.forEach((line, lineIdx) => {
            const trimmedLine = line.trim();
            if (trimmedLine) { // Process only non-empty lines
              const parsed = parseIngredientString(trimmedLine); // Assumes parseIngredientString is in scope
              if (parsed) {
                parsedEntries.push({
                  id: `status-str-ing-${index}-${lineIdx}-${Date.now()}`,
                  originalName: parsed.name,
                  nameToMatch: parsed.name.replace(/\s/g, "").toLowerCase(),
                  amount: parsed.amount,
                  unit: parsed.unit ? parsed.unit.toLowerCase() : '',
                  bracketAmount: parsed.bracketAmount,
                  bracketUnit: parsed.bracketUnit ? parsed.bracketUnit.toLowerCase() : '',
                  fullText: `${parsed.name} ${parsed.amount || ''}${parsed.unit || ''}${parsed.bracketAmount && parsed.bracketUnit ? `(${parsed.bracketAmount}${parsed.bracketUnit})` : ''}`.trim(),
                });
              }
            }
          });
        } else if (typeof ingredientItem === 'object' && ingredientItem !== null) {
          let parsableString = '';
          let originalNameFromObject = '알 수 없는 재료';

          if (ingredientItem.IRDNT_NM) { // Public API format
            originalNameFromObject = ingredientItem.IRDNT_NM;
            parsableString = `${ingredientItem.IRDNT_NM} ${ingredientItem.IRDNT_CPCTY || ''}`.trim();
          } else if (ingredientItem.name) { // Internal object format
            originalNameFromObject = ingredientItem.name;
            parsableString = `${ingredientItem.name} ${ingredientItem.amount || ''} ${ingredientItem.unit || ''}`.trim();
          }

          if (parsableString) {
            const parsed = parseIngredientString(parsableString);
            if (parsed) {
              parsedEntries.push({
                id: ingredientItem.id || ingredientItem.IRDNT_SN || `status-obj-ing-${index}-${Date.now()}`,
                originalName: parsed.name,
                nameToMatch: parsed.name.replace(/\s/g, "").toLowerCase(),
                amount: parsed.amount,
                unit: parsed.unit ? parsed.unit.toLowerCase() : '',
                bracketAmount: parsed.bracketAmount,
                bracketUnit: parsed.bracketUnit ? parsed.bracketUnit.toLowerCase() : '',
                fullText: `${parsed.name} ${parsed.amount || ''}${parsed.unit || ''}${parsed.bracketAmount && parsed.bracketUnit ? `(${parsed.bracketAmount}${parsed.bracketUnit})` : ''}`.trim(),
              });
            } else { // Fallback if object couldn't be parsed into name/amount/unit
                 parsedEntries.push({
                    id: ingredientItem.id || ingredientItem.IRDNT_SN || `status-obj-fallback-${index}-${Date.now()}`,
                    originalName: originalNameFromObject,
                    nameToMatch: originalNameFromObject.replace(/\s/g, "").toLowerCase(),
                    amount: '-', // Indicate unknown amount/unit
                    unit: '',
                    fullText: originalNameFromObject,
                });
            }
          }
        }
        return parsedEntries;
      })
      .map((parsedItem) => {
        if (!parsedItem || !parsedItem.nameToMatch) return null; // Skip if item is invalid

        // 표시 텍스트 생성: 단위가 하나면 한 번만, 둘 다 있으면 둘 다
        let display = '';
        if (parsedItem.amount && parsedItem.unit && parsedItem.bracketAmount && parsedItem.bracketUnit) {
          // 단위와 수량이 둘 다 있고, 단위가 다를 때만 둘 다 표시
          if (parsedItem.unit !== parsedItem.bracketUnit || parsedItem.amount !== parsedItem.bracketAmount) {
            display = `${parsedItem.originalName} ${parsedItem.amount}${parsedItem.unit}(${parsedItem.bracketAmount}${parsedItem.bracketUnit})`;
          } else {
            // 단위와 수량이 완전히 같으면 한 번만
            display = `${parsedItem.originalName} ${parsedItem.amount}${parsedItem.unit}`;
          }
        } else if (parsedItem.amount && parsedItem.unit) {
          display = `${parsedItem.originalName} ${parsedItem.amount}${parsedItem.unit}`;
        } else if (parsedItem.amount) {
          display = `${parsedItem.originalName} ${parsedItem.amount}`;
        } else {
          display = parsedItem.originalName;
        }

        const userItem = userIngredients.find(ui =>
          ui.foodName && parsedItem.nameToMatch.includes(ui.foodName.replace(/\s/g, "").toLowerCase())
        );

        // 디버깅용 로그
        console.log('[재료비교] parsedItem:', parsedItem);
        console.log('[재료비교] userItem:', userItem);

        let status = '미보유';
        // display는 위에서 이미 레시피 필요량만으로 생성

        if (userItem) {
          // 단위 normalize
          const userUnit = userItem.unit ? userItem.unit.toLowerCase() : '';
          const parsedUnit = parsedItem.unit ? parsedItem.unit.toLowerCase() : '';
          const parsedBracketUnit = parsedItem.bracketUnit ? parsedItem.bracketUnit.toLowerCase() : '';
          let compareAmount = null, compareUnit = null;
          let needNum = null, ownNum = null;
          if (userUnit && parsedUnit && userUnit === parsedUnit) {
            compareAmount = parsedItem.amount;
            compareUnit = parsedUnit;
            try { needNum = eval(compareAmount.replace(/[^\d./]/g, '')); } catch { needNum = parseFloat(compareAmount); }
            ownNum = parseFloat(userItem.quantity);
            console.log(`[재료비교] 단위 일치: userUnit=${userUnit}, amount=${compareAmount}, needNum=${needNum}, ownNum=${ownNum}`);
          } else if (userUnit && parsedBracketUnit && userUnit === parsedBracketUnit) {
            compareAmount = parsedItem.bracketAmount;
            compareUnit = parsedBracketUnit;
            try { needNum = eval(compareAmount.replace(/[^\d./]/g, '')); } catch { needNum = parseFloat(compareAmount); }
            ownNum = parseFloat(userItem.quantity);
            console.log(`[재료비교] 괄호 단위 일치: userUnit=${userUnit}, bracketAmount=${compareAmount}, needNum=${needNum}, ownNum=${ownNum}`);
          } else if (userUnit && parsedUnit && parsedBracketUnit) {
            if (userUnit === '개' && parsedUnit === 'g') {
              const convertedOwn = convertUnit(parsedItem.originalName, userItem.quantity, '개', 'g');
              try { needNum = eval(parsedItem.amount.replace(/[^\d./]/g, '')); } catch { needNum = parseFloat(parsedItem.amount); }
              console.log(`[재료비교] 변환(개→g): userUnit=${userUnit}, own=${userItem.quantity}, convertedOwn=${convertedOwn}, needNum=${needNum}`);
              if (convertedOwn !== null && !isNaN(needNum)) {
                if (convertedOwn < needNum) {
                  status = '부족';
                } else {
                  status = '보유';
                }
                return { id: parsedItem.id, name: parsedItem.originalName, display, status };
              }
            } else if (userUnit === 'g' && parsedBracketUnit === '개') {
              const convertedOwn = convertUnit(parsedItem.originalName, userItem.quantity, 'g', '개');
              try { needNum = eval(parsedItem.bracketAmount.replace(/[^\d./]/g, '')); } catch { needNum = parseFloat(parsedItem.bracketAmount); }
              console.log(`[재료비교] 변환(g→개): userUnit=${userUnit}, own=${userItem.quantity}, convertedOwn=${convertedOwn}, needNum=${needNum}`);
              if (convertedOwn !== null && !isNaN(needNum)) {
                if (convertedOwn < needNum) {
                  status = '부족';
                } else {
                  status = '보유';
                }
                return { id: parsedItem.id, name: parsedItem.originalName, display, status };
              }
            }
          }
          if (needNum !== null && ownNum !== null && !isNaN(needNum) && !isNaN(ownNum)) {
            console.log(`[재료비교] 기본비교: needNum=${needNum}, ownNum=${ownNum}, compareAmount=${compareAmount}, compareUnit=${compareUnit}`);
            if (ownNum < needNum) {
              status = '부족';
            } else {
              status = '보유';
            }
          } else {
            console.log(`[재료비교] 수량 비교 불가, 보유로 처리: userItem.quantity=${userItem.quantity}, userUnit=${userUnit}`);
            status = '보유';
          }
        } else {
          console.log(`[재료비교] 미보유: parsedItem.nameToMatch=${parsedItem.nameToMatch}`);
        }
        return {
          id: parsedItem.id,
          name: parsedItem.originalName, // API 호출 시 이 name을 사용 (순수 재료명)
          display, // 화면 표시용 텍스트(레시피 필요량만)
          status,
        };
      })
      .filter(Boolean); // Remove any null items from map
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>레시피 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 32}}>
      
      {/* 메뉴 이름 */}
      <Text style={styles.menuName}>{recipeTitle}</Text>
      
      {/* 메뉴 사진 */}
      <View style={styles.imageSection}>
        <Image
          source={getRecipeImage(recipeTitle)}
          style={styles.menuImage}
        />
      </View>
      {/* 영양 정보 섹션 (있을 경우에만 표시) */}
      {nutritionInfo && (
        (nutritionInfo.calorie !== null || nutritionInfo.carbohydrate !== null || nutritionInfo.protein !== null || nutritionInfo.fat !== null || nutritionInfo.natrium !== null) && (
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>영양 정보</Text>
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>칼로리</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.calorie, 'kcal') || '정보 없음'}
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>탄수화물</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.carbohydrate, 'g') || '정보 없음'}
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>단백질</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.protein, 'g') || '정보 없음'}
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>지방</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.fat, 'g') || '정보 없음'}
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>나트륨</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.natrium, 'mg') || '정보 없음'}
              </Text>
            </View>
          </View>
        </View>
        )
      )}

      {/* 재료 리스트 */}
      <View style={styles.ingredientsSection}>
        <Text style={styles.sectionTitle}>재료 리스트</Text>
        <ScrollView style={styles.scrollableList} nestedScrollEnabled={true}>
          {getIngredientStatusList().map((item) => (
            <View
              key={item.id}
              style={[
                styles.ingredientItem,
                item.status === '보유'
                  ? { backgroundColor: '#e0f7ff' }
                  : item.status === '부족'
                  ? { backgroundColor: '#fffbe0' }
                  : { backgroundColor: '#ffe0e0' },
              ]}
            >
              <Text style={styles.ingredientText}>{item.display}</Text>
              <Text
                style={[
                  styles.ingredientStatus,
                  item.status === '보유'
                    ? { color: '#3498db' }
                    : item.status === '부족'
                    ? { color: '#f39c12' }
                    : { color: '#e74c3c' },
                ]}
              >
                {item.status === '보유' ? '보유' : item.status === '부족' ? '부족' : '미보유'}
              </Text>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.detailButton} onPress={() => setShowIngredientsModal(true)}>
          <Text style={styles.detailButtonText}>전체 재료 자세히 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 레시피 내용 */}
      <View style={styles.recipeSection}>
        <Text style={styles.sectionTitle}>레시피</Text>
        <ScrollView style={styles.scrollableList} nestedScrollEnabled={true}>
          {recipeSteps.map((step, index) => (
            <Text key={index} style={styles.recipeStep}>
              {step}
            </Text>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.detailButton} onPress={() => setShowRecipeModal(true)}>
          <Text style={styles.detailButtonText}>전체 레시피 자세히 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 요리 완료 버튼 */}
      <TouchableOpacity style={styles.completeButton} onPress={completeCooking}>
        <Text style={styles.completeButtonText}>요리 완료</Text>
      </TouchableOpacity>

      {/* 재료 모달 */}
      <Modal
        visible={showIngredientsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIngredientsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>전체 재료 리스트</Text>
            {isLoadingAlternatives && ( // 대체 재료 로딩 중일 때 인디케이터 표시
              <View style={styles.loadingContainerModal}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingTextModal}>대체 식재료 검색 중...</Text>
              </View>
            )}
            {!isLoadingAlternatives && ( // 로딩 중이 아닐 때만 재료 목록 표시
              <ScrollView style={styles.modalScroll}>
                {getIngredientStatusList().map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.ingredientItem,
                      item.status === '보유'
                        ? { backgroundColor: '#e0f7ff' }
                        : item.status === '부족'
                        ? { backgroundColor: '#fffbe0' }
                        : { backgroundColor: '#ffe0e0' },
                      styles.touchableIngredient // 터치 효과를 위한 스타일 (선택적)
                    ]}
                    onPress={() => {
                      // item.name이 순수 재료 이름인지 확인 (getIngredientStatusList에서 'name'으로 반환)
                      fetchAlternativeIngredients(recipeTitle, item.name);
                    }}
                    disabled={isLoadingAlternatives} // 로딩 중일 때 버튼 비활성화
                  >
                    <Text style={styles.ingredientText}>{item.display}</Text>
                    <Text
                      style={[
                        styles.ingredientStatus,
                        item.status === '보유'
                          ? { color: '#3498db' }
                          : item.status === '부족'
                          ? { color: '#f39c12' }
                          : { color: '#e74c3c' },
                      ]}
                    >
                      {item.status === '보유' ? '보유' : item.status === '부족' ? '부족' : '미보유'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity 
              style={[styles.closeButton, isLoadingAlternatives && styles.disabledButton]} // 로딩 중일 때 닫기 버튼 스타일 변경
              onPress={() => setShowIngredientsModal(false)}
              disabled={isLoadingAlternatives} // 로딩 중일 때 버튼 비활성화
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 대체 식재료 모달 */}
      <Modal
        visible={showAlternativeIngredientsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAlternativeIngredientsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedIngredientForReplacement} 대체 식재료</Text>
            {alternativeIngredients.length > 0 ? (
              <FlatList
                data={alternativeIngredients}
                style={styles.modalScroll}
                keyExtractor={(item, index) => `alt-ing-${index}-${item}`}
                renderItem={({ item }) => (
                  <View style={styles.alternativeIngredientItem}>
                    <Text style={styles.alternativeIngredientText}>- {item}</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.emptyAlternativeText}>대체 식재료 정보가 없습니다.</Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowAlternativeIngredientsModal(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 레시피 모달 */}
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>전체 레시피</Text>
            <ScrollView style={styles.modalScroll}>
              {recipeSteps.map((step, index) => (
                <Text key={index} style={styles.recipeStep}>{step}</Text>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowRecipeModal(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#C3CAE8',
  },
  menuName: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  allergyWarning: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 15,
  },
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  menuImage: {
    width: 200,
    height: 100,
    borderRadius: 10,
  },
  favoriteButton: {
    padding: 10,
    backgroundColor: '#3498db',
    borderRadius: 50,
  },
  favoriteButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  scrollableList: {
    maxHeight: 150, // 스크롤 가능한 고정 높이
    height: 150, // 명확히 고정
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginVertical: 10, // 리스트 컨테이너의 위아래 마진
    overflow: 'hidden', // 섹션을 벗어나지 않도록
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: '#333',
  },
  ingredientStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipeSection: {
    marginBottom: 20,
  },
  recipeStep: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    paddingVertical: 10, // 개별 레시피 단계 텍스트의 위아래 마진
  },
  completeButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },  nutritionSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  nutritionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
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
  detailButton: {
    backgroundColor: '#eee',
    marginTop: 5,
  },
  detailButtonText: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalScroll: {
    width: '100%',
    marginBottom: 16,
    maxHeight: 350,
  },
  closeButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  touchableIngredient: { // 재료 아이템 터치 시 시각적 피드백을 위한 스타일 (선택)
    // 예: activeOpacity={0.7} 등을 TouchableOpacity 자체 prop으로 설정 가능
  },
  alternativeIngredientItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  alternativeIngredientText: {
    fontSize: 16,
    color: '#333',
  },
  emptyAlternativeText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainerModal: { // 모달 내 로딩 컨테이너
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingTextModal: { // 모달 내 로딩 텍스트
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  disabledButton: { // 비활성화된 버튼 스타일
    backgroundColor: '#ccc',
  },
});

export default RecipeDetail; // RecipeDetail 컴포넌트를 외부로 내보냄