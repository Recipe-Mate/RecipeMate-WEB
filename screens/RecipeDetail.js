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

  // Regex to capture name, amount, and unit.
  // Adjusted to better handle various formats and ensure name is captured.
  // Example: "당근 100g", "오렌지 1/2개", "물 50ml", "설탕 1큰술", "대파 1대 (흰 부분)"
  // It looks for a name part, followed by a numeric amount, and an optional unit.
  // It tries to be flexible with spacing and parentheses around details.
  const regex = /^(.*?)\s*([\d./]+)\s*([a-zA-Z가-힣μ]+)?(?:\s*\(.*\)|\s|$)/;
  const match = line.match(regex);

  if (match) {
    const name = (match[1] || '').trim();
    const amount = (match[2] || '0').trim(); // Default to '0' if somehow empty
    const unit = (match[3] || '').trim();

    // If name is empty, it's not a valid ingredient line for our purpose.
    if (!name) {
      // console.log(`[parseIngredientString] Skipped due to empty name: "${line}"`);
      return null;
    }
    // If amount is effectively zero and there's no unit, it might be a title-like entry
    // or an ingredient without quantity (e.g., "후추"). For IngredientChange, we prefer quantifiable items.
    // However, IngredientChange can handle amount "0", so let's pass it if name is present.
    return { name, amount, unit };
  }
  // console.log(`[parseIngredientString] Skipped due to no regex match: "${line}"`);
  return null; // Not a parsable ingredient line with amount/unit
};

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
    // recipeData 대신 recipe를 사용
    if (recipe) {
      console.log('[RecipeDetail] Received recipe for NUTRITION CHECK:', JSON.stringify(recipe, null, 2)); // <--- 이 로그를 추가합니다.
      console.log('[RecipeDetail] Received recipe:', JSON.stringify(recipe, null, 2));

      // API 응답 또는 RecipeResult.js에서 전달된 객체의 필드명에 맞게 수정
      setRecipeTitle(recipe.recipeName || recipe.title || '레시피 정보 없음');
      setRecipeImageUri(recipe.thumbnail || recipe.image || recipe.ATT_FILE_NO_MK || recipe.ATT_FILE_NO_MAIN || null);

      // recipe.steps를 가장 먼저 확인하도록 수정
      setRecipeSteps(
        Array.isArray(recipe.steps) && recipe.steps.length > 0 // RecipeResult.js에서 오는 'steps' 필드 우선 확인
          ? recipe.steps
          : Array.isArray(recipe.cookingProcess) && recipe.cookingProcess.length > 0 // 그 다음 'cookingProcess' (SavedRecipeInfo 등)
          ? recipe.cookingProcess 
          : Array.isArray(recipe.manual) && recipe.manual.length > 0 // 그 다음 공공데이터 포털 API의 'manual' 필드
          ? recipe.manual.filter(m => m && (m.MANUAL_DESC || m.MANUAL_IMG_URL)).map((m, idx) => `${idx+1}. ${m.MANUAL_DESC || '이미지 참고'}`)
          : ['조리법 정보가 없습니다.'] // 모두 없으면 기본 메시지
      );
      
      // API 응답의 재료 필드명 확인 필요 (예: ingredients, recipe.ingredients 등)
      // 현재는 ingredients가 문자열 배열이라고 가정
      // SavedRecipeInfo와 구조가 다르므로, API 응답에 맞게 처리해야 함.
      if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
        const ingredientItems = recipe.ingredients.map((ing, index) => ({
          id: String(index),
          name: typeof ing === 'string' ? ing : (ing.IRDNT_NM || '알 수 없는 재료'), // 공공데이터 포털 API의 경우 IRDNT_NM
          has: userIngredients.some(userIng => 
            typeof ing === 'string' && userIng.name && ing.toLowerCase().includes(userIng.name.toLowerCase()) ||
            (ing.IRDNT_NM && userIng.name && ing.IRDNT_NM.toLowerCase().includes(userIng.name.toLowerCase()))
          ),
        }));
        setIngredients(ingredientItems);
      } else {
        setIngredients([{ id: '0', name: '재료 정보 없음', has: false }]);
      }      // API 응답의 영양 정보 필드명 확인 필요 (예: nutritionInfo, recipe.nutrition 등)
      // SavedRecipeInfo와 구조가 다르므로, API 응답에 맞게 처리해야 함.
      // RecipeResult에서 오는 데이터는 nutritionInfo 객체 안에 필드가 있을 수 있음.
      const nutritionSource = recipe.nutritionInfo || recipe; // nutritionInfo 객체가 있으면 사용, 없으면 recipe 객체에서 직접 찾음
      console.log('[RecipeDetail] 영양정보 원본데이터:', nutritionSource);
      
      // 영양정보 추출 및 검증 로직 개선
      const getNutritionValue = (source, keys) => {
        for (const key of keys) {
          if (source[key] !== undefined && source[key] !== null) {
            const value = parseFloat(source[key]);
            if (!isNaN(value)) return value;
          }
        }
        return null;
      };
      
      // Recipe.java에 맞게 필드 이름을 정렬 
      const nutritionData = {
        calorie: getNutritionValue(nutritionSource, ['calorie', 'CAL_INFO', 'NTR_SCO', 'INFO_ENG']),
        carbohydrate: getNutritionValue(nutritionSource, ['carbohydrate', 'CRB_INFO', 'INFO_CAR']),
        protein: getNutritionValue(nutritionSource, ['protein', 'PRO_INFO', 'INFO_PRO']),
        fat: getNutritionValue(nutritionSource, ['fat', 'FAT_INFO', 'INFO_FAT']),
        natrium: getNutritionValue(nutritionSource, ['natrium', 'NA_INFO', 'INFO_NA']),
      };
      
      console.log('[RecipeDetail] 가공된 영양정보:', nutritionData);
      
      // 영양 정보가 하나라도 있으면 nutritionInfo에 저장
      if (nutritionData.calorie !== null || 
          nutritionData.carbohydrate !== null || 
          nutritionData.protein !== null || 
          nutritionData.fat !== null || 
          nutritionData.natrium !== null) {
        setNutritionInfo(nutritionData);
      } else {
        console.warn('[RecipeDetail] 영양 정보가 없습니다. 설정되지 않았습니다.');
        setNutritionInfo(null);
      }

      setLoading(false);
    } else {      if (!recipe || !recipe.recipeName) {
        console.log('[RecipeDetail] No recipe, setting defaults');
        // ...기존 기본값 설정 코드 유지...
        setRecipeTitle('레시피 정보 없음');
        setRecipeImageUri(null);
        setRecipeSteps(['레시피 정보가 없습니다.']);
        setIngredients([{ id: '0', name: '재료 정보 없음', has: false }]);
        setNutritionInfo(null);
        setLoading(false);
      }
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
  const formatNutritionValue = (value) => {
    if (value === undefined || value === null || Number.isNaN(parseFloat(value))) return '정보 없음';
    
    // 숫자가 아닌 경우 숫자로 변환 시도
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    
    // 변환에 실패하거나 NaN인 경우
    if (isNaN(numValue)) return '정보 없음';
    
    // 소수점 첫째 자리까지 표시 (0이면 정수로 표시)
    return numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(1);
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
                  unit: parsed.unit,
                  fullText: `${parsed.name} ${parsed.amount || ''}${parsed.unit || ''}`.trim(),
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
                unit: parsed.unit,
                fullText: `${parsed.name} ${parsed.amount || ''}${parsed.unit || ''}`.trim(),
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

        const userItem = userIngredients.find(ui =>
          ui.name && parsedItem.nameToMatch.includes(ui.name.replace(/\s/g, "").toLowerCase())
        );

        let status = '미보유';
        let display = parsedItem.fullText;

        if (userItem) {
          status = '보유'; // Default to '보유' if user has it
          display = `${parsedItem.originalName} (보유량: ${userItem.quantity || '측정 안됨'}${userItem.unit || ''})`;

          // Check for '부족' status only if quantifiable
          if (parsedItem.amount && parsedItem.amount !== '-' && userItem.quantity) {
            const needNumStr = String(parsedItem.amount).replace(/[^\\d.]/g, '');
            const ownNumStr = String(userItem.quantity).replace(/[^\\d.]/g, '');

            if (needNumStr && ownNumStr) { // Ensure both are non-empty after stripping non-numeric
                const needNum = parseFloat(needNumStr);
                const ownNum = parseFloat(ownNumStr);

                if (!Number.isNaN(needNum) && !Number.isNaN(ownNum)) {
                    if (ownNum < needNum) {
                    status = '부족';
                    display = `${parsedItem.originalName} (필요: ${parsedItem.amount || ''}${parsedItem.unit || ''}, 보유: ${userItem.quantity || '0'}${userItem.unit || ''})`;
                    }
                }
            }
          }
        }
        return {
          id: parsedItem.id,
          name: parsedItem.originalName, // API 호출 시 이 name을 사용 (순수 재료명)
          display: parsedItem.fullText, // 화면 표시용 텍스트
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

      {/* 알레르기 정보는 데이터가 없어서 일단 생략 */}
      
      {/* 메뉴 사진 */}
      <View style={styles.imageSection}>
        <Image
          source={getRecipeImage(recipeTitle)}
          style={styles.menuImage}
        />
      </View>
      {/* 영양 정보 섹션 (있을 경우에만 표시) */}
      {nutritionInfo && (
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>영양 정보</Text>
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>칼로리</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.calorie)} kcal
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>탄수화물</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.carbohydrate)} g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>단백질</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.protein)} g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>지방</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.fat)} g
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>나트륨</Text>
              <Text style={styles.nutritionValue}>
                {formatNutritionValue(nutritionInfo.natrium)} mg
              </Text>
            </View>
          </View>
        </View>
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
    backgroundColor: '#f9f9f9',
  },
  menuName: {
    fontSize: 28,
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